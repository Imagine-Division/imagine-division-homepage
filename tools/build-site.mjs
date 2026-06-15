import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative as relativePath, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const contentPath = join(root, "refined-content", "website-content.zh-HK.en.md");
const archiveRoot = join(root, "source-archive", "imaginedivision-site-2026-06-06-final-complete");
const archiveAssets = join(archiveRoot, "assets");
const portfolioRoot = join(root, "portfolio-source", "imagine-division");
const portfolioPagesRoot = join(portfolioRoot, "pages");
const portfolioAssetsRoot = join(root, "portfolio-assets");
const markdown = readFileSync(contentPath, "utf8");

const languages = [
  {
    code: "en",
    dir: "en",
    marker: "EN",
    htmlLang: "en-HK",
    label: "English",
    shortLabel: "EN",
    homePath: "/en/",
    otherDir: "zh-hk",
  },
  {
    code: "zh-hk",
    dir: "zh-hk",
    marker: "ZH_HK",
    htmlLang: "zh-Hant-HK",
    label: "繁體中文",
    shortLabel: "繁",
    homePath: "/zh-hk/",
    otherDir: "en",
  },
];

const i18n = {
  en: {
    home: "Home",
    projects: "Projects",
    about: "About",
    services: "Services",
    contact: "Contact",
    viewProjects: "View Projects",
    contactUs: "Contact Us",
    viewProject: "View Project",
    viewService: "View Service",
    keyServices: "Key Services",
    featuredCases: "Featured Cases",
    capabilities: "Capabilities",
    productionScope: "Production Scope",
    context: "Context",
    summary: "Summary",
    showcaseAngle: "Showcase Angle",
    selectedProjects: "Selected Projects",
    projectIndex: "Project Index",
    projectDetails: "Project Details",
    enquiryPrompts: "Enquiry Prompts",
    contactChannels: "Contact Channels",
    all: "All",
    year: "Area",
    category: "Category",
    venue: "Venue / Location",
    language: "繁體中文",
    switchLanguage: "Switch language",
    nextStep: "Start a Production Discussion",
    exploreServices: "Explore Services",
    serviceFocus: "Service Focus",
    footerIntro:
      "Event and virtual production solutions: Event Production, Virtual Production, Web3.0 and AI Engineering, Virtual Artist Management and Production, and CGI/VFX.",
    copyright: "Copyright © 2022 Imagine Division Limited. All rights reserved.",
  },
  "zh-hk": {
    home: "首頁",
    projects: "項目",
    about: "關於我們",
    services: "服務",
    contact: "聯絡",
    viewProjects: "查看項目",
    contactUs: "聯絡我們",
    viewProject: "查看項目",
    viewService: "查看服務",
    keyServices: "主要服務",
    featuredCases: "精選案例",
    capabilities: "製作能力",
    productionScope: "製作範圍",
    context: "項目背景",
    summary: "概要",
    showcaseAngle: "展示重點",
    selectedProjects: "精選項目",
    projectIndex: "項目索引",
    projectDetails: "項目資料",
    enquiryPrompts: "查詢提示",
    contactChannels: "聯絡渠道",
    all: "全部",
    year: "範疇",
    category: "類別",
    venue: "場地 / 地點",
    language: "English",
    switchLanguage: "切換語言",
    nextStep: "開始討論製作",
    exploreServices: "瀏覽服務",
    serviceFocus: "服務重點",
    footerIntro:
      "活動及虛擬製作解決方案：活動製作、虛擬製作、Web3.0及AI工程、虛擬藝人運營及製作、數碼合成與視覺特效。",
    copyright: "Copyright © 2022 Imagine Division Limited. All rights reserved.",
  },
};

const serviceDefinitions = [
  {
    name: "Event Production",
    slug: "event-production",
    zhName: "活動製作",
    accent: "Event",
    pageSlugs: ["event-production-service", "event-production-reference-collage"],
    featuredSlugs: [
      "third-belt-road-youth-development-summit",
      "top-nova-2023",
      "hololive-party2gather",
      "lnaf-2023",
      "vtuber-only-hk-2024",
      "virtualcarnival-2025",
      "mic-on-project-1st-live",
    ],
    headline: {
      en: "Event production with planning, crew, and technical resources.",
      "zh-hk": "活動製作，由策劃、設計、人力到軟硬件資源。",
    },
    body: {
      en:
        "Event Production covers one-stop planning from initial proposal to project report, with event design, experienced staff, and professional hardware and software resources.",
      "zh-hk":
        "因應客戶需求，提供符合預算及完善的一條龍活動策劃服務，由前期立案至後期提交專案報告，積極與客戶溝通並落實專案進程及執行。",
    },
    keyServices: [
      { en: "Event design and concept development", "zh-hk": "提供活動設計及構思" },
      {
        en: "Experienced crew for exhibitions, events, and different production scales",
        "zh-hk": "具豐富經驗的工作人員，曾多次參與各大不同展會、活動，能應付不同規模及需求",
      },
      {
        en: "Professional stage, lighting, visual, audio, and production resources",
        "zh-hk": "齊備舉辦活動所需之一切軟硬件資源，舞台、燈光、畫面、聲音等設備皆具專業標準",
      },
    ],
  },
  {
    name: "Virtual Production",
    slug: "virtual-production",
    zhName: "虛擬製作",
    accent: "Realtime",
    pageSlugs: ["virtual-production-service"],
    featuredSlugs: [
      "parallel-phantasia",
      "ghost-hoshimachi-suisei-cosplay-music-video",
      "angela-pang-official-music-video",
      "ywca-virtual-production-course",
    ],
    headline: {
      en: "Virtual production using Unreal Engine, virtual filming, and mixed reality.",
      "zh-hk": "虛擬製作，結合 Unreal Engine、虛擬製片與混合實景技術。",
    },
    body: {
      en:
        "Virtual Production combines Unreal Engine 5, virtual filming, and mixed reality environments for entertainment, education, and commercial applications.",
      "zh-hk":
        "虛擬製作運用虛幻引擎、虛擬製片及混合實景技術，將數字畫面與現實攝像結合，並應用於娛樂、教育及商業領域。",
    },
    keyServices: [
      {
        en: "Unreal Engine 5 rendering and high-fidelity virtual environments",
        "zh-hk": "虛幻引擎5：高精度攝像機運動、材質及光照渲染",
      },
      {
        en: "Virtual filming that combines digital imagery with real camera capture",
        "zh-hk": "虛擬製片：利用虛擬現實技術將數字畫面與現實攝像結合",
      },
      {
        en: "Mixed Reality and CAVE-style immersive environments",
        "zh-hk": "混合實景技術：透過 Mixed Reality、CAVE 等技術搭建沉浸式環境",
      },
    ],
  },
  {
    name: "Web3.0 and AI Engineering",
    slug: "web3-ai-engineering",
    zhName: "Web3.0及AI工程",
    accent: "AI",
    pageSlugs: ["web3-ai-engineering-service"],
    featuredSlugs: ["100most-ai-portraits", "c-smart-site-management-platform", "mtr-loha-heart-ai-promo"],
    headline: {
      en: "Web3.0 and AI engineering for data, private systems, and virtual assets.",
      "zh-hk": "Web3.0及AI工程，支援數據、私有系統及虛擬資產應用。",
    },
    body: {
      en:
        "Web3.0 and AI Engineering supports data generation, decentralised application scenarios, private blockchain or cloud systems, mainstream AI tools, private AI workflows, and virtual asset applications.",
      "zh-hk":
        "使用數據生成器進行海量數據篩選及利用，建立去中心化應用場景、私有區塊鏈或雲端系統，並運用 AI 工具協助專案建立、執行及資源轉化。",
    },
    keyServices: [
      {
        en: "Web3.0 data workflows, decentralised application scenarios, private blockchain, and cloud systems",
        "zh-hk": "Web3.0：數據生成、去中心化應用場景、私有區塊鏈或雲端系統",
      },
      {
        en: "AI engineering with mainstream models and private workflow development",
        "zh-hk": "AI工程：運用 ChatGPT、Deepseek、Grok 等工具處理數據流及建立私有工作流",
      },
      {
        en: "Virtual assets, secure resource transactions, and NFT production",
        "zh-hk": "虛擬資產：支援資源交易、提高安全性及製作非同質化代幣",
      },
    ],
  },
  {
    name: "Virtual Artist Management and Production",
    slug: "virtual-artist-management-and-production",
    zhName: "虛擬藝人運營及製作",
    accent: "Artist",
    pageSlugs: ["our-services", "about-us"],
    featuredSlugs: ["mic-on-project-1st-live", "vtuber-only-hk-2024", "virtualcarnival-2025"],
    headline: {
      en: "Virtual artist production and operation connected to Hong Kong virtual creator culture.",
      "zh-hk": "虛擬藝人運營及製作，連接香港本地虛擬藝人生態。",
    },
    body: {
      en:
        "Imagine Division launched innoneer.TV in February 2023 as a Hong Kong one-stop virtual artist production and operation platform, supporting local virtual artist IP, promotion, technical support, and production services.",
      "zh-hk":
        "2023年2月創立香港一站式虛擬藝人製作及營運平台 innoneer.TV，主力營運香港虛擬藝人 IP、推廣香港本地虛擬藝人，並提供技術支援及製作服務。",
    },
    keyServices: [
      { en: "Virtual artist IP operation and production support", "zh-hk": "香港虛擬藝人 IP 營運及製作支援" },
      { en: "Promotion for local virtual artists", "zh-hk": "香港本地虛擬藝人推廣" },
      {
        en: "Technical support and production services for virtual artist programmes",
        "zh-hk": "虛擬藝人節目技術支援及製作服務",
      },
    ],
  },
  {
    name: "CGI and VFX",
    slug: "cgi-vfx",
    zhName: "數碼合成&視覺特效",
    accent: "VFX",
    pageSlugs: ["cgi-vfx-service", "cgi-vfx-application-examples"],
    featuredSlugs: ["cgi-vfx-application-examples"],
    headline: {
      en: "CGI and VFX for compositing, visual effects, and multi-platform media.",
      "zh-hk": "數碼合成與視覺特效，支援多媒體及多平台影像應用。",
    },
    body: {
      en:
        "CGI and VFX covers computer-generated imagery, digital compositing, visual effects, and mature multi-platform applications across film, games, advertising, architecture, medicine, and virtual reality.",
      "zh-hk":
        "電腦合成影像（CGI）利用電腦繪圖技術生成靜態圖像或動態影像；VFX 與 CGI 技術深度融合，透過數位技術創造、操作或強化影像。",
    },
    keyServices: [
      { en: "Digital compositing for still and moving imagery", "zh-hk": "數碼合成：二維或三維影像生成及合成" },
      {
        en: "Visual effects for scenes and effects that cannot be captured practically",
        "zh-hk": "視覺特效：創造、操作或強化無法以實景拍攝捕捉的場景或效果",
      },
      {
        en: "Application across film, games, advertising, architecture, medicine, and virtual reality",
        "zh-hk": "應用媒介：影視、遊戲開發、廣告營銷、建築、醫學及虛擬現實等平台",
      },
    ],
  },
];

const projectDefinitions = [
  {
    slug: "third-belt-road-youth-development-summit",
    pageSlug: "third-belt-road-youth-development-summit",
    title: "第三屆「一帶一路」青年發展高峰論壇",
    category: "Event Production",
  },
  { slug: "top-nova-2023", pageSlug: "top-nova-2023", title: "TOP NOVA 2023", category: "Event Production" },
  {
    slug: "hololive-party2gather",
    pageSlug: "hololive-party2gather",
    title: "Hololive Party2Gather",
    category: "Event Production",
  },
  { slug: "lnaf-2023", pageSlug: "lnaf-2023", title: "LNAF 2023", category: "Event Production" },
  {
    slug: "vtuber-only-hk-2024",
    pageSlug: "vtuber-only-hk-2024",
    title: "Vtuber Only HK 2024",
    category: "Event Production, Virtual Artist Management and Production",
  },
  {
    slug: "virtualcarnival-2025",
    pageSlug: "virtualcarnival-2025",
    title: "VirtualCarnival 2025",
    category: "Event Production, Virtual Artist Management and Production",
  },
  {
    slug: "mic-on-project-1st-live",
    pageSlug: "mic-on-project-1st-live",
    title: "《Mic On Project 1st Live》",
    category: "Event Production, Virtual Artist Management and Production",
  },
  {
    slug: "parallel-phantasia",
    pageSlug: "parallel-phantasia",
    title: "乙女新夢 / 【平行幻想 Parallel Phantasia】",
    category: "Virtual Production",
  },
  {
    slug: "ghost-hoshimachi-suisei-cosplay-music-video",
    pageSlug: "ghost-hoshimachi-suisei-cosplay-music-video",
    title: "GHOST - 星街すいせい Cosplay Music Video",
    category: "Virtual Production",
  },
  {
    slug: "angela-pang-official-music-video",
    pageSlug: "angela-pang-official-music-video",
    title: "彭家麗 Angela Pang - 是不是這樣的痛過人才算真正的成長過 (Official Music Video)",
    category: "Virtual Production",
  },
  {
    slug: "ywca-virtual-production-course",
    pageSlug: "ywca-virtual-production-course",
    title: "YWCA 虛擬製作課程",
    category: "Virtual Production",
  },
  {
    slug: "100most-ai-portraits",
    pageSlug: "100most-ai-portraits",
    title: "100毛AI寫真",
    category: "Web3.0 and AI Engineering",
  },
  {
    slug: "c-smart-site-management-platform",
    pageSlug: "c-smart-site-management-platform",
    title: "中國建築工程(香港)有限公司《C SMART 智慧工地管理平台》",
    category: "Web3.0 and AI Engineering",
  },
  {
    slug: "mtr-loha-heart-ai-promo",
    pageSlug: "mtr-loha-heart-ai-promo",
    title: "港鐵公司MTR AI宣傳片《Loha Heart》",
    category: "Web3.0 and AI Engineering",
  },
];

const portfolioPageDefinitions = [
  {
    page: 1,
    slug: "company-profile-cover",
    file: "page-001_company-profile-cover.md",
    section: "Company Profile",
    type: "cover",
    title: "企業簡介 / Company Profile",
  },
  {
    page: 2,
    slug: "about-us",
    file: "page-002_about-us.md",
    section: "Company Profile",
    type: "about",
    title: "關於我們 / About us",
  },
  {
    page: 3,
    slug: "vision-and-mission",
    file: "page-003_vision-and-mission.md",
    section: "Company Profile",
    type: "vision-mission",
    title: "願景與使命 / Vision & Mission",
  },
  {
    page: 4,
    slug: "our-services",
    file: "page-004_our-services.md",
    section: "Services",
    type: "services-overview",
    title: "公司業務 / Our Services",
  },
  {
    page: 5,
    slug: "event-production-service",
    file: "page-005_event-production-service.md",
    section: "Event Production",
    type: "service",
    title: "活動製作 / Event Production",
  },
  {
    page: 6,
    slug: "event-production-reference-collage",
    file: "page-006_event-production-reference-collage.md",
    section: "Event Production",
    type: "reference-collage",
    title: "Event Production reference collage",
  },
  {
    page: 7,
    slug: "third-belt-road-youth-development-summit",
    file: "page-007_third-belt-road-youth-development-summit.md",
    section: "Event Production",
    type: "project-reference",
    title: "第三屆「一帶一路」青年發展高峰論壇",
  },
  {
    page: 8,
    slug: "top-nova-2023",
    file: "page-008_top-nova-2023.md",
    section: "Event Production",
    type: "project-reference",
    title: "TOP NOVA 2023",
  },
  {
    page: 9,
    slug: "hololive-party2gather",
    file: "page-009_hololive-party2gather.md",
    section: "Event Production",
    type: "project-reference",
    title: "Hololive Party2Gather",
  },
  {
    page: 10,
    slug: "lnaf-2023",
    file: "page-010_lnaf-2023.md",
    section: "Event Production",
    type: "project-reference",
    title: "LNAF 2023",
  },
  {
    page: 11,
    slug: "vtuber-only-hk-2024",
    file: "page-011_vtuber-only-hk-2024.md",
    section: "Event Production",
    type: "project-reference",
    title: "Vtuber Only HK 2024",
  },
  {
    page: 12,
    slug: "virtualcarnival-2025",
    file: "page-012_virtualcarnival-2025.md",
    section: "Event Production",
    type: "project-reference",
    title: "VirtualCarnival 2025",
  },
  {
    page: 13,
    slug: "mic-on-project-1st-live",
    file: "page-013_mic-on-project-1st-live.md",
    section: "Event Production",
    type: "project-reference",
    title: "《Mic On Project 1st Live》",
  },
  {
    page: 14,
    slug: "virtual-production-service",
    file: "page-014_virtual-production-service.md",
    section: "Virtual Production",
    type: "service",
    title: "虛擬製作 / Virtual Production",
  },
  {
    page: 15,
    slug: "parallel-phantasia",
    file: "page-015_parallel-phantasia.md",
    section: "Virtual Production",
    type: "project-reference",
    title: "乙女新夢 / 【平行幻想 Parallel Phantasia】",
  },
  {
    page: 16,
    slug: "ghost-hoshimachi-suisei-cosplay-music-video",
    file: "page-016_ghost-hoshimachi-suisei-cosplay-music-video.md",
    section: "Virtual Production",
    type: "project-reference",
    title: "GHOST - 星街すいせい Cosplay Music Video",
  },
  {
    page: 17,
    slug: "angela-pang-official-music-video",
    file: "page-017_angela-pang-official-music-video.md",
    section: "Virtual Production",
    type: "project-reference",
    title: "彭家麗 Angela Pang - 是不是這樣的痛過人才算真正的成長過 (Official Music Video)",
  },
  {
    page: 18,
    slug: "ywca-virtual-production-course",
    file: "page-018_ywca-virtual-production-course.md",
    section: "Virtual Production",
    type: "project-reference",
    title: "YWCA 虛擬製作課程",
  },
  {
    page: 19,
    slug: "web3-ai-engineering-service",
    file: "page-019_web3-ai-engineering-service.md",
    section: "Web3.0 and AI Engineering",
    type: "service",
    title: "WEB3.0及AI工程 / Web3.0 and AI Engineering",
  },
  {
    page: 20,
    slug: "100most-ai-portraits",
    file: "page-020_100most-ai-portraits.md",
    section: "Web3.0 and AI Engineering",
    type: "project-reference",
    title: "100毛AI寫真",
  },
  {
    page: 21,
    slug: "c-smart-site-management-platform",
    file: "page-021_c-smart-site-management-platform.md",
    section: "Web3.0 and AI Engineering",
    type: "project-reference",
    title: "中國建築工程(香港)有限公司《C SMART 智慧工地管理平台》",
  },
  {
    page: 22,
    slug: "mtr-loha-heart-ai-promo",
    file: "page-022_mtr-loha-heart-ai-promo.md",
    section: "Web3.0 and AI Engineering",
    type: "project-reference",
    title: "港鐵公司MTR AI宣傳片《Loha Heart》",
  },
  {
    page: 23,
    slug: "cgi-vfx-service",
    file: "page-023_cgi-vfx-service.md",
    section: "CGI and VFX",
    type: "service",
    title: "數碼合成&視覺特效 / CGI and VFX",
  },
  {
    page: 24,
    slug: "cgi-vfx-application-examples",
    file: "page-024_cgi-vfx-application-examples.md",
    section: "CGI and VFX",
    type: "reference-collage",
    title: "數碼合成&視覺特效 應用實例",
  },
  {
    page: 25,
    slug: "contact",
    file: "page-025_contact.md",
    section: "Contact",
    type: "contact",
    title: "Contact us",
  },
];

const extraAssets = [
  {
    source: "assets/images/008-Full_Name_logo-5a1072e66a.png",
    image: "logo-full.png",
  },
  {
    source: "assets/images/042-ID-Logo_White_Blod-26e292b0cd.png",
    image: "logo-mark-white.png",
  },
  {
    source: "assets/images/041-favicon-467dcdf2df.ico",
    image: "favicon.ico",
  },
  {
    source: "assets/images/048-vlcsnap-2024-10-08-02h30m50s127-1-scaled-20f2a67284.jpg",
    image: "hero-volume.jpg",
  },
  {
    source: "assets/images/040-hardware-bfe95e72e2.png",
    image: "systems-hardware.png",
  },
  {
    source: "assets/images/133-credit_2-48be7e6486.jpg",
    image: "credit-2.jpg",
  },
  {
    source: "assets/images/134-credit_3-4404e9c666.jpg",
    image: "credit-3.jpg",
  },
  {
    source: "assets/fonts/023-PPNeueMontreal-Regular-7a9e00fafe.otf",
    image: "fonts/PPNeueMontreal-Regular.otf",
  },
  {
    source: "assets/fonts/027-PPNeueMontreal-Bold-94a1c6ab21.otf",
    image: "fonts/PPNeueMontreal-Bold.otf",
  },
  {
    source: "assets/fonts/033-NotoSansTC-Regular-98d7946278.otf",
    image: "fonts/NotoSansTC-Regular.otf",
  },
  {
    source: "assets/fonts/030-NotoSansTC-Bold-1f79be5037.otf",
    image: "fonts/NotoSansTC-Bold.otf",
  },
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stripTicks(value = "") {
  return value.replace(/`/g, "").trim();
}

function stripTrailing(value = "") {
  return value.replace(/[ \t]+$/gm, "").trim();
}

function extractSection(source, level, title) {
  const lines = source.split(/\r?\n/);
  const marker = `${"#".repeat(level)} ${title}`;
  const start = lines.findIndex((line) => line.trim() === marker);
  if (start === -1) throw new Error(`Missing section: ${marker}`);
  let end = lines.length;
  const nextHeading = new RegExp(`^#{1,${level}}\\s+`);
  for (let index = start + 1; index < lines.length; index += 1) {
    if (nextHeading.test(lines[index])) {
      end = index;
      break;
    }
  }
  return stripTrailing(lines.slice(start + 1, end).join("\n"));
}

function tryExtractSection(source, level, title) {
  try {
    return extractSection(source, level, title);
  } catch {
    return "";
  }
}

function normalizeExtractedText(value = "") {
  const cleaned = stripTrailing(value)
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n");
  return cleaned || "No extractable text layer on this page.";
}

function portfolioAssetTarget(slug, sourcePath) {
  return `${slug}-${basename(sourcePath)}`;
}

function parsePortfolioAsset(definition, markdownPath, kind, label, link, meta = "") {
  const source = resolve(dirname(markdownPath), link);
  const file = portfolioAssetTarget(definition.slug, link);
  const role = meta.match(/role:\s*([^;]+)/)?.[1]?.trim() || kind;
  const size = meta.match(/source size:\s*([0-9]+x[0-9]+)/)?.[1] || "";
  const [, width = 0, height = 0] = size.match(/^(\d+)x(\d+)$/)?.map(Number) || [];
  const aspectRatio = width && height ? Math.max(width / height, height / width) : 0;
  return {
    kind,
    label,
    source,
    file,
    url: `/portfolio-assets/${file}`,
    role,
    size,
    width,
    height,
    aspectRatio,
    page: definition.page,
    pageSlug: definition.slug,
  };
}

function isUsableVisualAsset(asset) {
  if (!asset || asset.kind !== "image" || asset.role !== "content") return false;
  if (!asset.width || !asset.height) return false;
  if (Math.min(asset.width, asset.height) < 240) return false;
  if (asset.aspectRatio > 3) return false;
  return true;
}

function readPortfolioPage(definition) {
  const markdownPath = join(portfolioPagesRoot, definition.file);
  const source = readFileSync(markdownPath, "utf8");
  const extractedText = normalizeExtractedText(tryExtractSection(source, 2, "Extracted Text"));
  const renderBlock = tryExtractSection(source, 2, "Associated Page Render");
  const imageBlock = tryExtractSection(source, 2, "Associated Embedded Images");
  const renderMatch = renderBlock.match(/- \[([^\]]+)\]\(([^)]+)\)/);
  const render = renderMatch
    ? parsePortfolioAsset(definition, markdownPath, "render", renderMatch[1], renderMatch[2])
    : null;
  const images = [...imageBlock.matchAll(/^- \[([^\]]+)\]\(([^)]+)\)(?: - (.+))?$/gm)].map((match) =>
    parsePortfolioAsset(definition, markdownPath, "image", match[1], match[2], match[3] || "")
  );
  const visualAssets = images.filter(isUsableVisualAsset);
  const heroAsset = visualAssets[0] || images.find((asset) => asset.role === "content") || images[0] || render;
  return {
    ...definition,
    markdownPath,
    extractedText,
    render,
    images,
    assets: visualAssets,
    visualAssets,
    heroAsset,
    image: heroAsset?.url || "/assets/hero-volume.jpg",
  };
}

function pageLines(page, skip = []) {
  const skipped = new Set(skip);
  return page.extractedText
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line && !skipped.has(line));
}

function portfolioGalleryAssets(pages) {
  return pages.flatMap((page) => page.visualAssets);
}

function uniqueAssets(assets) {
  const seen = new Set();
  return assets.filter((asset) => {
    if (!asset || seen.has(asset.file)) return false;
    seen.add(asset.file);
    return true;
  });
}

function splitSubsections(source, level) {
  const lines = source.split(/\r?\n/);
  const heading = new RegExp(`^${"#".repeat(level)}\\s+(.+)$`);
  const sections = [];
  let current = null;
  for (const line of lines) {
    const match = line.match(heading);
    if (match) {
      if (current) sections.push(current);
      current = { title: match[1].trim(), body: "" };
      continue;
    }
    if (current) current.body += `${line}\n`;
  }
  if (current) sections.push(current);
  return sections.map((item) => ({ ...item, body: stripTrailing(item.body) }));
}

function extractLabelBlock(source, label) {
  const regex = new RegExp(`^${escapeRegExp(label)}:\\s*$`, "m");
  const match = regex.exec(source);
  if (!match) return "";
  const start = match.index + match[0].length;
  const rest = source.slice(start).replace(/^\r?\n/, "");
  const stop = rest.search(
    /\n(?=(?:ZH_HK|EN)(?:\s+(?:title|description|headline|body))?:\s*$|[A-Z][A-Za-z /-]+:\s*$|#{2,4}\s+)/m
  );
  return stripTrailing(stop === -1 ? rest : rest.slice(0, stop));
}

function extractLanguageBlock(source, marker) {
  const regex = new RegExp(`^${marker}:\\s*$`, "m");
  const match = regex.exec(source);
  if (!match) return "";
  const start = match.index + match[0].length;
  const rest = source.slice(start).replace(/^\r?\n/, "");
  const stop = rest.search(/\n(?=(?:ZH_HK|EN):\s*$|#{2,4}\s+|[A-Z][A-Za-z /-]+:\s*$)/m);
  return stripTrailing(stop === -1 ? rest : rest.slice(0, stop));
}

function extractMeta(block, lang) {
  const marker = lang.marker;
  const title = block.match(new RegExp(`^${marker} title:\\s*(.+)$`, "m"))?.[1] || "";
  const description = block.match(new RegExp(`^${marker} description:\\s*(.+)$`, "m"))?.[1] || "";
  return { title: stripTrailing(title), description: stripTrailing(description) };
}

function extractPairedBullets(source, label) {
  const block = extractLabelBlock(source, label);
  if (!block) return [];
  const paired = [];
  let current = {};
  for (const line of block.split(/\r?\n/)) {
    const match = line.match(/^-\s+(ZH_HK|EN):\s*(.+)$/);
    if (!match) continue;
    const key = match[1] === "ZH_HK" ? "zh-hk" : "en";
    current[key] = stripTrailing(match[2]);
    if (current.en && current["zh-hk"]) {
      paired.push(current);
      current = {};
    }
  }
  return paired;
}

function extractPlainAfter(source, label) {
  return extractLabelBlock(source, label).replace(/\n/g, " ").trim();
}

function renderInline(value = "") {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

function renderMarkdownLite(value = "") {
  const lines = stripTrailing(value).split(/\r?\n/);
  const html = [];
  let paragraph = [];
  let list = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    html.push(`<p>${renderInline(paragraph.join(" "))}</p>`);
    paragraph = [];
  };
  const flushList = () => {
    if (!list.length) return;
    html.push(`<ul>${list.map((item) => `<li>${renderInline(item)}</li>`).join("")}</ul>`);
    list = [];
  };

  for (const line of lines) {
    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }
    const bullet = line.match(/^-\s+(.+)$/);
    if (bullet) {
      flushParagraph();
      list.push(bullet[1].trim());
      continue;
    }
    flushList();
    paragraph.push(line.trim());
  }
  flushParagraph();
  flushList();
  return html.join("\n");
}

function langText(pair, lang) {
  return pair[lang.code] || pair[lang.dir] || "";
}

function localizedName(service, lang) {
  return lang.code === "zh-hk" ? service.zhName : service.name;
}

function imageSrc(image) {
  return image?.startsWith("/") ? image : `/assets/${image}`;
}

function servicePath(service, lang) {
  return `/${lang.dir}/services/${service.slug}/`;
}

function projectPath(project, lang) {
  return `/${lang.dir}/projects/${project.slug}/`;
}

function pagePath(kind, lang) {
  if (kind === "home") return `/${lang.dir}/`;
  return `/${lang.dir}/${kind}/`;
}

function routeToFile(routePath) {
  if (routePath === "/") return join(root, "index.html");
  const path = routePath === "/" ? "index.html" : routePath.replace(/^\/|\/$/g, "");
  return routePath.endsWith("/") ? join(root, path, "index.html") : join(root, path);
}

function rootUrlToFile(urlPath) {
  if (urlPath === "/") return routeToFile("/");
  if (urlPath.startsWith("/assets/")) return join(root, urlPath.slice(1));
  return routeToFile(urlPath);
}

function relativeFromFile(filePath, urlPath) {
  const target = rootUrlToFile(urlPath);
  let relative = normalizePath(relativePath(dirname(filePath), target));
  if (!relative.startsWith(".")) relative = `./${relative}`;
  return relative;
}

function normalizePath(value) {
  return value.replace(/\\/g, "/");
}

function relativizeRootUrls(html, filePath) {
  return html
    .replace(/\b(href|src)="(\/[^"#?]*)([#?][^"]*)?"/g, (_match, attr, urlPath, suffix = "") => {
      return `${attr}="${relativeFromFile(filePath, urlPath)}${suffix}"`;
    })
    .replace(/url=(\/[^";\s<]+)/g, (_match, urlPath) => `url=${relativeFromFile(filePath, urlPath)}`);
}

function writeRoute(routePath, html) {
  const filePath = routeToFile(routePath);
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, relativizeRootUrls(html, filePath));
}

function copyAsset(entry) {
  const source = entry.sourcePath || join(archiveRoot, entry.source);
  const target = join(root, "assets", entry.image);
  if (!existsSync(source)) throw new Error(`Missing asset: ${source}`);
  mkdirSync(dirname(target), { recursive: true });
  if (existsSync(target) && statSync(source).size === statSync(target).size) return;
  copyFileSync(source, target);
}

function copyPortfolioAsset(asset) {
  const target = join(portfolioAssetsRoot, asset.file);
  if (!existsSync(asset.source)) throw new Error(`Missing portfolio asset: ${asset.source}`);
  mkdirSync(dirname(target), { recursive: true });
  if (existsSync(target) && statSync(asset.source).size === statSync(target).size) return;
  copyFileSync(asset.source, target);
}

function readData() {
  const portfolioPages = Object.fromEntries(
    portfolioPageDefinitions.map((definition) => {
      const page = readPortfolioPage(definition);
      return [definition.slug, page];
    })
  );
  const pageList = Object.values(portfolioPages);
  const pageFor = (slug) => {
    const page = portfolioPages[slug];
    if (!page) throw new Error(`Missing portfolio page: ${slug}`);
    return page;
  };
  const projectTitle = (slug) => projectDefinitions.find((project) => project.slug === slug)?.title || slug;

  const services = serviceDefinitions.map((service) => {
    const sourcePages = service.pageSlugs.map(pageFor);
    return {
      ...service,
      image: sourcePages[0]?.image || "/assets/hero-volume.jpg",
      gallery: uniqueAssets(portfolioGalleryAssets(sourcePages)),
      sourcePages,
      title: {
        en: service.name,
        "zh-hk": service.zhName,
      },
      featured: service.featuredSlugs.map(projectTitle).join(", "),
    };
  });

  const projects = projectDefinitions.map((project) => {
    const page = pageFor(project.pageSlug);
    return {
      ...project,
      image: page.image,
      gallery: uniqueAssets(page.visualAssets),
      year: page.section,
      venue: "",
      metadata: {
        "Service Area": page.section,
        Category: project.category,
      },
      summary: {
        en: `${project.title} is a selected ${page.section} project by Imagine Division.`,
        "zh-hk": `${project.title} 是 Imagine Division「${page.section}」範疇中的專案實例。`,
      },
      context: {
        en: `${project.title} sits within Imagine Division's ${page.section} work, demonstrating how the team adapts production resources to different clients, venues, and creative formats.`,
        "zh-hk": `${project.title} 屬於 Imagine Division 的「${page.section}」工作範疇，展示團隊如何因應不同客戶、場地及創作形式調配製作資源。`,
      },
      scope: {
        en: "Production support includes the planning, creative, technical, and onsite execution needed to bring the project into a presentable public-facing result.",
        "zh-hk": "製作支援涵蓋策劃、創意、技術及現場執行，讓項目能以完整而適合公開展示的形式呈現。",
      },
      angle: {
        en: `This project highlights Imagine Division's capability in ${page.section}.`,
        "zh-hk": `此項目展示 Imagine Division 在「${page.section}」上的製作能力。`,
      },
    };
  });

  const contentDirection = `### Positioning

ZH_HK:
Imagine Division Limited 成立於2020年11月，主要業務涵蓋活動策劃、舞台設計及製作、三維動畫、元宇宙及AI工程等，為教育機構、私營企業、個人品牌等不同客戶提供度身訂造的解決方案。

EN:
Imagine Division Limited was established in November 2020. The company works across event planning, stage design and production, 3D animation, metaverse and AI engineering, and tailored solutions for education institutions, private companies, and personal brands.

### Tagline Options

1. ZH_HK: 活動及虛擬製作解決方案
   EN: Event and virtual production solutions.

2. ZH_HK: 提供多媒介、多元化的策劃及製作內容
   EN: Multi-media, diversified planning and production content.

3. ZH_HK: 重新定義虛擬與現實的深度交互
   EN: Redefining deep interaction between virtual and physical worlds.`;

  const home = `### Meta

ZH_HK title: Imagine Division | 活動及虛擬製作解決方案
EN title: Imagine Division | Event and Virtual Production Solutions
ZH_HK description: Imagine Division Limited 2025 企業簡介內容，涵蓋活動製作、虛擬製作、Web3.0及AI工程、虛擬藝人運營及製作、數碼合成與視覺特效。
EN description: Imagine Division Limited 2025 company profile content covering event production, virtual production, Web3.0 and AI engineering, virtual artist management and production, and CGI/VFX.

### Hero

ZH_HK:
活動及虛擬製作解決方案

企業簡介 2025：活動製作、虛擬藝人運營及製作、虛擬製作、Web3.0及AI工程、數碼合成&視覺特效。

EN:
Event and Virtual Production Solutions

Company Profile 2025: Event Production, Virtual Artist Management and Production, Virtual Production, Web3.0 and AI Engineering, and CGI and VFX.

### Intro

ZH_HK:
成立於2020年11月，Imagine Division 主要業務涵蓋活動策劃、舞台設計及製作、三維動畫、元宇宙及AI工程等，並於近年積極拓展人工智能應用，配合 Web 3.0、虛擬資產等科技市場方向更新製作內容。

EN:
Established in November 2020, Imagine Division works across event planning, stage design and production, 3D animation, metaverse and AI engineering. The company has also expanded into AI applications alongside Web 3.0 and virtual asset markets.

### Recent Projects Section

ZH_HK:
以下專案實例來自 Imagine Division 2025 作品集，按原章節整理為活動製作、虛擬製作、Web3.0及AI工程等類別，並保留每頁所有可用圖片。

EN:
The selected projects below show Imagine Division's work across event production, virtual production, Web3.0 and AI engineering, and virtual artist programmes.`;

  const about = `### Meta

ZH_HK title: 關於 Imagine Division
EN title: About Imagine Division
ZH_HK description: Imagine Division 2025 企業簡介中的關於我們、願景與使命內容。
EN description: About, vision, and mission content for Imagine Division.

### Main Copy

ZH_HK:
${pageFor("about-us").extractedText}

${pageFor("vision-and-mission").extractedText}

EN:
Imagine Division Limited was established in November 2020. The company works across event planning, stage design and production, 3D animation, metaverse and AI engineering, with tailored solutions for education institutions, private companies, and personal brands.

In February 2023, the company launched innoneer.TV as a Hong Kong one-stop virtual artist production and operation platform focused on local virtual artist IP, promotion, technical support, and production services.

Its vision and mission include becoming a solutions company that best fits client needs, redefining deep interaction between virtual and physical worlds, providing multi-media and diversified planning and production content, and exploring new directions beyond traditional frameworks.`;

  const projectsLanding = `### Meta

ZH_HK title: 項目 | Imagine Division
EN title: Projects | Imagine Division
ZH_HK description: Imagine Division 專案實例，包含活動製作、虛擬製作、Web3.0及AI工程參考。
EN description: Imagine Division project references across event production, virtual production, and Web3.0 and AI engineering.

### Intro

ZH_HK:
以下項目展示 Imagine Division 在活動製作、虛擬製作、Web3.0及AI工程等範疇的製作經驗。

EN:
The projects below show Imagine Division's production experience across event production, virtual production, Web3.0 and AI engineering, and virtual artist programmes.`;

  const contact = `### Meta

ZH_HK title: 聯絡 Imagine Division
EN title: Contact Imagine Division
ZH_HK description: Imagine Division 聯絡資料。
EN description: Contact details for Imagine Division.

### Main CTA

ZH_HK:
聯絡我們

www.imaginedivision.com
info@imaginedivision.com

EN:
Contact us

www.imaginedivision.com
info@imaginedivision.com

### Enquiry Prompts

ZH_HK:
- 活動製作
- 虛擬製作
- Web3.0及AI工程
- 虛擬藝人運營及製作
- 數碼合成&視覺特效

EN:
- Event Production
- Virtual Production
- Web3.0 and AI Engineering
- Virtual Artist Management and Production
- CGI and VFX`;

  const homeHighlights = services.map((service) => ({
    title: service.name,
    service,
    body: service.body,
    featured: service.featured,
    focus: [],
  }));

  const capabilities = services.map((service) => ({
    title: `${service.title.en} / ${service.title["zh-hk"]}`,
    body: service.body,
  }));

  return {
    contentDirection,
    home,
    about,
    services,
    projectsLanding,
    projects,
    contact,
    homeHighlights,
    capabilities,
    portfolioPages: pageList,
    portfolioAssets: uniqueAssets(pageList.flatMap((page) => page.assets)),
    portfolioPageMap: portfolioPages,
  };
}

const data = readData();

function metaFor(block, lang, fallbackTitle) {
  const meta = extractMeta(block, lang);
  return {
    title: meta.title || `${fallbackTitle} | Imagine Division`,
    description:
      meta.description ||
      "Imagine Division is a Hong Kong multimedia production company for event, video, virtual production, XR, and technical solutions.",
  };
}

function layout({ lang, title, description, current, alternatePath, body, structuredData = "" }) {
  const labels = i18n[lang.code];
  const nav = [
    { key: "home", href: pagePath("home", lang), label: labels.home },
    { key: "projects", href: pagePath("projects", lang), label: labels.projects },
    { key: "about", href: pagePath("about", lang), label: labels.about },
    { key: "contact", href: pagePath("contact", lang), label: labels.contact },
  ];
  return `<!doctype html>
<html lang="${lang.htmlLang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="icon" href="/assets/favicon.ico">
  <link rel="stylesheet" href="/site.css">
  <script src="/site.js" defer></script>
  ${structuredData}
</head>
<body data-page="${escapeHtml(current)}">
  <a class="skip-link" href="#main">${lang.code === "zh-hk" ? "跳到主要內容" : "Skip to main content"}</a>
  <header class="site-header" data-site-header>
    <div class="header-inner">
      <a class="brand" href="${pagePath("home", lang)}" aria-label="Imagine Division">
        <img src="/assets/logo-full.png" alt="Imagine Division" width="2560" height="1440" loading="eager" decoding="async">
      </a>
      <button class="nav-toggle" type="button" aria-controls="primaryNav" aria-expanded="false" data-nav-toggle>
        <span></span><span></span><span></span>
        <span class="sr-only">${labels.services}</span>
      </button>
      <nav class="primary-nav" id="primaryNav" aria-label="Primary navigation" data-primary-nav>
        ${nav
          .map(
            (item) =>
              `<a href="${item.href}" ${current === item.key ? 'aria-current="page"' : ""}>${escapeHtml(
                item.label
              )}</a>`
          )
          .join("")}
        <details class="service-menu">
          <summary>${escapeHtml(labels.services)}</summary>
          <div class="service-menu-panel">
            ${data.services
              .map(
                (service) =>
                  `<a href="${servicePath(service, lang)}">${escapeHtml(service.title[lang.code])}</a>`
              )
              .join("")}
          </div>
        </details>
        <a class="language-link" href="${alternatePath}" aria-label="${escapeHtml(labels.switchLanguage)}">${escapeHtml(
          labels.language
        )}</a>
      </nav>
    </div>
  </header>
  <main id="main">
${body}
  </main>
  ${footer(lang)}
</body>
</html>`;
}

function footer(lang) {
  const labels = i18n[lang.code];
  return `<footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-brand">
        <img src="/assets/logo-mark-white.png" alt="" width="2560" height="581" loading="lazy" decoding="async">
        <div>
          <strong>Imagine Division Limited</strong>
          <p>${escapeHtml(labels.footerIntro)}</p>
        </div>
      </div>
      <nav aria-label="Footer services" class="footer-links">
        <span>${escapeHtml(labels.services)}</span>
        ${data.services
          .slice(0, 6)
          .map((service) => `<a href="${servicePath(service, lang)}">${escapeHtml(service.title[lang.code])}</a>`)
          .join("")}
      </nav>
      <nav aria-label="Footer contact" class="footer-links">
        <span>${escapeHtml(labels.contactChannels)}</span>
        <a href="mailto:info@imaginedivision.com">info@imaginedivision.com</a>
        <a href="https://www.facebook.com/ImagineDivision">Facebook</a>
        <a href="https://twitter.com/ImagineDivision">Twitter</a>
        <a href="https://www.instagram.com/imagine.division/">Instagram</a>
      </nav>
    </div>
    <div class="footer-bottom">${escapeHtml(labels.copyright)}</div>
  </footer>`;
}

function hero({ lang, eyebrow, title, copy, image = "/assets/hero-volume.jpg", primary, secondary, meta = [] }) {
  return `<section class="hero">
    <img class="hero-media" src="${image}" alt="" width="1600" height="1000" loading="eager" decoding="async" fetchpriority="high">
    <div class="hero-scrim"></div>
    <div class="hero-kinetic" aria-hidden="true">
      <span></span><span></span><span></span>
    </div>
    <div class="hero-content">
      <p class="eyebrow">${escapeHtml(eyebrow)}</p>
      <h1>${escapeHtml(title)}</h1>
      ${renderMarkdownLite(copy)}
      <div class="hero-actions">
        ${primary ? `<a class="button button-primary" href="${primary.href}">${escapeHtml(primary.label)}</a>` : ""}
        ${secondary ? `<a class="button button-secondary" href="${secondary.href}">${escapeHtml(secondary.label)}</a>` : ""}
      </div>
      ${
        meta.length
          ? `<dl class="hero-meta">${meta
              .map((item) => `<div><dt>${escapeHtml(item.label)}</dt><dd>${escapeHtml(item.value)}</dd></div>`)
              .join("")}</dl>`
          : ""
      }
    </div>
  </section>`;
}

function sectionIntro(label, title, copy = "") {
  return `<div class="section-intro">
    <p class="eyebrow">${escapeHtml(label)}</p>
    <h2>${escapeHtml(title)}</h2>
    ${copy ? renderMarkdownLite(copy) : ""}
  </div>`;
}

function serviceCards(lang, services = data.services) {
  const labels = i18n[lang.code];
  return `<div class="service-grid" id="serviceGrid">
    ${services
      .map(
        (service) => `<article class="service-card">
          <a href="${servicePath(service, lang)}">
            <img src="${imageSrc(service.image)}" alt="" width="640" height="460" loading="lazy" decoding="async">
            <span class="card-kicker">${escapeHtml(service.accent)}</span>
            <h3>${escapeHtml(service.title[lang.code])}</h3>
            <p>${escapeHtml(service.body[lang.code])}</p>
            <span class="text-link">${escapeHtml(labels.viewService)}</span>
          </a>
        </article>`
      )
      .join("")}
  </div>`;
}

function projectCards(lang, projects = data.projects, limit = null) {
  const labels = i18n[lang.code];
  const visibleProjects = limit ? projects.slice(0, limit) : projects;
  return `<div class="project-grid" id="projectGrid">
    ${visibleProjects
      .map(
        (project) => `<article class="project-card" data-category="${escapeHtml(project.category.toLowerCase())}">
          <a href="${projectPath(project, lang)}">
            <img src="${imageSrc(project.image)}" alt="" width="720" height="500" loading="lazy" decoding="async">
            <div class="project-card-body">
              <p class="card-kicker">${escapeHtml(project.year || "To confirm")}</p>
              <h3>${escapeHtml(project.title)}</h3>
              <p>${escapeHtml(project.summary[lang.code])}</p>
              <span class="meta-line">${escapeHtml(project.category)}</span>
              <span class="text-link">${escapeHtml(labels.viewProject)}</span>
            </div>
          </a>
        </article>`
      )
      .join("")}
  </div>`;
}

function renderAssetGallery(lang, title, assets, copy = "") {
  const unique = uniqueAssets(assets);
  if (!unique.length) return "";
  return `<section class="band project-gallery-band" aria-label="${escapeHtml(title)} ${lang.code === "zh-hk" ? "圖片" : "images"}">
    <div class="container">
      <div class="project-gallery">
        ${unique
          .map(
            (asset) => `<figure class="project-gallery-item">
              <img src="${asset.url}" alt="${escapeHtml(title)}" loading="lazy" decoding="async" width="960" height="640">
            </figure>`
          )
          .join("")}
      </div>
    </div>
  </section>`;
}

function homeSectionNav(lang) {
  const labels = i18n[lang.code];
  const items = [
    { step: "01", href: "#workflow", label: "Workflow" },
    { step: "02", href: "#services", label: labels.services },
    { step: "03", href: "#projects", label: labels.projects },
    { step: "04", href: "#contact", label: labels.contact },
  ];
  return `<nav class="home-spa-nav" aria-label="Homepage sections" data-home-spa-nav>
    <div class="home-spa-nav-inner">
      ${items
        .map(
          (item) =>
            `<a href="${item.href}" data-home-section-link><span>${escapeHtml(item.step)}</span> ${escapeHtml(
              item.label
            )}</a>`
        )
        .join("")}
    </div>
  </nav>`;
}

function processRail() {
  const steps = [
    {
      step: "01",
      title: "Event Production",
      copy: "One-stop event planning, event design, experienced crew, and professional stage, lighting, visual, and audio resources.",
    },
    {
      step: "02",
      title: "Virtual Production",
      copy: "Unreal Engine 5, virtual filming, and mixed reality environments for entertainment, education, and commercial applications.",
    },
    {
      step: "03",
      title: "Web3.0 And AI",
      copy: "Data generators, decentralised application scenarios, AI workflows, private systems, and virtual asset support.",
    },
    {
      step: "04",
      title: "CGI And VFX",
      copy: "Computer-generated imagery, digital compositing, visual effects, and multi-platform media applications.",
    },
  ];
  return `<div class="process-rail" aria-label="Production workflow">
    ${steps
      .map(
        (item) => `<article class="process-step">
          <span>${escapeHtml(item.step)}</span>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.copy)}</p>
        </article>`
      )
      .join("")}
  </div>`;
}

function contactCta(lang) {
  const labels = i18n[lang.code];
  return `<section class="band contact-cta-band" id="contact" data-section="contact">
    <div class="container contact-cta">
      <div>
        <p class="eyebrow">${escapeHtml(labels.contact)}</p>
        <h2>${escapeHtml(labels.nextStep)}</h2>
        <p>${escapeHtml(labels.footerIntro)}</p>
        <div class="section-actions">
          <a class="button button-primary" href="${pagePath("contact", lang)}">${escapeHtml(labels.contactUs)}</a>
          <a class="button button-secondary" href="mailto:info@imaginedivision.com">info@imaginedivision.com</a>
        </div>
      </div>
      <div class="contact-cta-card">
        <p class="card-kicker">Response Channels</p>
        <a href="mailto:info@imaginedivision.com">info@imaginedivision.com</a>
        <a href="https://www.instagram.com/imagine.division/">Instagram</a>
        <a href="https://www.facebook.com/ImagineDivision">Facebook</a>
      </div>
    </div>
  </section>`;
}

function renderLinkButton(item) {
  const target = item.href.startsWith("http") ? ` target="_blank" rel="noopener noreferrer"` : "";
  return `<a class="links-button links-button-${escapeHtml(item.type)}" href="${escapeHtml(item.href)}"${target}>
    <span>
      <strong>${escapeHtml(item.label)}</strong>
      <small>${escapeHtml(item.detail)}</small>
    </span>
    <em>${escapeHtml(item.action)}</em>
  </a>`;
}

function renderLinks() {
  const lang = languages[0];
  const primaryLinks = [
    {
      type: "primary",
      label: "Official Website",
      detail: "Explore Imagine Division services, projects, and production capabilities.",
      action: "Open",
      href: "/en/",
    },
    {
      type: "accent",
      label: "Start a Production Discussion",
      detail: "Email the team for event production, virtual production, Web3.0/AI, virtual artist, or CGI/VFX work.",
      action: "Email",
      href: "mailto:info@imaginedivision.com",
    },
    {
      type: "standard",
      label: "Selected Projects",
      detail: "Selected references across event production, virtual production, and Web3.0/AI engineering.",
      action: "View",
      href: "/en/projects/",
    },
    {
      type: "standard",
      label: "Services",
      detail: "Event Production, Virtual Production, Web3.0 and AI Engineering, Virtual Artist Management, and CGI/VFX.",
      action: "Browse",
      href: "/en/services/",
    },
  ];
  const featureLinks = [
    {
      label: "Virtual Production",
      detail: "LED Volume, ICVFX, realtime rendering, simulcam, and virtual events.",
      href: "/en/services/virtual-production/",
    },
    {
      label: "Web3.0 And AI Engineering",
      detail: "Data workflows, AI tools, private systems, and virtual asset support.",
      href: "/en/services/web3-ai-engineering/",
    },
    {
      label: "CGI And VFX",
      detail: "Computer-generated imagery, digital compositing, visual effects, and multi-platform media.",
      href: "/en/services/cgi-vfx/",
    },
  ];
  const socialLinks = [
    { label: "Instagram", href: "https://www.instagram.com/imagine.division/" },
    { label: "Facebook", href: "https://www.facebook.com/ImagineDivision" },
    { label: "Twitter", href: "https://twitter.com/ImagineDivision" },
    { label: "Creation Chamber", href: "https://www.instagram.com/thecreationchamber.id/" },
    { label: "Audio Chamber", href: "https://www.instagram.com/theaudiochamber.id/" },
  ];
  const coverPage = data.portfolioPageMap["company-profile-cover"];
  const body = `<section class="hero links-page">
    <img class="hero-media" src="${coverPage.image}" alt="" width="1600" height="1000" loading="eager" decoding="async" fetchpriority="high">
    <div class="hero-scrim"></div>
    <div class="hero-kinetic" aria-hidden="true">
      <span></span><span></span><span></span>
    </div>
    <div class="links-shell">
      <div class="links-profile">
        <img src="/assets/logo-mark-white.png" alt="" width="2560" height="581" loading="eager" decoding="async">
        <p class="eyebrow">Imagine Division Limited</p>
        <h1>Event and Virtual Production Solutions</h1>
        <p>Company Profile 2025: Event Production, Virtual Production, Web3.0 and AI Engineering, Virtual Artist Management and Production, and CGI/VFX.</p>
      </div>
      <div class="links-card">
        <p class="card-kicker">Quick Links</p>
        <div class="links-list">
          ${primaryLinks.map(renderLinkButton).join("")}
        </div>
        <div class="links-feature-grid">
          ${featureLinks
            .map(
              (item) => `<a class="links-feature" href="${escapeHtml(item.href)}">
                <strong>${escapeHtml(item.label)}</strong>
                <span>${escapeHtml(item.detail)}</span>
              </a>`
            )
            .join("")}
        </div>
        <nav class="links-social-row" aria-label="Social links">
          ${socialLinks
            .map(
              (item) =>
                `<a href="${escapeHtml(item.href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(
                  item.label
                )}</a>`
            )
            .join("")}
        </nav>
      </div>
    </div>
  </section>`;
  return layout({
    lang,
    title: "Links | Imagine Division",
    description:
      "Quick links for Imagine Division: official website, contact email, projects, services, and social channels.",
    current: "links",
    alternatePath: "/zh-hk/",
    body,
  });
}

function renderHome(lang) {
  const labels = i18n[lang.code];
  const homeMeta = metaFor(data.home, lang, "Imagine Division");
  const heroBlock = extractSection(data.home, 3, "Hero");
  const heroCopy = extractLanguageBlock(heroBlock, lang.marker);
  const intro = extractLanguageBlock(extractSection(data.home, 3, "Intro"), lang.marker);
  const positioning = extractLanguageBlock(extractSection(data.contentDirection, 3, "Positioning"), lang.marker);
  const recentCopy = extractLanguageBlock(extractSection(data.home, 3, "Recent Projects Section"), lang.marker);
  const taglineBlock = extractSection(data.contentDirection, 3, "Tagline Options");
  const taglines = [...taglineBlock.matchAll(new RegExp(`${lang.marker}:\\s*(.+)$`, "gm"))].map((match) =>
    stripTrailing(match[1])
  );
  const coverPage = data.portfolioPageMap["company-profile-cover"];
  const body = `${hero({
    lang,
    eyebrow: "Imagine Division Limited",
    title: heroCopy.split(/\n\n/)[0],
    copy: heroCopy.split(/\n\n/).slice(1).join("\n\n"),
    image: coverPage.image,
    primary: { href: pagePath("projects", lang), label: labels.viewProjects },
    secondary: { href: pagePath("contact", lang), label: labels.contactUs },
  })}
  ${homeSectionNav(lang)}
  <section class="band band-light process-band" id="workflow" data-section="workflow">
    <div class="container split-intro">
      ${sectionIntro(
        "Production Workflow",
        lang.code === "zh-hk" ? "由概念到現場與後期" : "From Concept To Delivery",
        `${intro}\n\n${positioning}`
      )}
      <div class="tagline-stack">
        ${taglines.map((item) => `<p>${escapeHtml(item)}</p>`).join("")}
      </div>
    </div>
    <div class="container">
      ${processRail()}
    </div>
  </section>
  <section class="band" id="services" data-section="services">
    <div class="container">
      ${sectionIntro(labels.services, lang.code === "zh-hk" ? "整合活動、影像與即時技術" : "Integrated Live, Screen, And Realtime Production")}
      ${serviceHighlights(lang)}
    </div>
  </section>
  <section class="band band-light" id="projects" data-section="projects">
    <div class="container">
      ${sectionIntro(labels.selectedProjects, labels.selectedProjects, recentCopy)}
      ${projectCards(lang, data.projects, 6)}
      <div class="section-actions">
        <a class="button button-primary" href="${pagePath("projects", lang)}">${escapeHtml(labels.viewProjects)}</a>
      </div>
    </div>
  </section>
  ${contactCta(lang)}`;
  return layout({
    lang,
    title: homeMeta.title,
    description: homeMeta.description,
    current: "home",
    alternatePath: pagePath("home", languages.find((item) => item.dir === lang.otherDir)),
    body,
  });
}

function serviceHighlights(lang) {
  const labels = i18n[lang.code];
  return `<div class="service-showcase-grid">
    ${data.homeHighlights
      .map((highlight) => {
        if (highlight.focus.length) {
          return `<article class="systems-panel">
            <div>
              <p class="card-kicker">${escapeHtml(labels.serviceFocus)}</p>
              <h3>${escapeHtml(lang.code === "zh-hk" ? "新增製作服務" : "New Production Systems")}</h3>
              ${renderMarkdownLite(highlight.body[lang.code])}
            </div>
            <ul class="focus-list">${highlight.focus
              .map((item) => `<li>${escapeHtml(item[lang.code])}</li>`)
              .join("")}</ul>
          </article>`;
        }
        const service = highlight.service;
        return `<article class="service-showcase-card">
          <a href="${service ? servicePath(service, lang) : pagePath("projects", lang)}">
            ${
              service
                ? `<img src="${imageSrc(service.image)}" alt="" width="720" height="520" loading="lazy" decoding="async">`
                : ""
            }
            <div class="service-showcase-copy">
              <p class="card-kicker">${escapeHtml(service?.accent || labels.services)}</p>
              <h3>${escapeHtml(service ? service.title[lang.code] : highlight.title)}</h3>
              ${renderMarkdownLite(highlight.body[lang.code])}
              ${
                highlight.featured
                  ? `<p class="featured-note">${escapeHtml(labels.featuredCases)}: ${escapeHtml(highlight.featured)}</p>`
                  : ""
              }
              <span class="text-link">${escapeHtml(labels.viewService)}</span>
            </div>
          </a>
        </article>`;
      })
      .join("")}
  </div>`;
}

function renderAbout(lang) {
  const labels = i18n[lang.code];
  const meta = metaFor(data.about, lang, labels.about);
  const mainCopy = extractLanguageBlock(extractSection(data.about, 3, "Main Copy"), lang.marker);
  const aboutPage = data.portfolioPageMap["about-us"];
  const visionPage = data.portfolioPageMap["vision-and-mission"];
  const body = `${hero({
    lang,
    eyebrow: labels.about,
    title: meta.title.replace(" | Imagine Division", ""),
    copy: mainCopy.split(/\n\n/).slice(0, 1).join("\n\n"),
    image: aboutPage.image,
    primary: { href: pagePath("contact", lang), label: labels.contactUs },
    secondary: { href: pagePath("projects", lang), label: labels.viewProjects },
  })}
  <section class="band band-light">
    <div class="container readable">
      ${renderMarkdownLite(mainCopy.split(/\n\n/).slice(1).join("\n\n"))}
    </div>
  </section>
  <section class="band">
    <div class="container">
      ${sectionIntro(labels.capabilities, lang.code === "zh-hk" ? "製作能力" : "Capability Groups")}
      <div class="capability-grid">
        ${data.capabilities
          .map(
            (capability) => `<article class="capability-card">
              <h3>${escapeHtml(capability.title)}</h3>
              ${renderMarkdownLite(capability.body[lang.code])}
            </article>`
          )
          .join("")}
      </div>
    </div>
  </section>`;
  return layout({
    lang,
    title: meta.title,
    description: meta.description,
    current: "about",
    alternatePath: pagePath("about", languages.find((item) => item.dir === lang.otherDir)),
    body,
  });
}

function renderServicesIndex(lang) {
  const labels = i18n[lang.code];
  const title =
    lang.code === "zh-hk" ? "製作服務 | Imagine Division" : "Production Services | Imagine Division";
  const description =
    lang.code === "zh-hk"
      ? "Imagine Division 2025 企業簡介中的活動製作、虛擬製作、Web3.0及AI工程、虛擬藝人運營及製作、數碼合成與視覺特效。"
      : "Imagine Division services: Event Production, Virtual Production, Web3.0 and AI Engineering, Virtual Artist Management and Production, and CGI/VFX.";
  const servicesPage = data.portfolioPageMap["our-services"];
  const body = `${hero({
    lang,
    eyebrow: labels.services,
    title: lang.code === "zh-hk" ? "完整製作服務" : "Complete Production Services",
    copy:
      lang.code === "zh-hk"
        ? "根據 2025 企業簡介，網站整理為活動製作、虛擬製作、Web3.0及AI工程、虛擬藝人運營及製作、數碼合成與視覺特效。"
        : "Based on the 2025 company profile, the site is organised around Event Production, Virtual Production, Web3.0 and AI Engineering, Virtual Artist Management and Production, and CGI/VFX.",
    image: servicesPage.image,
    primary: { href: pagePath("contact", lang), label: labels.nextStep },
    secondary: { href: pagePath("projects", lang), label: labels.viewProjects },
  })}
  <section class="band band-light">
    <div class="container">
      ${serviceCards(lang)}
    </div>
  </section>`;
  return layout({
    lang,
    title,
    description,
    current: "services",
    alternatePath: `/${lang.otherDir}/services/`,
    body,
  });
}

function renderServicePage(service, lang) {
  const labels = i18n[lang.code];
  const title = `${service.title[lang.code]} | Imagine Division`;
  const description = service.body[lang.code];
  const relatedProjects = data.projects.filter((project) =>
    service.featuredSlugs.includes(project.slug) || project.category.toLowerCase().includes(service.name.toLowerCase())
  );
  const fallbackProjects = data.projects.slice(0, 3);
  const body = `${hero({
    lang,
    eyebrow: labels.services,
    title: service.headline[lang.code],
    copy: service.body[lang.code],
    image: imageSrc(service.image),
    primary: { href: pagePath("contact", lang), label: labels.contactUs },
    secondary: { href: pagePath("projects", lang), label: labels.viewProjects },
  })}
  <section class="band band-light">
    <div class="container service-detail">
      <div>
        ${sectionIntro(labels.keyServices, service.title[lang.code])}
        ${
          service.keyServices.length
            ? `<ul class="feature-list">${service.keyServices
                .map((item) => `<li>${escapeHtml(item[lang.code])}</li>`)
                .join("")}</ul>`
            : renderMarkdownLite(service.body[lang.code])
        }
      </div>
      <aside class="detail-aside">
        <p class="card-kicker">${escapeHtml(labels.featuredCases)}</p>
        <p>${escapeHtml(service.featured || "Imagine Division selected projects")}</p>
        <a class="button button-secondary" href="${pagePath("projects", lang)}">${escapeHtml(labels.viewProjects)}</a>
      </aside>
    </div>
  </section>
  ${service.slug === "gaussian-splatting" ? gsViewerSection(lang) : ""}
  <section class="band">
    <div class="container">
      ${sectionIntro(labels.selectedProjects, lang.code === "zh-hk" ? "相關案例" : "Related Cases")}
      ${projectCards(lang, relatedProjects.length ? relatedProjects : fallbackProjects, 3)}
    </div>
  </section>`;
  return layout({
    lang,
    title,
    description,
    current: "services",
    alternatePath: servicePath(service, languages.find((item) => item.dir === lang.otherDir)),
    body,
  });
}

function gsViewerSection(lang) {
  const isZh = lang.code === "zh-hk";
  return `<section class="band gs-viewer-band">
    <div class="container">
      ${sectionIntro(
        isZh ? "GS Viewer" : "GS Viewer",
        isZh ? "Gaussian Splatting Viewer 預留模組" : "Gaussian Splatting Viewer Module",
        isZh
          ? "此區域預留作未來展示 Gaussian Splatting 或點雲場景。現階段可載入 ASCII PLY 點雲檔作瀏覽測試，正式 GS 格式可在日後接入同一個 viewer 介面。"
          : "This area is reserved for future Gaussian Splatting or point-cloud scene previews. For now it can load ASCII PLY point-cloud files for viewing tests, with production GS formats able to connect to the same viewer interface later."
      )}
      <div class="gs-viewer" data-gs-viewer>
        <div class="gs-canvas-wrap">
          <canvas width="960" height="620" data-gs-canvas aria-label="${
            isZh ? "Gaussian Splatting viewer preview canvas" : "Gaussian Splatting viewer preview canvas"
          }"></canvas>
          <div class="gs-hud">
            <span data-gs-status>${isZh ? "Demo point cloud ready" : "Demo point cloud ready"}</span>
            <span data-gs-count>0 points</span>
          </div>
        </div>
        <aside class="gs-controls">
          <p class="card-kicker">${isZh ? "Future-ready" : "Future-ready"}</p>
          <h3>${isZh ? "載入場景" : "Load A Scene"}</h3>
          <p>${
            isZh
              ? "拖放或選擇 ASCII PLY 檔案。滑鼠或手指拖動可旋轉預覽，滾輪可縮放。"
              : "Drop or choose an ASCII PLY file. Drag to rotate the preview, and use the wheel to zoom."
          }</p>
          <label class="file-control">
            <span>${isZh ? "選擇 PLY 檔案" : "Choose PLY File"}</span>
            <input type="file" accept=".ply" data-gs-file>
          </label>
          <button class="button button-secondary" type="button" data-gs-reset>${
            isZh ? "重設 Demo" : "Reset Demo"
          }</button>
          <dl class="gs-spec">
            <div><dt>${isZh ? "支援" : "Current Support"}</dt><dd>ASCII PLY point cloud</dd></div>
            <div><dt>${isZh ? "預留" : "Reserved For"}</dt><dd>.splat / .ksplat / WebGL renderer</dd></div>
          </dl>
        </aside>
      </div>
    </div>
  </section>`;
}

function renderProjects(lang) {
  const labels = i18n[lang.code];
  const meta = metaFor(data.projectsLanding, lang, labels.projects);
  const intro = extractLanguageBlock(extractSection(data.projectsLanding, 3, "Intro"), lang.marker);
  const categories = [...new Set(data.projects.flatMap((project) => project.category.split(",").map((item) => item.trim())))].filter(
    Boolean
  );
  const heroProject = data.projects[0];
  const body = `${hero({
    lang,
    eyebrow: labels.projects,
    title: labels.selectedProjects,
    copy: intro,
    image: imageSrc(heroProject.image),
    primary: { href: pagePath("contact", lang), label: labels.nextStep },
    secondary: { href: pagePath("about", lang), label: labels.about },
  })}
  <section class="band band-light">
    <div class="container">
      <div class="filter-bar" aria-label="${escapeHtml(labels.projectIndex)}">
        <button type="button" class="filter-button is-active" data-project-filter="all">${escapeHtml(labels.all)}</button>
        ${categories
          .slice(0, 8)
          .map(
            (category) =>
              `<button type="button" class="filter-button" data-project-filter="${escapeHtml(
                category.toLowerCase()
              )}">${escapeHtml(category)}</button>`
          )
          .join("")}
      </div>
      ${projectCards(lang)}
    </div>
  </section>
  <section class="band">
    <div class="container">
      ${sectionIntro(labels.projectIndex, labels.projectIndex)}
      <div class="table-wrap">
        <table class="project-table">
          <thead><tr><th>${escapeHtml(labels.projects)}</th><th>${escapeHtml(labels.year)}</th><th>${escapeHtml(
    labels.category
  )}</th></tr></thead>
          <tbody>
            ${data.projects
              .map(
                (project) => `<tr>
                  <td><a href="${projectPath(project, lang)}">${escapeHtml(project.title)}</a></td>
                  <td>${escapeHtml(project.year)}</td>
                  <td>${escapeHtml(project.category)}</td>
                </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </div>
  </section>`;
  return layout({
    lang,
    title: meta.title,
    description: meta.description,
    current: "projects",
    alternatePath: pagePath("projects", languages.find((item) => item.dir === lang.otherDir)),
    body,
  });
}

function renderProjectPage(project, lang) {
  const labels = i18n[lang.code];
  const title = `${project.title} | Imagine Division`;
  const description = project.summary[lang.code];
  const metadata = Object.entries(project.metadata).filter(([key]) => key !== "Slug");
  const creditImages = ["music-video-stellarstellar", "ghost-music-video", "angela-pang-mv"].includes(project.slug)
    ? `<div class="credit-images">
        <img src="/assets/credit-2.jpg" alt="Project credit graphic" loading="lazy" decoding="async" width="640" height="420">
        <img src="/assets/credit-3.jpg" alt="Project credit graphic" loading="lazy" decoding="async" width="640" height="420">
      </div>`
    : "";
  const body = `${hero({
    lang,
    eyebrow: labels.projects,
    title: project.title,
    copy: project.summary[lang.code],
    image: imageSrc(project.image),
    primary: { href: pagePath("contact", lang), label: labels.nextStep },
    secondary: { href: pagePath("projects", lang), label: labels.projectIndex },
    meta: [
      { label: labels.year, value: project.year },
      { label: labels.category, value: project.category },
    ],
  })}
  <section class="band band-light">
    <div class="container project-detail">
      <article class="case-copy">
        <section>
          <p class="eyebrow">${escapeHtml(labels.context)}</p>
          <h2>${escapeHtml(labels.context)}</h2>
          ${renderMarkdownLite(project.context[lang.code])}
        </section>
        <section>
          <p class="eyebrow">${escapeHtml(labels.productionScope)}</p>
          <h2>${escapeHtml(labels.productionScope)}</h2>
          ${renderMarkdownLite(project.scope[lang.code])}
        </section>
        <section>
          <p class="eyebrow">${escapeHtml(labels.showcaseAngle)}</p>
          <h2>${escapeHtml(labels.showcaseAngle)}</h2>
          ${renderMarkdownLite(project.angle[lang.code])}
        </section>
        ${creditImages}
      </article>
      <aside class="detail-aside">
        <p class="card-kicker">${escapeHtml(labels.projectDetails)}</p>
        <dl class="detail-list">
          ${metadata
            .map(([key, value]) => `<div><dt>${escapeHtml(key)}</dt><dd>${escapeHtml(value)}</dd></div>`)
            .join("")}
        </dl>
      </aside>
    </div>
  </section>
  ${renderAssetGallery(lang, project.title, project.gallery)}`;
  return layout({
    lang,
    title,
    description,
    current: "projects",
    alternatePath: projectPath(project, languages.find((item) => item.dir === lang.otherDir)),
    body,
  });
}

function renderContact(lang) {
  const labels = i18n[lang.code];
  const meta = metaFor(data.contact, lang, labels.contact);
  const main = extractLanguageBlock(extractSection(data.contact, 3, "Main CTA"), lang.marker);
  const prompts = extractLanguageBlock(extractSection(data.contact, 3, "Enquiry Prompts"), lang.marker);
  const contactPage = data.portfolioPageMap.contact;
  const body = `${hero({
    lang,
    eyebrow: labels.contact,
    title: main.split(/\n\n/)[0],
    copy: main.split(/\n\n/).slice(1).join("\n\n"),
    image: contactPage.image,
    primary: { href: "mailto:info@imaginedivision.com", label: lang.code === "zh-hk" ? "發送訊息" : "Send a Message" },
    secondary: { href: pagePath("projects", lang), label: labels.viewProjects },
  })}
  <section class="band band-light">
    <div class="container contact-grid">
      <section>
        ${sectionIntro(labels.enquiryPrompts, labels.enquiryPrompts)}
        ${renderMarkdownLite(prompts)}
      </section>
      <aside class="contact-panel">
        <p class="card-kicker">${escapeHtml(labels.contactChannels)}</p>
        <a href="mailto:info@imaginedivision.com">info@imaginedivision.com</a>
        <a href="https://www.facebook.com/ImagineDivision">Facebook / Imagine Division</a>
        <a href="https://twitter.com/ImagineDivision">Twitter / @ImagineDivision</a>
        <a href="https://www.instagram.com/imagine.division/">Instagram / @imagine.division</a>
        <a href="https://www.instagram.com/thecreationchamber.id/">Instagram / @thecreationchamber.id</a>
        <a href="https://www.instagram.com/theaudiochamber.id/">Instagram / @theaudiochamber.id</a>
      </aside>
    </div>
  </section>`;
  return layout({
    lang,
    title: meta.title,
    description: meta.description,
    current: "contact",
    alternatePath: pagePath("contact", languages.find((item) => item.dir === lang.otherDir)),
    body,
  });
}

function renderRedirect(target) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="refresh" content="0; url=${target}">
  <title>Redirecting | Imagine Division</title>
  <link rel="canonical" href="${target}">
  <style>body{font-family:system-ui,sans-serif;background:#0b0d10;color:#f8f8f3;display:grid;min-height:100vh;place-items:center}a{color:#73e4ff}</style>
</head>
<body><main><p>Redirecting to <a href="${target}">${target}</a></p></main></body>
</html>`;
}

const legacyServiceRedirects = {
  "corporate-event": "event-production",
  "video-production": "",
  photography: "",
  "gaussian-splatting": "",
  "bullet-time-camera-rig": "",
  "vtuber-production": "virtual-artist-management-and-production",
  "interactive-experience": "",
  "motion-capture": "",
};

const legacyProjectRedirects = {
  "luminous-nexus-anime-fiesta-2023": "lnaf-2023",
  "the-3rd-belt-and-road-youth-development-summit-forum": "third-belt-road-youth-development-summit",
  "music-video-stellarstellar": "",
  "icvfx-wedding-demo": "",
  "ghost-music-video": "ghost-hoshimachi-suisei-cosplay-music-video",
  "angela-pang-mv": "angela-pang-official-music-video",
  "music-video-otomesyndream-dopamine": "",
  "hololive-en-party2gather": "hololive-party2gather",
  "mop-1st-live-concert": "mic-on-project-1st-live",
  "hk-subculture-production-hksp01": "",
  "belt-and-road-government-banquets": "",
  "top-nova-music-festival-2023": "top-nova-2023",
};

function writeStaticAssets() {
  const unique = new Map();
  for (const asset of extraAssets) unique.set(asset.image, asset);
  for (const asset of unique.values()) copyAsset(asset);
  for (const asset of data.portfolioAssets) copyPortfolioAsset(asset);
  writeFileSync(join(root, "site.css"), siteCss);
  writeFileSync(join(root, "site.js"), readFileSync(join(root, "tools", "site-runtime.js"), "utf8"));
}

function writePages() {
  writeRoute("/", renderHome(languages[0]));
  writeRoute("/links/", renderLinks());
  for (const lang of languages) {
    writeRoute(pagePath("home", lang), renderHome(lang));
    writeRoute(pagePath("about", lang), renderAbout(lang));
    writeRoute(`/${lang.dir}/services/`, renderServicesIndex(lang));
    writeRoute(pagePath("projects", lang), renderProjects(lang));
    writeRoute(pagePath("contact", lang), renderContact(lang));
    for (const service of data.services) writeRoute(servicePath(service, lang), renderServicePage(service, lang));
    for (const project of data.projects) writeRoute(projectPath(project, lang), renderProjectPage(project, lang));
  }

  const redirects = [
    ["/about/", "/en/about/"],
    ["/projects/", "/en/projects/"],
    ["/contact/", "/en/contact/"],
    ["/services/", "/en/services/"],
    ...data.services.map((service) => [`/${service.slug}/`, `/en/services/${service.slug}/`]),
    ...data.projects.map((project) => [`/project/${project.slug}/`, `/en/projects/${project.slug}/`]),
    ...Object.entries(legacyServiceRedirects).flatMap(([from, to]) => [
      [`/${from}/`, to ? `/en/services/${to}/` : "/en/services/"],
      [`/en/services/${from}/`, to ? `/en/services/${to}/` : "/en/services/"],
      [`/zh-hk/services/${from}/`, to ? `/zh-hk/services/${to}/` : "/zh-hk/services/"],
    ]),
    ...Object.entries(legacyProjectRedirects).flatMap(([from, to]) => [
      [`/project/${from}/`, to ? `/en/projects/${to}/` : "/en/projects/"],
      [`/en/projects/${from}/`, to ? `/en/projects/${to}/` : "/en/projects/"],
      [`/zh-hk/projects/${from}/`, to ? `/zh-hk/projects/${to}/` : "/zh-hk/projects/"],
    ]),
  ];
  for (const [from, to] of redirects) writeRoute(from, renderRedirect(to));
}

const siteJs = `(() => {
  const navToggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-primary-nav]");
  if (navToggle && nav) {
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
  }

  const root = document.documentElement;
  const header = document.querySelector("[data-site-header]");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let scrollTicking = false;

  const updateScrollState = () => {
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
  updateScrollState();

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
    item.style.setProperty("--reveal-delay", Math.min((index % 8) * 45, 280) + "ms");
  });

  if (!prefersReducedMotion.matches && "IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
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
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  const sectionLinks = [...document.querySelectorAll("[data-home-section-link]")];
  if (sectionLinks.length && "IntersectionObserver" in window) {
    const sections = sectionLinks
      .map((link) => document.querySelector(link.getAttribute("href")))
      .filter(Boolean);
    const sectionObserver = new IntersectionObserver(
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
  }

  if (!prefersReducedMotion.matches) {
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
  }

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

  const viewer = document.querySelector("[data-gs-viewer]");
  if (!viewer) return;

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
    const lines = text.split(/\\r?\\n/);
    const end = lines.findIndex((line) => line.trim() === "end_header");
    if (end === -1 || !lines[0]?.startsWith("ply")) throw new Error("Not an ASCII PLY file");
    if (!lines.some((line) => line.trim() === "format ascii 1.0")) throw new Error("Only ASCII PLY is supported in this preview");
    const vertexLine = lines.find((line) => line.startsWith("element vertex "));
    const vertexCount = Number(vertexLine?.split(/\\s+/)[2] || 0);
    if (!vertexCount) throw new Error("No vertices found");
    const props = [];
    for (let index = 0; index < end; index += 1) {
      const match = lines[index].match(/^property\\s+\\S+\\s+(\\S+)$/);
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
      const values = (lines[end + 1 + row] || "").trim().split(/\\s+/).map(Number);
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
  canvas.addEventListener("wheel", (event) => {
    event.preventDefault();
    zoom = Math.max(0.45, Math.min(2.4, zoom - event.deltaY * 0.0015));
    draw();
  }, { passive: false });
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
  window.ImagineDivisionGS = { loadPlyText: (text) => { points = parseAsciiPly(text); setStatus("Loaded from API"); setCount(); draw(); } };
  createDemo();
})();`;

const siteCss = `@font-face {
  font-family: "PP Neue Montreal";
  src: url("fonts/PPNeueMontreal-Regular.otf") format("opentype");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "PP Neue Montreal";
  src: url("fonts/PPNeueMontreal-Bold.otf") format("opentype");
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Noto Sans TC";
  src: url("fonts/NotoSansTC-Regular.otf") format("opentype");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Noto Sans TC";
  src: url("fonts/NotoSansTC-Bold.otf") format("opentype");
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

:root {
  color-scheme: dark;
  --ink: #f7f4ea;
  --muted: #b9b7aa;
  --subtle: #89867d;
  --bg: #080a0d;
  --panel: #11151a;
  --panel-2: #171d23;
  --line: rgba(247, 244, 234, 0.16);
  --cyan: #6bdff8;
  --amber: #f0c46a;
  --red: #ff6b5f;
  --violet: #b48cff;
  --max: 1180px;
  --radius: 8px;
  --shadow: 0 24px 70px rgba(0, 0, 0, 0.34);
  --motion-fast: 180ms;
  --motion-medium: 360ms;
  --motion-spring: cubic-bezier(0.22, 1, 0.36, 1);
}

* { box-sizing: border-box; }
html {
  scroll-behavior: smooth;
  background: var(--bg);
  color: var(--ink);
}
body {
  margin: 0;
  font-family: "PP Neue Montreal", "Noto Sans TC", Arial, sans-serif;
  font-size: 16px;
  line-height: 1.6;
  letter-spacing: 0;
  background:
    repeating-linear-gradient(90deg, rgba(247, 244, 234, 0.028) 0 1px, transparent 1px 128px),
    linear-gradient(180deg, #080a0d 0%, #0b1016 44%, #07080a 100%);
  color: var(--ink);
}
html:lang(zh-Hant-HK) body,
html[lang="zh-Hant-HK"] body {
  font-family: "Noto Sans TC", "PP Neue Montreal", Arial, sans-serif;
}
img { display: block; max-width: 100%; height: auto; }
a { color: inherit; text-decoration: none; }
a:focus-visible,
button:focus-visible,
summary:focus-visible {
  outline: 3px solid var(--cyan);
  outline-offset: 4px;
}
p { margin: 0 0 1rem; color: var(--muted); }
h1, h2, h3 { margin: 0; line-height: 1.05; letter-spacing: 0; }
h1 {
  max-width: 920px;
  font-size: 6.4rem;
  font-weight: 700;
}
h2 { font-size: 3.8rem; }
h3 { font-size: 1.55rem; }
ul { padding-left: 1.2rem; color: var(--muted); }
li + li { margin-top: 0.45rem; }
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
.skip-link {
  position: fixed;
  left: 1rem;
  top: 1rem;
  z-index: 1000;
  transform: translateY(-130%);
  padding: 0.7rem 1rem;
  background: var(--cyan);
  color: #041015;
  border-radius: var(--radius);
}
.skip-link:focus { transform: translateY(0); }
.site-header {
  position: sticky;
  top: 0;
  z-index: 200;
  background: rgba(8, 10, 13, 0.86);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--line);
  transition: background var(--motion-fast) ease, box-shadow var(--motion-fast) ease;
}
.site-header::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 1px;
  background: linear-gradient(90deg, var(--cyan), var(--amber), var(--red));
  transform: scaleX(var(--scroll-progress, 0));
  transform-origin: left center;
}
.site-header.is-compact {
  background: rgba(8, 10, 13, 0.94);
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.3);
}
.header-inner {
  width: min(100% - 32px, 1340px);
  min-height: 76px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 1rem;
}
.brand { display: inline-flex; align-items: center; min-width: 0; }
.brand img { width: 188px; height: auto; }
.primary-nav {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.2rem;
}
.primary-nav > a,
.service-menu > summary {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  padding: 0.7rem 0.9rem;
  border-radius: var(--radius);
  color: var(--muted);
  cursor: pointer;
  transition: color var(--motion-fast) ease, background var(--motion-fast) ease, transform var(--motion-fast) ease;
}
.primary-nav > a:hover,
.service-menu > summary:hover,
.primary-nav > a[aria-current="page"] {
  color: var(--ink);
  background: rgba(255, 255, 255, 0.06);
}
.primary-nav > a:hover,
.service-menu > summary:hover {
  transform: translateY(-1px);
}
.language-link {
  border: 1px solid var(--line);
  color: var(--ink) !important;
}
.service-menu { position: relative; }
.service-menu summary { list-style: none; }
.service-menu summary::-webkit-details-marker { display: none; }
.service-menu-panel {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  width: min(420px, calc(100vw - 32px));
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.35rem;
  padding: 0.7rem;
  background: rgba(17, 21, 26, 0.98);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}
.service-menu-panel a {
  min-height: 44px;
  padding: 0.7rem;
  border-radius: 6px;
  color: var(--muted);
}
.service-menu-panel a:hover {
  color: var(--ink);
  background: rgba(255, 255, 255, 0.06);
}
.nav-toggle {
  display: none;
  width: 48px;
  height: 48px;
  margin-left: auto;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: transparent;
  color: var(--ink);
  cursor: pointer;
}
.nav-toggle span:not(.sr-only) {
  display: block;
  width: 20px;
  height: 2px;
  margin: 4px auto;
  background: currentColor;
}
.hero {
  position: relative;
  min-height: 86svh;
  display: grid;
  align-items: end;
  overflow: hidden;
  border-bottom: 1px solid var(--line);
  isolation: isolate;
}
.hero::before,
.hero::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}
.hero::before {
  background:
    repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.05) 0 1px, transparent 1px 84px),
    repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.035) 0 1px, transparent 1px 120px);
  opacity: 0.22;
  transform: translate3d(0, var(--hero-shift, 0px), 0);
}
.hero::after {
  inset: 18% 0 auto;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(107, 223, 248, 0.84), rgba(240, 196, 106, 0.72), transparent);
  opacity: 0.72;
  animation: hero-scan 4.8s var(--motion-spring) infinite;
}
.hero-media {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(0.92) contrast(1.08);
  transform: translate3d(0, var(--hero-shift, 0px), 0) scale(1.045);
  transform-origin: center;
}
.hero-scrim {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(8,10,13,0.94), rgba(8,10,13,0.58) 48%, rgba(8,10,13,0.22)),
    linear-gradient(0deg, rgba(8,10,13,0.92), rgba(8,10,13,0.18) 60%);
  z-index: 1;
}
.hero-kinetic {
  position: absolute;
  inset: 0;
  z-index: 1;
  overflow: hidden;
  pointer-events: none;
}
.hero-kinetic span {
  position: absolute;
  right: max(2rem, calc((100vw - var(--max)) / 2));
  width: min(42vw, 520px);
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(247, 244, 234, 0.78), transparent);
  opacity: 0.34;
  transform: rotate(-14deg);
  animation: kinetic-line 7s ease-in-out infinite;
}
.hero-kinetic span:nth-child(1) { top: 31%; animation-delay: -1s; }
.hero-kinetic span:nth-child(2) { top: 48%; width: min(36vw, 460px); animation-delay: -3s; }
.hero-kinetic span:nth-child(3) { top: 66%; width: min(28vw, 360px); animation-delay: -5s; }
.hero-content {
  position: relative;
  z-index: 2;
  width: min(100% - 32px, var(--max));
  margin: 0 auto;
  padding: 9rem 0 5rem;
  animation: hero-enter 700ms var(--motion-spring) both;
}
.hero-content p {
  max-width: 780px;
  font-size: 1.1rem;
}
.hero-content h1 {
  text-wrap: balance;
}
.eyebrow,
.card-kicker {
  margin: 0 0 0.85rem;
  color: var(--amber);
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.hero-actions,
.section-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1.6rem;
}
.button {
  position: relative;
  min-height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.82rem 1.1rem;
  border-radius: var(--radius);
  font-weight: 700;
  border: 1px solid var(--line);
  overflow: hidden;
  transition: transform var(--motion-fast) ease, background var(--motion-fast) ease, border-color var(--motion-fast) ease, box-shadow var(--motion-fast) ease;
}
.button::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(110deg, transparent 0 35%, rgba(255, 255, 255, 0.42) 50%, transparent 65% 100%);
  transform: translateX(-120%);
  transition: transform 520ms var(--motion-spring);
  pointer-events: none;
}
.button:hover::before { transform: translateX(120%); }
.button > * { position: relative; }
.button:active { transform: translateY(0) scale(0.98); }
.button:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.24);
}
.button-primary {
  background: var(--cyan);
  color: #041015;
  border-color: var(--cyan);
}
.button-secondary {
  background: rgba(255, 255, 255, 0.06);
  color: var(--ink);
}
.hero-meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  max-width: 720px;
  margin: 2rem 0 0;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  overflow: hidden;
}
.hero-meta div { padding: 1rem; border-right: 1px solid var(--line); }
.hero-meta div:last-child { border-right: 0; }
.hero-meta dt { color: var(--subtle); font-size: 0.78rem; text-transform: uppercase; font-weight: 700; }
.hero-meta dd { margin: 0.2rem 0 0; color: var(--ink); font-weight: 700; }
.home-spa-nav {
  position: sticky;
  top: 76px;
  z-index: 150;
  background: rgba(8, 10, 13, 0.82);
  border-bottom: 1px solid var(--line);
  backdrop-filter: blur(16px);
}
.home-spa-nav-inner {
  width: min(100% - 32px, var(--max));
  min-height: 58px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  overflow-x: auto;
  scrollbar-width: none;
}
.home-spa-nav-inner::-webkit-scrollbar { display: none; }
.home-spa-nav a {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  flex: 0 0 auto;
  padding: 0.62rem 0.8rem;
  border: 1px solid transparent;
  border-radius: var(--radius);
  color: var(--muted);
  font-weight: 700;
  transition: color var(--motion-fast) ease, border-color var(--motion-fast) ease, background var(--motion-fast) ease, transform var(--motion-fast) ease;
}
.home-spa-nav a span {
  color: var(--amber);
  font-size: 0.78rem;
}
.home-spa-nav a:hover,
.home-spa-nav a.is-active {
  color: var(--ink);
  border-color: rgba(107, 223, 248, 0.32);
  background: rgba(255, 255, 255, 0.05);
  transform: translateY(-1px);
}
[id] { scroll-margin-top: 148px; }
.band {
  padding: clamp(4rem, 8vw, 7.5rem) 0;
  background: var(--bg);
}
.process-band {
  position: relative;
  overflow: hidden;
}
.process-band::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(115deg, rgba(107, 223, 248, 0.1), transparent 32%),
    linear-gradient(245deg, rgba(240, 196, 106, 0.08), transparent 38%);
  pointer-events: none;
}
.process-band > .container {
  position: relative;
  z-index: 1;
}
.band-light {
  background: #0c1117;
  color: var(--ink);
  border-top: 1px solid rgba(247, 244, 234, 0.08);
  border-bottom: 1px solid rgba(247, 244, 234, 0.08);
}
.band-light p,
.band-light li { color: var(--muted); }
.band-light .eyebrow,
.band-light .card-kicker { color: var(--amber); }
.container {
  width: min(100% - 32px, var(--max));
  margin: 0 auto;
}
.readable { max-width: 840px; }
.readable p { font-size: 1.08rem; }
.section-intro {
  max-width: 820px;
  margin-bottom: 2rem;
}
.section-intro p:last-child { margin-bottom: 0; }
.split-intro {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(260px, 0.72fr);
  gap: clamp(2rem, 5vw, 5rem);
  align-items: start;
}
.tagline-stack {
  display: grid;
  gap: 0.85rem;
}
.tagline-stack p {
  padding: 1rem;
  margin: 0;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  color: var(--ink);
  background: rgba(255, 255, 255, 0.04);
  font-weight: 700;
}
.process-rail {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1px;
  margin-top: 2rem;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--line);
  overflow: hidden;
}
.process-step {
  position: relative;
  min-height: 240px;
  padding: 1.15rem;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.075), rgba(255, 255, 255, 0.025)),
    var(--panel);
  overflow: hidden;
}
.process-step::after {
  content: "";
  position: absolute;
  left: 1.15rem;
  right: 1.15rem;
  bottom: 1rem;
  height: 2px;
  background: linear-gradient(90deg, var(--cyan), var(--amber));
  transform: scaleX(0.28);
  transform-origin: left center;
  transition: transform var(--motion-medium) var(--motion-spring);
}
.process-step:hover::after { transform: scaleX(1); }
.process-step span {
  display: inline-flex;
  min-width: 2.6rem;
  min-height: 2.6rem;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.2rem;
  border: 1px solid rgba(107, 223, 248, 0.36);
  border-radius: 50%;
  color: var(--cyan);
  font-weight: 700;
}
.process-step h3 {
  margin-bottom: 0.75rem;
}
.process-step p {
  margin: 0;
}
.service-grid,
.project-grid,
.highlight-grid,
.capability-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}
.highlight-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.service-showcase-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 1rem;
}
.service-showcase-card {
  grid-column: span 6;
  min-height: 100%;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: linear-gradient(145deg, rgba(23, 29, 35, 0.98), rgba(10, 14, 19, 0.98));
  overflow: hidden;
}
.service-showcase-card:first-child { grid-column: span 7; }
.service-showcase-card:nth-child(2) { grid-column: span 5; }
.service-showcase-card a {
  display: grid;
  grid-template-columns: minmax(220px, 0.9fr) minmax(0, 1fr);
  min-height: 100%;
}
.service-showcase-card img {
  width: 100%;
  height: 100%;
  min-height: 290px;
  object-fit: cover;
}
.service-showcase-copy {
  display: grid;
  align-content: start;
  padding: clamp(1.1rem, 2.2vw, 1.65rem);
}
.service-showcase-copy h3 {
  max-width: 11ch;
  margin-bottom: 0.8rem;
  font-size: 2.35rem;
}
.service-showcase-copy p {
  color: #cbc9bd;
}
.service-showcase-copy .featured-note {
  margin-top: 0.5rem;
  color: var(--ink);
}
.systems-panel {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: minmax(0, 0.78fr) minmax(0, 1fr);
  gap: clamp(1.25rem, 3vw, 2rem);
  padding: clamp(1.25rem, 3vw, 2.1rem);
  border: 1px solid rgba(107, 223, 248, 0.28);
  border-radius: var(--radius);
  background:
    linear-gradient(135deg, rgba(107, 223, 248, 0.12), rgba(240, 196, 106, 0.08)),
    var(--panel);
}
.systems-panel h3 {
  margin-bottom: 0.75rem;
  font-size: 2.75rem;
}
.systems-panel .focus-list {
  align-self: stretch;
  margin: 0;
}
.service-card,
.project-card,
.highlight-card,
.capability-card,
.detail-aside,
.contact-panel,
.contact-cta-card {
  position: relative;
  border-radius: var(--radius);
  border: 1px solid var(--line);
  background: var(--panel);
  overflow: hidden;
}
[data-reveal] {
  opacity: 0;
  transform: translate3d(0, 28px, 0);
  transition:
    opacity 520ms var(--motion-spring) var(--reveal-delay, 0ms),
    transform 520ms var(--motion-spring) var(--reveal-delay, 0ms);
}
[data-reveal].is-visible {
  opacity: 1;
  transform: translate3d(0, 0, 0);
}
.service-showcase-card,
.service-card,
.project-card,
.highlight-card,
.capability-card,
.contact-cta-card {
  transform-style: preserve-3d;
  transition:
    transform 260ms var(--motion-spring),
    border-color 220ms ease,
    box-shadow 220ms ease,
    background 220ms ease;
  will-change: transform;
}
.service-showcase-card:hover,
.service-card:hover,
.project-card:hover,
.highlight-card:hover,
.capability-card:hover,
.contact-cta-card:hover {
  transform: translateY(-6px) rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg));
  border-color: rgba(107, 223, 248, 0.42);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.36);
}
.service-showcase-card a,
.service-card a,
.project-card a {
  color: inherit;
}
.service-showcase-card img,
.service-card img,
.project-card img {
  transition: transform 560ms var(--motion-spring), filter 260ms ease;
}
.service-showcase-card:hover img,
.service-card:hover img,
.project-card:hover img {
  transform: scale(1.04);
  filter: saturate(1.08) contrast(1.04);
}
.project-card[hidden] {
  display: none;
}
.band-light .service-card,
.band-light .project-card,
.band-light .highlight-card,
.band-light .capability-card,
.band-light .detail-aside,
.band-light .contact-panel,
.band-light .contact-cta-card {
  background: var(--panel);
  border-color: var(--line);
}
.service-card a,
.project-card a {
  display: grid;
  height: 100%;
}
.service-card img,
.project-card img {
  width: 100%;
  aspect-ratio: 1.35;
  object-fit: cover;
}
.service-card h3,
.service-card p,
.service-card .card-kicker,
.service-card .text-link {
  margin-left: 1rem;
  margin-right: 1rem;
}
.service-card .card-kicker,
.project-card .card-kicker { margin-top: 1rem; }
.service-card p,
.project-card p {
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.meta-line {
  display: inline-flex;
  align-self: start;
  margin-top: 0.4rem;
  color: var(--subtle);
  font-size: 0.84rem;
  font-weight: 700;
}
.text-link {
  display: inline-flex;
  align-items: center;
  margin-top: auto;
  padding: 1rem 0;
  color: var(--cyan);
  font-weight: 700;
}
.band-light .text-link { color: var(--cyan); }
.text-link::after { content: "→"; margin-left: 0.45rem; }
.project-card-body,
.highlight-card,
.capability-card,
.detail-aside,
.contact-panel {
  padding: 1.1rem;
}
.highlight-wide {
  grid-column: 1 / -1;
}
.featured-note {
  margin-top: 1rem;
  font-weight: 700;
}
.focus-list,
.feature-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  list-style: none;
  padding: 0;
  margin: 1rem 0 0;
}
.focus-list li,
.feature-list li {
  padding: 0.9rem;
  margin: 0;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  color: var(--ink);
  background: rgba(255, 255, 255, 0.04);
}
.band-light .focus-list li,
.band-light .feature-list li {
  color: var(--ink);
  border-color: var(--line);
  background: rgba(255, 255, 255, 0.04);
}
.service-detail,
.project-detail,
.contact-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 1.2rem;
  align-items: start;
}
.detail-aside {
  position: sticky;
  top: 100px;
}
.detail-list {
  margin: 0;
}
.detail-list div {
  padding: 0.75rem 0;
  border-top: 1px solid var(--line);
}
.band-light .detail-list div { border-color: var(--line); }
.detail-list dt {
  color: var(--subtle);
  font-size: 0.82rem;
  font-weight: 700;
}
.detail-list dd {
  margin: 0.2rem 0 0;
  color: inherit;
}
.case-copy {
  display: grid;
  gap: 3rem;
}
.case-copy section {
  max-width: 840px;
}
.case-copy h2 { margin-bottom: 1rem; }
.credit-images {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}
.credit-images img {
  width: 100%;
  border-radius: var(--radius);
  border: 1px solid var(--line);
}
.project-gallery {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}
.project-gallery-item {
  display: grid;
  min-width: 0;
  margin: 0;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--panel);
  overflow: hidden;
}
.project-gallery-item img {
  width: 100%;
  aspect-ratio: 1.35;
  object-fit: cover;
  background: #05080c;
}
.project-gallery-item figcaption {
  display: grid;
  gap: 0.25rem;
  padding: 0.85rem;
  color: var(--muted);
  font-size: 0.84rem;
  line-height: 1.35;
}
.project-gallery-item figcaption span {
  color: var(--amber);
  font-weight: 700;
  text-transform: uppercase;
}
.project-gallery-item figcaption strong {
  color: var(--ink);
  overflow-wrap: anywhere;
}
.project-gallery-item figcaption small {
  color: var(--subtle);
}
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  margin-bottom: 1.4rem;
}
.filter-button {
  min-height: 44px;
  padding: 0.6rem 0.85rem;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: rgba(255, 255, 255, 0.04);
  color: var(--muted);
  cursor: pointer;
  font: inherit;
  font-weight: 700;
}
.filter-button.is-active {
  background: var(--cyan);
  border-color: var(--cyan);
  color: #041015;
}
.filter-button:hover { color: var(--ink); border-color: rgba(107, 223, 248, 0.5); }
.table-wrap {
  overflow-x: auto;
  border: 1px solid var(--line);
  border-radius: var(--radius);
}
.project-table {
  width: 100%;
  min-width: 760px;
  border-collapse: collapse;
}
.project-table th,
.project-table td {
  padding: 0.9rem;
  text-align: left;
  border-bottom: 1px solid var(--line);
  vertical-align: top;
}
.project-table th {
  color: var(--amber);
  font-size: 0.84rem;
  text-transform: uppercase;
}
.project-table a {
  color: var(--cyan);
  font-weight: 700;
}
.contact-panel {
  display: grid;
  gap: 0.7rem;
}
.contact-panel a {
  min-height: 44px;
  display: flex;
  align-items: center;
  padding: 0.75rem;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  color: var(--ink);
  font-weight: 700;
}
.contact-panel a:hover {
  border-color: rgba(107, 223, 248, 0.5);
  color: var(--cyan);
}
.contact-cta-band {
  background:
    linear-gradient(135deg, rgba(107, 223, 248, 0.12), transparent 34%),
    linear-gradient(220deg, rgba(255, 107, 95, 0.1), transparent 42%),
    #080a0d;
  border-top: 1px solid var(--line);
}
.contact-cta {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 0.42fr);
  gap: clamp(1.5rem, 4vw, 4rem);
  align-items: center;
}
.contact-cta h2 {
  max-width: 760px;
  margin-bottom: 1rem;
}
.contact-cta p {
  max-width: 760px;
}
.contact-cta-card {
  display: grid;
  gap: 0.75rem;
  padding: 1rem;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.025)),
    var(--panel);
}
.contact-cta-card a {
  min-height: 44px;
  display: flex;
  align-items: center;
  padding: 0.75rem;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  color: var(--ink);
  font-weight: 700;
  transition: color var(--motion-fast) ease, border-color var(--motion-fast) ease, background var(--motion-fast) ease;
}
.contact-cta-card a:hover {
  border-color: rgba(107, 223, 248, 0.5);
  background: rgba(255, 255, 255, 0.045);
  color: var(--cyan);
}
.links-page.hero {
  min-height: calc(100svh - 76px);
  align-items: center;
  border-bottom: 1px solid var(--line);
}
.links-page .hero-scrim {
  background:
    linear-gradient(90deg, rgba(8, 10, 13, 0.96), rgba(8, 10, 13, 0.7)),
    linear-gradient(0deg, rgba(8, 10, 13, 0.96), rgba(8, 10, 13, 0.2) 60%);
}
.links-shell {
  position: relative;
  z-index: 2;
  width: min(100% - 32px, 980px);
  margin: 0 auto;
  padding: 4rem 0;
  display: grid;
  grid-template-columns: minmax(0, 0.76fr) minmax(320px, 0.9fr);
  gap: 1.2rem;
  align-items: center;
}
.links-profile {
  max-width: 520px;
}
.links-profile img {
  width: 104px;
  height: auto;
  margin-bottom: 1.4rem;
}
.links-profile h1 {
  max-width: 10ch;
  margin-bottom: 1rem;
  font-size: 3.35rem;
}
.links-profile p:last-child {
  max-width: 520px;
  margin-bottom: 0;
}
.links-card {
  position: relative;
  display: grid;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid rgba(107, 223, 248, 0.28);
  border-radius: var(--radius);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.09), rgba(255, 255, 255, 0.025)),
    rgba(17, 21, 26, 0.92);
  box-shadow: var(--shadow);
  backdrop-filter: blur(16px);
}
.links-list {
  display: grid;
  gap: 0.7rem;
}
.links-button {
  min-height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.86rem 0.9rem;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: rgba(255, 255, 255, 0.04);
  transition: transform var(--motion-fast) ease, border-color var(--motion-fast) ease, background var(--motion-fast) ease;
}
.links-button:hover {
  transform: translateY(-2px);
  border-color: rgba(107, 223, 248, 0.48);
  background: rgba(255, 255, 255, 0.075);
}
.links-button span {
  display: grid;
  gap: 0.12rem;
  flex: 1 1 auto;
  min-width: 0;
}
.links-button strong,
.links-feature strong {
  color: var(--ink);
  overflow-wrap: anywhere;
}
.links-button small,
.links-feature span {
  color: var(--muted);
  line-height: 1.45;
  overflow-wrap: anywhere;
}
.links-button em {
  flex: 0 0 auto;
  color: var(--cyan);
  font-style: normal;
  font-weight: 700;
}
.links-button-primary {
  border-color: rgba(107, 223, 248, 0.45);
}
.links-button-accent {
  border-color: rgba(240, 196, 106, 0.45);
}
.links-button-accent em {
  color: var(--amber);
}
.links-feature-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.7rem;
}
.links-feature {
  min-height: 128px;
  display: grid;
  align-content: start;
  gap: 0.45rem;
  padding: 0.85rem;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: rgba(255, 255, 255, 0.035);
  transition: transform var(--motion-fast) ease, border-color var(--motion-fast) ease;
}
.links-feature:hover {
  transform: translateY(-2px);
  border-color: rgba(107, 223, 248, 0.42);
}
.links-social-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.links-social-row a {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.58rem 0.72rem;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  color: var(--ink);
  font-weight: 700;
  transition: color var(--motion-fast) ease, border-color var(--motion-fast) ease, background var(--motion-fast) ease;
}
.links-social-row a:hover {
  color: var(--cyan);
  border-color: rgba(107, 223, 248, 0.48);
  background: rgba(255, 255, 255, 0.05);
}
.gs-viewer-band {
  background: #070b0f;
}
.gs-viewer {
  border: 1px solid rgba(107, 223, 248, 0.25);
  border-radius: var(--radius);
  background: var(--panel);
  overflow: hidden;
  box-shadow: var(--shadow);
}
.gs-canvas-wrap {
  position: relative;
  min-height: clamp(360px, 56vw, 640px);
  background:
    linear-gradient(135deg, rgba(107, 223, 248, 0.16), transparent 32%),
    linear-gradient(225deg, rgba(240, 196, 106, 0.12), transparent 38%),
    #05080c;
  cursor: grab;
  touch-action: none;
}
.gs-viewer[data-dragging="true"] .gs-canvas-wrap,
.gs-canvas-wrap:active {
  cursor: grabbing;
}
.gs-canvas-wrap canvas {
  display: block;
  width: 100%;
  height: 100%;
  min-height: inherit;
}
.gs-hud {
  position: absolute;
  left: 1rem;
  top: 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  max-width: calc(100% - 2rem);
  pointer-events: none;
}
.gs-hud span {
  padding: 0.42rem 0.62rem;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: rgba(5, 8, 12, 0.78);
  color: var(--ink);
  font-size: 0.82rem;
  font-weight: 700;
  backdrop-filter: blur(10px);
}
.gs-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border-top: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.03);
}
.file-control {
  position: relative;
  min-height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.82rem 1.1rem;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  color: var(--ink);
  font-weight: 700;
  overflow: hidden;
  cursor: pointer;
}
.file-control:hover {
  border-color: rgba(107, 223, 248, 0.5);
  color: var(--cyan);
}
.file-control input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}
.gs-spec {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
  padding: 1rem;
  margin: 0;
  list-style: none;
  border-top: 1px solid var(--line);
}
.gs-spec li {
  margin: 0;
  padding: 0.9rem;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: rgba(255, 255, 255, 0.04);
  color: var(--muted);
}
.site-footer {
  border-top: 1px solid var(--line);
  background: #07080a;
}
.footer-inner {
  width: min(100% - 32px, var(--max));
  margin: 0 auto;
  padding: 3rem 0;
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) repeat(2, minmax(180px, 0.6fr));
  gap: 2rem;
}
.footer-brand {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}
.footer-brand img {
  width: min(188px, 100%);
  height: auto;
}
.footer-links {
  display: grid;
  gap: 0.5rem;
}
.footer-links span,
.footer-brand strong {
  color: var(--ink);
  font-weight: 700;
}
.footer-links a {
  color: var(--muted);
}
.footer-links a:hover {
  color: var(--cyan);
}
.footer-bottom {
  width: min(100% - 32px, var(--max));
  margin: 0 auto;
  padding: 1rem 0 2rem;
  color: var(--subtle);
  font-size: 0.88rem;
}

@view-transition {
  navigation: auto;
}
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 220ms;
  animation-timing-function: var(--motion-spring);
}

@keyframes hero-enter {
  from {
    opacity: 0;
    transform: translate3d(0, 24px, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}
@keyframes hero-scan {
  0%, 100% {
    transform: translate3d(-12%, 0, 0) scaleX(0.42);
    opacity: 0;
  }
  28%, 68% {
    opacity: 0.72;
  }
  50% {
    transform: translate3d(12%, 0, 0) scaleX(1);
  }
}
@keyframes kinetic-line {
  0%, 100% {
    transform: translate3d(18%, 0, 0) rotate(-14deg);
    opacity: 0.16;
  }
  50% {
    transform: translate3d(-4%, 0, 0) rotate(-14deg);
    opacity: 0.46;
  }
}

@media (max-width: 980px) {
  h1 { font-size: 4.8rem; }
  h2 { font-size: 3.15rem; }
  .nav-toggle { display: block; }
  .primary-nav {
    position: absolute;
    inset: 76px 16px auto;
    display: none;
    flex-direction: column;
    align-items: stretch;
    padding: 0.8rem;
    background: rgba(17, 21, 26, 0.98);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
  }
  .primary-nav[data-open="true"] { display: flex; }
  .service-menu-panel {
    position: static;
    width: 100%;
    grid-template-columns: 1fr;
    box-shadow: none;
  }
  .split-intro,
  .service-detail,
  .project-detail,
  .contact-grid,
  .contact-cta,
  .links-shell,
  .service-showcase-card a,
  .systems-panel,
  .footer-inner {
    grid-template-columns: 1fr;
  }
  .links-profile {
    max-width: 720px;
  }
  .links-profile h1 {
    max-width: none;
  }
  .process-rail {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .service-showcase-card,
  .service-showcase-card:first-child,
  .service-showcase-card:nth-child(2) {
    grid-column: 1 / -1;
  }
  .service-showcase-card img { min-height: 240px; }
  .service-showcase-copy h3 { font-size: 2rem; }
  .systems-panel h3 { font-size: 2.35rem; }
  .service-grid,
  .project-grid,
  .highlight-grid,
  .capability-grid,
  .project-gallery {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .detail-aside { position: static; }
}

@media (max-width: 640px) {
  .header-inner { width: min(100% - 24px, 1340px); }
  .brand img { width: 154px; }
  .hero { min-height: 82svh; }
  .hero-content { width: min(100% - 24px, var(--max)); padding: 7rem 0 3rem; }
  .links-page.hero { min-height: calc(100svh - 76px); }
  .links-shell {
    width: min(100% - 24px, 980px);
    padding: 2.4rem 0;
  }
  .links-profile img {
    width: 84px;
    margin-bottom: 1rem;
  }
  .links-profile h1 {
    font-size: 2.75rem;
  }
  .links-card {
    padding: 0.75rem;
  }
  .links-button {
    min-height: 68px;
    align-items: flex-start;
  }
  .links-button em {
    padding-top: 0.12rem;
  }
  .links-feature-grid {
    grid-template-columns: 1fr;
  }
  .home-spa-nav-inner { width: min(100% - 24px, var(--max)); }
  .hero-meta,
  .focus-list,
  .feature-list,
  .process-rail,
  .service-showcase-grid,
  .gs-spec,
  .service-grid,
  .project-grid,
  .highlight-grid,
  .capability-grid,
  .project-gallery,
  .credit-images {
    grid-template-columns: 1fr;
  }
  .hero-meta div { border-right: 0; border-bottom: 1px solid var(--line); }
  .hero-meta div:last-child { border-bottom: 0; }
  .container { width: min(100% - 24px, var(--max)); }
  h1 { font-size: 3.2rem; }
  h2 { font-size: 2.55rem; }
  h3 { font-size: 1.35rem; }
  .service-showcase-copy h3,
  .systems-panel h3 { font-size: 1.8rem; }
  .process-step { min-height: 210px; }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
  [data-reveal] {
    opacity: 1 !important;
    transform: none !important;
  }
  .hero-media,
  .hero::before,
  .service-showcase-card:hover,
  .service-card:hover,
  .project-card:hover,
  .highlight-card:hover,
  .capability-card:hover,
  .contact-cta-card:hover {
    transform: none !important;
  }
}`;

writeStaticAssets();
writePages();

const generated = {
  languages: languages.map((lang) => lang.dir),
  standalonePages: ["links"],
  services: data.services.map((service) => service.slug),
  projects: data.projects.map((project) => project.slug),
  pagesPerLanguage: 1 + 3 + 1 + data.services.length + data.projects.length,
};
writeFileSync(join(root, "site-manifest.json"), `${JSON.stringify(generated, null, 2)}\n`);
console.log(JSON.stringify(generated, null, 2));
