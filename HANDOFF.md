# Handoff：北北基桃政策城市（tpencore2026）


> 交接日期：2026-10-23　來源：claude.ai 雲端 session（Cowork）→ Claude Code
> 使用者：KunWei（James Lin），回覆一律用**繁體中文**，語氣直接、技術對等。

## 0. 移轉快照（2026-10-24 02:05 第二次暫停・Claude Code → Codex）

> 第二次交接。上一輪（§0 前版）的工作已全數完成合併；本節為當前唯一有效的快照。

### 0.1 現況
- **第一個階段版本：v1.0.0**。A 白線指引與目前功能作為模型／美術迭代前的基準，詳見 §0.18、CHANGELOG.md 與 VERSION。
- **目前修正版：v2.0.16**。人物改為圓潤小人偶 v3，完成互動遊戲規劃；修正政策標牌藍底與白字對比；政策霓虹標牌改為街區錯落排列；新增社群分享標題／說明／全景預覽圖；修正載入招牌圖層；新增日夜時間顯示模式與藍天白雲載入畫面；新增 2D／3D 互通與 GitHub 資料回報入口、Issue 表單及貢獻指南；全景自動環繞、NAS 自動更新測試已完成。音樂預設啟播、NAS 瀏覽次數計數與自動更新設定包；四市最高建築國旗；桌機全景拉近、移除 body 外距白邊及全景響應式取景；底部標示改為 Designed by TPEncore © 2026；手機三線圖示與七項單欄工具選單；加入飛機與商船往返遠方的示意動線；採用加亮 B 招牌效果作為部署版本；跨市平移跟隨縣市、初次載入預設開使用說明；音樂控制、載入招牌／文案與點地圖關閉視窗；聲明移入使用說明、底部版權／聯絡浮水印；B 招牌改用正式圖像資產以修正 mockup 落差；採用 B 版霓虹天際線品牌招牌；改善全景深度精度與海岸閃爍；政策泡泡完整展開、依內容調整尺寸；依標記圖降低新北市全景標牌高度；資訊面板滑動、載入畫面、3D 世界座標標題與既有功能保留，詳見 §0.19–0.39。
- **最新街廓定案（2026-10-24 台北時間）**：使用者明示「捨棄六邊形，改為四方形」。目前 3D 採等大方形格網，詳見 §0.15；早期六邊形規格僅保留為歷史紀錄。
- **Codex 接手進度（2026-10-23 UTC）**：§0.3 六邊形重構與 §0.4 行人檢查已完成，詳見 §0.7；後續都市規劃、單市天氣與正式發佈以 §0.8 為準。程式以 `claude/modest-newton-t9y5uj` 最新 commit 為準；下列線上 V34 尚未重新發佈。
- **線上**：<https://claude.ai/artifact/Ssboakje3hi8UHQp4nHQQA> Version 34 ＝ 主分支 `claude/modest-newton-t9y5uj` @ `c3a9e99`（已推送，工作樹乾淨，無未合併 WIP）。
- 自上次快照後完成並上線：網頁品牌卡縮放式（霓虹 tab 預設收合、彈出卡含天氣、聲明置底置中、四市鈕統一藍）；3D 美術六軸（精緻沙灘、建築細緻化、未來感 LED、真實客機、乾淨底盤、關渡/淡江雙橋移至兩島正面）；Codex 端角色/四市識別色（台北藍/新北黃/基隆粉紅/桃園紅）/手機取景；G–L 連環修正（去綠暖色基底、中間調對比、夜光收斂、星空常駐、月球、夜光距離 LOD、**天氣與場景完全脫鉤**）；飛機防撞排程；**人物定案「積木人偶 v2」**（圓潤積木輪廓×柔霧質感、11 身分、12 draw call，取代 Codex 版角色）。
- 舊 `wip/art-upgrade`、`wip/web-brandcard` 分支內容已全部合入主分支，可刪。
- 天氣：場景永遠晴朗（唯一視覺驅動＝台北時間日夜）；天氣資料只顯示在品牌卡彈出視窗，Artifact db `weather/now` 由 Claude session 的每小時排程更新中。

### 0.2 今日新增設計定案（不可回頭改）
- 人物＝圓潤小人偶 v3（依使用者新附圖，見 §0.47；取代積木人偶 v2）；天氣不得影響場景視覺；**政策區塊幾何採方形**（使用者最新定案，見 §0.15，取代先前六邊形）；城市要 SimCity 式機能分區與高建築密度、未來感；品牌卡預設收合；「獨立整理」聲明永遠置底可見。

### 0.3 六邊形城市重構規格（歷史紀錄；幾何已由 §0.15 方形取代）
使用者方向：「不是單純去綠，要置入更多建築設計。城市要有未來感、現代科技感。參考 SimCity 的城市規劃——商業區/住宅區/科技工業區等劃分。政策區現在是不規則多邊形，視覺上很沒規劃。」幾何選定六邊形。規格：
1. **六邊形街區**（world.js）：等大正六邊形鋪滿各島現有輪廓內部（海岸、沙灘、環島高架、港口、橋接點不動）。每政策主題＝1 格（內容多時 2–3 相鄰格群組）；島緣畸零地做綠帶/水岸公園。WORLD 對外介面（geo/bridges/ferryRoutes/highways/islands id+c）盡量相容，必要變動同步修 main.js 並記錄。參考 heart-island「等大六邊形拼成城市輪廓」。
2. **機能分區**（decor.js）：主題語意→分區型態，各有專屬建築組合/密度/配色——商業核心（交通樞紐、市政效能→玻璃塔群+LED+廣場）、科技工業（產業/數位/AI→園區廠辦+太陽能+研發樓）、住宅（居住都更→中低層社區+中庭+街角店）、公共設施（教育/衛生/社福/托育→校園醫院+開放空間）、文創觀光（文化觀光/體育→場館市集步行街）、綠能環境（環保/工務水利→淨水+風機+濕地）。政績主題（kind=record）用對應型態的成熟樣貌。
3. **密度與未來感**：每格建築飽滿成街廓；沿用 decor.js B kit 與 models 系列；全走 core.js part/buildBatches instanced，draw call 與現版同量級，QUALITY 降級保留。
4. **不可破壞**：島輪廓與周邊、地標、people.js 介面（LAMP_POOLS 等）、標籤/泡泡互動、政黨色僅識別（六邊形邊框=城市政黨色細線）、聲明、資料來源機制、2D 版（template/build.py 不動）、星月與夜光 LOD、天氣脫鉤。
5. 驗證：build no problems＋五張截圖（日全景/日進城/單格近景/夜全景/夜近景）＋泡泡 focusTheme 正常。

### 0.4 其他待辦
- **tools/check_scene.js 行人段過時**（Codex 已修復，見 §0.7；以下為原問題）：它斷言舊 Codex 角色介面（PEOPLE.meshes/accessories/detailVisible/恰 10 role/LOD 隱藏配件）；現版 brick2 是 7 基本 InstancedMesh＋5 道具池、11 role、配件常駐。請改寫該段以符合現版，其餘（車/船/飛機）斷言保留。頁面與 build.py 本身正常，只有這個測試工具會 fail。
- 近景海色偏深（可調 env.js 水色 smoothstep(16,70,d) 起點外推或調亮 uDeep，一行）；淺色模式政黨色白字對比（方案：選中態背景 color-mix 加深 20%，待拍板）；2D 跨市協作分頁自動開線；新北候選人卡補「N 項政績（參考）」；手機實機效能；公開部署與回報表單。

### 0.5 工作流程（同前，重點重述）
改 `3d/*.js`、`template.html`、`data/` → `python3 build.py`（必須 no problems；index.html 與 index3d.html 一起 commit）。截圖 `tools/shot.py`（playwright；本容器瀏覽器版本不合時做符號連結勿 `playwright install`；JS 多敘述包 IIFE；殼層單引號轉義 `\"`；每張 1–3 分鐘）。開發與推送一律 `claude/modest-newton-t9y5uj`。容器直連 api.open-meteo.com 被網路政策擋（環境設定 Network access 可放行）。

### 0.6 只有 Claude 能做的事（Codex 邊界）
- **Claude Artifact 本身**：原 Claude Artifact 連結的重新發佈受 Claude 工具限制；這不限制獨立網站發佈。**Codex 現在可直接更新 GitHub Pages**，網址與正式部署流程見 §0.8，不必為一般網站更新返回 Claude。
- Artifact 天氣 db 讀寫、每小時天氣排程（綁原 Claude session，放著即可）同理。

### 0.7 Codex 六邊形重構完成快照（2026-10-23 UTC）
- **後續視覺調整**：依使用者指示，政策地圖標題與展開泡泡標題列改為霓虹樣式：深藍底、城市識別色細框／柔光、白色發光文字；四市沿用藍／黃／粉紅／紅。保留項目清單、點選互動與鍵盤焦點，無閃爍動畫。來源 `3d/page.css`，建置後輸出 `index3d.html`；build `no problems`，已檢視桌機藍色日景／黃色夜景、手機粉紅／紅色近景（`out/neon-policy-*.png`）。
- **已完成**：四市同尺寸的 351 格正六邊形，外接半徑約 1.1。55 個政策 ID 不變；依項目數分配 1／2／3 格的連通群組（現有資料使用 1 或 2 格），主題以外的完整格補入機能街廓，島緣碎地做水岸綠帶。商業／科技工業／住宅／公共設施／文創觀光／綠能環境採不同高度、建築組合與屋頂配件；政績街廓用成熟樣貌。
- **相容介面**：`WORLD.geo`、海岸／環島高架／港口／橋接座標、主題 `id`、`ringNode`／`ringPts` 保留。新增 `WORLD.hexCells`／`hexRadius`／`zoneFor`／`buildingCounts`；每個 island 新增 `cells`／`zone`／`hexRadius`，`poly` 是群組的外輪廓，`campus.cx/cz` 是群組中心。`main.js` 已同步泡泡與 focusTheme 取景中心，進城取景改按完整海岸範圍計算。
- **地標保護**：32 個島上地標沿用重構前位置與比例，位置存於 `WORLD.landmarkSites`（六位小數）；政策格配置先避開其足跡，後續補充建築也避開地標。另 2 座海上橋梁地標沿用原生成程式，共 34 個。若日後改城市輪廓，需同步重新檢視這些固定站點。
- **效能與互動**：所有新增建築走 part/buildBatches instancing；幾何批次 23 → 25。補充街廓放 `_static`，不會隨政策選取浮起；近景前方高樓沿用遮擋退讓。people.js、env.js、星月、夜光距離 LOD、天氣脫鉤均未修改；保留積木人偶桌機 578 位／手機 413 位、11 身分、7 基本＋5 道具池。
- **檢查工具已修**：`tools/check_scene.js` 改用現版 `stats`／`list[].parts`／局部矩陣與場景 InstancedMesh 驗證 12 批次，近遠距離配件常駐；船／飛機動態與橋梁斷言保留。另檢查等邊與島內邊界、主題群組連通、全部項目模型、34 地標，以及單格／多格泡泡實際點選。
- **驗證**：`python3 build.py` 輸出 `no problems`；桌機 `tools/shot.py --check` 通過（6 橋、65 船、3 飛機、11 角色）；手機 `--check mobile` 通過（413 人、47 船、3 飛機、關閉陰影），四市標籤無裁切／重疊。五張指定日夜截圖與手機截圖已完成並檢視，泡泡可點選。外圍基準比對：coast、shore、rings、port、bridges 完全一致，島上地標位置差 < 0.000001。
- **產物**：`out/hex-day-panorama.png`、`hex-day-city.png`、`hex-day-block.png`、`hex-night-panorama.png`、`hex-night-block.png`；手機 `out/check-scene-mobile.png`。out 已由 gitignore 排除，重拍命令沿用 §2 的 tools/shot.py。
- **2D**：template.html、build.py、data 未動。兩份 HTML 都已重建；index.html 內容與原版相同，Git 不會為相同內容產生檔案差異。
- **當時的上線待辦（已由 §0.8 正式網站流程取代）**：原 Artifact 仍由 Claude 工具維護；目前一般網站更新由 Codex 直接發佈 GitHub Pages。

### 0.8 Codex 直接發佈與 SimCity 規劃修正（2026-10-23 UTC）
- **正式網站**：<https://soulfyai.github.io/tpencore2026/>。已以 `main` 成功發佈並驗證公開 version.json。這輪都市規劃與天氣更新沿同流程發佈，線上版本以 version.json 的 commit 為準。
- **404 根因已解決**：Pages 已啟用，但 `github-pages` environment 只允許 `main`。先前工作分支部署被 protection rules 拒絕，並非無法由 Codex 發佈。已將通過驗證的版本 fast-forward 至 main 並成功執行 Pages workflow。
- **持續發佈流程**：開發、測試、commit 仍在 `claude/modest-newton-t9y5uj`；完成檢查後正常 push 工作分支，再 fast-forward push 同一版本至 main（不可 force push）。`.github/workflows/pages.yml` 改為監聽 main。Pages 自動建置後檢查 Actions 與公開 version.json；手動部署也應使用 `gh workflow run pages.yml --ref main`。更新網站不必回 Claude；原 Artifact 不會因此自動更新。
- **所選城市天氣**：品牌卡只顯示目前城市的時間、溫度與天氣。切換品牌城市／進城／政策焦點都跟隨；不列其他三市。公開網站直接向 Open-Meteo 取得所選城市市區座標的天氣，每小時快取、每分鐘檢查重試；離線或資料無效時保留該城市快照並標示時間，缺資料則顯示暫不可用。保留 Artifact db 相容路徑，但網站不依賴 Claude 天氣排程。天氣仍不影響場景視覺。
- **依 SimCity 參考修正**：保留六邊形政策分區與周邊站點，格內改為主樓＋臨街前棟＋入口步道。沿既有格網從 351 格補至 402 格，補齊水岸完整街廓，不移動原政策位置；島底層從整片瀝青改為暖灰步行鋪面，深灰色只保留於實際道路。移除新增的隨機水岸樹叢，改用展亭、街角店與太陽能充電棚，完整街廓僅配置少量行道樹。降低細針高樓比例，商業區用深色玻璃與退台／雙塔空橋／圓形塔冠／矩形天際線四種量體，住宅用雙翼中庭，科技園區用廠辦／機房／太陽能，公共設施用側翼與入口雨棚，文化區用展館及街角店，綠能區用淨水槽與能源設施。道路統一深灰鋪面、雙向中心標線與路口穿越線，擴大建築退縮，行道樹與燈具沿入口配置。政策霓虹標題、34 地標、海岸／沙灘／環島高架／港口／橋接點不動。
- **驗證工具**：新增 `tools/check_weather.py`，用瀏覽器執行實際天氣模組，驗證所選城市、延遲回應不覆蓋、離線／異常／缺資料 fallback 與快取；已 PASS。`tools/check_scene.js` 增加四市切換時天氣只含所選城市的檢查。build 與公開網站 package 均輸出 no problems。
- **截圖**：`out/planned-panorama-day.png`、`planned-city-day.png`、`planned-block-day.png`、`planned-panorama-night.png`、`planned-block-night.png`；另 `planned-weather.png` 顯示桃園單市天氣。手機場景檢查已通過（402 格、34 地標、6 橋、413 人、47 船、3 飛機）；五個指定日夜視角已完成並檢視。桌機最終回歸通過（402 格、149 處水岸設施、24 幾何批次、34 地標、6 橋、578 人、65 船、3 飛機），手機檢查與天氣回應回歸也已通過。

### 0.9 街廓多樣性修正（2026-10-24 台北時間）
- 使用者再次指出整座城市重複。這輪改的是布局：背景街廓不再固定「主樓＋兩棟前樓」，改為院落、平行雙棟、單體園區、錯落群樓、退台複合體、環形市集與混合核心七種組織，棟數 1–5 不等；依街區改變朝向、退縮與高低配置，相鄰格不得使用相同布局。各建築類型另限制高寬比，避免小基地再長成細針塔樓。
- 六種機能各有四種建築家族。新增中庭圍合、退台樓、玻璃中庭、資料中心、折板展館、連續騎樓、創作工坊、能源棚；保留既有商業塔樓、住宅、研究樓、公設、展館與再生水建築。綠能區不再整片水槽／太陽能板，背景各棟也不再只有一種中低層辦公樓。
- 同一片背景街區內的部分共用邊改為步行聯通道，形成街區與道路層級；政策環道不變，既有汽車與行人路徑維持原介面。沒有增加大片樹林或閒置瀝青。
- 僅調整 decor.js 及其生成 HTML；政策／地標／海岸／港口／橋梁／天氣／霓虹標題不變。新增 WORLD.blockPlans 與 streetTypes 作為驗證資訊。
- tools/check_scene.js 增加實際場景檢查：至少六種布局、十種建築類型、每市至少五種布局、相鄰有效背景街廓不得重複，以及車道／步行街層級。build 與 package 輸出 no problems；桌機與手機場景檢查通過（7 布局／15 建築類型、每市多樣性、相鄰不重複），日夜俯視／近景已檢視。402 格、287 段步行聯通空間、24 幾何批次；34 地標、6 橋、人物與天氣切換檢查通過。沿 §0.8 流程由 main 直接發佈 Pages。圖檔：out/diverse-city-overhead.png、diverse-commercial.png、diverse-night.png。

### 0.10 工具列整合與公共建築（2026-10-24 台北時間）
- 桌機「地標／導覽」移至右上角工具列左側，右側模式改為「全景／政策清單／政策進度」。沿用原節點與事件，地標切換、導覽開始／結束維持；手機保留底部按鈕，模式採短標籤與完整 aria-label，避免操作列擠在一起。窄桌機開啟側欄時工具列往下錯開品牌卡。
- 四市各配置消防局、警察局、醫院三類公共設施。消防局含車庫、消防車與訓練塔；警察局含藍白入口、標誌與巡邏車；醫院含急診雨棚、救護車、十字與屋頂停機坪。以原創建築外觀與中文實體招牌辨識，不冒充實際地址或新增政策宣稱。
- 四市各加入 10／15／20 層高樓（逐層樓板／窗帶），矩形、退台與圓形外觀，與既有中低層街廓混合。先選擇可用背景基地，避開政策／地標與占用範圍；沒有改政策資料或島嶼周邊。
- 招牌使用三組共用 instanced 材質與平面，幾何批次 24 → 27。WORLD.blockPlans 的 building 加入 floors；check_scene 增加每市三種公共設施與三種樓層、桌機工具列位置、地標與導覽操作驗證。桌機與手機場景檢查已通過，工具列日景、消防／警察／醫院近景及 20 層高樓夜景已檢視。四市共 12 棟公共設施與 12 棟高樓；19 種建築類型、27 幾何批次，build 與 package no problems。沿 §0.8 由 main 直接發佈。

### 0.11 霓虹城市標題進城（2026-10-24 台北時間）
- 四市霓虹大標題改為原生按鈕，滑鼠／觸控點選或鍵盤 Enter／空白鍵都能進入對應縣市。新增城市名稱無障礙標示、滑入提示與鍵盤焦點框，保留原有霓虹外觀與手機避讓位置。
- 與品牌卡城市按鈕共用 UI.enterCity：結束導覽、收合政策側欄、清除舊選取，再進城並同步品牌卡／天氣。tools/shot.py 的 --check 加入四市實際點擊與 Enter／空白鍵操作、相機進城及城市／天氣同步驗證。
- 桌機與手機 --check 均通過，截圖已檢視；手機四市標題無裁切／重疊。build 與 package 均輸出 no problems，沿 §0.8 直接發佈 Pages。

### 0.12 動態海浪與沿岸浪潮（2026-10-24 台北時間）
- 原海面兩組垂直正弦波相乘造成棋盤格，改為不同方向長波疊加、連續雜訊擾動與曲線碎浪；細節隨鏡頭距離淡出，保留原有海色與日夜調整。
- 依現有 WORLD.shore 的沙灘／岩岸／港口邊界，新增一組合併的沿岸浪花網格（12,318 vertices、1 draw call），以 GPU 著色器向岸推進、消散並緩慢往返，表現浪潮感。海岸、沙灘、港口與船隻的位置不變；不是實際潮汐預報。天氣仍只作資訊，不驅動場景。
- 海面與沿岸共用既有 ENV.update 動畫時間，沿用 prefers-reduced-motion 停止動畫。tools/shot.py 新增 --check-sea [mobile]，檢查實際動畫迴圈、海／岸時間同步、減少動態效果暫停，並捕捉 WebGL shader 編譯錯誤。
- 已檢視桌機全景／沿岸／夜景及手機全景／沿岸截圖。兩張相隔 5 秒的實際渲染，在純海面樣區 44,000 像素中有 36,100 像素變化，確認海面在動。截圖 out/sea-*.png；建置與 package 均 no problems。
- 桌機與手機 --check-sea 均通過：實際動畫迴圈會更新、海岸同步，減少動態效果可暫停，沒有 WebGL shader 編譯錯誤。沿 §0.8 直接發佈 Pages。

### 0.13 Home 回到預設視角（2026-10-24 台北時間）
- 桌機與手機右上角新增房屋圖示＋Home 原生按鈕，含鍵盤焦點與「回到初始全景」無障礙標示。按下會結束導覽、關閉品牌彈窗與使用說明、收合政策清單／進度、清除選取，再以 MAP3D.panorama 回到啟動時的四市全景；保留目前城市資料選取。
- 桌機與手機瀏覽器均驗證進城後按 Home 的相機位置／目標與預設全景一致、政策側欄／進度／導覽收合、全景按鈕狀態，以及右上角按鈕範圍與觸控尺寸。截圖 out/home-desktop.png、home-mobile.png 已檢視；build 與 package no problems，沿 §0.8 直接發佈。

### 0.14 參考圖預設鏡頭（2026-10-24 台北時間）
- 使用者以圖片指定 default 視角：上方保留天空與海平線、四市落於中下方的低角度斜俯視。overview() 仰角由約 34° 降至 20.42°，保留原有台北中心、四市取景距離及依螢幕比例的適配；首次進站、全景與 Home 共用同一組鏡頭。日夜依台北時間變化，不固定成參考圖的夜景。
- 桌機以參考圖相同 1280×1050 比例檢視夜景，另檢視日景與手機。最終桌機／手機均確認 Home 相機位置與目標回到同一預設鏡頭，手機四市標題無裁切／重疊。截圖 out/default-final-night.png、default-final-mobile.png；build 與 package no problems，沿 §0.8 直接發佈。

### 0.15 方形城市街廓（2026-10-24 台北時間）
- 使用者最新指示「捨棄六邊形，改為四方形」，取代 §0.3 的六邊形幾何要求。四市共 376 個等大正方形（邊長 1.8），直角道路網、四向相鄰政策群組、方形基板與城市色邊框；背景建築採 0／90 度朝向，市集改直角排列。55 個政策 ID 與全部項目資料保留，部分政策使用相鄰兩格。
- 政策群組與背景重新排入既有島內，配置避開固定地標。海岸／沙灘／港口／橋梁、34 地標位置、積木人偶、海浪、約 20° 預設視角與 Home 不改。四市各有消防／警察／醫院與 10／15／20 層高樓，七種布局與 19 種建築類型保留。
- WORLD 對外格網改為 blockCells／blockHalfSize（正方形半邊長），island 同步 blockHalfSize；不再使用 hexCells／hexRadius。ringNode／ringPts／graph 仍提供行人及汽車路網，改為四向直角交叉。背景格板使用既有 box instancing，幾何批次 27 → 26；681 段車道、194 段步行聯通道、156 處水岸補充建築。
- tools/check_scene.js 同步四邊等長、軸線對齊、直角道路、四向連通與相鄰背景布局不重複檢查；保留建築、地標、人物／船機、泡泡、工具列、城市標題點選與天氣同步檢查。build 與 package no problems；2D 版維持既有資料呈現。
- 桌機與手機完整場景檢查通過（578／413 人、65／47 船、3 飛機、6 橋），四市標題點擊與鍵盤進城正常。另以城市近景驗證全部街道及四邊對齊座標軸；已檢視桌機城市日／夜景、雙格政策近景與手機單格政策近景。截圖 out/square-city-day.png、square-city-night.png、square-policy-close.png、square-mobile-policy.png。依 §0.8 發佈 Pages。

### 0.16 手機工具集中右上角（2026-10-24 台北時間）
- 手機原本左下角地標／導覽與右下角全景／清單／進度／說明，整合至右上角「工具」展開面板，Home 保持直接可按。使用原有按鈕節點與事件，桌機仍採原工具列排列；視窗跨過 860px 時會同步恢復顯示並收合手機選單。
- 工具面板二欄排列，所有操作至少 44px；使用完整「政策清單／政策進度／使用說明」標籤。選擇功能、按 Home、點外側或 Esc 會收合，提供 aria-expanded／aria-controls 與焦點回復；隱藏面板不進鍵盤焦點順序。手機聲明移至底部安全區，導覽／說明與進度面板留出空間，進度面板上緣避開右上角按鈕。
- 實際瀏覽器點擊六個功能、Home 返回、選單自動收合、Space／Esc、點外側、320px 窄螢幕、640×360 橫向與桌機／手機切換均通過；桌機原工具列位置已檢查。已檢視 out/mobile-tools-closed.png、mobile-tools-open.png、mobile-tools-timeline.png 與 desktop-tools-retained.png。build 與 package no problems，依 §0.8 發佈 Pages。

### 0.17 移除 Home（2026-10-24 台北時間）
- 使用者認為與全景重複，移除桌機／手機 Home 按鈕與專用樣式。手機右上角僅保留工具，回到預設視角統一使用「全景」。全景同步結束導覽、收合品牌彈窗／使用說明／政策面板與工具選單、清除選取；初始鏡頭不變。
- 桌機與手機皆確認沒有 Home 節點，進城並開始導覽後按全景，鏡頭位置／目標回到預設且導覽／側欄收合。已檢視 out/no-home-desktop.png、no-home-mobile.png、no-home-mobile-tools.png；build 與 package no problems，沿 §0.8 發佈。

### 0.18 v1.0.0 第一階段與 A 白線指引（2026-10-24 台北時間）
- 使用者已選定 A 白線方案，先完成並發佈目前成果作為第一版，後續再迭代建築模型與美術。全景霓虹城市標題移離所有島嶼上方，以細白線與落點指向該城市島內；手機採兩排，桌機採單排，較矮視窗縮小標題。上排白線繞過下排標題；引導層不攔截地圖點擊。
- 鏡頭距離透過 smoothstep 連續混合全景排列與原有近景位置，拉近後逐漸靠回島邊；標題原生按鈕的點擊／鍵盤進城仍保留。使用既有凸包投影避開島嶼與標題重疊，距離範圍在 resize 時計算，SVG 僅四組線與落點，不新增 GPU 場景批次。
- 桌機與手機完整場景回歸通過：四個白線、標題不遮島、不重疊、點擊／鍵盤進城、政策泡泡、人物／船機、地標／公共設施與單市天氣。tools/check_scene.js 加入指引檢查；tools/shot.py 對已凍結 RAF 的場景使用已渲染座標實際點擊，再驗證城市狀態，避免等待 RAF 穩定性造成偶發逾時。
- 發佈基準：VERSION=1.0.0、CHANGELOG.md、git tag v1.0.0、GitHub Release 與可部署網站 zip；公開 version.json 同時記錄 version／commit／built_at。網站仍由 main 的 Pages workflow 發佈，開發分支不變。後續版本變更須更新 VERSION 與 CHANGELOG。
- 額外版面與縮放驗證通過：320×568、640×360、320×480、400×860 標題皆不遮島、不重疊、不裁切；遠到近取樣的排列混合值 1 → .953 → .656 → .188 → .001 → 0，逐步靠回近景。已檢視 out/v1-labels-final-mobile.png、v1-labels-final-night.png、v1-leaders-mobile-near.png 與桌機全景／近景；build 與 package no problems。
- 下一輪美術以使用者確認的精緻微縮城市示意風格為目標，可替換目前建築模型、材質與光影；政策資料與互動介面保留。先製作可互動的代表街區並量測效能，再擴展四市，不再將現有模型視為不能更換的限制。

### 0.19 預設全景與進城政策標題（2026-10-24 台北時間）
- 正常開啟網站維持原有四市全景；使用說明的「自己逛逛」改為全景，不自動進入台北。原有政策深連結仍可開啟指定內容。
- 點選縣市霓虹標題／城市切換時，先收合舊的政策清單／進度與導覽，再進城。stage.city-view 讓該市政策標題完整顯示，覆蓋手機遠距離規則原先隱藏標題的設定；其他城市政策標題隱藏，回全景後收起政策標題。
- 城市總覽的政策標題依原位置分兩欄排序避讓，保留完整名稱及點選開啟政策內容。選取主題／項目後恢復其近景位置，不改政策模型或鏡頭幾何。標題增加 data-theme 供操作驗證。
- tools/shot.py 的四市實際進城檢查同步驗證標題數量／城市範圍、文字可讀與標題不重疊，返回全景後政策標題隱藏；check_scene 使用明確收合品牌彈窗，適應城市切換會自動收合的流程。VERSION／CHANGELOG 更新為 1.0.1，保留 v1.0.0 原標籤。
- 桌機與手機完整回歸均通過，包含四市進城後標題數量／可讀性／無重疊及返回全景後隱藏。已確認首次開啟與「自己逛逛」維持全景，進城可見政策標題，點選交通主題後選取狀態與內容正確；桌機／手機截圖已檢視。build 與 package no problems，依 §0.8 發佈 v1.0.1。

### 0.20 直線指引與全景標題縮放（2026-10-24 台北時間）
- 使用者指定白線不要轉彎，允許被城市標題遮住；全景標題等比例縮小以保留更多觀景空間。取代 §0.18 的繞線配置，SVG 每條指引只保留 M→L 單一直線，線層仍在標題下方且不攔截點擊。
- 全景標題整體縮至原尺寸 75%，沿用距離 smoothstep，拉近時逐漸恢復原大小。CSS2D 外層只定位，內層原生按鈕獨立等比例縮放，避免連同投影座標一起縮放；文字、邊框、霓虹光均同步縮小。標題最小原始高度 60px，縮小後至少 45px。
- tools/check_scene.js 驗證白線只有 M/L、全景比例 .75；既有四市滑鼠／Enter／空白鍵進城與政策標題檢查保留。tools/shot.py 另保存台北進城截圖，供全景／近景比例比對。VERSION／CHANGELOG 更新 1.0.2。
- 桌機與手機完整場景回歸通過，實際點擊與鍵盤進城、四市政策標題、直線與 75% 比例皆正常；全景及進城截圖已檢視。build 與 package no problems，沿 §0.8 發佈 v1.0.2。

### 0.21 載入前舊版面閃現（2026-10-24 台北時間）
- 使用者手機截圖是 3D 載入前的舊版排版：原本 html.hi 直到 ui.js 執行才套用，Three.js 下載與場景建構期間露出基礎版面。build.py 的 3D 輸出現在在文件開頭即啟用 hi／booting，保留 2D 文件不變；載入期間隱藏尚未準備好的應用介面。
- 全螢幕品牌載入畫面清楚說明「正在載入四座政策城市／準備好後自動顯示全景」，保留獨立整理聲明與文字版入口。第一個實際場景畫面 render 完成後才解除 booting／aria-busy；不延長載入或使用虛構百分比。
- 模組下載失敗的 script.onerror 與場景初始化 catch 共用失敗提示，提供重新整理與可用的 ./2d.html。字型樣式改非阻擋載入，字型完成後觸發標籤重新排版；減少動態效果會停止載入轉圈動畫。
- tools/check_loading.py 使用封裝後的 out/site，刻意延遲／中止 Three.js，驗證手機／桌機初始全螢幕、舊介面隱藏、無障礙忙碌狀態、失敗提示／重試，以及真正點入可用的 2D 政策頁。載入中的模組會延遲 document.fonts.ready，測試透過 CDP 擷取實際首屏。截圖 out/loading-mobile.png、loading-desktop.png 及 loading-*-failure.png 已檢視。
- 首次進站不自動彈出使用說明，直接顯示全景；說明仍可從工具列開啟。VERSION／CHANGELOG 更新 1.0.3；build 與 package no problems，正常桌機／手機場景回歸及載入／失敗／備援頁測試均通過。

### 0.22 城市上方 3D 懸浮標題（2026-10-24 台北時間）
- 使用者指出固定四個螢幕位置是 2D 思考，要求標題與指引線位於城市的垂直上方，旋轉時跟隨 3D 城市。**取代 §0.18 的手機兩排／桌機單排與螢幕排位演算法**，城市大標題不再套用 CSS translate 或螢幕避讓。
- 每市在島內、靠近城市中心的街道交會點選一個固定 3D 錨點，避開地標足跡；CSS2D 標題物件的世界 X/Z 永遠等於錨點，只沿 Y 軸懸浮。標題維持面向鏡頭方便閱讀，位置由攝影機透視投影，旋轉／平移時跟著該城市移動。
- SVG 指引改為一個 THREE.LineSegments（8 頂點）與一個 Points 落點批次（4 點），具 depthTest，不攔截地圖拾取。每條線的上下端點 X/Z 完全一致，依場景深度自然遮擋；新增共 2 個輕量 draw call。懸浮高度隨縮放連續變化（近景 10 世界單位，全景依視距與各城市高度層次），保留全景 75%／近景恢復比例。
- tools/check_scene.js 驗證四條真正的 3D 垂直線、錨點在島內、標題符合投影、沒有螢幕 translate，並在 60°／90°／180° 旋轉後重新驗證，回到全景再執行既有實際點選與鍵盤進城／政策標題測試。CITY3D.cityLabels／cityLeaders 提供檢查介面。截圖 out/world-labels-mobile.png、world-labels-mobile-rotate.png、world-labels-mobile-near.png、world-labels-desktop.png 已檢視。
- VERSION／CHANGELOG 更新為 1.0.4；城市方形街廓、模型、政策資料、海岸／地標／人物與載入流程不變。
- 桌機與手機完整回歸均通過，包含三個旋轉角度的世界垂直／投影檢查、四市實際點擊與鍵盤進城、政策標題、人物／船機與地標。build 與 package no problems，依 §0.8 發佈 v1.0.4。

### 0.23 移除文字版入口（2026-10-24 台北時間）
- 使用者要求刪除載入畫面的「先用文字版瀏覽政策」。已移除該連結及失敗提示中的文字版說明；正常載入不顯示操作按鈕，失敗時才顯示重新整理。
- tools/check_loading.py 已同步驗證手機／桌機正常延遲載入與失敗畫面都沒有連結或文字版提示，並確認重試按鈕與減少動態效果正常。截圖已檢視，build／package no problems；VERSION／CHANGELOG 更新 1.0.5，依 §0.8 發佈。

### 0.24 資訊面板捲動（2026-10-24 台北時間）
- 手機共用舊樣式將 .pbody 設為 overflow:visible，而 3D 版外層禁止頁面捲動，導致候選人／政策清單／跨市協作／資料說明的底下內容被截住。3D 樣式現在明確將面板內容設為可縮小的 flex 捲動區（min-height:0、overflow-y:auto），支援原生 pan-y 及 iOS 慣性捲動；分頁列不縮小、不隨內容滑走。
- 內容底部保留 64px＋安全區 padding，讓最後一筆資料可完整滑至底部聲明上方；背景地圖的拖曳與縮放維持原操作。
- 新增 tools/check_panel_scroll.py（先 package），使用實際分頁／內容程式與 3D 面板 CSS，透過原生 CDP 觸控手勢和桌機滾輪驗證四分頁，包含展開所有政策項目、到達內容底端、最後元素不被聲明遮住、分頁列位置固定。手機／桌機八組皆 PASS。
- 已檢視實際 3D 手機畫面候選人／跨市協作底部及各分頁捲到底截圖。build／package no problems，VERSION／CHANGELOG 更新 1.0.6，依 §0.8 發佈。

### 0.25 新北市標牌高度（2026-10-24 台北時間）
- 依使用者綠色標記降低新北市預設全景標牌：cityFarHeights.newtaipei 由 .20 調為 .115。僅調整世界 Y 軸遠景懸浮高度，原有 X/Z 城市錨點、3D 垂直白線、近景高度與其餘城市不變。
- 手機／桌機預設視角截圖驗證高度與錨點；tools/shot.py 移除不適用於 3D 空間標牌的「投影不得重疊」舊限制，保留出界檢查，真正的世界座標／旋轉檢查仍在 check_scene.js。版本 1.0.7，build／package no problems。

### 0.26 政策泡泡完整展開（2026-10-24 台北時間）
- 使用者要求一次顯示全部項目。移除 callout ol 的桌機 260px／手機 170px 高度限制與內部捲動，泡泡改為桌機 320px／手機 300px（仍受視窗寬度限制），自然增高，保留原生政策按鈕與霓虹標題。
- main.js 的 fitPolicyCallout 在 CSS2D 投影後依實際尺寸平移，避開頁首與導覽控制卡；短橫向畫面可改兩欄。未改動城市標牌、模型或政策資料。
- 版本 1.0.8，手機／桌機七項導覽及八項主題畫面驗證完整展開、無清單捲動與裁切，build／package no problems；依 §0.8 發佈。

### 0.27 海岸閃爍修正（2026-10-24 台北時間）
- 實測手機全景距離 663、far 1759，原 near 固定 .3、24-bit depth，在遠處難以區分海面／淺灘／泡沫 .006–.025 的間距。main.js 依相機距離更新 near=clamp(distance*.02,.3,12)，手機全景 near=12，深度解析度約提升 40 倍，政策近景仍保留 .3 下限。
- world.js 淺灘／靜態泡沫、env.js 動態浪花依序 renderOrder 1／2／3；保留 depthTest、關閉 depthWrite，使用保守 polygonOffset。各層以獨立 stencil bit 1／4／2 限制凹角重複混色，不互相覆寫。
- 動態浪花改用 phase footprint 過濾，遠景亞像素亮紋淡為柔和水色，近景仍保留波浪；沒有改島形、沙灘／橋梁／地標、城市標題、政策或品質像素比上限。
- tools/check_coast.py 以固定時間、DPR 2 的手機尺寸／桌機三個微幅旋轉畫面檢查；before 需先將舊版 index3d.html 複製至 out/coast-before.html。驗證海岸九層、stencil bit、四市／政策近景裁切與海浪時鐘；另拍日夜畫面。手機全景相鄰畫面 max RGB 差 >80 的像素由 157 降到 11，為整張 canvas 的回歸比對指標，非 iPhone 實機測量。
- 版本 1.0.9，build／package no problems，手機／桌機畫面檢視後依 §0.8 發佈。

### 0.28 B 版品牌天際線（2026-10-24 台北時間）
- 使用者選定香港霓虹參考 mockup B。左上品牌按鈕改為原創北北基桃地標 SVG 天際線外輪廓（101、橋梁、港口吊臂、航廈／飛機），藍白燈管與暖金點綴。主標／副標保持真實文字，未使用生成圖片作為招牌貼圖。
- 桌機寬 360px，標題／副標並排；手機寬 min(250px,100vw - 110px)，上下排列並保留右側工具空間。靜態柔光不閃爍；SVG 為 aria-hidden，原生按鈕保留 aria-expanded／controls、焦點框與城市彈出卡操作。
- 修改 3d/ui.js、page.css 與生成 HTML。桌機／手機實際場景截圖、文字邊界與展開收合操作檢查，build／package no problems。版本 1.0.10，依 §0.8 發佈。

### 0.29 B 招牌忠實度修正（2026-10-24 台北時間）
- 使用者否決 §0.28 的簡化 SVG，要求貼近核准 mockup B。改為以該原稿參考製作正式透明圖像，保留細緻橋梁／吊臂／建築、金色窗光、雙層燈管、固定螺絲、主副標字體與層級；不再沿用手工簡化 skyline。
- 3d/assets/brand-b-desktop.webp（2158×729、約 313 KiB）與 brand-b-mobile.webp（1902×827、約 264 KiB），手機另做主副標上下排列。WebP 僅由 imagegen 產物做格式壓縮，未以程式重繪。build.py 將兩份圖像內嵌 data URI，index3d 仍單檔可用；不增加外部資產路徑。
- ui.js 使用 picture 的 860px media source；圖片裝飾性 alt 空字串，按鈕保留輔助文字、aria-expanded／controls、焦點與城市卡事件。CSS 預留正確 aspect-ratio，桌機 380px、手機 min(260px,100vw - 110px)。
- 手機／桌機實際圖像解碼、來源尺寸、邊界與選單操作及截圖檢視；build／package no problems。版本 1.0.11，依 §0.8 發佈。

### 0.30 聲明移入使用說明與版權浮水印（2026-10-24 台北時間）
- 使用者明確覆寫「聲明永遠置底可見」的早期規則：完整「獨立整理，非任何候選人或政黨官方網站」及資料查核日期移入使用說明，不再以白色膠囊遮擋場景。中立性與來源仍保留；僅 3D 外殼改動，2D 頁面保留原版。
- ui.js 移動原聲明 HTML 後移除原節點，新增底部無底色小字 Copyright@TPEncore2026、Contact / TPEncore2026@gmail.com（mailto）。手機可自然換行；閱讀抽屜開啟時隱藏浮水印，避免蓋住正文。載入畫面亦改為版權／聯絡文字。
- 使用說明可於較小畫面內部捲動。更新場景／面板檢查中舊 .notice 假設。手機／桌機檢查版權文字、mailto、抽屜不遮擋、使用說明聲明及最終截圖，build／package no problems；與 §0.29 同為 v1.0.11 發佈。

### 0.31 載入／音樂／地圖關閉與 NAS 準備（2026-10-24 台北時間）
- 載入狀態文字精確為「正在載入你的理想城市」；正常狀態不顯示 hint，失敗時才顯示重試說明。loader 內使用與品牌按鈕相同的桌機／手機透明招牌資產，由 build.py 內嵌 URI。
- site-config.json.musicUrl=https://tpencore.tw/music/tpencoretheme.mp3（使用者提供，NAS 網址尚未建立好）。右上工具新增音樂按鈕，預設關閉、preload none，點擊才 play，支援暫停／循環，錯誤提示不阻斷地圖。主機 JSON 設定可獨立更改，沒有自行下載／搬移使用者 MP3。
- main.js 在 pointerdown 記錄是否有視窗；短距離單指點擊時先 dismiss，不穿透選取背後建築。取消／多指／曾移動 >6px 皆不視為點擊。ui.js 統一收合品牌卡、工具、使用說明、抽屜、時間軸、導覽與政策選取；清選取後還原目前相機視角。
- tools/check_loading.py 驗證新文字、招牌尺寸／解碼與失敗重試；tools/check_map_music.py 使用瀏覽器原生音訊搭配本地 WAV fixture，驗證主動播放／暫停、無預載、錯誤恢復與各類視窗的實際地圖點擊、無視角跳轉／穿透與拖曳保護。手機／桌機截圖檢視。
- deploy/SYNOLOGY.md 提供 Web Station、HiNet DNS（A 指公司公網 IP，尚未知）、HTTPS、音樂路徑、排程設定。deploy/synology-update.sh 由 NAS 拉取 Pages 成功發布的版本，每份 HTML 原子 rename，保留既有 site-config.json／music，未變版本不重下載；離線測試包含失敗保留舊版。package 複製 site-config.json，NAS ZIP 由 out/site 打包。
- **NAS 尚未實際部署**：使用者回覆「還沒設定好」，尚無主機／Web Station 根目錄／可用存取方式，不宣稱 DNS／HTTPS／MP3 連線已可用。先更新 Pages、提供 ZIP 與設定文件；待 NAS 準備好再驗證 tpencore.tw。版本 1.0.12，build／package no problems。

### 0.32 地圖平移跟隨縣市與預設使用說明（2026-10-24 台北時間）
- 使用者反映 entered 僅由城市按鈕指定，平移後仍鎖在舊縣市。main.js 在政策可見距離且不在程式飛行時，以 controls.target 的世界 X/Z 對海岸多邊形判斷城市；進入另一城市直接切換，海上依最近岸線並需有明顯距離優勢以避免抖動。
- UI.followCity 同步品牌／所選城市／天氣；跨市遇到舊主題／項目／協作或導覽時先清除選取，保留相機位置與縮放，不呼叫 enterCity 重新取景。只旋轉、遠景全景與飛行過程不會亂切城市。
- 使用者要求恢復預設使用說明（覆寫 §0.21 的不自動開啟決定）：每次新載入 intro.hidden=false，依然先呈現全景，說明可點地圖／X 關閉，也能由工具列再開啟。不使用 localStorage 永久隱藏。
- tools/check_city_follow.py 驗證手機／桌機初始說明、四市連續平移的政策標題與城市同步、縮放／相機位置不跳動、跨市清除舊政策。更新 shot.py 預設說明期待與 map_music 測試的開場收合。截圖 out/city-follow-intro-*.png、city-follow-taoyuan-*.png，build／package no problems。版本 1.0.13。

### 0.33 v2.0.1 加亮 B 與部署版本（2026-10-24 台北時間）
- 使用者核准發光加強 mockup B，指定版本號跳至 2.0.1。沿用 §0.29 的正式桌機／手機圖像，於 page.css 共用 brightness(1.25)、saturate(1.15) 與三層藍色 drop-shadow，提高亮芯與外暈，避免另行重繪改動地標與字體。主畫面與 loader 使用相同設定，靜態柔光無動畫。
- 桌機／手機場景及載入畫面檢視、build／package no problems。發布工作分支、main、v2.0.1 tag／Release，更新 NAS ZIP。
- NAS 部署狀態沿 §0.31：尚未取得已設定的 Web Station 根目錄／存取方式或公司公網 IP；部署包與自動更新腳本已備妥，不能將 GitHub Pages 發布等同於 tpencore.tw 已部署。設定流程見 deploy/SYNOLOGY.md。

### 0.34 國際飛行／遠洋航道（2026-10-24 台北時間）
- 使用者要求飛機與船隻飛往／航向世界其他地方。people.js 將原繞圈機改為兩條示意國際航道（桃園往新加坡方向、松山往東京方向，並非真實航班），保留兩架區域往返機，共 4 架；平滑爬升／下降與分層高度、固定方向，邊界淡出後等候再循環，不在畫面中瞬移掉頭。
- 重新指派既有商船，桌機 4 艘／手機 3 艘遠洋航道，船總數仍為 65／47。航道逐段檢查 seaGuard、橋梁距離 5 與外海小島半徑+4；env.js 只額外暴露原有小島位置／半徑供避障，沒有移動任何小島或改變海岸。漁船、渡輪與停泊貨櫃船保留。
- 只有這些角色複製材質以支援透明淡出，不影響其他船或城市夜燈；夜光同步原材質亮度。減少動態模式停止進度；重置在不可見狀態，保留夜間航行燈。
- tools/check_world_routes.js 驗證手機／桌機航道數、>100 場景單位、主島／橋梁／小島避障、材質隔離、淡出／重置與減少動態，300 秒飛行排程取樣最小間距約 6.37。日夜場景檢視與 build／package no problems，版本 2.0.2；NAS ZIP 依既定方式更新。
- 使用者另問即時天氣是否能加回且不改視覺；已說明現版左上城市卡仍保留 Open-Meteo 即時資訊與快照 fallback，僅顯示所選城市，不讓氣象改變場景。使用者回覆 ok；本次不加入天氣視覺特效。

### 0.35 手機工具單欄排列（2026-10-24 台北時間）
- 手機右上按鈕只顯示 SVG 三條線，44px 觸控範圍；保留 aria-label「地圖工具」與展開狀態，不再顯示「工具」文字。
- phoneOrder 明確定為政策清單／政策進度／使用說明／全景／導覽／地標／音樂，手機將原有按鈕節點直接移到單欄面板，確保 DOM／鍵盤／視覺順序一致。桌機恢復原 mapTools 與 modes 群組，事件、選取與播放狀態不重建。
- 手機面板寬 180px、每列至少 44px，高度不足可內部捲動。tools/check_mobile_menu.py 檢查七列順序、按鈕無文字、清單／說明動作自動收合、桌機回復與 320px 窄手機邊界；更新 check_scene 的手機群組假設。截圖 out/mobile-menu-single-column.png、mobile-menu-desktop-preserved.png、mobile-menu-320.png。build／package no problems，版本 2.0.3，NAS ZIP 同步更新。

### 0.36 底部標示文字（2026-10-24 台北時間）
- 依使用者指示將主畫面浮水印及載入畫面底部 Copyright 改為「Designed by TPEncore © 2026」，保留 Contact／信箱連結及既有換行。未修改獨立整理聲明與選單功能。
- 版本 2.0.4；build／package no problems，手機／桌機畫面檢查後依既定流程發布；包含 §0.35 的手機單欄選單，NAS ZIP 同步更新。

### 0.37 桌機全景縮放與滿版（2026-10-24 台北時間）
- overview 在 stage 寬度 >860px 時將原鏡頭距離乘 .82，桌機約近 18%、物件約大 22%；手機保持既有取景倍率。1400×860 全景距離約 224.18（原約 273），四市海岸與標牌仍在視窗內。
- 白邊來自瀏覽器預設 body margin 8px，原 hi CSS 只清 padding。限定 3D 的 html.hi／body 加 margin:0、width:100%，畫布及 stage x/y=0，寬高等於視窗；未修改 2D 樣式。
- 窄桌機品牌寬度隨 viewport 在 280–380px 間調整，工具列維持頂部，避免舊規則把整列下移而擋住城市標題。
- ResizeObserver 原已同步 renderer、CSS2D 與 camera.aspect；新增在未選城市／政策的全景中依新視窗立即重取景。進城或選政策時保留相機位置，不將手動視角重設。
- tools/check_responsive_view.py 驗證 1400×860、1920×1080、1024×768、400×860、320×720 的滿版邊界、投影比例、海岸／標牌可見、桌機拉近，以及全景重取景／進城視角保留。截圖 out/responsive-{1400,1024,400}.png；build／package no problems，版本 2.0.5，NAS ZIP 依既定流程更新。

### 0.38 四市屋頂國旗（2026-10-24 台北時間）
- 使用者核准 mockup 後實作。新增 3d/flags.js（build 在 coaster 後、main 前串接），掃描既有背景建築及人工地標零件的真實變換 bounding box，於每市最高合適屋頂放一面旗；排除自然景點、橋梁與大觀音塑像。未改島形、城市高度或地標本體。
- 實測台北為 101 頂點 y=11.736，其餘三市為原有 20 層高樓頂點 y=5.42。旗面 .9×.6、旗桿 1.15，3:2 比例。CanvasTexture 自繪紅地／藍色左上角／十二白色光芒與白色圓心；不使用生成圖片貼圖。國旗材質共用，夜間低量自發光維持可辨識。
- 頂點 shader 輕微飄動，旗桿不動；CITY_FLAGS.update 跟隨 main 的 clock，減少動態時停止旗面時間，仍跟隨來源建築的 lift。旗面關閉 frustum culling 避免邊界飄動閃現。CITY3D.flags 暴露 sites／uniforms／update 作檢查。
- tools/check_flags.js 驗證四市各一、旗面比例／紅藍白與十二道光芒、真實屋頂錨點、建築升降跟隨、動畫／減少動態及 GL error。手機／桌機全景、101／基隆高樓近景與夜景檢視；build／package no problems，版本 2.0.6，NAS ZIP 同步更新。

### 0.39 音樂預設啟播／無 Cookie 計數／NAS 自動更新（2026-10-24 台北時間）
- 使用者已完成首次 NAS 部署。已唯讀驗證 https://tpencore.tw/version.json 可連線，為 v2.0.6、commit 231912d；不需重新索取 DSM 基本資料。尚未在 NAS 安裝新排程／PHP，沒有可用 NAS 管理存取方式，不宣稱已代為啟用。
- 音樂預設 play()，NotAllowedError 時靜默保留首次真實 pointerup／keydown 內直接播放的 fallback，避開音樂按鈕本身以免雙重切換；手動暫停後取消 fallback。序列避免過期 Promise 狀態，失敗可 load() 重試，支援 config.musicAutoplay=false；舊 config 缺欄位預設 true。
- recordVisit 只在初次取得主機設定後呼叫一次；tpencore.tw 預設同站 counter.php，其他主機可設 counterUrl，GitHub Pages 預設不呼叫。POST credentials:omit，不用 Cookie／localStorage／指紋；底部標示「瀏覽次數」，不是獨立訪客。服務失敗時隱藏，不阻斷場景／音樂。
- deploy/counter.php：PHP 8.2+、PDO SQLite，僅存 totals(name,value)，POST 原子加一，GET 只讀，不記 IP／UA／訪客識別，移除 Set-Cookie、no-store、拒絕跨源瀏覽器 POST。資料庫預設 /volumeN/tpencore-data/visits.sqlite（網站外），可由 TPENCORE_COUNTER_DB 覆寫。NAS 需先啟用 PHP、pdo_sqlite、http 帳號資料夾讀寫及 open_basedir。
- tools/package_site.py 發布 counter.php.txt 純原始碼；NAS updater 取得後改存 counter.php，保留 local config／music／外部 DB，版本相同且必需檔齊全才跳過。加入時間戳與版本日誌。tools/package_nas.py 將網站包的 .txt 改回 .php，另產生 automation ZIP（腳本＋兩份指南），不把排程腳本放網站根目錄。
- tools/check_music_autostart.py 用原生 Chromium 音訊與允許／阻擋 autoplay 政策測首次互動、手動暫停、opt-out、網路錯誤恢復。tools/check_counter.py 用真實 PHP/SQLite 測 40 並行請求、持久化、GET 不增、重新整理增一、只 POST 一次、無 Cookie／識別欄位及跨源拒絕。tools/check_nas_deploy.py 驗證更新／保留資料／無變更／下載失敗。手機、桌機、320px 排版已檢視。版本 2.0.7，build／package no problems。
- 文件：deploy/NAS_QUICK_START.md 為現有網站的一次性工作排程器步驟，deploy/SYNOLOGY.md 末段為計數器 PHP／私有資料夾啟用步驟。NAS 自動更新從 GitHub Pages 已發布檔拉取，不需 NAS 安裝 Git／Python，且不依賴 cloud session 常駐。

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
  `core, world, env, models, models2, models3, landmarks, ships, decor, people, coaster, flags, main, ui`。
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

### 0.40 全景自動環繞 v2.0.8
- 全景完成定位、無使用說明／工具／政策視窗遮擋時，等待 5 秒後順時針環繞 360°，一圈約 180 秒。僅改相機方位，維持 target、半徑與高度。
- pointerdown／wheel／keydown 及 OrbitControls start 停止；重新點選全景重新計時。初次說明關閉後才計時；減少動態設定不啟動，切背景停止已啟動運鏡。
- 保留 v2.0.7 音樂行為，依使用者要求不再修改自動播放。

### 0.41 2D 與 GitHub 協作入口 v2.0.10
- 使用者明確要求保留原有 2D 地圖／資料面板及四市色彩，不採參考網站卡片改版。2D 頁首新增 3D、Issue、原始碼連結；資料說明新增貢獻與聯絡資訊。
- 3D 使用說明連到 ./2d.html 與 GitHub Issue 表單。政策資料、模型及原有功能不改。
- .github/ISSUE_TEMPLATE 三種表單、CONTRIBUTING.md、README.md 已整理。未修改遠端分支保護或 Issues 開關設定。

### 0.42 時間模式與藍天白雲載入 v2.0.11
- 桌機右上角時間選擇器、手機三線選單新增白天／晚上／實際時間。預設 live 台北時間，不持久保存選擇；白天固定 12:00，晚上固定 22:00。ENV.setTimeMode 共用既有光照／燈光／星月，不影響即時天氣資料。
- loading-sky.webp 為生成的純藍天白雲背景，build.py 內嵌至 3D HTML；現有 B 招牌、載入文案與錯誤重試機制保留。

### 0.43 載入招牌顯示修正 v2.0.12
- 正式站招牌資料檢查完整，但 loader 原置於 visibility:hidden 的 .app 下。將 loader 在 build.py 移到 .app 前的獨立 section，避免隱藏祖先／裁切與濾鏡合成風險；首次場景畫格移除 booting 後 CSS 隱藏 loader。
- 圖片 eager／sync／high 優先解碼，容器固定 aspect-ratio 並禁止 flex 壓縮。

### 0.44 社群分享預覽 v2.0.13
- template.html 新增 OG／Twitter 大圖卡及 canonical；build.py 對 3D 調整 og:url／canonical 為正式首頁，2D 為 /2d.html。
- assets/social-preview.jpg 為實際 3D 全景截圖（1200×630），tools/capture_social_preview.py 可重拍。封裝發布至 GitHub Pages，OG 使用該 HTTPS 圖片網址，既有 NAS 排程無需更新或額外複製圖片。
- 社群平台可能快取舊卡片；網站不會直接修改已發布的社群貼文。

### 0.45 錯落政策標牌 v2.0.14
- 使用者核准錯落排列 mockup。fitPolicyLabels 取代原兩欄程式：以政策街區的世界座標投影為錨點，確定性螺旋候選搜尋避讓標牌、城市大標題、品牌列與主要高地標；保留原霓虹及四市色彩。
- SVG policy-guides 在 CSS2D 下方，無 pointer events；直線／落點連回原政策街區，只有位移且連線長度足夠時顯示。選取政策／項目／協作、全景均清除。
- 投影與標牌尺寸未變時重用排版，避免閒置場景每幀重建；鏡頭旋轉／縮放／平移或字型尺寸改變則重新計算。原始街區／地標／建築與點擊功能不變。

### 0.46 政策標牌對比 v2.0.15
- 使用者要求藍底調亮、文字固定白色，選取時不要變黑。修正 build.py 後置的 .tlabel.sel color:var(--surface) 與編號樣式覆蓋；用 .hi .tlabel.sel 等更明確選擇器固定白字。
- 藍底 #244e85，懸停／選取 #2c619d，編號與標題 #fff；.dim opacity 改為 1 保持未選標牌可讀。展開白底內容保留高對比深字，標題列改亮藍底白字。

### 0.47 圓潤人物與互動規劃 v2.0.16
- 使用者要求依新附圖調整人物、規劃互動遊戲。人物改球形大頭／柔色衣服／膠囊手腳，重做臉部 UV 朝向、帽髮與道具垂直位置；成人／學童／長者保留比例差異。保持 11 roles，7 基本 InstancedMesh＋5 道具池。
- 加入停步張望、部分學童／旅客揮手，家長推車與長者拐杖手勢；moving=false 不更新動作。新增 PEOPLE.characterKit、activity、position、facing 供檢查與後續互動使用。check_scene.js 改依 characterKit 取得 12 批次，不再依舊 Capsule 頭幾何判斷。
- docs/INTERACTION_PLAN.md 為具體規劃：第一期市民小任務＋探索護照，第二期跟居民散步／找一找／生活情境入口。遊戲尚未實作，未新增任務 UI、探索紀錄或事件蒐集。

### 0.48 背景計數 v2.0.17
- NAS PHP／SQLite 已啟用，GET counter.php 回傳 ok:true。使用者要求前台不顯示數字，移除 visitCounter DOM，保留每次載入 POST；counter.php 仍公開可查，尚無管理者登入。

### 0.49 獨立街景美術測試 v2.0.18
- 使用者要求將示意圖街角做成可操作的真實 3D。prototypes/street-test.html、street-test.js 為獨立 Three.js 0.160.0 實作，package_site.py 複製到 Pages 根目錄 street-test.html / street-test.js。NAS 原有更新腳本不抓新獨立檔，因此先提供 Pages 測試網址，不聲稱 NAS 有此頁。
- 高畫質為預設，提供標準、三視角、日景／夕陽；固定種子自然樹群、草地 shader、道路人行道、托育建築／公寓／人物與原生拾取。無玩家移動、任務或新資料蒐集。
- docs/CITIZEN_GAME_PLAN.md 是完整角色與政策任務企劃，docs/CITY_ART_DIRECTION.md 為全城美術目標；POLICY_MISSION_INVENTORY.json 為128政策／83筆待去重政績的規劃盤點，非已完成任務。正式城市未換模。

### 0.50 臺北市獨立預覽（待確認，不替換正式城市）
- 使用者肯定街景樣板，要求以同樣美術先做臺北全市，但明確要求確認後才替換正式網站。新增 `taipei-preview.html` 獨立 Pages 入口，沿用正式輪廓／160街區／17主題與16地標的快照，採街景樣板衍生素材與草地、葉片樹冠、建築、人物、光影。正式兩版HTML、3d/、data/及street-test均未改。
- 新增street-art-kit.js、taipei-landmarks.js、taipei-preview-data.json，package_site.py只增封裝檔案清單，版本號維持2.0.18。既有NAS更新器不抓新預覽檔，預覽網址在Pages，不聲稱NAS已有預覽。
- 四個可操作視角、高／標準畫質、白天／夕陽；政策面板呈現既有62筆條目與來源，區分9政見／8政績，非任務遊戲。
- `tools/export_taipei_preview.py` 以UTF-8讀取本機正式HTML並刻意更新快照，勿在CI自動重新佈局；check_taipei_preview.py驗證原生控制、來源、政策文字編碼、全市視角、避讓、面板捲動與正式檔案未變。詳docs/TAIPEI_PREVIEW.md。
- 後續整合／替換正式模型必須等使用者明確確認，目前僅提供美術審查。

### 0.51 臺北預覽第二輪：建築組合與微縮風格
- 使用者要求更靠近原示意圖，包含房屋組合多樣性。獨立taipei-preview升為rev=2；新增taipei-architecture.js的11種組合，依機能分區與相鄰避讓選擇，保留政策、地標配置及高樓。新街區樣貌視角供近看差異。
- 暖色牆面、坡屋頂、廊架／陽台／花台／庭園／退台、藍色海面與3D雲層；RoomEnvironment提供材質反射，高畫質用SSAOPass接觸陰影，標準關閉AO。EffectComposer MSAA與OutputPass統一渲染。
- street-art-kit僅供新預覽，合批時保留castShadow／receiveShadow，避免不應投影的細瓦線被重新開啟；原street-test仍未改。check_taipei_preview驗證11種組合、實際操作及正式檔未變。版本號仍2.0.18，沒有替換正式城市，需等待使用者明確確認。

### 0.52 都市天際線範例：修正低樓小鎮方向
- 使用者指出rev=2仍是相同風格，要求依新附SimCity式高低混合都市範例，並問高度限制。已說明舊7／8層一般建物及少量10／15／20層為程式自訂，不是引擎上限。
- 新增獨立skyline-study.html／.js與urban-buildings.js，展示圓筒雙塔、尖塔斜撐、斜冠、曲面玻璃、ArtDeco、錯位雙塔、退台住宅、中層圍合、複合街廓、弧頂場館共10種都市量體；最高配置48F，45F尖塔另有冠頂，前景保留低樓住宅。僅為建築語彙審查，沒有套進臺北島或替換正式網站。
- 街廓尺寸亦要改：舊臺北每格約14.4、占地8×8，新裙樓可32×25；後續需先確認樣本，再合併街廓與重新規劃高／中／低區及101縮尺。不能只把舊方盒拉高。
- 提供四視角、建築目錄與點選、日／夕陽、畫質與名牌。check_skyline_study.py實際驗證10種、48F、高低差、操作與既有頁面未改。詳docs/URBAN_SKYLINE_STUDY.md。沿用2.0.18版本號與現有三套預覽，各檔保持隔離。
