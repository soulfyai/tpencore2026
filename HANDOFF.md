# Handoff：北北基桃政策城市（tpencore2026）

> 交接日期：2026-10-23　來源：claude.ai 雲端 session（Cowork）→ Claude Code
> 使用者：KunWei（James Lin），回覆一律用**繁體中文**，語氣直接、技術對等。

## 0. 移轉快照（2026-10-24 00:00 暫停・Claude Code → Codex）

### 0.0 Codex 接手更新（2026-10-24）

網站部署接續：已新增 GitHub Actions Pages 工作流程及 `tools/package_site.py`，推送目前開發分支後自動發布；首頁為 3D，另有 2d.html 與 version.json。Pages 是否啟用與首次正式部署結果尚待線上確認；環境目前阻擋 api.github.com、soulfyai.github.io，已儲存兩個網域的設定草稿，需要儲存／發布套用後才能由此環境管理及驗證。操作見 README。

以下 0.1–0.6 保留移轉時的歷史背景；最新工作以本節及 Git log 為準。

遠端同步更新：原先 GitHub 回覆 403 的寫入權限已由使用者開放。重試時已整合遠端新增的網頁組合併提交，保留雙方歷史；以 claude/modest-newton-t9y5uj 最新提交為準。尚未更新線上 Artifact。

- 網頁組已合併；手機置底聲明遮住地標按鈕的問題已修正。四市識別依使用者最新指定：台北藍、新北黃、基隆粉紅、桃園紅，適用地圖、場景、招牌、城市切換與候選人色點。
- 美術 WIP 已整合：成組沙灘設施與留白、平滑岸線、白色／玻璃藍建築、屋頂／雨庇／太陽能板／空中綠化、冷色 LED、方形政策底盤與雙發客機。
- 關渡／淡江雙橋改至台北面向新北的正面；取消縮小間距的 fallback。幾何檢查：六座橋不交叉，具名橋過水，兩岸最小間距約 15.80，門檻約 15.74。
- 人物已完成十種 chibi 角色：上班族、學童、長者、家長／嬰兒車、工人、登山客、撐傘行人、氣球小孩、跑者、購物者。採低飽和衣服、依主題分布、共用 instanced 配件批次；車／船／飛機動畫段落保持原樣。
- 效能：手機像素倍率上限 1.25、停用陰影；遠景隱藏人物手臂、頭髮與配件，近景恢復，省下配件矩陣更新；重用人物臨時向量。手機實機 FPS 仍待量測，不能由雲端軟體渲染推論。
- 手機全景依實際長寬比取景，城市招牌限制在畫面內並防止重疊；保持台北居中、全景為最遠縮放。
- 2D 切至跨市協作會自動顯示連線。新北候選人卡顯示參考政績數；目前來源 achievements 為空，因此是 0，未新增或推測政績資料。
- 已驗證建置、桌機日／夜與手機完整場景；11:00 路燈關、19:00 路燈開。`panorama()` 不會清除 ENV.forced；先前截圖未執行完整畫格，造成霧距／場景狀態未更新。
- `tools/shot.py` 現在自帶 UTF-8 HTTP 伺服器，支援 CHROMIUM_EXECUTABLE；以 CITY3D.snapshot() 完成完整畫格後截圖。`--check [mobile]` 執行 tools/check_scene.js，驗證角色／批次／動作／橋梁幾何與手機招牌。用法見 README。
- Artifact 發布與 weather/now 排程仍由 Claude 處理；本輪未更新線上 Artifact。公開部署目的地、錯誤回報表單與新增資料查核不在這次 WIP 的既有決定中，仍待使用者定案。

> 本節是暫停點交接。線上版、主分支、三組未完成工作與接手步驟都在這裡；讀完本節再讀其餘章節的長期背景。

### 0.1 現況
- **線上**：claude.ai Artifact（私人）<https://claude.ai/artifact/Ssboakje3hi8UHQp4nHQQA>，Version 27＝主分支 `claude/modest-newton-t9y5uj` @ `44b3f85` 的 `index3d.html`。
- **主分支 `claude/modest-newton-t9y5uj`（已推送）今日累計上線**：死檔清理（map3d.js、3d/lots.js 已刪）；「台北安可」品牌（霓虹招牌等寬、2D/3D 同名、城市・候選人 22px）；「政策島」→「政策區塊」；資料說明隱藏「尚待補齊」；一批無障礙／對比／觸控修正；3D 大改（六座跨島橋含具名關渡/淡江、65 艘船＋漁船隊、3 架飛機、星空、預設四島全景台北居中、標籤距離門檻＋政績去前綴、地標標籤開關、聚光燈、基隆標籤除重疊）；天氣快照更新機制。
- **天氣**：頁面優先讀 Artifact db `weather/now`，退回內建快照。每小時排程「政策市天氣每小時更新（本session）」（每小時 :22）綁在原 Claude session 上自動更新 db；要停用去 claude.ai 的排程介面關。

### 0.2 進行中的 WIP（被暫停，未驗證）
WIP 以 commit 保存。若 remote 上存在 `wip/art-upgrade`、`wip/web-brandcard` 分支即為同內容；否則只在原容器的 `.claude/worktrees/` 裡（容器回收即消失）。

1. **美術組** `06b9d78`（改 core/decor/env/models/ships/world，+380 行，**未完成**）——任務六軸：
   A. 沙灘乾淨化：傘/設施成組 cluster＋留白、低飽和 2–3 色、岸線平滑，告別雜亂
   B. 建築細緻化：立面分段、玻璃帷幕、屋頂結構（女兒牆/機電層）、入口雨庇；精緻低多邊形；必用 instanced（core.js part/buildBatches）
   C. 科技未來感：LED 燈帶（夜發光）、太陽能板、空中綠化、純白＋玻璃藍基調；政黨色只做識別
   D. 飛機真實化（3d/ships.js plane）：圓柱機身收尖、後掠翼上反角、翼下雙發動機艙、水平+垂直尾翼、窗帶；白塗裝+單色尾翼（避開真實航空公司）
   E. 政策區塊 heart-island 化：**維持方形**（使用者明令不用六邊形）、乾淨平整底盤＋單色細框＋留白、暖色基底
   F. 關渡/淡江雙橋改位：放棄真實經緯度，移到台北島**面對新北島的正面**，兩橋間距 ≥ 該側環道 1/3；維持過水/不交叉/淨空與紅拱/白塔造型
   最後卡點：驗證截圖出現夜景——`MAP3D.panorama()` 疑似重置 `ENV.forced`，截圖前的強制 11:00 失效，需先查這個再跑圖。
2. **網頁組** `565ce2a`（改 ui.js/page.css/template.html，**程式自評完成、截圖驗證未跑**）——任務五項：
   ① 品牌卡縮放式：霓虹標題常駐 tab（預設收合），點開彈出資訊視窗（城市・候選人、統計、四市切換），aria-expanded＋鍵盤
   ② 霓虹小標改「一起打造你我的北北基桃」；刪 lede「開始探索屬於你我的城市」；<title> 不變
   ③ 「獨立整理…」聲明移畫面最下方置中小字——**紅線：任何狀態不可被遮擋**，2D/3D、桌機/手機都要驗
   ④ 右下角天氣懸浮框移除，.wx 節點移植進彈出視窗（不可改 main.js 寫入邏輯）
   ⑤ 左上角四市按鈕統一台北藍（僅限這些按鈕；場景城市色不變）
3. **人物組：未動工**（基礎乾淨）。任務：3d/people.js 行人改 chibi 漫畫比例（頭:身≈1:1.5–2）；8–10 種身分（上班族咖啡、學童小黃帽、長者拐杖、家長嬰兒車、工地安全帽、登山客背包、撐傘、小孩氣球…）靠輪廓與色塊遠觀可辨；低飽和協調色票（不用政黨色做衣服）；場景分佈合理；沿用 instanced；參考 https://puma.taipei/heart-island 的角色系統。只准改 people.js（車/船/飛機動畫邏輯保留）。

### 0.3 未指派的待辦
手機效能 LOD；淺色模式政黨色上白字對比不足（建議選中態背景 color-mix 加深 20%，待拍板）；2D 跨市協作分頁切換時自動開協作線；新北候選人卡補「N 項政績（參考）」；公開部署與錯誤回報表單。

### 0.4 接手工作流程（Codex）
- 改 `3d/*.js`、`template.html`、`data/` 後跑 `python3 build.py`：必須 `no problems`，產出 index.html/index3d.html 一起 commit。
- 視覺驗證 `tools/shot.py`（用法見檔頭）。本容器眉角：playwright 瀏覽器版本不合時做符號連結（勿 `playwright install`）；shot.py 的 JS 參數多敘述要包 IIFE；殼層轉義單引號用 `\"`；軟體渲染每張 1–3 分鐘。
- 網路：容器直連 `api.open-meteo.com` 被環境政策擋。放行：session 標題列雲端環境選單 → Edit → Network access → Allowed domains 加該網域。
- 開發與推送一律在 `claude/modest-newton-t9y5uj`。

### 0.5 只有 Claude 能做的事（Codex 邊界）
- **Artifact 發佈**：更新同一條線上連結只能用 Claude 的 Artifact 工具。Codex 流程＝commit+push 後，回到任一 Claude session 貼該 URL 請它以最新 `index3d.html` 重新發佈。
- **Artifact 天氣 db**（`weather/now`）讀寫同理（Claude 的 ArtifactData）。
- 每小時天氣排程綁定原 Claude session；Codex 不需也無法接手，放著即可或從 claude.ai 排程介面停用。

### 0.6 今日新增設計定案（加入「不要回頭改」清單）
標題「台北安可」＋小標「一起打造你我的北北基桃」；城市識別與左上角四市按鈕採台北藍、新北黃、基隆粉紅、桃園紅（依使用者最新指定）；政策區塊維持方形；美術基準＝heart-island 的乾淨舒服＋SimCity 精緻＋科技未來感（不要開發中落後感）；預設視角四島全貌、台北居中、不可拉更遠；地標標籤預設隱藏（左下開關）；全景無任何泡泡（霓虹招牌除外）；3D 泡泡不出現「政績・」字樣；船隻放大不按真實比例；飛機用真實客機外型。

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
