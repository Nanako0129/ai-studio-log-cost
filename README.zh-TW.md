# Google AI Studio Log 費用估算

在 Google AI Studio 的 log 與 preview 頁面中，於 token 用量區塊顯示 Gemini API 付費層級的費用估算。

[English](README.md)

## 功能

- 在每一筆 log 顯示預估費用。
- 將費用拆分為未快取 input、cache read、output 三項成本。
- 顯示 cache 命中比例。
- 可偵測展開後的 token 明細，例如 `Cached content tokens`。
- token 或 model 資訊沒有變化時不會反覆刷新 DOM，不會中斷文字反白選取。
- 作用於 `https://aistudio.google.com/` 底下的 log 與 preview 頁面。

## 隱私

這個腳本只在你的瀏覽器本機執行。它不會呼叫任何外部 API、上傳頁面內容、收集分析資料、儲存你的 prompt、response、logs、project ID 或 API key，也不會把任何資料傳給腳本作者或第三方。

## 價格說明

估算依據頁面上可見的 token 數量，以及腳本內建的 Gemini API 付費層級價格表（[來源](https://ai.google.dev/gemini-api/docs/pricing) ）。價格表最後確認日期：2026-10-01。

實際帳單可能因 free tier 用量、explicit cache storage 每小時費用、audio tokens、生成圖片的 token 或逐張計價、grounding/search 費用、稅金、折扣、地區或帳戶專屬計費，以及 Google 日後調價而不同。

遇到價格表裡沒有的 model，腳本會顯示找不到價格規則，不會自行猜測。

## 更新紀錄

| 版本 | 日期 | 內容 |
|---|---|---|
| 0.3.6 | 2026-10-01 | 新增 Gemini 4 Argon（官方公布的推廣價，Standard 方案；官方定價頁尚未列出 model ID）。更新價格確認日期。 |
| 0.3.5 | 2026-09-03 | 新增 Gemini 3.8 Flash（Standard、Batch、Flex、Priority；優惠價至 2026-12-31）。 |
| 0.3.4 | 2026-08-14 | 新增 Gemini 3.7 Flash（Standard、Batch、Flex、Priority；優惠價至 2026-12-31）。 |
| 0.3.3 | 2026-07-27 | 縮短 cache 命中比例的顯示，避免在窄面板換行。 |
| 0.3.2 | 2026-07-27 | 新增 cache 命中比例顯示。 |
| 0.3.1 | 2026-07-22 | 新增 Gemini 3.6 Flash 官方價格。 |
| 0.3.0 | 2026-06-18 | 支援 AI Studio preview 頁面。 |
| 0.2.3 | 2026-05-19 | Gemini 3.5 Flash 改用官方價格，含 Batch、Flex、Priority。 |
| 0.2.2 | 2026-05-19 | 暫定 Gemini 3.5 Flash 價格；修正層級 fallback 顯示。 |
| 0.2.1 | 2026-04-28 | `@match` 擴大到所有 AI Studio 頁面。 |
| 0.2.0 | 2026-04-28 | Greasy Fork 首次發佈。 |

## 免責聲明

非官方輔助腳本，與 Google、Google AI Studio 或 Gemini API 團隊沒有關聯。MIT 授權。
