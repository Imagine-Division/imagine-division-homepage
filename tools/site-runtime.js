(() => {
  const root = document.documentElement;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const parser = new DOMParser();
  const routeCache = new Map();
  let scrollTicking = false;
  let revealObserver = null;
  let sectionObserver = null;

  const updateScrollState = () => {
    const header = document.querySelector("[data-site-header]");
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const progress = Math.min(1, Math.max(0, window.scrollY / max));
    root.style.setProperty("--scroll-progress", progress.toFixed(4));
    root.style.setProperty("--hero-shift", "-" + Math.min(48, window.scrollY * 0.06).toFixed(2) + "px");
    header?.classList.toggle("is-compact", window.scrollY > 24);
    scrollTicking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (scrollTicking) return;
      scrollTicking = true;
      window.requestAnimationFrame(updateScrollState);
    },
    { passive: true }
  );

  const routeKey = (url) => url.origin + url.pathname.replace(/\/index\.html$/i, "/") + url.search;

  const canRoute = () =>
    location.protocol !== "file:" &&
    "fetch" in window &&
    "history" in window &&
    "pushState" in history &&
    "replaceState" in history;

  const isAssetPath = (pathname) =>
    /\.(?:avif|css|gif|ico|jpe?g|js|json|map|mp4|otf|pdf|png|svg|webm|webp|woff2?|zip)$/i.test(pathname);

  const normalizeHtmlPath = (pathname) => pathname.replace(/\/index\.html$/i, "/");

  const localPath = (url) =>
    url.origin === location.origin ? normalizeHtmlPath(url.pathname) + url.search + url.hash : url.href;

  const routeUrlFromLink = (link) => {
    if (!canRoute()) return null;
    if (!link || link.target || link.hasAttribute("download")) return null;
    const href = link.getAttribute("href");
    if (!href || href.startsWith("#")) return null;
    if (/^(?:mailto|tel|sms|javascript):/i.test(href)) return null;

    const url = new URL(href, location.href);
    if (url.origin !== location.origin || isAssetPath(url.pathname)) return null;
    url.pathname = normalizeHtmlPath(url.pathname);
    return url;
  };

  const resolveUrlAttribute = (element, attribute, baseUrl) => {
    const value = element.getAttribute(attribute);
    if (!value || value.startsWith("#") || /^(?:data|mailto|tel|sms|javascript):/i.test(value)) return;
    const resolved = new URL(value, baseUrl);
    element.setAttribute(attribute, localPath(resolved));
  };

  const resolveSrcset = (element, baseUrl) => {
    const value = element.getAttribute("srcset");
    if (!value) return;
    const resolved = value
      .split(",")
      .map((candidate) => {
        const parts = candidate.trim().split(/\s+/);
        if (!parts[0]) return "";
        const url = new URL(parts[0], baseUrl);
        return [localPath(url), ...parts.slice(1)].join(" ");
      })
      .filter(Boolean)
      .join(", ");
    element.setAttribute("srcset", resolved);
  };

  const resolveDocumentUrls = (doc, baseUrl) => {
    for (const element of doc.querySelectorAll("[href]")) resolveUrlAttribute(element, "href", baseUrl);
    for (const element of doc.querySelectorAll("[src]")) resolveUrlAttribute(element, "src", baseUrl);
    for (const element of doc.querySelectorAll("[poster]")) resolveUrlAttribute(element, "poster", baseUrl);
    for (const element of doc.querySelectorAll("[srcset]")) resolveSrcset(element, baseUrl);
  };

  const loadRoute = async (url) => {
    const key = routeKey(url);
    if (!routeCache.has(key)) {
      routeCache.set(
        key,
        fetch(url.href, {
          credentials: "same-origin",
          headers: { "X-Requested-With": "spa-navigation" },
        }).then(async (response) => {
          if (!response.ok) throw new Error("Route request failed: " + response.status);
          const html = await response.text();
          const doc = parser.parseFromString(html, "text/html");
          if (!doc.querySelector("main") || !doc.querySelector("[data-site-header]")) {
            throw new Error("Route is not an app page");
          }
          resolveDocumentUrls(doc, url.href);
          return doc;
        })
      );
    }
    return routeCache.get(key);
  };

  const syncHead = (doc) => {
    document.title = doc.title;
    const nextDescription = doc.querySelector('meta[name="description"]')?.getAttribute("content") || "";
    let description = document.querySelector('meta[name="description"]');
    if (!description) {
      description = document.createElement("meta");
      description.name = "description";
      document.head.append(description);
    }
    description.setAttribute("content", nextDescription);
    document.documentElement.lang = doc.documentElement.lang || document.documentElement.lang;
  };

  const replaceRegion = (selector, doc) => {
    const current = document.querySelector(selector);
    const next = doc.querySelector(selector);
    if (current && next) current.replaceWith(next.cloneNode(true));
  };

  const updatePageState = (doc) => {
    const nextPage = doc.body?.dataset.page;
    if (nextPage) document.body.dataset.page = nextPage;
    else document.body.removeAttribute("data-page");
  };

  const scrollAfterNavigation = (url) => {
    if (!url.hash) {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion.matches ? "auto" : "smooth" });
      return;
    }
    const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (target) target.scrollIntoView({ block: "start", behavior: prefersReducedMotion.matches ? "auto" : "smooth" });
  };

  const applyRoute = async (url, doc, historyMode) => {
    const update = () => {
      syncHead(doc);
      updatePageState(doc);
      replaceRegion("[data-site-header]", doc);
      replaceRegion("main", doc);
      replaceRegion(".site-footer", doc);
      initializePage();
    };

    if (document.startViewTransition && !prefersReducedMotion.matches) {
      await document.startViewTransition(update).finished;
    } else {
      update();
    }

    if (historyMode === "push") history.pushState({}, "", localPath(url));
    if (historyMode === "replace") history.replaceState({}, "", localPath(url));
    scrollAfterNavigation(url);
    window.dispatchEvent(new CustomEvent("imagine:routechange", { detail: { path: url.pathname } }));
  };

  const navigateTo = async (url, historyMode = "push") => {
    const current = new URL(location.href);
    if (routeKey(url) === routeKey(current) && url.hash) {
      history.pushState({}, "", localPath(url));
      scrollAfterNavigation(url);
      return;
    }

    document.body.dataset.routeLoading = "true";
    document.querySelector("main")?.setAttribute("aria-busy", "true");
    try {
      const doc = await loadRoute(url);
      await applyRoute(url, doc, historyMode);
      window.ImagineDivisionSPA.navigationCount += 1;
    } catch {
      window.location.assign(url.href);
    } finally {
      document.body.dataset.routeLoading = "false";
      document.querySelector("main")?.removeAttribute("aria-busy");
    }
  };

  document.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest("a[href]");
    const url = routeUrlFromLink(link);
    if (!url) return;

    const current = new URL(location.href);
    if (routeKey(url) === routeKey(current) && !url.hash) return;

    event.preventDefault();
    navigateTo(url);
  });

  document.addEventListener(
    "pointerover",
    (event) => {
      const url = routeUrlFromLink(event.target.closest("a[href]"));
      if (url) loadRoute(url).catch(() => {});
    },
    { passive: true }
  );

  document.addEventListener("focusin", (event) => {
    const url = routeUrlFromLink(event.target.closest("a[href]"));
    if (url) loadRoute(url).catch(() => {});
  });

  window.addEventListener("popstate", () => {
    navigateTo(new URL(location.href), "replace");
  });

  const setImageLoading = (scope = document) => {
    const images = [...scope.querySelectorAll("img")];
    for (const image of images) {
      image.decoding = image.decoding || "async";
      const isCritical = image.classList.contains("hero-media") || image.closest(".brand") || image.closest(".links-profile");
      if (isCritical) {
        if (image.classList.contains("hero-media")) image.fetchPriority = "high";
        continue;
      }
      image.loading = "lazy";
    }
  };

  const initializeNav = () => {
    const navToggle = document.querySelector("[data-nav-toggle]");
    const nav = document.querySelector("[data-primary-nav]");
    if (!navToggle || !nav) return;

    navToggle.addEventListener("click", () => {
      const expanded = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!expanded));
      nav.dataset.open = String(!expanded);
    });

    for (const link of nav.querySelectorAll("a")) {
      link.addEventListener("click", () => {
        navToggle.setAttribute("aria-expanded", "false");
        nav.dataset.open = "false";
      });
    }
  };

  const initializeReveal = () => {
    revealObserver?.disconnect();
    const revealSelectors = [
      ".section-intro",
      ".tagline-stack p",
      ".process-step",
      ".service-showcase-card",
      ".systems-panel",
      ".focus-list li",
      ".service-card",
      ".project-card",
      ".highlight-card",
      ".capability-card",
      ".detail-aside",
      ".contact-panel",
      ".contact-cta-card",
      ".links-profile",
      ".links-card",
      ".links-button",
      ".links-feature",
      ".links-social-row a",
      ".credit-images img",
    ].join(",");
    const revealItems = [...document.querySelectorAll(revealSelectors)];
    revealItems.forEach((item, index) => {
      item.dataset.reveal = "";
      item.classList.remove("is-visible");
      item.style.setProperty("--reveal-delay", Math.min((index % 8) * 45, 280) + "ms");
    });

    if (!prefersReducedMotion.matches && "IntersectionObserver" in window) {
      revealObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        },
        { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
      );
      revealItems.forEach((item) => revealObserver.observe(item));
    } else {
      revealObserver = null;
      revealItems.forEach((item) => item.classList.add("is-visible"));
    }
  };

  const initializeSectionLinks = () => {
    sectionObserver?.disconnect();
    const sectionLinks = [...document.querySelectorAll("[data-home-section-link]")];
    if (!sectionLinks.length || !("IntersectionObserver" in window)) return;

    const sections = sectionLinks
      .map((link) => document.querySelector(link.getAttribute("href")))
      .filter(Boolean);
    sectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          for (const link of sectionLinks) {
            link.classList.toggle("is-active", link.getAttribute("href") === "#" + entry.target.id);
          }
        }
      },
      { threshold: 0.01, rootMargin: "-35% 0px -45% 0px" }
    );
    sections.forEach((section) => sectionObserver.observe(section));
  };

  const initializeTilt = () => {
    if (prefersReducedMotion.matches) return;
    const tiltCards = [
      ...document.querySelectorAll(
        ".service-showcase-card, .service-card, .project-card, .highlight-card, .capability-card, .contact-cta-card"
      ),
    ];
    for (const card of tiltCards) {
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.setProperty("--tilt-x", (-y * 3).toFixed(2) + "deg");
        card.style.setProperty("--tilt-y", (x * 4).toFixed(2) + "deg");
      });
      card.addEventListener("pointerleave", () => {
        card.style.removeProperty("--tilt-x");
        card.style.removeProperty("--tilt-y");
      });
    }
  };

  const initializeProjectFilters = () => {
    const filterButtons = [...document.querySelectorAll("[data-project-filter]")];
    const cards = [...document.querySelectorAll(".project-card")];
    for (const button of filterButtons) {
      button.addEventListener("click", () => {
        const filter = button.dataset.projectFilter;
        for (const other of filterButtons) other.classList.toggle("is-active", other === button);
        for (const card of cards) {
          const visible = filter === "all" || card.dataset.category.includes(filter);
          card.hidden = !visible;
        }
      });
    }
  };

  const initializeGsViewer = () => {
    const viewer = document.querySelector("[data-gs-viewer]");
    if (!viewer || viewer.dataset.ready === "true") return;
    viewer.dataset.ready = "true";

    const canvas = viewer.querySelector("[data-gs-canvas]");
    const fileInput = viewer.querySelector("[data-gs-file]");
    const resetButton = viewer.querySelector("[data-gs-reset]");
    const status = viewer.querySelector("[data-gs-status]");
    const count = viewer.querySelector("[data-gs-count]");
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let points = [];
    let rotationX = -0.34;
    let rotationY = 0.62;
    let zoom = 1;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    const setStatus = (message) => {
      if (status) status.textContent = message;
    };

    const setCount = () => {
      if (count) count.textContent = String(points.length) + " points";
    };

    const normalizePoints = (items) => {
      if (!items.length) return [];
      const min = { x: Infinity, y: Infinity, z: Infinity };
      const max = { x: -Infinity, y: -Infinity, z: -Infinity };
      for (const point of items) {
        min.x = Math.min(min.x, point.x);
        min.y = Math.min(min.y, point.y);
        min.z = Math.min(min.z, point.z);
        max.x = Math.max(max.x, point.x);
        max.y = Math.max(max.y, point.y);
        max.z = Math.max(max.z, point.z);
      }
      const cx = (min.x + max.x) / 2;
      const cy = (min.y + max.y) / 2;
      const cz = (min.z + max.z) / 2;
      const span = Math.max(max.x - min.x, max.y - min.y, max.z - min.z) || 1;
      return items.map((point) => ({
        ...point,
        x: (point.x - cx) / span,
        y: (point.y - cy) / span,
        z: (point.z - cz) / span,
      }));
    };

    const parseAsciiPly = (text) => {
      const lines = text.split(/\r?\n/);
      const end = lines.findIndex((line) => line.trim() === "end_header");
      if (end === -1 || !lines[0]?.startsWith("ply")) throw new Error("Not an ASCII PLY file");
      if (!lines.some((line) => line.trim() === "format ascii 1.0")) {
        throw new Error("Only ASCII PLY is supported in this preview");
      }
      const vertexLine = lines.find((line) => line.startsWith("element vertex "));
      const vertexCount = Number(vertexLine?.split(/\s+/)[2] || 0);
      if (!vertexCount) throw new Error("No vertices found");
      const props = [];
      for (let index = 0; index < end; index += 1) {
        const match = lines[index].match(/^property\s+\S+\s+(\S+)$/);
        if (match) props.push(match[1]);
      }
      const ix = props.indexOf("x");
      const iy = props.indexOf("y");
      const iz = props.indexOf("z");
      const ir = props.findIndex((name) => /^(red|r)$/i.test(name));
      const ig = props.findIndex((name) => /^(green|g)$/i.test(name));
      const ib = props.findIndex((name) => /^(blue|b)$/i.test(name));
      if (ix < 0 || iy < 0 || iz < 0) throw new Error("PLY vertices need x, y, and z properties");
      const parsed = [];
      for (let row = 0; row < vertexCount; row += 1) {
        const values = (lines[end + 1 + row] || "").trim().split(/\s+/).map(Number);
        if (values.length < props.length) continue;
        parsed.push({
          x: values[ix],
          y: values[iy],
          z: values[iz],
          r: ir >= 0 ? values[ir] : 110,
          g: ig >= 0 ? values[ig] : 220,
          b: ib >= 0 ? values[ib] : 255,
        });
      }
      return normalizePoints(parsed.slice(0, 120000));
    };

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      const width = Math.max(1, Math.round(rect.width * ratio));
      const height = Math.max(1, Math.round(rect.height * ratio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      ctx.clearRect(0, 0, width, height);
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#071015");
      gradient.addColorStop(1, "#1b1018");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      const sinX = Math.sin(rotationX);
      const cosX = Math.cos(rotationX);
      const sinY = Math.sin(rotationY);
      const cosY = Math.cos(rotationY);
      const projected = points.map((point) => {
        const x1 = point.x * cosY - point.z * sinY;
        const z1 = point.x * sinY + point.z * cosY;
        const y1 = point.y * cosX - z1 * sinX;
        const z2 = point.y * sinX + z1 * cosX;
        const scale = (height * 0.72 * zoom) / (2.25 + z2);
        return {
          x: width / 2 + x1 * scale,
          y: height / 2 + y1 * scale,
          z: z2,
          r: point.r,
          g: point.g,
          b: point.b,
        };
      });
      projected.sort((a, b) => a.z - b.z);
      const pointSize = Math.max(1.4, Math.min(4.8, 3.2 * zoom * ratio));
      for (const point of projected) {
        const alpha = Math.max(0.35, Math.min(1, 0.62 + point.z * 0.2));
        ctx.fillStyle = "rgba(" + point.r + "," + point.g + "," + point.b + "," + alpha + ")";
        ctx.beginPath();
        ctx.arc(point.x, point.y, pointSize, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const createDemo = () => {
      const demo = [];
      const rings = 56;
      for (let ring = 0; ring < rings; ring += 1) {
        const theta = (ring / rings) * Math.PI * 2;
        for (let index = 0; index < 36; index += 1) {
          const phi = (index / 36) * Math.PI * 2;
          const radius = 0.42 + 0.28 * Math.sin(theta * 2.4);
          demo.push({
            x: Math.cos(theta) * radius + Math.cos(phi) * 0.07,
            y: Math.sin(phi) * 0.34,
            z: Math.sin(theta) * radius + Math.cos(phi) * 0.07,
            r: 70 + Math.round(120 * (ring / rings)),
            g: 210 - Math.round(80 * (index / 36)),
            b: 250,
          });
        }
      }
      points = demo;
      setStatus("Demo point cloud ready");
      setCount();
      draw();
    };

    const loadFile = async (file) => {
      if (!file) return;
      try {
        setStatus("Loading " + file.name);
        const text = await file.text();
        points = parseAsciiPly(text);
        setStatus("Loaded " + file.name);
        setCount();
        draw();
      } catch (error) {
        setStatus(error.message || "Unable to load file");
      }
    };

    canvas.addEventListener("pointerdown", (event) => {
      dragging = true;
      lastX = event.clientX;
      lastY = event.clientY;
      canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener("pointermove", (event) => {
      if (!dragging) return;
      rotationY += (event.clientX - lastX) * 0.008;
      rotationX += (event.clientY - lastY) * 0.008;
      lastX = event.clientX;
      lastY = event.clientY;
      draw();
    });
    canvas.addEventListener("pointerup", () => {
      dragging = false;
    });
    canvas.addEventListener(
      "wheel",
      (event) => {
        event.preventDefault();
        zoom = Math.max(0.45, Math.min(2.4, zoom - event.deltaY * 0.0015));
        draw();
      },
      { passive: false }
    );
    viewer.addEventListener("dragover", (event) => {
      event.preventDefault();
      viewer.dataset.dragging = "true";
    });
    viewer.addEventListener("dragleave", () => {
      viewer.dataset.dragging = "false";
    });
    viewer.addEventListener("drop", (event) => {
      event.preventDefault();
      viewer.dataset.dragging = "false";
      loadFile(event.dataTransfer.files[0]);
    });
    fileInput?.addEventListener("change", () => loadFile(fileInput.files[0]));
    resetButton?.addEventListener("click", () => {
      rotationX = -0.34;
      rotationY = 0.62;
      zoom = 1;
      createDemo();
    });
    window.addEventListener("resize", draw);
    window.ImagineDivisionGS = {
      loadPlyText: (text) => {
        points = parseAsciiPly(text);
        setStatus("Loaded from API");
        setCount();
        draw();
      },
    };
    createDemo();
  };

  function initializePage() {
    setImageLoading();
    initializeNav();
    initializeReveal();
    initializeSectionLinks();
    initializeTilt();
    initializeProjectFilters();
    initializeGsViewer();
    updateScrollState();
  }

  window.ImagineDivisionSPA = {
    navigationCount: 0,
    preloadCount: () => routeCache.size,
    navigate: (href) => navigateTo(new URL(href, location.href)),
  };

  initializePage();
})();
