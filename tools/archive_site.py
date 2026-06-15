from __future__ import annotations

import argparse
import csv
import json
import re
import time
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qsl, urlencode, urljoin, urlparse, urlunparse
from urllib.request import urlopen

from archive_homepage import (
    MAX_WORKERS,
    ROOT_URL,
    TIMEOUT,
    HomepageParser,
    add_resource,
    classify,
    css_urls,
    download_asset,
    fetch_bytes,
    merge_resources,
    normalize_url,
    path_extension,
    raw_asset_urls,
    request,
    should_download,
    visible_text,
    write_links_csv,
    write_manifest,
)


OUTPUT_DIR = Path("source-archive") / "imaginedivision-site-2026-06-06-final"
PAGE_EXTENSIONS = {"", ".html", ".htm", ".php", ".asp", ".aspx"}
SKIP_PAGE_PREFIXES = (
    "/cdn-cgi",
    "/feed",
    "/wp-admin",
    "/wp-content",
    "/wp-includes",
    "/wp-json",
    "/xmlrpc.php",
)
SKIP_QUERY_KEYS = {
    "fbclid",
    "gclid",
    "replytocom",
    "utm_campaign",
    "utm_content",
    "utm_medium",
    "utm_source",
    "utm_term",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Archive a same-domain website into raw pages, text, links, and assets.")
    parser.add_argument("--url", default=ROOT_URL, help="Website root URL.")
    parser.add_argument("--output", default=str(OUTPUT_DIR), help="Output directory for the archive bundle.")
    parser.add_argument("--max-pages", type=int, default=1000, help="Maximum HTML pages to crawl.")
    parser.add_argument("--max-sitemaps", type=int, default=100, help="Maximum XML sitemap files to inspect.")
    return parser.parse_args()


def fetch_optional(url: str) -> tuple[bytes, str, dict[str, str]] | None:
    try:
        return fetch_bytes(url)
    except (HTTPError, URLError, TimeoutError, OSError):
        return None


def same_site(url: str, root_url: str) -> bool:
    parsed = urlparse(url)
    root = urlparse(root_url)
    return parsed.scheme in {"http", "https"} and parsed.netloc.lower() == root.netloc.lower()


def clean_query(query: str) -> str:
    pairs = [(key, value) for key, value in parse_qsl(query, keep_blank_values=True) if key.lower() not in SKIP_QUERY_KEYS]
    return urlencode(pairs, doseq=True)


def canonical_page_url(url: str, root_url: str) -> str | None:
    normalized = normalize_url(url, root_url)
    if not normalized or not same_site(normalized, root_url):
        return None
    parsed = urlparse(normalized)
    path = parsed.path or "/"
    path_lower = path.lower()
    if any(path_lower.startswith(prefix) for prefix in SKIP_PAGE_PREFIXES):
        return None
    if path_lower.endswith(("/feed", "/feed/")):
        return None
    ext = path_extension(normalized)
    if ext and ext not in PAGE_EXTENSIONS:
        return None
    if should_download(normalized):
        return None
    query = clean_query(parsed.query)
    parsed = parsed._replace(path=path, query=query, fragment="")
    if parsed.path != "/" and parsed.path.endswith("/"):
        parsed = parsed._replace(path=parsed.path.rstrip("/"))
    return urlunparse(parsed)


def discover_sitemap_urls(root_url: str) -> list[str]:
    root = urlparse(root_url)
    candidates = [
        urljoin(root_url, "/sitemap.xml"),
        urljoin(root_url, "/wp-sitemap.xml"),
        urljoin(root_url, "/sitemap_index.xml"),
    ]
    robots = fetch_optional(urljoin(root_url, "/robots.txt"))
    if robots:
        robots_text = decode_bytes(robots[0], robots[2])
        for line in robots_text.splitlines():
            match = re.match(r"^\s*sitemap\s*:\s*(\S+)", line, flags=re.IGNORECASE)
            if match:
                candidates.append(match.group(1))
    unique: list[str] = []
    seen: set[str] = set()
    for candidate in candidates:
        normalized = normalize_url(candidate, root_url)
        if normalized and urlparse(normalized).netloc.lower() == root.netloc.lower() and normalized not in seen:
            seen.add(normalized)
            unique.append(normalized)
    return unique


def discover_pages_from_sitemaps(root_url: str, max_sitemaps: int) -> tuple[list[str], list[dict[str, str]]]:
    sitemap_queue = discover_sitemap_urls(root_url)
    seen_sitemaps: set[str] = set()
    pages: list[str] = []
    errors: list[dict[str, str]] = []

    while sitemap_queue and len(seen_sitemaps) < max_sitemaps:
        sitemap_url = sitemap_queue.pop(0)
        if sitemap_url in seen_sitemaps:
            continue
        seen_sitemaps.add(sitemap_url)
        fetched = fetch_optional(sitemap_url)
        if not fetched:
            errors.append({"url": sitemap_url, "error": "unavailable"})
            continue
        data, final_url, headers = fetched
        text = decode_bytes(data, headers)
        locs = parse_sitemap_locs(text)
        if not locs:
            errors.append({"url": final_url, "error": "no <loc> entries found"})
            continue
        if "<sitemapindex" in text[:500].lower():
            for loc in locs:
                normalized = normalize_url(loc, root_url)
                if normalized and same_site(normalized, root_url) and normalized not in seen_sitemaps:
                    sitemap_queue.append(normalized)
            continue
        for loc in locs:
            page_url = canonical_page_url(loc, root_url)
            if page_url and page_url not in pages:
                pages.append(page_url)
    return pages, errors


def parse_sitemap_locs(text: str) -> list[str]:
    try:
        root = ET.fromstring(text)
        return [
            (element.text or "").strip()
            for element in root.iter()
            if element.tag.endswith("loc") and (element.text or "").strip()
        ]
    except ET.ParseError:
        return [match.group(1).strip() for match in re.finditer(r"<loc>\s*(.*?)\s*</loc>", text, flags=re.I | re.S)]


def decode_bytes(data: bytes, headers: dict[str, str]) -> str:
    content_type = headers.get("Content-Type", "")
    match = re.search(r"charset=([^;\s]+)", content_type, flags=re.I)
    encoding = match.group(1) if match else "utf-8"
    return data.decode(encoding, errors="replace")


def page_slug(url: str, index: int) -> str:
    parsed = urlparse(url)
    if parsed.path in {"", "/"}:
        base = "home"
    else:
        base = parsed.path.strip("/").replace("/", "__")
    if parsed.query:
        base += "__" + re.sub(r"[^A-Za-z0-9._-]+", "-", parsed.query)
    base = re.sub(r"[^A-Za-z0-9._-]+", "-", base).strip(".-_") or "page"
    return f"{index:03d}-{base[:140]}"


def crawl_pages(root_url: str, seed_urls: list[str], out_dir: Path, max_pages: int) -> tuple[list[dict[str, Any]], dict[str, dict[str, Any]]]:
    queue: list[str] = []
    queued: set[str] = set()
    for url in [root_url, *seed_urls]:
        page_url = canonical_page_url(url, root_url)
        if page_url and page_url not in queued:
            queued.add(page_url)
            queue.append(page_url)

    pages: list[dict[str, Any]] = []
    resources: dict[str, dict[str, Any]] = {}
    raw_pages_dir = out_dir / "raw" / "pages"
    text_pages_dir = out_dir / "content" / "pages"
    link_pages_dir = out_dir / "content" / "links"
    raw_pages_dir.mkdir(parents=True, exist_ok=True)
    text_pages_dir.mkdir(parents=True, exist_ok=True)
    link_pages_dir.mkdir(parents=True, exist_ok=True)

    seen_pages: set[str] = set()
    while queue and len(pages) < max_pages:
        url = queue.pop(0)
        if url in seen_pages:
            continue
        seen_pages.add(url)
        index = len(pages) + 1
        print(f"Fetching page {index}: {url}", flush=True)
        try:
            data, final_url, headers = fetch_bytes(url)
        except HTTPError as exc:
            pages.append({"url": url, "status": "failed", "error": f"HTTP {exc.code}: {exc.reason}"})
            continue
        except (URLError, TimeoutError, OSError) as exc:
            pages.append({"url": url, "status": "failed", "error": str(exc)})
            continue

        content_type = headers.get("Content-Type", "")
        if "html" not in content_type.lower():
            add_resource(resources, final_url, root_url, hinted_kind=classify(final_url, content_type=content_type), source="non-html-page")
            pages.append({"url": url, "final_url": final_url, "status": "skipped", "content_type": content_type})
            continue

        html_text = decode_bytes(data, headers)
        slug = page_slug(url, index)
        raw_path = raw_pages_dir / f"{slug}.html"
        text_path = text_pages_dir / f"{slug}.txt"
        links_path = link_pages_dir / f"{slug}.links.json"
        raw_path.write_text(html_text, encoding="utf-8")

        parser = HomepageParser(final_url)
        parser.feed(html_text)
        page_resources = merge_resources(parser.resources, raw_asset_urls(html_text, final_url))
        resources = merge_resources(resources, page_resources)

        page_text = visible_text(parser.text_tokens)
        text_path.write_text(page_text, encoding="utf-8")
        links_path.write_text(json.dumps(parser.links, indent=2, ensure_ascii=False), encoding="utf-8")

        internal_links = []
        for link in parser.links:
            page_url = canonical_page_url(link.get("url", ""), root_url)
            if not page_url:
                continue
            internal_links.append(page_url)
            if page_url not in queued and page_url not in seen_pages and len(queued) + len(seen_pages) < max_pages:
                queued.add(page_url)
                queue.append(page_url)

        pages.append(
            {
                "url": url,
                "final_url": final_url,
                "status": "downloaded",
                "content_type": content_type,
                "raw_path": str(raw_path.relative_to(out_dir)).replace("\\", "/"),
                "text_path": str(text_path.relative_to(out_dir)).replace("\\", "/"),
                "links_path": str(links_path.relative_to(out_dir)).replace("\\", "/"),
                "text_bytes": len(page_text.encode("utf-8")),
                "link_count": len(parser.links),
                "internal_link_count": len(set(internal_links)),
                "resource_count": len(page_resources),
            }
        )
        time.sleep(0.15)

    return pages, resources


def download_resources(out_dir: Path, root_url: str, resources: dict[str, dict[str, Any]]) -> None:
    write_manifest(out_dir, root_url, root_url, resources)
    stylesheet_urls = [
        url
        for url, entry in resources.items()
        if entry.get("download") and classify(url, entry.get("kind")) == "stylesheets"
    ]
    next_index = 1
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
        write_manifest(out_dir, root_url, root_url, resources)

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
            if completed == 1 or completed % 25 == 0 or completed == len(asset_jobs):
                downloaded_count = sum(1 for item in resources.values() if item.get("status") == "downloaded")
                failed_count = sum(1 for item in resources.values() if item.get("status") == "failed")
                print(
                    f"Progress: {completed}/{len(asset_jobs)} assets complete "
                    f"({downloaded_count} downloaded, {failed_count} failed)",
                    flush=True,
                )
                write_manifest(out_dir, root_url, root_url, resources)
    write_manifest(out_dir, root_url, root_url, resources)


def write_site_indexes(
    out_dir: Path,
    root_url: str,
    pages: list[dict[str, Any]],
    sitemap_pages: list[str],
    sitemap_errors: list[dict[str, str]],
) -> None:
    content_dir = out_dir / "content"
    content_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "pages.json").write_text(json.dumps(pages, indent=2, ensure_ascii=False), encoding="utf-8")
    with (out_dir / "pages.csv").open("w", encoding="utf-8", newline="") as output:
        fieldnames = [
            "status",
            "url",
            "final_url",
            "content_type",
            "raw_path",
            "text_path",
            "links_path",
            "text_bytes",
            "link_count",
            "internal_link_count",
            "resource_count",
            "error",
        ]
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        for page in pages:
            writer.writerow({key: page.get(key, "") for key in fieldnames})

    combined_text = []
    for page in pages:
        if page.get("status") != "downloaded":
            continue
        text_path = out_dir / page["text_path"]
        try:
            text = text_path.read_text(encoding="utf-8")
        except OSError:
            continue
        combined_text.append(f"# {page['url']}\n\n{text.strip()}\n")
    (content_dir / "all-pages-text.txt").write_text("\n\n".join(combined_text) + "\n", encoding="utf-8")

    all_links: list[dict[str, str]] = []
    for page in pages:
        if page.get("status") != "downloaded":
            continue
        links_path = out_dir / page["links_path"]
        try:
            links = json.loads(links_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            links = []
        for link in links:
            all_links.append({"page_url": page["url"], "text": link.get("text", ""), "url": link.get("url", "")})
    (content_dir / "all-links.json").write_text(json.dumps(all_links, indent=2, ensure_ascii=False), encoding="utf-8")
    with (content_dir / "all-links.csv").open("w", encoding="utf-8", newline="") as output:
        writer = csv.DictWriter(output, fieldnames=["page_url", "text", "url"])
        writer.writeheader()
        writer.writerows(all_links)

    (out_dir / "sitemap-discovery.json").write_text(
        json.dumps(
            {
                "root_url": root_url,
                "discovered_page_count": len(sitemap_pages),
                "discovered_pages": sitemap_pages,
                "sitemap_errors": sitemap_errors,
            },
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )


def write_readme(out_dir: Path, root_url: str, pages: list[dict[str, Any]], resources: dict[str, dict[str, Any]]) -> None:
    resource_list = list(resources.values())
    downloaded_pages = sum(1 for page in pages if page.get("status") == "downloaded")
    failed_pages = sum(1 for page in pages if page.get("status") == "failed")
    downloaded_resources = sum(1 for item in resource_list if item.get("status") == "downloaded")
    failed_resources = [item for item in resource_list if item.get("status") == "failed"]
    total_bytes = sum(path.stat().st_size for path in out_dir.rglob("*") if path.is_file())
    failed_lines = "\n".join(f"- `{item.get('url')}`: {item.get('error')}" for item in failed_resources) or "- None"
    readme = f"""# Imagine Division Full Site Archive

Source: {root_url}

Archived at (UTC): {datetime.now(timezone.utc).isoformat()}

This is a same-domain crawl of the live website. It combines sitemap discovery with internal links found on crawled pages.

## Contents

- `raw/pages/`: Raw HTML for each crawled page.
- `content/pages/`: Extracted visible text per page.
- `content/links/`: Links extracted per page.
- `content/all-pages-text.txt`: Combined text for rewriting.
- `content/all-links.json` and `content/all-links.csv`: Combined link inventory.
- `assets/images/`: Downloaded image files and SVG image assets.
- `assets/fonts/`: Downloaded font files.
- `assets/stylesheets/`: Downloaded CSS.
- `assets/other/`: Other directly referenced small assets.
- `pages.json` and `pages.csv`: Page crawl manifest.
- `manifest.json` and `manifest.csv`: Resource URL-to-local-file manifest.
- `sitemap-discovery.json`: Sitemap discovery details.

## Counts

- Pages downloaded: {downloaded_pages}
- Pages failed: {failed_pages}
- Referenced resources: {len(resource_list)}
- Resources downloaded: {downloaded_resources}
- Resources failed: {len(failed_resources)}
- Total archive size: {total_bytes / (1024 * 1024):.1f} MB

## Known Unavailable Resource References

{failed_lines}

## Coverage Notes

- XML sitemap and robots sitemap discovery are used as crawl seeds.
- Public same-domain links discovered on crawled pages are recursively crawled.
- WordPress internals, feeds, media directories, and Cloudflare email-protection URLs are skipped as pages.
"""
    (out_dir / "README.md").write_text(readme, encoding="utf-8")


def main() -> int:
    args = parse_args()
    root_url = args.url
    out_dir = Path(args.output)
    out_dir.mkdir(parents=True, exist_ok=True)

    print("Discovering sitemap pages", flush=True)
    sitemap_pages, sitemap_errors = discover_pages_from_sitemaps(root_url, args.max_sitemaps)
    print(f"Sitemap page seeds: {len(sitemap_pages)}", flush=True)

    pages, resources = crawl_pages(root_url, sitemap_pages, out_dir, args.max_pages)
    write_site_indexes(out_dir, root_url, pages, sitemap_pages, sitemap_errors)
    print(f"Crawled pages: {sum(1 for page in pages if page.get('status') == 'downloaded')}", flush=True)

    download_resources(out_dir, root_url, resources)
    write_readme(out_dir, root_url, pages, resources)

    downloaded_resources = sum(1 for item in resources.values() if item.get("status") == "downloaded")
    failed_resources = sum(1 for item in resources.values() if item.get("status") == "failed")
    print(f"Archived {root_url} -> {out_dir}")
    print(f"Pages downloaded: {sum(1 for page in pages if page.get('status') == 'downloaded')}")
    print(f"Resources referenced: {len(resources)}")
    print(f"Resources downloaded: {downloaded_resources}")
    print(f"Resources failed: {failed_resources}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
