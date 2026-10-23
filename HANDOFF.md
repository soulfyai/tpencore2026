# Handoff：北北基桃政策城市（tpencore2026）

> 交接日期：2026-10-23　來源：claude.ai 雲端 session（Cowork）→ Claude Code
> 使用者：KunWei（James Lin），回覆一律用**繁體中文**，語氣直接、技術對等。

## 1. 專案是什麼

獨立、非官方的選舉政見網站，把國民黨北北基桃四位市長參選人的政見與任內政績，畫成 **SimCity BuildIt 風格的 3D 城市島嶼**。版面、內容架構參考 <https://puma.taipei/heart-island>。

| 城市 | 參選人 | 政策區（主題） | 項目 |
|---|---|---|---|
| 台北 | 蔣萬安 | 17 | 62（35 政見＋27 政績） |
| 新北 | 李四川 | 9 | 56 |
| 基隆 | 謝國樑 | 15 | 51 |
| 桃園 | 張善政 | 14 | 42 |

**不可違反的規則**
- 頁面上永遠保留「獨立整理，非任何候選人或政黨官方網站」。
- 只用政黨色，**不放黨徽、候選人照片、官方 logo**；立場中立，不加評論。
- 地標只畫原創低多邊形造型，不複製官方設計或吉祥物。
- 每項內容都要能追溯到 `data/` 裡的來源連結。

**目前上線位置**：claude.ai Artifact（私人）<https://claude.ai/artifact/Ssboakje3hi8UHQp4nHQQA>。要更新同一個連結，需在 claude.ai 用 Artifact 工具以此 URL 重新發佈；若改部署到 GitHub Pages / Cloudflare Pages / 使用者的 Synology NAS，`index3d.html` 是單一自足檔案，直接放上去即可（Three.js 走 jsDelivr CDN）。

## 2. 建置與檢查

```bash
python3 build.py          # 合併 data/ + template.html + 3d/*.js → index.html（2D）與 index3d.html（3D）
```

- 3D 模組依序串接成**同一個 module script**（共用頂層 const），順序寫在 `build.py`：
  `core, world, env, models, models2, models3, landmarks, ships, decor, people, coaster, main, ui`。
  `3d/page.css` 會被插在 3D CSS 最前面。
- 舊檔 `map3d.js`（根目錄）與 `3d/lots.js` 未被建置使用，已於 2026-10-23 刪除；`3d/` 內現存檔案全部都有用到。
- 視覺檢查：`tools/shot.py`（Playwright + swiftshader，需先 `npm i --no-save three@0.160.0`）。
  場景大，軟體渲染單張截圖約 1–3 分鐘，請給長 timeout，放背景跑。
  頁面暴露的除錯介面：`window.MAP3D`（panorama / enterCity / focusTheme / focusItem / flyTo）、
  `window.CITY3D`（WORLD, islands, camera, controls, scene, ENV）、`window.LANDMARKS3D`、`window.COASTER`、`window.LAMP_POOLS`。
  夜景：`CITY3D.ENV.forced = {minute: 1140, w:{code:1,cloud:20,wind:10,temp:27}}; CITY3D.ENV.apply()`。

## 3. 架構（3d/）

| 檔案 | 內容 |
|---|---|
| `core.js` | renderer / camera / OrbitControls（地圖式手勢：單指/左鍵平移、雙指縮放旋轉、右鍵旋轉）、常數 `TOP`、`WATER_Y`、`LIVE_CITIES`、instanced 零件系統 `part()` / `buildBatches()`、facade 貼圖材質（窗戶夜間發光）、草皮材質 `turf` |
| `world.js` | 真實行政區輪廓（`data/geo.json`，內政部開放資料）投影成島：`CITY_SCALE`、四島沿方位角拉開距離；k-means + Voronoi 切政策區；街道圖與 Dijkstra；海岸（沙灘/港口/礁石、轉角沙錐、口袋海灣填沙）、淺水色帶（stencil 避免疊色）；`WORLD.geo(city, lon, lat)` 經緯度→世界座標 |
| `env.js` | 天空、海、雲、雨；依台北時間＋ Open-Meteo 天氣；**路燈 17:00–06:00 開**（`ENV.lampsOn`） |
| `models*.js` | 政策項目→建築：`MODELS.kindFor(item, theme)`（名稱規則＋主題對應），學校/醫院/捷運…等造型 |
| `landmarks.js` | `LANDMARK_BUILD[id](p)` 地標造型，回傳高度 |
| `ships.js` | `SHIPS.make(type)`：軍艦、海巡、貨櫃、油輪、渡輪、遊艇… |
| `decor.js` | 填城市：政策園區（草皮底座＋城市色邊＋四角聚光燈）、地標擺放、一般建築（**非地標不超過約 10 樓**）、樹叢、路燈、環島高架、港口、沙灘設施（遮陽傘、木棧道、椰子樹、販賣亭、遊樂碼頭＋摩天輪、遊艇碼頭）、**跨島斜張橋與渡輪航線** |
| `people.js` | 行人（白衣為主）、車流（含高架與大橋）、路燈光暈與聚光燈光束、船隻與渡輪 |
| `coaster.js` | 每座島環島高架外側的雲霄飛車（3 個垂直迴圈、橋頭下潛） |
| `main.js` | 標籤（城市霓虹招牌、地標標籤、政策區標籤）、單一清單泡泡 callout、相機飛行、平移邊界限制、天氣列 |
| `ui.js` | 外殼：品牌區＋**四市切換按鈕**、全景/清單/時間模式、開場說明、城市導覽、時間軸、抽屜；隨目前城市切換 |
| `page.css` | 外殼樣式、霓虹招牌、callout、手機版 |

**地標擺放**（`decor.js` 的 `LM`、`GEO_LL`、`FP`）：每個地標用真實經緯度找最近的合法位置——整個底座在陸地上、不壓政策園區、與其他地標保持間距；放不下時先外移，最多縮到 80%。`FP` 是各模型的底座半徑（模型單位）。自然景觀第 5 欄為 `1`（綠色標籤、可與城市地標同區）。

## 4. 使用者已確認的設計決定（不要回頭改）

- 第一層是四座城市島；政策主題＝島上的「政策區」，每區一個園區，格子上放對應建築（教育→學校）。
- 每個政策區只有**一個泡泡**，含標題與全部項目，不要數字小泡泡、不要底部清單。
- SimCity BuildIt 風：貼圖材質、沙灘與港口接海、環島高架、雲霄飛車、往來船隻。
- 地標要明顯；一般建築壓低、空地補綠。
- 城市名稱是霓虹招牌，手機上也要大。
- 「現在的設計是好的，不要大幅更動，採優化」——之後的修改以微調為主。

## 5. 已知問題 / 待辦

- **手機效能**：四島全開後物件量約為原本 4 倍，尚未在實機量測。可考慮遠方城市降細節（LOD）、關閉陰影、減少 tube 段數。
- **基隆地標偏擠**：真實位置都在港邊，「和平島」與「大觀音」標籤仍略重疊。
- **桃園機場**縮到約一半尺寸；台北市中心地標（龍山寺、西門紅樓、國父紀念館、大安森林公園）較小。
- 政策區聚光燈在空拍角度不夠突出，可調暗一般路燈或加亮聚光燈。
- 即時天氣：Artifact 版從 artifact db `weather/now` 讀取，每小時更新排程當時因權限未建立，現用固定快照。
- 資料缺口：四人都沒有官方政見白皮書，內容來自媒體報導；部分政績領域未查完（台北產業/工務、桃園長照/運動中心）。
- 公開部署與「回報錯誤／補充來源」表單尚未決定。

## 6. 資料（data/）

- `taipei.json` / `newtaipei.json` / `keelung.json` / `taoyuan.json`：政見主題與項目（含來源、依據等級、phase）。
- `records-*.json`：現任市長任內政績（主題 kind = `record`）。
- `flows.json`：15 條跨市協作線。`geo.json`：行政區輪廓。`weather.json`：天氣快照。
- 資料查核日標示在頁面，唯一來源是 `build.py` 開頭的 `CHECKED_AT` 常數（人工重新查核後才更新）。
