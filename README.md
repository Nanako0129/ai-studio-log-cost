# Google AI Studio Log Cost

Adds a Gemini API paid-tier cost estimate to Google AI Studio log and preview pages, shown inside the token usage section.

[繁體中文說明](README.zh-TW.md)

## Features

- Shows an estimated Gemini API paid-tier cost for each log entry.
- Breaks the estimate into uncached input cost, cache read cost, and output cost.
- Shows the cache hit ratio.
- Detects expanded token details such as `Cached content tokens`.
- Avoids unnecessary DOM refreshes when the token/model data has not changed, so text selection is not interrupted.
- Works on log and preview pages under `https://aistudio.google.com/`.

## Privacy

This script runs locally in your browser. It does not call any external API, upload page content, collect analytics, store your prompts, responses, logs, project IDs, or API keys, or transmit any data to the script author or third parties.

## Pricing notes

The estimate is based on the token counts visible on the page and a built-in Gemini API paid-tier pricing table ([source](https://ai.google.dev/gemini-api/docs/pricing)). Pricing table last checked: 2026-10-01.

Actual billing may differ because of free tier usage, explicit cache storage charges per hour, audio tokens, generated image tokens or per-image pricing, grounding/search charges, taxes, discounts, regional or account-specific billing, and future Google pricing changes.

If a model is missing, the script shows that no pricing rule is available instead of guessing.

## Changelog

| Version | Date | Changes |
|---|---|---|
| 0.3.6 | 2026-10-01 | Added Gemini 4 Argon (announced introductory Standard rates; model ID not yet on the official pricing page). Updated pricing check date. |
| 0.3.5 | 2026-09-03 | Added Gemini 3.8 Flash (Standard, Batch, Flex, Priority; promotional rates through 2026-12-31). |
| 0.3.4 | 2026-08-14 | Added Gemini 3.7 Flash (Standard, Batch, Flex, Priority; promotional rates through 2026-12-31). |
| 0.3.3 | 2026-07-27 | Shortened the cache hit ratio display to avoid wrapping in narrow panels. |
| 0.3.2 | 2026-07-27 | Added cache hit ratio display. |
| 0.3.1 | 2026-07-22 | Added official Gemini 3.6 Flash pricing. |
| 0.3.0 | 2026-06-18 | Added support for AI Studio preview pages. |
| 0.2.3 | 2026-05-19 | Official Gemini 3.5 Flash pricing, including Batch, Flex, and Priority. |
| 0.2.2 | 2026-05-19 | Provisional Gemini 3.5 Flash pricing; fixed tier fallback display. |
| 0.2.1 | 2026-04-28 | Broadened `@match` to all AI Studio pages. |
| 0.2.0 | 2026-04-28 | Initial Greasy Fork release. |

## Development

Prices live in the `PRICING` table in `google-ai-studio-log-cost.user.js`. Greasy Fork syncs the script and this README from `main` on every push, so bump `@version` and add a changelog row with each change.

## Disclaimer

Unofficial helper script, not affiliated with Google, Google AI Studio, or the Gemini API team. MIT licensed.
