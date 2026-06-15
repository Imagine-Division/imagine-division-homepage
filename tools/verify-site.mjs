import { createReadStream, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { tmpdir } from "node:os";
import net from "node:net";

const root = resolve(import.meta.dirname, "..");
const verificationDir = join(root, "verification");
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const mime = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".svg", "image/svg+xml"],
  [".ico", "image/x-icon"],
  [".otf", "font/otf"],
  [".woff2", "font/woff2"],
]);

function runBuild() {
  const result = spawnSync("node", ["tools/build-site.mjs"], {
    cwd: root,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(`Build failed\n${result.stdout}\n${result.stderr}`);
  }
}

function freePort() {
  return new Promise((resolvePort, reject) => {
    const server = net.createServer();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => resolvePort(port));
    });
  });
}

function fileForRequest(pathname) {
  const decoded = decodeURIComponent(pathname);
  const requestPath = decoded === "/" ? "/index.html" : decoded;
  let filePath = normalize(join(root, requestPath));
  if (!filePath.startsWith(root)) return null;
  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = join(filePath, "index.html");
  }
  if (!existsSync(filePath) && !extname(filePath)) {
    filePath = join(filePath, "index.html");
  }
  if (!filePath.startsWith(root) || !existsSync(filePath)) return null;
  return filePath;
}

function startStaticServer() {
  const server = createServer((request, response) => {
    const url = new URL(request.url, "http://127.0.0.1");
    const filePath = fileForRequest(url.pathname);
    if (!filePath) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }
    response.writeHead(200, {
      "content-type": mime.get(extname(filePath).toLowerCase()) || "application/octet-stream",
    });
    createReadStream(filePath).pipe(response);
  });

  return new Promise((resolveServer, reject) => {
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => resolveServer(server));
  });
}

async function waitForJson(url, attempts = 80) {
  for (let index = 0; index < attempts; index += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
    } catch {
      // Chrome may take a moment to expose the debugging endpoint.
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

class CDP {
  constructor(url) {
    this.id = 0;
    this.pending = new Map();
    this.listeners = new Map();
    this.socket = new WebSocket(url);
    this.ready = new Promise((resolveReady, rejectReady) => {
      this.socket.addEventListener("open", resolveReady, { once: true });
      this.socket.addEventListener("error", rejectReady, { once: true });
    });
    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        const { resolveSend, rejectSend } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) rejectSend(new Error(message.error.message));
        else resolveSend(message.result);
        return;
      }
      if (message.method && this.listeners.has(message.method)) {
        for (const listener of this.listeners.get(message.method)) listener(message.params);
      }
    });
  }

  async send(method, params = {}) {
    await this.ready;
    const id = ++this.id;
    this.socket.send(JSON.stringify({ id, method, params }));
    return new Promise((resolveSend, rejectSend) => {
      this.pending.set(id, { resolveSend, rejectSend });
    });
  }

  waitFor(method) {
    return new Promise((resolveEvent) => {
      const listeners = this.listeners.get(method) || [];
      const listener = (params) => {
        this.listeners.set(
          method,
          (this.listeners.get(method) || []).filter((item) => item !== listener)
        );
        resolveEvent(params);
      };
      listeners.push(listener);
      this.listeners.set(method, listeners);
    });
  }

  close() {
    this.socket.close();
  }
}

async function createPage(debugPort) {
  const response = await fetch(`http://127.0.0.1:${debugPort}/json/new?about:blank`, {
    method: "PUT",
  });
  if (!response.ok) throw new Error(`Unable to create Chrome target: ${response.status}`);
  return response.json();
}

function expectedRoutes(manifest) {
  const routes = ["/", "/about/", "/projects/", "/contact/", "/services/"];
  for (const page of manifest.standalonePages || []) routes.push(`/${page}`, `/${page}/`);
  const languages = manifest.languages;
  for (const lang of languages) {
    routes.push(`/${lang}/`, `/${lang}/about/`, `/${lang}/projects/`, `/${lang}/contact/`, `/${lang}/services/`);
    for (const service of manifest.services) routes.push(`/${lang}/services/${service}/`);
    for (const project of manifest.projects) routes.push(`/${lang}/projects/${project}/`);
  }
  for (const service of manifest.services) routes.push(`/${service}/`);
  for (const project of manifest.projects) routes.push(`/project/${project}/`);
  return routes;
}

async function verifyRoutes(baseUrl, manifest) {
  const failures = [];
  const leaked = [];
  const routes = expectedRoutes(manifest);
  for (const route of routes) {
    const response = await fetch(`${baseUrl}${route}`);
    if (!response.ok) {
      failures.push({ route, status: response.status });
      continue;
    }
    const text = await response.text();
    if (
      /Website built with Semplice|網站第一篇文章|EN headline|EN body|ZH_HK|Primary CTA|Secondary CTA|Portfolio Images|作品集圖片|Page render|Embedded images|Not specified in archive|Extracted portfolio page text/.test(
        text
      )
    ) {
      leaked.push(route);
    }
  }
  if (failures.length || leaked.length) {
    throw new Error(`Route verification failed: ${JSON.stringify({ failures, leaked }, null, 2)}`);
  }
  return { routeCount: routes.length };
}

async function verifyViewport(client, siteUrl, viewport, outputName) {
  await client.send("Page.enable");
  await client.send("Runtime.enable");
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
    mobile: viewport.mobile,
  });

  const loaded = client.waitFor("Page.loadEventFired");
  await client.send("Page.navigate", { url: siteUrl });
  await loaded;
  await new Promise((resolveWait) => setTimeout(resolveWait, 900));

  const expression = `(() => {
    const bodyText = document.body.textContent || "";
    const projectCards = [...document.querySelectorAll(".project-card")];
    const filterButton = document.querySelector("[data-project-filter='event production']");
    if (filterButton) filterButton.click();
    const visibleAfterFilter = [...document.querySelectorAll(".project-card")].filter((card) => !card.hidden).length;
    const galleryItems = [...document.querySelectorAll(".project-gallery-item")];
    const loadedGalleryImages = galleryItems.filter((item) => item.querySelector("img")?.naturalWidth > 0).length;
      const navToggle = document.querySelector("[data-nav-toggle]");
      let navOpened = false;
      if (navToggle) {
        navToggle.click();
        navOpened = document.querySelector("[data-primary-nav]")?.dataset.open === "true";
        navToggle.click();
      }
    return {
      title: document.title,
      h1: document.querySelector("h1")?.textContent.trim(),
      services: document.querySelectorAll(".service-menu-panel a").length,
      projectCards: projectCards.length,
      visibleAfterFilter,
      hasEmail: bodyText.includes("info@imaginedivision.com"),
      hasLegacyPost: bodyText.includes("網站第一篇文章"),
      hasSemplice: bodyText.includes("Website built with Semplice"),
      hasLanguageLeak: /EN headline|EN body|ZH_HK|Primary CTA|Secondary CTA/.test(bodyText),
      hasSourceWording: /Portfolio Images|作品集圖片|Page render|embedded image|Not specified in archive|Extracted portfolio page text/.test(bodyText),
      logoLoaded: document.querySelector(".brand img")?.naturalWidth > 0,
      imageCount: [...document.images].filter((image) => image.naturalWidth > 0).length,
      nonCriticalImages: [...document.images].filter((image) => {
        return !image.classList.contains("hero-media") && !image.closest(".brand") && !image.closest(".links-profile");
      }).length,
      nonCriticalNotLazy: [...document.images]
        .filter((image) => {
          return !image.classList.contains("hero-media") && !image.closest(".brand") && !image.closest(".links-profile");
        })
        .filter((image) => image.loading !== "lazy")
        .map((image) => image.getAttribute("src")),
      stylesheetLoaded: [...document.styleSheets].some((sheet) => sheet.href && sheet.href.includes("site.css")),
      heroDisplay: getComputedStyle(document.querySelector(".hero")).display,
      heroMetaCount: document.querySelectorAll(".hero-meta").length,
      projectGalleryItems: galleryItems.length,
      loadedGalleryImages,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      navOpened
    };
  })()`;

  const evaluation = await client.send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });

  const screenshot = await client.send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
  });
  writeFileSync(join(verificationDir, outputName), Buffer.from(screenshot.data, "base64"));
  return evaluation.result.value;
}

async function verifySpaNavigation(client, siteUrl) {
  await client.send("Page.enable");
  await client.send("Runtime.enable");
  const loaded = client.waitFor("Page.loadEventFired");
  await client.send("Page.navigate", { url: siteUrl });
  await loaded;
  await new Promise((resolveWait) => setTimeout(resolveWait, 500));

  const evaluation = await client.send("Runtime.evaluate", {
    expression: `new Promise((resolve) => {
      const navigationEntriesBefore = performance.getEntriesByType("navigation").length;
      const link = [...document.querySelectorAll("a[href]")].find((anchor) => {
        try {
          return ["/en/about/", "/en/about/index.html"].includes(new URL(anchor.href).pathname);
        } catch {
          return false;
        }
      });
      if (!link) {
        resolve({ missingLink: true });
        return;
      }
      const timeout = setTimeout(() => {
        resolve({
          timeout: true,
          path: location.pathname,
          navigationCount: window.ImagineDivisionSPA?.navigationCount || 0,
          navigationEntriesBefore,
          navigationEntriesAfter: performance.getEntriesByType("navigation").length,
        });
      }, 4000);
      window.addEventListener(
        "imagine:routechange",
        () => {
          clearTimeout(timeout);
          requestAnimationFrame(() => {
            resolve({
              path: location.pathname,
              title: document.title,
              h1: document.querySelector("h1")?.textContent.trim(),
              bodyPage: document.body.dataset.page,
              navigationCount: window.ImagineDivisionSPA?.navigationCount || 0,
              navigationEntriesBefore,
              navigationEntriesAfter: performance.getEntriesByType("navigation").length,
              routeRequests: performance
                .getEntriesByType("resource")
                .filter((entry) => entry.name.includes("/en/about/")).length,
              nonCriticalNotLazy: [...document.images]
                .filter((image) => {
                  return !image.classList.contains("hero-media") && !image.closest(".brand") && !image.closest(".links-profile");
                })
                .filter((image) => image.loading !== "lazy")
                .map((image) => image.getAttribute("src")),
            });
          });
        },
        { once: true }
      );
      link.click();
    })`,
    returnByValue: true,
    awaitPromise: true,
  });
  return evaluation.result.value;
}

async function captureSection(client, siteUrl, viewport, selector, outputName) {
  await client.send("Page.enable");
  await client.send("Runtime.enable");
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
    mobile: viewport.mobile,
  });

  const loaded = client.waitFor("Page.loadEventFired");
  await client.send("Page.navigate", { url: siteUrl });
  await loaded;
  await new Promise((resolveWait) => setTimeout(resolveWait, 900));
  await client.send("Runtime.evaluate", {
    expression: `document.querySelector(${JSON.stringify(selector)})?.scrollIntoView({ block: "center" })`,
    returnByValue: true,
  });
  await new Promise((resolveWait) => setTimeout(resolveWait, 300));
  const screenshot = await client.send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
  });
  writeFileSync(join(verificationDir, outputName), Buffer.from(screenshot.data, "base64"));
}

async function main() {
  runBuild();
  if (!existsSync(chromePath)) throw new Error(`Chrome not found: ${chromePath}`);
  mkdirSync(verificationDir, { recursive: true });

  const manifest = JSON.parse(readFileSync(join(root, "site-manifest.json"), "utf8"));
  const staticServer = await startStaticServer();
  const sitePort = staticServer.address().port;
  const debugPort = await freePort();
  const chromeProfile = mkdtempSync(join(tmpdir(), "imagine-division-cdp-"));
  const chrome = spawn(chromePath, [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${chromeProfile}`,
    "about:blank",
  ]);

  try {
    const baseUrl = `http://127.0.0.1:${sitePort}`;
    const routeSummary = await verifyRoutes(baseUrl, manifest);
    await waitForJson(`http://127.0.0.1:${debugPort}/json/version`);
    const page = await createPage(debugPort);
    const client = new CDP(page.webSocketDebuggerUrl);
    await client.ready;

    const desktopHome = await verifyViewport(client, `${baseUrl}/en/`, { width: 1440, height: 1100, mobile: false }, "desktop-home.png");
    const mobileHome = await verifyViewport(client, `${baseUrl}/zh-hk/`, { width: 390, height: 1000, mobile: true }, "mobile-home.png");
    const desktopProjects = await verifyViewport(client, `${baseUrl}/en/projects/`, { width: 1440, height: 1100, mobile: false }, "desktop-projects.png");
    const desktopLinks = await verifyViewport(client, `${baseUrl}/links`, { width: 1440, height: 1100, mobile: false }, "desktop-links.png");
    const mobileLinks = await verifyViewport(client, `${baseUrl}/links`, { width: 390, height: 1000, mobile: true }, "mobile-links.png");
    const mobileService = await verifyViewport(client, `${baseUrl}/zh-hk/services/virtual-production/`, { width: 390, height: 1000, mobile: true }, "mobile-service.png");
    const mobileProject = await verifyViewport(client, `${baseUrl}/zh-hk/projects/third-belt-road-youth-development-summit/`, { width: 390, height: 1000, mobile: true }, "mobile-project.png");
    const directFileIndex = await verifyViewport(client, pathToFileURL(join(root, "index.html")).href, { width: 1440, height: 1100, mobile: false }, "file-index.png");
    const spaNavigation = await verifySpaNavigation(client, `${baseUrl}/en/`);
    await captureSection(client, `${baseUrl}/en/`, { width: 1440, height: 1100, mobile: false }, ".service-showcase-grid", "desktop-home-services.png");
    await captureSection(client, `${baseUrl}/zh-hk/projects/third-belt-road-youth-development-summit/`, { width: 390, height: 1000, mobile: true }, ".project-gallery", "mobile-project-gallery.png");
    client.close();

    const checks = [desktopHome, mobileHome, desktopProjects, desktopLinks, mobileLinks, mobileService, mobileProject, directFileIndex];
    const failedViewport = checks.find(
      (check) =>
        check.horizontalOverflow ||
        check.hasLegacyPost ||
        check.hasSemplice ||
        check.hasLanguageLeak ||
        check.hasSourceWording ||
        !check.logoLoaded ||
        check.imageCount < 1 ||
        check.nonCriticalNotLazy.length ||
        !check.stylesheetLoaded ||
        check.heroDisplay !== "grid"
    );
    if (failedViewport) throw new Error(`Viewport verification failed: ${JSON.stringify(failedViewport, null, 2)}`);
    if (desktopHome.heroMetaCount || mobileHome.heroMetaCount || directFileIndex.heroMetaCount) {
      throw new Error(
        `Homepage hero meta should be removed: ${JSON.stringify(
          {
            desktopHome: desktopHome.heroMetaCount,
            mobileHome: mobileHome.heroMetaCount,
            directFileIndex: directFileIndex.heroMetaCount,
          },
          null,
          2
        )}`
      );
    }
    if (desktopHome.services !== manifest.services.length) {
      throw new Error(`Service menu count mismatch: ${desktopHome.services} !== ${manifest.services.length}`);
    }
    if (desktopProjects.projectCards !== manifest.projects.length) {
      throw new Error(`Project card count mismatch: ${desktopProjects.projectCards} !== ${manifest.projects.length}`);
    }
    if (mobileService.projectGalleryItems) {
      throw new Error(`Service pages should not render project galleries: ${JSON.stringify(mobileService, null, 2)}`);
    }
    if (!mobileProject.projectGalleryItems || !mobileProject.loadedGalleryImages) {
      throw new Error(`Project gallery verification failed: ${JSON.stringify(mobileProject, null, 2)}`);
    }
    if (
      spaNavigation.timeout ||
      spaNavigation.missingLink ||
      spaNavigation.path !== "/en/about/" ||
      spaNavigation.bodyPage !== "about" ||
      !spaNavigation.navigationCount ||
      spaNavigation.navigationEntriesAfter !== spaNavigation.navigationEntriesBefore ||
      spaNavigation.nonCriticalNotLazy?.length
    ) {
      throw new Error(`SPA navigation verification failed: ${JSON.stringify(spaNavigation, null, 2)}`);
    }

    console.log(
      JSON.stringify(
        {
          siteUrl: baseUrl,
          routeSummary,
          desktopHome,
          mobileHome,
          desktopProjects,
          desktopLinks,
          mobileLinks,
          mobileService,
          mobileProject,
          directFileIndex,
          spaNavigation,
          screenshots: [
            "verification/desktop-home.png",
            "verification/mobile-home.png",
            "verification/desktop-projects.png",
            "verification/desktop-links.png",
            "verification/mobile-links.png",
            "verification/mobile-service.png",
            "verification/file-index.png",
            "verification/desktop-home-services.png",
            "verification/mobile-project.png",
            "verification/mobile-project-gallery.png",
          ],
        },
        null,
        2
      )
    );
  } finally {
    staticServer.close();
    chrome.kill("SIGTERM");
    await new Promise((resolveClose) => {
      if (chrome.exitCode !== null) {
        resolveClose();
        return;
      }
      chrome.once("exit", resolveClose);
      setTimeout(resolveClose, 1500);
    });
    try {
      rmSync(chromeProfile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    } catch {
      // Windows can hold a short-lived lock on Chrome's profile directory after exit.
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
