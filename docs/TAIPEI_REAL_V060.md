# 擬真臺北預覽 v0.6.0

獨立預覽，不替換正式網站，也不修改任何既有預覽。入口：`taipei-real-v0.6.0.html`（GitHub Pages 發布後為 `https://soulfyai.github.io/tpencore2026/taipei-real-v0.6.0.html`）。

## 這一版做了什麼

依使用者選定的「方案二」，臺北島改用擬真城市引擎，先做臺北市，新北市之後再接。

- **地理**：臺北市十二行政區實際邊界（內政部鄉鎮市區界線）、基隆河（含社子、關渡）、景美溪、雙溪；陽明山、內湖山區、四獸山、南港山、貓空以連續森林覆蓋。比例為真實比例（1 單位約 135 公尺），不放大島形。
- **城市**：每區有自己的街道方向、街廓大小與定位（信義金融、松山商務、南港與內湖科技、大同萬華老城、大安中正士林住宅、北投文山郊區）；101 周邊限高，讓 101 獨立突出。
- **地標**：101（含國旗）、大巨蛋、國父紀念館、中正紀念堂、總統府、台北車站、新光摩天大樓、小巨蛋、龍山寺、圓山大飯店、南港展覽館、臺大、陶朱隱園、美麗華、兒童新樂園、松山機場等，依真實經緯度放置並自動避讓。
- **政策園區**：17 個主題（9 政見＋8 政績）各一座園區，城市色外框、四角聚光燈、依主題配置建築。依主題放進合適的行政區，例如 AI 產業 → 北投（北士科）、居住都更 → 萬華、運動 → 松山（大巨蛋）。
- **渲染**：大氣天空與環境反射、ACES 色調、窗戶法線與粗糙度貼圖、接地暗部、夜間窗燈與店面燈、SSAO、泛光（夜景）、暗角。高畫質按鈕可關閉後製。

## 內容規則（沿用正式站）

- 資料只來自 `data/taipei.json`、`data/records-taipei.json`；政績分組與 `build.py` 相同（常數由 build.py 解析，不重複定義）。
- 每一項都附來源，建置時驗證；任何一項缺來源或引用不存在的來源，建置會失敗。
- 頁面保留「獨立整理，非任何候選人或政黨官方網站」與資料查核日；只用台北藍，不放黨徽、照片或官方標誌。

## 檔案

| 檔案 | 用途 |
|---|---|
| `prototypes/taipei-real-v060.js` | 擬真臺北引擎（three@0.160.0），`createTaipeiIsland(container, opts)` |
| `prototypes/taipei-real-v060.css` | 引擎樣式（限定在 `.tpi-root` 內），含政策標籤樣式 |
| `prototypes/taipei-real-v060-districts.js` | 十二行政區邊界 |
| `tools/build_taipei_real_preview.py` | 產生 `prototypes/taipei-real-v0.6.0.html`（內嵌資料） |

```sh
python3 tools/build_taipei_real_preview.py
```

`tools/package_site.py` 已加入此建置與四個檔案的發布。

## 引擎 API（預覽頁使用的部分）

| 參數／方法 | 說明 |
|---|---|
| `policies` | 主題陣列（含 `id`、`name`、`kind`、`area`、`no`、`items`） |
| `cityColor` | 園區外框與標籤色 |
| `onSelect(place)` | `place.type` 為 `district`、`landmark` 或 `policy`；`policy` 時含 `theme` 與所在行政區 |
| `focusPolicy(id)`、`setActivePolicy(id)` | 飛到主題園區、標示目前主題 |
| `focusOffset()` | 回傳鏡頭目標前移比例，手機底部面板用 |
| `landmarkLabels` | 預設關閉，避免與政策標籤搶畫面 |

除錯：`window.TAIPEI_REAL = { island, data, openTheme }`；`island.three` 可取得 scene、camera、controls。

## 驗證

本機以 three@0.160.0、Playwright＋swiftshader：
- 桌機 1280×800：載入無錯誤，17 個政策標籤，點標籤與清單都會開啟面板並飛到園區。
- 手機 390×844：載入無錯誤；開啟底部面板後，園區停在面板上方可見範圍。

## 尚未處理

- 新北市島與雙島構圖、關渡大橋與淡江大橋。
- 正式站外殼：城市切換、音樂、時間模式、計數器、使用說明。
- 實機效能量測（高畫質後製在手機預設關閉）。

<a id="v061"></a>
## v0.6.1：正式站外殼＋擬真臺北

使用者要求：周邊 UI 不替換，唯一改變的是臺北市的美術設計與相對的政策標示位置。

- 入口 `greater-taipei-v0.6.1.html`，由 `tools/build_taipei_real_shell_preview.py` 從 `greater-taipei-v0.4.12.html`（正式站 2.2.x 的來源）複製產生，只做三處注入：
  1. 匯入 `taipei-real-v060.js`。
  2. 所有核准城市建好、交通網與原生標籤建立之前：隱藏 `approved-city-taipei` 與原台北國旗；以嵌入模式建立擬真臺北，等比例縮放進原台北島海岸外框；用正式站現有的 12 個台北政策主題建立園區，改寫 `isl.campus`、`isl.campusTop`、`body.anchor`、`ITEMS3D` 範圍與點選物件；臺北地標標籤移到新地標位置，新城市沒有的地標標籤移除。
  3. 每幀更新：擬真臺北動畫，並跟隨正式站的日夜狀態。
- 品牌、工具列、政策清單、泡泡、使用說明、時間模式、音樂、新北市、關渡與淡江大橋、海空交通與動物全部是正式站原樣。
- 引擎嵌入模式（`opts.embed`）：使用宿主 renderer，不建立畫布、天空、海、燈光、遠洋船隻與後製；海面以下的地形與樹冠三角形會被剔除，避免在宿主海面下露出方形。
- 已知差異：真實臺北海岸與原本風格化島形不同，雙橋落點與部分船隻航線是依原島形規劃，可能貼近或略微壓到新海岸。
