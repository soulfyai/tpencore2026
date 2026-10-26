# 預覽版本與封存規則

目前正式網站仍為 v2.0.18；預覽採獨立版本號，不以快取參數作為版本依據。

| 預覽版本 | 原始提交／Git tag | 說明 |
| --- | --- | --- |
| **preview-v0.4.0** | `de9bab2646cb3537c952f5e88ebe14734b7f2605` / `preview-v0.4.0` | 大台北雙市、兩座島嶼配置、套入指定的細緻騎樓街景；正式介面與 Logo 比例保持不變。此版本為行政區配置研究之前的回溯基準。 |

- [封存預覽入口](https://soulfyai.github.io/tpencore2026/previews/preview-v0.4.0/)
- [封存街景入口](https://soulfyai.github.io/tpencore2026/previews/preview-v0.4.0/?view=street)
- [下載完整封存包](https://soulfyai.github.io/tpencore2026/previews/preview-v0.4.0.zip)
- [版本與檔案校驗資料](https://soulfyai.github.io/tpencore2026/previews/preview-v0.4.0/preview-version.json)

封存包固定保存這次公開網頁的完整執行資源，包含相依 JS、JSON、圖片及兩市政策內容，不會回頭引用未來變動的根目錄城市模組。Three.js 使用既有固定 0.160.0 CDN；音樂、公開天氣 API 及字型服務仍為原來的外部服務。封存頁僅增加文件標題／版本 meta，目錄 index 指向同一封存預覽；不更動場景、介面、Logo 或尺寸。

`archives/preview-v0.4.0.zip` 及同名 JSON 的 SHA-256 受 Git 保存；package_site 先校驗整包與逐檔雜湊，再原樣解開至版本目錄。往後只新增封存版本，不覆寫舊 ZIP、不移動既有 tag。最新 greater-taipei.html 是可變入口，不能用其 `?v=` 參數代替回溯版本。

回看原始程式請使用 tag；需要重建時另開 worktree，避免改壞目前工作目錄：

```sh
git worktree add ../tpencore-preview-v0.4.0 preview-v0.4.0
cd ../tpencore-preview-v0.4.0
python3 tools/package_site.py
```

## 行政區配置研究 01（僅示意圖）

[概念圖](https://soulfyai.github.io/tpencore2026/mockups/greater-taipei-admin-layout-01.png) / [真實座標底圖](https://soulfyai.github.io/tpencore2026/mockups/greater-taipei-administrative-reference.png)

以現有 data/geo.json 的行政區經緯度邊界，在同一投影及比例尺呈現兩市關係；不是擷取或重製 Google Maps。臺北在新北環繞的內側：板橋西南、淡水西北、汐止東側、新店南側。未參與的周邊陸地淡化處理、不標示其他縣市名稱，不把行政區界線當作海岸。

左側為行政區關係示意，右側為生成的美術構想。河線在底圖只作位置示意；建物、橋梁及公園在生成圖中皆為風格與配置概念，並非實際建築或設施位置。下一步若獲確認，必須以原始行政區座標建立共同世界、正確挖出新北所包圍的臺北內環，不能拿生成圖描成新的任意島形。

尚未實作這個地理配置；現行預覽與正式網站均保持原樣。之後的地理實驗必須使用獨立入口與新版本，不修改 preview-v0.4.0 的封存檔。
