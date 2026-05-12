const WEB_APP_BASE = "http://localhost:5173";
const ROOT_ID = "verifind-extension-root";
const ALL_ENGINES = ["amazon", "walmart", "ebay", "google-shopping"];

const retailerConfigs = [
  {
    id: "amazon",
    label: "Amazon",
    hostMatch: /(^|\.)amazon\.com$/i,
    titleSelectors: ["#productTitle", "h1"],
    priceSelectors: [
      ".a-price .a-offscreen",
      "#priceblock_ourprice",
      "#priceblock_dealprice",
      "#corePrice_feature_div .a-offscreen",
      "#apex_desktop .a-offscreen",
    ],
    cleanTitle: (title) => title.replace(/\s*-\s*Amazon.*$/i, ""),
  },
  {
    id: "walmart",
    label: "Walmart",
    hostMatch: /(^|\.)walmart\.com$/i,
    titleSelectors: ['h1[itemprop="name"]', "h1"],
    priceSelectors: [
      '[itemprop="price"]',
      '[data-testid="price-wrap"] span',
      '[data-automation-id="product-price"]',
      'span[data-testid="price"]',
    ],
    cleanTitle: (title) => title.replace(/\s*-\s*Walmart.*$/i, ""),
  },
  {
    id: "ebay",
    label: "Ebay",
    hostMatch: /(^|\.)ebay\.com$/i,
    titleSelectors: [".x-item-title__mainTitle span", "#itemTitle", "h1"],
    priceSelectors: [".x-price-primary span", "#prcIsum", "#mm-saleDscPrc", '[itemprop="price"]'],
    cleanTitle: (title) =>
      title.replace(/^Details about\s*/i, "").replace(/\s*\|\s*eBay.*$/i, ""),
  },
  {
    id: "google-shopping",
    label: "Google Shopping",
    hostMatch: /(^|\.)google\.com$/i,
    titleSelectors: ["h1", '[role="heading"]', "title"],
    priceSelectors: [
      '[aria-label*="$"]',
      '[data-price]',
      ".a8Pemb",
      ".T14wmb",
      ".HRLxBb",
    ],
    cleanTitle: (title) =>
      title
        .replace(/\s*-\s*Google Shopping.*$/i, "")
        .replace(/\s*-\s*Google Search.*$/i, ""),
  },
];

function currentRetailer() {
  const host = location.hostname.replace(/^www\./, "");
  return retailerConfigs.find((config) => config.hostMatch.test(host)) || null;
}

function textFromSelector(selector) {
  if (selector === "title") return document.title.trim();
  return document.querySelector(selector)?.textContent?.trim() || "";
}

function firstText(selectors) {
  return selectors.map(textFromSelector).find(Boolean) || "";
}

function extractNumber(value) {
  if (!value) return null;
  const match = String(value).replace(/,/g, "").match(/\$?\s*([0-9]+(?:\.[0-9]{1,2})?)/);
  return match ? Number(match[1]) : null;
}

function getPageProduct(retailer) {
  const rawTitle = firstText(retailer.titleSelectors) || document.title;
  const title = retailer.cleanTitle(rawTitle).trim();
  const rawPrice = firstText(retailer.priceSelectors);

  return {
    retailer,
    title,
    price: extractNumber(rawPrice),
    rawPrice,
  };
}

function normalizeProductPrice(product) {
  if (typeof product.extracted_price === "number") return product.extracted_price;
  if (typeof product.price === "number") return product.price;
  return extractNumber(product.price || product.raw_price || "");
}

function getRetailerName(product) {
  const retailer = product.retailer || product.source || product.seller || "retailer";
  return String(retailer).replace(/-/g, " ");
}

function comparisonEngines(currentEngine) {
  const engines = ALL_ENGINES.filter((engine) => engine !== currentEngine);
  return engines.length ? engines : ALL_ENGINES;
}

function createRoot() {
  document.getElementById(ROOT_ID)?.remove();
  const root = document.createElement("div");
  root.id = ROOT_ID;
  document.body.appendChild(root);
  return root;
}

function render(root, state) {
  const openSearchUrl = `${WEB_APP_BASE}/search?keyword=${encodeURIComponent(state.title || "")}`;
  const best = state.best;
  const retailerLabel = state.retailer?.label || "Retailer";
  const currentPrice = state.price ? `$${state.price.toFixed(2)}` : state.rawPrice || "Not found";
  const bestPrice = best?.price ? `$${best.price.toFixed(2)}` : "";
  const savings = state.price && best?.price ? state.price - best.price : 0;

  root.innerHTML = `
    <div class="verifind-panel">
      <div class="verifind-topbar">
        <div class="verifind-brand">
          <strong>Verifind Price Check</strong>
          <span>${state.loading ? `Scanning ${escapeHtml(retailerLabel)}` : "Scan complete"}</span>
        </div>
        <button class="verifind-close" type="button" aria-label="Close Verifind panel">&times;</button>
      </div>
      <div class="verifind-body">
        <p class="verifind-product">${escapeHtml(state.title || "Product page")}</p>
        <p class="verifind-status">${escapeHtml(state.message)}</p>
        <div class="verifind-price-row">
          <span class="verifind-label">${escapeHtml(retailerLabel)} price</span>
          <span class="verifind-price">${escapeHtml(currentPrice)}</span>
        </div>
        ${
          best
            ? `<div class="verifind-price-row">
                <span class="verifind-label">Lowest found at ${escapeHtml(getRetailerName(best.product))}</span>
                <span class="verifind-price">${escapeHtml(bestPrice)}</span>
              </div>`
            : ""
        }
        ${
          savings > 0
            ? `<p class="verifind-savings">Potential savings: $${savings.toFixed(2)}</p>`
            : ""
        }
        <div class="verifind-actions">
          ${
            best?.product?.link
              ? `<a class="verifind-link" href="${escapeAttribute(best.product.link)}" target="_blank" rel="noreferrer">View deal</a>`
              : `<a class="verifind-link" href="${escapeAttribute(openSearchUrl)}" target="_blank" rel="noreferrer">Open Verifind</a>`
          }
          <button class="verifind-button" type="button">Rescan</button>
        </div>
      </div>
    </div>
  `;

  root.querySelector(".verifind-close")?.addEventListener("click", () => root.remove());
  root.querySelector(".verifind-button")?.addEventListener("click", () => scanProduct(root));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

async function scanProduct(root) {
  const retailer = currentRetailer();

  if (!retailer) {
    return;
  }

  const product = getPageProduct(retailer);

  if (!product.title) {
    render(root, {
      retailer,
      title: "Product page",
      rawPrice: "",
      price: null,
      loading: false,
      message: "Open a supported product page and Verifind will compare prices.",
    });
    return;
  }

  render(root, {
    ...product,
    loading: true,
    message: "Looking for lower prices through Verifind...",
  });

  try {
    const searchResult = await chrome.runtime.sendMessage({
      type: "VERIFIND_SEARCH",
      keyword: product.title,
      engines: comparisonEngines(retailer.id).join(","),
    });

    if (!searchResult?.ok) {
      throw new Error(`Verifind API returned ${searchResult?.status || 0}`);
    }

    const data = searchResult.data || {};
    const ranked = (data.products || [])
      .map((result) => ({ product: result, price: normalizeProductPrice(result) }))
      .filter((result) => typeof result.price === "number" && Number.isFinite(result.price))
      .sort((a, b) => a.price - b.price);

    const bestLower = product.price
      ? ranked.find((result) => result.price < product.price)
      : ranked[0];

    render(root, {
      ...product,
      best: bestLower,
      loading: false,
      message: bestLower
        ? "Verifind found a lower price candidate."
        : "No lower priced match was found yet. Open Verifind for a broader search.",
    });
  } catch (error) {
    render(root, {
      ...product,
      loading: false,
      message: "Start the Verifind backend with node server.js, then rescan.",
    });
  }
}

if (currentRetailer()) {
  scanProduct(createRoot());
}
