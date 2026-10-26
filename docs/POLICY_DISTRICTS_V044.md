# 政策街區預覽 v0.4.4

獨立審查入口：`greater-taipei-v0.4.4.html`。延續 v0.4.3，正式首頁及既有預覽不變。

## 內容整併

臺北 17 個政策／戰績區塊合併為 12 個主題。交通、居住與都更、教育、運動合併同類內容；原社福與其他中的托育、長照、青年、AI、防災、健康內容，逐項歸入相關主題。保留環境、文化等獨立主題。

原臺北 62 項（35 項政策、27 項任內戰績）及新北 56 項皆保留；每筆 ID、事實、說明、狀態與來源不變。新欄位 `contentKind` 區分政策與戰績，`originalCategory` 和 `originalTheme` 留存原分類，支援舊名稱搜尋。合併面板分列「政策與承諾」和「任內戰績」，沒有把承諾標記為完成。

## 空間配置

使用既有兩座島的海岸、地標、四座湖泊和道路格點。以島心周圍角度分配主要政策園區，合併相鄰地塊，移除園區內部道路，保留連通的外部路網。

- 臺北主要政策基地 24 → 46 個格點，新北 15 → 38 個格點。
- 臺北 12 個主要園區，新北 9 個；環島方向最大空缺均小於 90 度。
- 剩餘零散地塊設置候車區、親子遊戲區、運動場、照護庭院、防災及文化設施，連結最近的政策主題。
- 大幅減少一般建築及整片填樹的空地，保留沿岸與湖畔植栽。
- 全部政策建築及附屬設施的實際三維邊界均須落在基地內。

Logo、介面比例、手機臺北預設／Home 與雙市全景相機沿用前版。人車模型及數量保留。模型是政策主題的示意設施，非實際位置或建設承諾。

## 重建與驗證

```sh
python tools/build_policy_district_preview.py
python tools/check_policy_district_data_v044.py
python tools/check_policy_districts_v044.py --no-screenshots
python tools/package_site.py
```

最後一個瀏覽器測試省略 `--no-screenshots` 可輸出電腦／手機實際 WebGL 畫面至 `out/v044-*.png`。測試環境需 Playwright、Chromium 與本地 Three.js。

`tools/plan_policy_districts_v044.py` 使用標準函式庫求解基地；凍結湖泊格點來源在 `v044-park-footprints.json`。建置器只在暫存目錄改寫既有生成器，最後輸出 `v044-*` 和版本化新入口，避免覆寫以前版本。
