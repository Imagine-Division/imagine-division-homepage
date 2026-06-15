from __future__ import annotations

import csv
import argparse
import hashlib
import json
import mimetypes
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from html import unescape
from html.parser import HTMLParser
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import quote, unquote, urldefrag, urljoin, urlparse, urlsplit, urlunsplit
from urllib.request import Request, urlopen


ROOT_URL = "https://www.imaginedivision.com/"
OUTPUT_DIR = Path("source-archive") / "imaginedivision-homepage-2026-06-05"
TIMEOUT = 45
MAX_WORKERS = 8
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36"
)

IMAGE_EXTENSIONS = {
    ".apng",
    ".avif",
    ".bmp",
    ".gif",
    ".ico",
    ".jpeg",
    ".jpg",
    ".png",
    ".svg",
    ".tif",
    ".tiff",
    ".webp",
}
VIDEO_EXTENSIONS = {".avi", ".m4v", ".mov", ".mp4", ".mpeg", ".mpg", ".ogv", ".webm", ".wmv"}
AUDIO_EXTENSIONS = {".aac", ".flac", ".m4a", ".mp3", ".oga", ".ogg", ".opus", ".wav"}
FONT_EXTENSIONS = {".eot", ".otf", ".ttf", ".woff", ".woff2"}
DOCUMENT_EXTENSIONS = {".doc", ".docx", ".pdf", ".ppt", ".pptx", ".xls", ".xlsx"}
STYLE_EXTENSIONS = {".css"}
DOWNLOAD_EXTENSIONS = (
    IMAGE_EXTENSIONS
    | VIDEO_EXTENSIONS
    | AUDIO_EXTENSIONS
    | FONT_EXTENSIONS
    | DOCUMENT_EXTENSIONS
    | STYLE_EXTENSIONS
)

URL_ATTRS = {
    "content",
    "data-bg",
    "data-bg-image",
    "data-bg-mobile",
    "data-full",
    "data-full-url",
    "data-image",
    "data-img",
    "data-lazy-src",
    "data-lazy-srcset",
    "data-large-image",
    "data-original",
    "data-poster",
    "data-src",
    "data-srcset",
    "data-thumb",
    "data-thumbnail",
    "href",
    "poster",
    "src",
    "srcset",
}
TEXT_BLOCK_TAGS = {
    "address",
    "article",
    "aside",
    "blockquote",
    "br",
    "dd",
    "div",
    "dl",
    "dt",
    "figcaption",
    "figure",
    "footer",
    "form",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "header",
    "hr",
    "li",
    "main",
    "nav",
    "ol",
    "p",
    "pre",
    "section",
    "table",
    "tbody",
    "td",
    "tfoot",
    "th",
    "thead",
    "tr",
    "ul",
}


def normalize_space(value: str) -> str:
    return re.sub(r"\s+", " ", unescape(value)).strip()


def normalize_url(value: str, base_url: str) -> str | None:
    value = unescape(value).strip().strip("\"'")
    if not value:
        return None
    if value.startswith(("data:", "mailto:", "tel:", "javascript:", "#")):
        return None
    if value.startswith("//"):
        value = "https:" + value
    absolute = urljoin(base_url, value)
    absolute, _fragment = urldefrag(absolute)
    parsed = urlparse(absolute)
    if parsed.scheme not in {"http", "https"}:
        return None
    if "*" in parsed.path:
        return None
    if is_private_host(parsed.hostname):
        public_base = urlparse(base_url)
        absolute = parsed._replace(scheme=public_base.scheme, netloc=public_base.netloc).geturl()
    return absolute


def is_private_host(hostname: str | None) -> bool:
    if not hostname:
        return False
    hostname = hostname.lower()
    if hostname in {"localhost", "127.0.0.1", "::1"}:
        return True
    if hostname.startswith("10."):
        return True
    if hostname.startswith("192.168."):
        return True
    match = re.match(r"^172\.(\d+)\.", hostname)
    return bool(match and 16 <= int(match.group(1)) <= 31)


def quote_request_url(url: str) -> str:
    parts = urlsplit(url)
    return urlunsplit(
        (
            parts.scheme,
            parts.netloc,
            quote(unquote(parts.path), safe="/%:@"),
            quote(unquote(parts.query), safe="=&%:/?+,-._~"),
            parts.fragment,
        )
    )


def split_srcset(value: str) -> list[str]:
    urls: list[str] = []
    for candidate in value.split(","):
        candidate = candidate.strip()
        if not candidate:
            continue
        urls.append(candidate.split()[0])
    return urls


def css_urls(value: str) -> list[str]:
    return [match.group(2).strip() for match in re.finditer(r"url\(\s*(['\"]?)(.*?)\1\s*\)", value)]


def path_extension(url: str) -> str:
    return Path(urlparse(url).path).suffix.lower()


def classify(url: str, hinted_kind: str | None = None, content_type: str | None = None) -> str:
    ext = path_extension(url)
    content_type = (content_type or "").split(";")[0].lower()
    if content_type.startswith("image/") or ext in IMAGE_EXTENSIONS:
        return "images"
    if content_type.startswith("video/") or ext in VIDEO_EXTENSIONS:
        return "videos"
    if content_type.startswith("audio/") or ext in AUDIO_EXTENSIONS:
        return "audio"
    if content_type in {"text/css"} or ext in STYLE_EXTENSIONS:
        return "stylesheets"
    if "font" in content_type or ext in FONT_EXTENSIONS:
        return "fonts"
    if content_type in {"application/pdf"} or ext in DOCUMENT_EXTENSIONS:
        return "documents"
    if hinted_kind:
        return hinted_kind
    return "other"


def should_download(url: str, hinted_kind: str | None = None) -> bool:
    ext = path_extension(url)
    parsed = urlparse(url)
    path = parsed.path.lower()
    if hinted_kind in {"images", "videos", "audio", "stylesheets", "fonts", "documents"}:
        return True
    if ext in DOWNLOAD_EXTENSIONS:
        return True
    if "/wp-content/uploads/" in path:
        return True
    return False


def add_resource(
    resources: dict[str, dict[str, Any]],
    url: str | None,
    base_url: str,
    *,
    hinted_kind: str | None = None,
    source: str,
) -> None:
    normalized = normalize_url(url or "", base_url)
    if not normalized:
        return
    entry = resources.setdefault(
        normalized,
        {
            "url": normalized,
            "kind": classify(normalized, hinted_kind),
            "sources": [],
            "download": should_download(normalized, hinted_kind),
        },
    )
    if hinted_kind and entry["kind"] == "other":
        entry["kind"] = hinted_kind
    if should_download(normalized, hinted_kind):
        entry["download"] = True
    if source not in entry["sources"]:
        entry["sources"].append(source)


class HomepageParser(HTMLParser):
    def __init__(self, base_url: str) -> None:
        super().__init__(convert_charrefs=True)
        self.base_url = base_url
        self.resources: dict[str, dict[str, Any]] = {}
        self.links: list[dict[str, str]] = []
        self.meta: list[dict[str, str]] = []
        self.text_tokens: list[str] = []
        self._skip_depth = 0
        self._style_depth = 0
        self._link_stack: list[dict[str, str]] = []

    def handle_starttag(self, tag: str, attrs_list: list[tuple[str, str | None]]) -> None:
        attrs = {name.lower(): value or "" for name, value in attrs_list}
        tag = tag.lower()

        if tag in {"script", "noscript"}:
            self._skip_depth += 1
        if tag == "style":
            self._style_depth += 1
            self._skip_depth += 1

        if tag in TEXT_BLOCK_TAGS:
            self._newline()

        if tag == "a" and attrs.get("href"):
            href = normalize_url(attrs["href"], self.base_url)
            if href:
                link = {"url": href, "text": ""}
                self.links.append(link)
                self._link_stack.append(link)

        if tag == "meta":
            meta_entry = {
                key: normalize_space(value)
                for key, value in attrs.items()
                if key in {"charset", "content", "name", "property"}
            }
            if meta_entry:
                self.meta.append(meta_entry)
            meta_name = attrs.get("property") or attrs.get("name") or ""
            if meta_name.lower() in {"og:image", "og:image:url", "twitter:image"}:
                add_resource(self.resources, attrs.get("content"), self.base_url, hinted_kind="images", source="meta")
            if meta_name.lower() in {"og:video", "og:video:url"}:
                add_resource(self.resources, attrs.get("content"), self.base_url, hinted_kind="videos", source="meta")

        if tag == "link" and attrs.get("href"):
            rel = attrs.get("rel", "").lower()
            as_type = attrs.get("as", "").lower()
            hinted_kind: str | None = None
            if "stylesheet" in rel or as_type == "style":
                hinted_kind = "stylesheets"
            elif "icon" in rel or as_type == "image":
                hinted_kind = "images"
            elif as_type == "font":
                hinted_kind = "fonts"
            if hinted_kind:
                add_resource(
                    self.resources,
                    attrs.get("href"),
                    self.base_url,
                    hinted_kind=hinted_kind,
                    source=f"link:{rel or as_type}",
                )

        for attr, value in attrs.items():
            if not value:
                continue
            if attr == "style":
                for found in css_urls(value):
                    add_resource(self.resources, found, self.base_url, hinted_kind="images", source="inline-style")
                continue
            if attr not in URL_ATTRS and not attr.startswith("data-"):
                continue
            if attr in {"href", "content"} and tag not in {"link", "meta"}:
                continue
            if attr.endswith("srcset") or attr == "srcset":
                for found in split_srcset(value):
                    add_resource(self.resources, found, self.base_url, hinted_kind="images", source=f"{tag}:{attr}")
                continue
            hinted_kind = self._hint_for(tag, attr, value)
            if attr not in URL_ATTRS and not looks_like_asset_url(value):
                continue
            if looks_like_asset_url(value) or hinted_kind:
                add_resource(self.resources, value, self.base_url, hinted_kind=hinted_kind, source=f"{tag}:{attr}")

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag in TEXT_BLOCK_TAGS:
            self._newline()
        if tag == "a" and self._link_stack:
            self._link_stack.pop()
        if tag == "style" and self._style_depth:
            self._style_depth -= 1
            self._skip_depth = max(0, self._skip_depth - 1)
        if tag in {"script", "noscript"} and self._skip_depth:
            self._skip_depth -= 1

    def handle_data(self, data: str) -> None:
        if self._style_depth:
            for found in css_urls(data):
                add_resource(self.resources, found, self.base_url, hinted_kind="images", source="style-tag")
            return
        if self._skip_depth:
            return
        text = normalize_space(data)
        if not text:
            return
        self.text_tokens.append(text)
        if self._link_stack:
            link = self._link_stack[-1]
            link["text"] = normalize_space((link["text"] + " " + text).strip())

    def _newline(self) -> None:
        if self.text_tokens and self.text_tokens[-1] != "\n":
            self.text_tokens.append("\n")

    @staticmethod
    def _hint_for(tag: str, attr: str, value: str) -> str | None:
        ext = path_extension(value)
        if tag in {"img", "picture"} or ext in IMAGE_EXTENSIONS:
            return "images"
        if tag in {"video"} or attr == "poster" or ext in VIDEO_EXTENSIONS:
            return "videos" if attr != "poster" else "images"
        if tag in {"audio"} or ext in AUDIO_EXTENSIONS:
            return "audio"
        if ext in FONT_EXTENSIONS:
            return "fonts"
        if ext in STYLE_EXTENSIONS:
            return "stylesheets"
        if ext in DOCUMENT_EXTENSIONS:
            return "documents"
        return None


def looks_like_asset_url(value: str) -> bool:
    normalized = value.strip().strip("\"'")
    if "*" in normalized:
        return False
    if normalized.startswith(("http://", "https://", "//", "/", "../", "./")):
        ext = path_extension(normalized)
        return ext in DOWNLOAD_EXTENSIONS or "/wp-content/uploads/" in normalized.lower()
    return False


def raw_asset_urls(html_text: str, base_url: str) -> dict[str, dict[str, Any]]:
    resources: dict[str, dict[str, Any]] = {}
    patterns = [
        r"(?P<url>(?:https?:)?//[^\"'<>\s)]+)",
        r"(?P<url>/(?:wp-content|wp-includes)/[^\"'<>\s)]+)",
    ]
    for pattern in patterns:
        for match in re.finditer(pattern, html_text):
            candidate = match.group("url").rstrip("\\")
            if looks_like_asset_url(candidate):
                add_resource(resources, candidate, base_url, source="raw-html-regex")
    for found in css_urls(html_text):
        add_resource(resources, found, base_url, hinted_kind="images", source="raw-css-url")
    return resources


def request(url: str):
    return Request(quote_request_url(url), headers={"User-Agent": USER_AGENT, "Accept": "*/*"})


def fetch_bytes(url: str) -> tuple[bytes, str, dict[str, str]]:
    with urlopen(request(url), timeout=TIMEOUT) as response:
        return response.read(), response.geturl(), dict(response.headers.items())


def safe_name(url: str, index: int, kind: str, content_type: str | None = None) -> Path:
    parsed = urlparse(url)
    basename = unquote(Path(parsed.path).name) or "resource"
    stem = Path(basename).stem or "resource"
    ext = Path(basename).suffix.lower()
    if not ext and content_type:
        ext = mimetypes.guess_extension(content_type.split(";")[0].strip()) or ""
    safe_stem = re.sub(r"[^A-Za-z0-9._-]+", "-", stem).strip(".-_") or "resource"
    digest = hashlib.sha1(url.encode("utf-8")).hexdigest()[:10]
    if ext and not ext.startswith("."):
        ext = "." + ext
    return Path("assets") / kind / f"{index:03d}-{safe_stem}-{digest}{ext}"


def download_asset(url: str, out_dir: Path, index: int, hinted_kind: str) -> dict[str, Any]:
    last_error = ""
    for attempt in range(1, 4):
        started = time.time()
        try:
            with urlopen(request(url), timeout=TIMEOUT) as response:
                final_url = response.geturl()
                headers = dict(response.headers.items())
                content_type = headers.get("Content-Type", "")
                kind = classify(final_url, hinted_kind, content_type)
                relative_path = safe_name(final_url, index, kind, content_type)
                full_path = out_dir / relative_path
                full_path.parent.mkdir(parents=True, exist_ok=True)
                size = 0
                with full_path.open("wb") as output:
                    while True:
                        chunk = response.read(1024 * 256)
                        if not chunk:
                            break
                        size += len(chunk)
                        output.write(chunk)
                return {
                    "status": "downloaded",
                    "url": url,
                    "final_url": final_url,
                    "local_path": str(relative_path).replace("\\", "/"),
                    "kind": kind,
                    "content_type": content_type,
                    "bytes": size,
                    "seconds": round(time.time() - started, 3),
                    "attempts": attempt,
                }
        except HTTPError as exc:
            last_error = f"HTTP {exc.code}: {exc.reason}"
            if exc.code < 500:
                break
        except URLError as exc:
            last_error = str(exc.reason)
        except OSError as exc:
            last_error = str(exc)
        if attempt < 3:
            time.sleep(attempt)
    return {"status": "failed", "url": url, "kind": hinted_kind, "error": last_error}


def visible_text(tokens: list[str]) -> str:
    lines: list[str] = []
    current: list[str] = []
    for token in tokens:
        if token == "\n":
            if current:
                lines.append(normalize_space(" ".join(current)))
                current = []
            continue
        current.append(token)
    if current:
        lines.append(normalize_space(" ".join(current)))

    compacted: list[str] = []
    previous = ""
    for line in lines:
        if not line or line == previous:
            continue
        compacted.append(line)
        previous = line
    return "\n\n".join(compacted) + "\n"


def write_links_csv(path: Path, links: list[dict[str, str]]) -> None:
    with path.open("w", encoding="utf-8", newline="") as output:
        writer = csv.DictWriter(output, fieldnames=["text", "url"])
        writer.writeheader()
        for link in links:
            writer.writerow({"text": link.get("text", ""), "url": link.get("url", "")})


def write_manifest(out_dir: Path, root_url: str, final_url: str, resources: dict[str, dict[str, Any]]) -> None:
    resource_list = sorted(resources.values(), key=lambda item: (item.get("kind", ""), item.get("url", "")))
    (out_dir / "manifest.json").write_text(
        json.dumps(
            {
                "source_url": root_url,
                "final_url": final_url,
                "archived_at": datetime.now(timezone.utc).isoformat(),
                "downloaded_count": sum(1 for item in resource_list if item.get("status") == "downloaded"),
                "failed_count": sum(1 for item in resource_list if item.get("status") == "failed"),
                "pending_count": sum(1 for item in resource_list if item.get("download") and not item.get("status")),
                "referenced_count": len(resource_list),
                "resources": resource_list,
            },
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    with (out_dir / "manifest.csv").open("w", encoding="utf-8", newline="") as output:
        fieldnames = ["status", "kind", "bytes", "content_type", "local_path", "url", "final_url", "error", "sources"]
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        for item in resource_list:
            writer.writerow(
                {
                    key: "; ".join(item[key])
                    if key == "sources" and isinstance(item.get(key), list)
                    else item.get(key, "")
                    for key in fieldnames
                }
            )


def merge_resources(*resource_sets: dict[str, dict[str, Any]]) -> dict[str, dict[str, Any]]:
    merged: dict[str, dict[str, Any]] = {}
    for resources in resource_sets:
        for url, entry in resources.items():
            current = merged.setdefault(url, dict(entry, sources=[]))
            current["download"] = current.get("download", False) or entry.get("download", False)
            current["kind"] = current.get("kind") if current.get("kind") != "other" else entry.get("kind", "other")
            for source in entry.get("sources", []):
                if source not in current["sources"]:
                    current["sources"].append(source)
    return merged


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Archive the Imagine Division live homepage content and assets.")
    parser.add_argument("--url", default=ROOT_URL, help="Homepage URL to archive.")
    parser.add_argument("--output", default=str(OUTPUT_DIR), help="Output directory for the archive bundle.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    root_url = args.url
    out_dir = Path(args.output)
    raw_dir = out_dir / "raw"
    content_dir = out_dir / "content"
    raw_dir.mkdir(parents=True, exist_ok=True)
    content_dir.mkdir(parents=True, exist_ok=True)

    html_bytes, final_url, headers = fetch_bytes(root_url)
    html_text = html_bytes.decode(headers.get("Content-Type", "").split("charset=")[-1], errors="replace") if "charset=" in headers.get("Content-Type", "") else html_bytes.decode("utf-8", errors="replace")
    (raw_dir / "homepage.html").write_text(html_text, encoding="utf-8")
    (raw_dir / "homepage.headers.json").write_text(json.dumps(headers, indent=2, ensure_ascii=False), encoding="utf-8")

    parser = HomepageParser(final_url)
    parser.feed(html_text)
    resources = merge_resources(parser.resources, raw_asset_urls(html_text, final_url))

    (content_dir / "homepage-text.txt").write_text(visible_text(parser.text_tokens), encoding="utf-8")
    (content_dir / "homepage-links.json").write_text(json.dumps(parser.links, indent=2, ensure_ascii=False), encoding="utf-8")
    write_links_csv(content_dir / "homepage-links.csv", parser.links)
    (content_dir / "homepage-meta.json").write_text(json.dumps(parser.meta, indent=2, ensure_ascii=False), encoding="utf-8")
    write_manifest(out_dir, root_url, final_url, resources)
    print(f"Parsed homepage and wrote content files in {content_dir}", flush=True)

    next_index = 1
    stylesheet_urls = [
        url
        for url, entry in resources.items()
        if entry.get("download") and classify(url, entry.get("kind")) == "stylesheets"
    ]
    for url in stylesheet_urls:
        entry = resources[url]
        print(f"Downloading stylesheet {next_index}/{len(stylesheet_urls)}: {url}", flush=True)
        result = download_asset(url, out_dir, next_index, entry.get("kind", "other"))
        next_index += 1
        entry.update(result)
        if result.get("status") == "downloaded" and result.get("kind") == "stylesheets":
            css_path = out_dir / result["local_path"]
            try:
                css_text = css_path.read_text(encoding="utf-8", errors="replace")
            except OSError:
                css_text = ""
            for found in css_urls(css_text):
                add_resource(resources, found, result.get("final_url") or url, source=f"css:{result['local_path']}")
        write_manifest(out_dir, root_url, final_url, resources)

    asset_jobs: list[tuple[int, str, str]] = []
    for url, entry in resources.items():
        if not entry.get("download") or entry.get("status") or classify(url, entry.get("kind")) == "stylesheets":
            continue
        asset_jobs.append((next_index, url, entry.get("kind", "other")))
        next_index += 1

    print(f"Downloading {len(asset_jobs)} non-stylesheet assets with {MAX_WORKERS} workers", flush=True)
    completed = 0
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {
            executor.submit(download_asset, url, out_dir, index, hinted_kind): url
            for index, url, hinted_kind in asset_jobs
        }
        for future in as_completed(futures):
            url = futures[future]
            completed += 1
            try:
                result = future.result()
            except Exception as exc:
                result = {"status": "failed", "url": url, "kind": resources[url].get("kind", "other"), "error": str(exc)}
            resources[url].update(result)
            if completed == 1 or completed % 10 == 0 or completed == len(asset_jobs):
                downloaded_count = sum(1 for item in resources.values() if item.get("status") == "downloaded")
                failed_count = sum(1 for item in resources.values() if item.get("status") == "failed")
                print(
                    f"Progress: {completed}/{len(asset_jobs)} assets complete "
                    f"({downloaded_count} downloaded, {failed_count} failed)",
                    flush=True,
                )
                write_manifest(out_dir, root_url, final_url, resources)

    write_manifest(out_dir, root_url, final_url, resources)
    resource_list = sorted(resources.values(), key=lambda item: (item.get("kind", ""), item.get("url", "")))

    print(f"Archived {root_url} -> {out_dir}")
    print(f"Referenced resources: {len(resource_list)}")
    print(f"Downloaded: {sum(1 for item in resource_list if item.get('status') == 'downloaded')}")
    print(f"Failed: {sum(1 for item in resource_list if item.get('status') == 'failed')}")
    print(f"Text: {content_dir / 'homepage-text.txt'}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        print("Interrupted", file=sys.stderr)
        raise SystemExit(130)
