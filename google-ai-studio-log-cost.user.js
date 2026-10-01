// ==UserScript==
// @name         Google AI Studio Log Cost
// @name:zh-TW   Google AI Studio Log 費用估算
// @namespace    https://aistudio.google.com/
// @version      0.3.6
// @description  Show a paid-tier cost estimate next to token usage on Google AI Studio log and preview pages.
// @description:zh-TW 在 Google AI Studio log 與 preview 頁面的 token 用量旁顯示 Gemini API 付費層級費用估算。
// @author       Nanako0129
// @match        https://aistudio.google.com/*
// @compatible   chrome
// @compatible   edge
// @license      MIT
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
  "use strict";

  const CONFIG = {
    pricingTier: "standard", // standard, batch, flex, or priority
    updateDelayMs: 250,
    sourceLabel: "Google Gemini API pricing, checked 2026-10-01",
  };

  const TOKEN_LABELS = {
    input: ["Input tokens", "Input token", "Input token count", "Prompt tokens", "Prompt token", "Prompt token count"],
    output: ["Output tokens", "Output token", "Output token count", "Response tokens", "Response token", "Candidates tokens", "Candidate tokens", "Candidates token count"],
    total: ["Total tokens", "Total token", "Total token count", "Tokens used", "Token count"],
    cached: [
      "Cached tokens",
      "Cached token",
      "Cache tokens",
      "Cache token",
      "Cached input tokens",
      "Cached input token",
      "Cached prompt tokens",
      "Cached prompt token",
      "Cached content tokens",
      "Cached content token",
      "Cached content token count",
      "Cache read tokens",
      "Cache read token",
      "Context cache tokens",
      "Context cache token",
    ],
  };

  // Paid-tier prices are USD per 1M tokens. The table intentionally focuses on
  // text/image/video token prices because AI Studio log token rows do not expose
  // enough modality detail to price audio or generated images reliably. Cache
  // rates are cache-read token prices; explicit cache storage per hour is not
  // represented in a single AI Studio log row.
  const PRICING = {
    // Announced 2026-09-30 (blog.google); not yet on the pricing page, so the
    // model ID is assumed and only Standard rates are published.
    "gemini-4-argon": {
      standard: flatRates(2.0, 10.0, 0.1),
      note: "Introductory rates; later $4 / $20 per 1M, no end date announced.",
    },
    "gemini-3.8-flash": {
      standard: flatRates(0.75, 3.75, 0.075),
      batch: flatRates(0.375, 1.875, 0.0375),
      flex: flatRates(0.375, 1.875, 0.0375),
      priority: flatRates(1.35, 6.75, 0.135),
      note: "Promotional rates through 2026-12-31.",
    },
    "gemini-3.7-flash": {
      standard: flatRates(0.75, 3.75, 0.075),
      batch: flatRates(0.375, 1.875, 0.0375),
      flex: flatRates(0.375, 1.875, 0.0375),
      priority: flatRates(1.35, 6.75, 0.135),
      note: "Promotional rates through 2026-12-31.",
    },
    "gemini-3.6-flash": {
      standard: flatRates(1.5, 7.5, 0.15),
      batch: flatRates(0.75, 3.75, 0.075),
      flex: flatRates(0.75, 3.75, 0.075),
      priority: flatRates(2.7, 13.5, 0.27),
    },
    "gemini-3.5-flash": {
      standard: flatRates(1.5, 9.0, 0.15),
      batch: flatRates(0.75, 4.5, 0.075),
      flex: flatRates(0.75, 4.5, 0.08),
      priority: flatRates(2.7, 16.2, 0.27),
    },
    "gemini-3.1-pro-preview": {
      standard: thresholdRates(200000, 2.0, 12.0, 0.2, 4.0, 18.0, 0.4),
      batch: thresholdRates(200000, 1.0, 6.0, 0.2, 2.0, 9.0, 0.4),
      flex: thresholdRates(200000, 1.0, 6.0, 0.2, 2.0, 9.0, 0.4),
      priority: thresholdRates(200000, 3.6, 21.6, 0.36, 7.2, 32.4, 0.72),
    },
    "gemini-3.1-pro-preview-customtools": {
      standard: thresholdRates(200000, 2.0, 12.0, 0.2, 4.0, 18.0, 0.4),
      batch: thresholdRates(200000, 1.0, 6.0, 0.2, 2.0, 9.0, 0.4),
      flex: thresholdRates(200000, 1.0, 6.0, 0.2, 2.0, 9.0, 0.4),
      priority: thresholdRates(200000, 3.6, 21.6, 0.36, 7.2, 32.4, 0.72),
    },
    "gemini-3.1-flash-lite-preview": {
      standard: flatRates(0.25, 1.5, 0.025),
      batch: flatRates(0.125, 0.75, 0.0125),
      flex: flatRates(0.125, 0.75, 0.0125),
      priority: flatRates(0.45, 2.7, 0.045),
    },
    "gemini-3.1-flash-image-preview": {
      standard: flatRates(0.5, 3.0),
      batch: flatRates(0.25, 1.5),
    },
    "gemini-3-flash-preview": {
      standard: flatRates(0.5, 3.0, 0.05),
      batch: flatRates(0.25, 1.5, 0.05),
      flex: flatRates(0.25, 1.5, 0.05),
      priority: flatRates(0.9, 5.4, 0.09),
    },
    "gemini-3-pro-image-preview": {
      standard: flatRates(2.0, 12.0),
      batch: flatRates(1.0, 6.0),
      flex: flatRates(1.0, 6.0),
      priority: flatRates(3.6, 21.6),
    },
    "gemini-2.5-pro": {
      standard: thresholdRates(200000, 1.25, 10.0, 0.125, 2.5, 15.0, 0.25),
      batch: thresholdRates(200000, 0.625, 5.0, 0.125, 1.25, 7.5, 0.25),
      flex: thresholdRates(200000, 0.625, 5.0, 0.125, 1.25, 7.5, 0.25),
      priority: thresholdRates(200000, 2.25, 18.0, 0.225, 4.5, 27.0, 0.45),
    },
    "gemini-2.5-flash": {
      standard: flatRates(0.3, 2.5, 0.03),
      batch: flatRates(0.15, 1.25, 0.03),
      flex: flatRates(0.15, 1.25, 0.03),
      priority: flatRates(0.54, 4.5, 0.054),
    },
    "gemini-2.5-flash-lite": {
      standard: flatRates(0.1, 0.4, 0.01),
      batch: flatRates(0.05, 0.2, 0.01),
      flex: flatRates(0.05, 0.2, 0.01),
      priority: flatRates(0.18, 0.72, 0.018),
    },
    "gemini-2.5-flash-lite-preview-09-2025": {
      standard: flatRates(0.1, 0.4, 0.01),
      batch: flatRates(0.05, 0.2, 0.01),
    },
    "gemini-2.0-flash": {
      standard: flatRates(0.1, 0.4, 0.025),
      batch: flatRates(0.05, 0.2, 0.025),
    },
    "gemini-2.0-flash-lite": {
      standard: flatRates(0.075, 0.3),
      batch: flatRates(0.0375, 0.15),
    },
  };

  let scanTimer = null;
  let lastSignature = "";

  function flatRates(input, output, cache = null) {
    return [{ maxPromptTokens: Infinity, input, output, cache }];
  }

  function thresholdRates(threshold, lowInput, lowOutput, lowCache, highInput, highOutput, highCache) {
    return [
      { maxPromptTokens: threshold, input: lowInput, output: lowOutput, cache: lowCache },
      { maxPromptTokens: Infinity, input: highInput, output: highOutput, cache: highCache },
    ];
  }

  function scheduleScan() {
    window.clearTimeout(scanTimer);
    scanTimer = window.setTimeout(renderEstimate, CONFIG.updateDelayMs);
  }

  function renderEstimate() {
    const supportedByUrl = isSupportedPageUrl();
    if (!supportedByUrl && !hasUsageHints()) {
      removeExistingRows();
      lastSignature = "";
      return;
    }

    const usage = readUsageFromPage();
    if (!usage.model || usage.inputTokens == null || usage.outputTokens == null) {
      removeExistingRows();
      lastSignature = "";
      return;
    }

    const signature = [
      usage.model,
      usage.inputTokens,
      usage.outputTokens,
      usage.totalTokens,
      usage.cachedTokens,
      CONFIG.pricingTier,
    ].join("|");

    const existingRows = [...document.querySelectorAll(".gais-log-cost-estimate")];
    const existingRow = existingRows[0] || null;
    existingRows.slice(1).forEach((row) => row.remove());

    if (existingRow?.dataset.signature === signature) {
      lastSignature = signature;
      return;
    }

    const anchor = findTokenAnchor();
    if (!anchor) {
      return;
    }

    const modelKey = normalizeModelName(usage.model);
    const pricingMatch = findPricing(modelKey);
    const row = pricingMatch
      ? buildCostRow(usage, pricingMatch.modelKey, pricingMatch.rates)
      : buildUnknownModelRow(usage, modelKey);

    row.dataset.signature = signature;

    if (existingRow) {
      existingRow.replaceWith(row);
    } else {
      insertAfter(anchor, row);
    }

    lastSignature = signature;
  }

  function isLogPageUrl() {
    return location.hostname === "aistudio.google.com" && location.pathname.includes("/logs/");
  }

  function isPreviewPageUrl() {
    const routeText = `${location.pathname}${location.search}${location.hash}`;
    return location.hostname === "aistudio.google.com" && /(?:^|[/?#&=_-])preview(?:[/?#&=_.-]|$)/i.test(routeText);
  }

  function isSupportedPageUrl() {
    return isLogPageUrl() || isPreviewPageUrl();
  }

  function hasUsageHints() {
    const text = document.body?.innerText || "";
    return /\b(?:Input|Output|Total|Cached|Prompt|Candidates?)\s+tokens?\b/i.test(text)
      && (/\bModel\b/i.test(text) || /\bmodels\/[a-z0-9][a-z0-9._-]*/i.test(text));
  }

  function installRouteChangeHooks() {
    const notifyRouteChange = () => window.setTimeout(scheduleScan, 0);

    for (const methodName of ["pushState", "replaceState"]) {
      const original = history[methodName];
      history[methodName] = function patchedHistoryMethod(...args) {
        const result = original.apply(this, args);
        notifyRouteChange();
        return result;
      };
    }

    window.addEventListener("popstate", notifyRouteChange);
  }

  function readUsageFromPage() {
    const lines = getVisibleLines();

    return {
      model: readModel(lines),
      inputTokens: readTokenLine(lines, TOKEN_LABELS.input),
      outputTokens: readTokenLine(lines, TOKEN_LABELS.output),
      totalTokens: readTokenLine(lines, TOKEN_LABELS.total),
      cachedTokens: readTokenLine(lines, TOKEN_LABELS.cached) || 0,
    };
  }

  function getVisibleLines() {
    return (document.body?.innerText || "")
      .replace(/\r/g, "\n")
      .split("\n")
      .map((line) => line.replace(/\s+/g, " ").trim())
      .filter(Boolean);
  }

  function readModel(lines) {
    for (let index = 0; index < lines.length - 1; index += 1) {
      if (lines[index].toLowerCase() === "model") {
        return lines[index + 1];
      }
    }

    const fallback = (document.body?.innerText || "").match(/\bmodels\/[a-z0-9][a-z0-9._-]*/i);
    return fallback ? fallback[0] : null;
  }

  function readTokenLine(lines, labels) {
    for (let lineIndex = lines.length - 1; lineIndex >= 0; lineIndex -= 1) {
      const normalizedLine = normalizeTokenLine(lines[lineIndex]);
      for (const label of labels) {
        const match = normalizedLine.match(new RegExp(`^${escapeRegExp(label)}\\s*(?::|-)?\\s*([\\d,]+)(?:\\s*tokens?)?\\b`, "i"));
        if (match) {
          return Number.parseInt(match[1].replace(/,/g, ""), 10);
        }

        const labelOnlyMatch = normalizedLine.match(new RegExp(`^${escapeRegExp(label)}$`, "i"));
        if (labelOnlyMatch) {
          const nextValue = readTokenValueAfterLabel(lines, lineIndex);
          if (nextValue != null) {
            return nextValue;
          }
        }
      }
    }

    return null;
  }

  function readTokenValueAfterLabel(lines, labelLineIndex) {
    const searchEnd = Math.min(lines.length, labelLineIndex + 4);

    for (let valueLineIndex = labelLineIndex + 1; valueLineIndex < searchEnd; valueLineIndex += 1) {
      const normalizedLine = normalizeTokenLine(lines[valueLineIndex]);
      if (looksLikeTokenLabel(normalizedLine)) {
        return null;
      }

      const match = normalizedLine.match(/^([0-9][\d,]*)(?:\s*tokens?)?\b/i);
      if (match) {
        return Number.parseInt(match[1].replace(/,/g, ""), 10);
      }
    }

    return null;
  }

  function looksLikeTokenLabel(line) {
    return Object.values(TOKEN_LABELS)
      .flat()
      .some((label) => new RegExp(`^${escapeRegExp(label)}$`, "i").test(line));
  }

  function normalizeTokenLine(line) {
    return line
      .replace(/["']/g, "")
      .replace(/_/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/^[\s•·*-]+/, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizeModelName(rawModel) {
    return String(rawModel)
      .trim()
      .replace(/^models\//i, "")
      .toLowerCase();
  }

  function findPricing(modelKey) {
    if (PRICING[modelKey]) {
      return { modelKey, rates: PRICING[modelKey] };
    }

    const knownModel = Object.keys(PRICING)
      .sort((left, right) => right.length - left.length)
      .find((candidate) => modelKey === candidate || modelKey.startsWith(`${candidate}-`));

    return knownModel ? { modelKey: knownModel, rates: PRICING[knownModel] } : null;
  }

  function resolveRates(ratesByTier, inputTokens) {
    const tierName = ratesByTier[CONFIG.pricingTier] ? CONFIG.pricingTier : "standard";
    const tierRates = ratesByTier[tierName];
    const rate = tierRates.find((candidate) => inputTokens <= candidate.maxPromptTokens) || tierRates[tierRates.length - 1];
    return { ...rate, tierName };
  }

  function calculateCost(usage, ratesByTier) {
    const rates = resolveRates(ratesByTier, usage.inputTokens);
    const cacheHitTokens = Math.min(usage.cachedTokens || 0, usage.inputTokens);
    const cacheHitRatio = usage.inputTokens > 0 ? cacheHitTokens / usage.inputTokens : 0;
    const cachedTokens = rates.cache == null ? 0 : cacheHitTokens;
    const uncachedInputTokens = usage.inputTokens - cachedTokens;
    const inputCost = (uncachedInputTokens / 1000000) * rates.input;
    const cacheCost = (cachedTokens / 1000000) * (rates.cache || 0);
    const outputCost = (usage.outputTokens / 1000000) * rates.output;

    return {
      inputCost,
      cacheCost,
      outputCost,
      totalCost: inputCost + cacheCost + outputCost,
      inputRate: rates.input,
      cacheRate: rates.cache,
      outputRate: rates.output,
      tierName: rates.tierName,
      cachedTokens,
      cacheHitTokens,
      cacheHitRatio,
      inputTokens: usage.inputTokens,
      uncachedInputTokens,
      outputTokens: usage.outputTokens,
    };
  }

  function buildCostRow(usage, matchedModelKey, ratesByTier) {
    const cost = calculateCost(usage, ratesByTier);
    const row = createRowElement();
    const main = document.createElement("div");
    const detail = document.createElement("div");

    main.className = "gais-log-cost-estimate__main";
    detail.className = "gais-log-cost-estimate__detail";
    main.textContent = `Estimated cost: ${formatUsd(cost.totalCost)}`;
    buildCostDetails(cost).forEach((line) => detail.append(line));

    const pricingNote = ratesByTier.note ? ` ${ratesByTier.note}` : "";
    row.title = `${matchedModelKey}. ${CONFIG.sourceLabel}.${pricingNote} Free tier, explicit cache storage, audio tokens, generated images, grounding, and taxes may differ.`;
    row.append(main, detail);
    return row;
  }

  function buildCostDetails(cost) {
    const lines = [];

    if (cost.cachedTokens > 0) {
      lines.push(createDetailLine(
        "Uncached input",
        `${formatNumber(cost.uncachedInputTokens)} x ${formatRate(cost.inputRate)}/1M`,
        formatUsd(cost.inputCost),
      ));
      lines.push(createDetailLine(
        "Cache read",
        `${formatNumber(cost.cachedTokens)} x ${formatRate(cost.cacheRate)}/1M`,
        formatUsd(cost.cacheCost),
      ));
    } else {
      lines.push(createDetailLine(
        "Input",
        `${formatNumber(cost.uncachedInputTokens)} x ${formatRate(cost.inputRate)}/1M`,
        formatUsd(cost.inputCost),
      ));
    }

    lines.push(createDetailLine(
      "Output",
      `${formatNumber(cost.outputTokens)} x ${formatRate(cost.outputRate)}/1M`,
      formatUsd(cost.outputCost),
    ));
    lines.push(createDetailLine(
      "Cache hit ratio",
      `${formatNumber(cost.cacheHitTokens)} / ${formatNumber(cost.inputTokens)}`,
      formatPercent(cost.cacheHitRatio),
      "Cached content tokens / input tokens",
    ));
    lines.push(createNoteLine(`${cost.tierName} paid tier; explicit cache storage/hour not included`));

    return lines;
  }

  function createDetailLine(label, formula, amount, title = "") {
    const line = document.createElement("div");
    const labelNode = document.createElement("span");
    const amountNode = document.createElement("span");

    line.className = "gais-log-cost-estimate__line";
    if (title) {
      line.title = title;
    }
    labelNode.textContent = `${label}: ${formula}`;
    amountNode.textContent = amount;
    line.append(labelNode, amountNode);

    return line;
  }

  function createNoteLine(text) {
    const line = document.createElement("div");
    line.className = "gais-log-cost-estimate__note";
    line.textContent = text;
    return line;
  }

  function buildUnknownModelRow(usage, modelKey) {
    const row = createRowElement();
    const main = document.createElement("div");
    const detail = document.createElement("div");

    main.className = "gais-log-cost-estimate__main";
    detail.className = "gais-log-cost-estimate__note";
    main.textContent = "Estimated cost: pricing rule missing";
    detail.textContent = `${modelKey}; input ${formatNumber(usage.inputTokens)}; output ${formatNumber(usage.outputTokens)}`;
    detail.style.color = "#fbbc04";
    row.append(main, detail);
    return row;
  }

  function createRowElement() {
    const parent = findTokenAnchor()?.parentElement;
    const row = document.createElement(parent && /^(UL|OL)$/i.test(parent.tagName) ? "li" : "div");

    row.className = "gais-log-cost-estimate";
    row.style.display = "flex";
    row.style.flexDirection = "column";
    row.style.gap = "2px";
    row.style.marginTop = "4px";
    row.style.padding = "6px 0";
    row.style.fontSize = "12px";
    row.style.lineHeight = "1.45";
    row.style.color = "var(--mat-sys-on-surface, #e8eaed)";

    return row;
  }

  function injectStyles() {
    if (document.getElementById("gais-log-cost-estimate-style")) {
      return;
    }

    const style = document.createElement("style");
    style.id = "gais-log-cost-estimate-style";
    style.textContent = `
      .gais-log-cost-estimate__main {
        font-weight: 500;
      }

      .gais-log-cost-estimate__detail {
        display: flex;
        flex-direction: column;
        gap: 1px;
        color: var(--mat-sys-on-surface-variant, #bdc1c6);
      }

      .gais-log-cost-estimate__line {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        column-gap: 8px;
      }

      .gais-log-cost-estimate__line span:first-child {
        min-width: 0;
        overflow-wrap: anywhere;
      }

      .gais-log-cost-estimate__line span:last-child {
        white-space: nowrap;
        color: var(--mat-sys-on-surface, #e8eaed);
      }

      .gais-log-cost-estimate__note {
        color: var(--mat-sys-on-surface-variant, #bdc1c6);
        overflow-wrap: anywhere;
      }
    `;
    document.head.append(style);
  }

  function findTokenAnchor() {
    const labelPattern = Object.values(TOKEN_LABELS)
      .flat()
      .sort((left, right) => right.length - left.length)
      .map(escapeRegExp)
      .join("|");
    const textNode = findLastTextNode(new RegExp(`^[\\s•·*-]*(?:${labelPattern})\\s*(?::|-)?\\s*[\\d,]+(?:\\s*tokens?)?\\b`, "i"))
      || findLastTextNode(new RegExp(`^[\\s•·*-]*(?:${labelPattern})\\s*$`, "i"));
    if (!textNode?.parentElement) {
      return null;
    }

    return (
      textNode.parentElement.closest("li,[role='listitem'],.mat-mdc-list-item") ||
      textNode.parentElement
    );
  }

  function findLastTextNode(pattern) {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          const text = node.nodeValue.replace(/\s+/g, " ").trim();
          if (!pattern.test(text) || !node.parentElement || !isVisible(node.parentElement)) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        },
      },
    );

    let match = null;
    let node = walker.nextNode();
    while (node) {
      match = node;
      node = walker.nextNode();
    }

    return match;
  }

  function isVisible(element) {
    const style = window.getComputedStyle(element);
    return style.display !== "none" && style.visibility !== "hidden" && element.getClientRects().length > 0;
  }

  function insertAfter(anchor, row) {
    anchor.parentNode.insertBefore(row, anchor.nextSibling);
  }

  function removeExistingRows() {
    document.querySelectorAll(".gais-log-cost-estimate").forEach((row) => row.remove());
  }

  function formatUsd(value) {
    const digits = value < 0.01 ? 6 : value < 1 ? 5 : 4;
    return `$${value.toFixed(digits)}`;
  }

  function formatRate(rate) {
    return `$${Number.isInteger(rate) ? rate.toFixed(0) : rate.toString()}`;
  }

  function formatPercent(value) {
    return `${(value * 100).toFixed(2)}%`;
  }

  function formatNumber(value) {
    return new Intl.NumberFormat("en-US").format(value);
  }

  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  const observer = new MutationObserver(scheduleScan);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  window.GoogleAIStudioLogCost = {
    config: CONFIG,
    pricing: PRICING,
    debug: () => ({
      href: location.href,
      supportedPageUrl: isSupportedPageUrl(),
      usageHints: hasUsageHints(),
      usage: readUsageFromPage(),
      tokenAnchorFound: Boolean(findTokenAnchor()),
    }),
    rescan: renderEstimate,
  };

  installRouteChangeHooks();
  injectStyles();
  scheduleScan();
})();
