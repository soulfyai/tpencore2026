# 臺北市獨立美術預覽

2026-10-25｜等待使用者檢視與確認，尚未套用正式城市。

預覽入口：<https://soulfyai.github.io/tpencore2026/taipei-preview.html?rev=1>

## 範圍

- 沿用正式版臺北島輪廓、160 個方形街區、17 個主題（9 政見／8 政績）與16個地標位置；海岸、街區配置為網站縮尺島，非真實導航。
- 延伸已發布街角樣板的草地、葉片樹冠、住宅陽台、公共建築、人物與材質，加入全市街道、公園綠化及白天／夕陽光影。
- 政策清單涵蓋原有62筆條目，保留原文字、政見／紀錄區分與來源；地圖標牌及街區可開內容，全部條目在可捲動面板內閱讀。
- 提供全市、地標區、育兒街角、綠地四個視角，自由旋轉縮放、標牌顯示及高／標準畫質。
- 建築與植栽為美術預覽，非已落實政策或真實設施的新主張；尚無角色建立、任務、玩家移動或新增統計。

## 與正式站隔離

正式 `index.html`、`index3d.html`、`3d/`、`data/` 和先前的 `street-test` 均不修改。只新增獨立預覽檔與封裝清單，維持現有正式版本號。部署至 GitHub Pages 的獨立網址；既有 NAS 更新器不下載這組新增檔，不能聲稱 NAS 已有此預覽。必須待使用者確認後才另行整合／替換正式模型。

## 檔案與更新

- `prototypes/taipei-preview.html`／`.js`：獨立介面與全市渲染。
- `prototypes/street-art-kit.js`：街角樣板衍生的材質與組件，不改舊樣板。
- `prototypes/taipei-landmarks.js`：既有地標造型的獨立快照。
- `prototypes/taipei-preview-data.json`：既有城市位置與政策快照，含來源查核日與來源 commit。
- `tools/export_taipei_preview.py`：明確 UTF-8 的瀏覽器快照匯出；刻意更新快照時才執行，不在 CI 自動重排。需要 Playwright、Chromium 與本機 Three.js。
- `tools/check_taipei_preview.py`：實際 WebGL 截圖與原生按鍵、來源、地標、旋轉縮放、標牌避讓、關閉、捲動、窄視窗及正式檔案未變檢查。截圖位於 `out/taipei-preview-*.png`。

此版為完整城市的第一輪美術審查，並非先前生成圖片的逐像素重製，也未代表四城改版已完成。
