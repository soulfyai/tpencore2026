# 台北安可｜北北基桃政策城市

獨立整理，非任何候選人或政黨官方網站。

整理台北、新北、基隆、桃園四位國民黨市長參選人的公開政見與任內政績。以 3D 城市探索，也可使用原有 2D 政策地圖與文字面板查閱內容及原始來源。

- [橋梁與海空交通預覽 v0.4.6](https://soulfyai.github.io/tpencore2026/greater-taipei-v0.4.6.html?view=bridges)（關渡大橋、淡江大橋，24 艘船與 8 架飛機；[版本說明](docs/TRANSPORT_PREVIEW_V046.md)；未替換正式網站）
- [街區補齊預覽 v0.4.5](https://soulfyai.github.io/tpencore2026/greater-taipei-v0.4.5.html)（多式樣建築補齊空格、加密植栽、放大屋頂國旗；[版本說明](docs/STREET_INFILL_V045.md)；未替換正式網站）
- [政策街區預覽 v0.4.4](https://soulfyai.github.io/tpencore2026/greater-taipei-v0.4.4.html)（同類政策與戰績整併、放大政策設施並環島分散；[版本說明](docs/POLICY_DISTRICTS_V044.md)；待確認，未替換正式網站）
- [正式網站・3D 城市](https://tpencore.tw/)
- [封存預覽 preview-v0.4.0](https://soulfyai.github.io/tpencore2026/previews/preview-v0.4.0/?view=street)（固定完整資源；[版本說明](docs/PREVIEW_VERSIONS.md)）
- [行政區配置示意圖 01](https://soulfyai.github.io/tpencore2026/mockups/greater-taipei-admin-layout-01.png)（僅概念，未套用網站）
- [街景細節預覽・採用指定的騎樓街景概念](https://soulfyai.github.io/tpencore2026/greater-taipei.html?view=street&v=4)（正式站介面，尚未替換正式網站）
- [大台北改版預覽・臺北與新北](https://soulfyai.github.io/tpencore2026/greater-taipei.html?v=4)（保留正式站介面與 Logo 比例，整合已確認的新美術；雙市預覽待確認）
- [2D 政策地圖與文字導覽](https://tpencore.tw/2d.html)
- [提供資料／回報問題](https://github.com/soulfyai/tpencore2026/issues/new/choose)
- [貢獻指南](CONTRIBUTING.md)
- [市民角色與政策任務完整企劃](docs/CITIZEN_GAME_PLAN.md)
- [臺北城市內容與構圖樣板](https://soulfyai.github.io/tpencore2026/taipei-composition.html?v=2)（操場、湖橋、碼頭、客船與帆船，獨立審查）
- [臺北生活街區細節樣板](https://soulfyai.github.io/tpencore2026/taipei-detail.html?v=1)（實際3D模型，騎樓、立面、庭院與湖岸，獨立審查）
- [四市獨立美術預覽入口](https://soulfyai.github.io/tpencore2026/city-review.html)（臺北、新北、基隆、桃園，尚未替換正式網站）
- [飛機、車輛與人物細節](https://soulfyai.github.io/tpencore2026/model-study.html?model=aircraft)（實際模型，可旋轉、縮放與查看局部）
- [臺北市政策與都市生活預覽](https://soulfyai.github.io/tpencore2026/taipei-city.html?v=3)（政策主題建築、複合街廓、池湖與人車動態，尚未替換正式網站）
- [都市天際線建築範例](https://soulfyai.github.io/tpencore2026/skyline-study.html?rev=2)（複合街廓、自然湖泊與24–48層高樓，獨立審查）
- [臺北市全市美術預覽](https://soulfyai.github.io/tpencore2026/taipei-preview.html?rev=2)（待確認，尚未套用正式城市）
- [獨立 3D 街景美術測試](https://soulfyai.github.io/tpencore2026/street-test.html)（可旋轉／縮放、日景／夕陽）

台北藍、新北黃、基隆粉紅、桃園紅為四市識別。政策內容、來源及查核日期由共同資料產生，2D 與 3D 同步更新。發現內容有誤，請開 Issue 附上原始來源；提出建議不會直接修改網站。

## 原始碼與建置

- `data/`：政策、政績、跨市協作與行政區輪廓。
- `template.html`：2D 地圖與共用資料面板。
- `3d/`：Three.js 場景、模型、互動、音樂與樣式。
- `build.py`：驗證資料並生成 `index.html`（2D）、`index3d.html`（3D）。
- `assets/social-preview.jpg`：社群分享全景圖；可用 `tools/capture_social_preview.py` 從實際 3D 頁面重新擷取。分享設定在 `template.html`，圖片由既有 GitHub Pages 提供公開 HTTPS 網址。

```sh
python3 build.py
python3 tools/package_site.py
```

建置必須輸出 `no problems`。網站封裝在 `out/site/`：首頁為 3D，文字版為 `2d.html`。不要直接把儲存庫的 2D `index.html` 當成正式 3D 首頁。

安裝 Playwright、Chromium 與 `three@0.160.0` 後，可執行場景檢查：

```sh
CHROMIUM_EXECUTABLE=/usr/bin/chromium python3 tools/shot.py --check mobile
```

## 發布與 NAS 自動更新

開發分支為 `claude/modest-newton-t9y5uj`；通過檢查後更新 `main`。`.github/workflows/pages.yml` 監聽 `main`，建置並發布 [GitHub Pages 預覽](https://soulfyai.github.io/tpencore2026/)。NAS 每 5 分鐘拉取發布檔，無需 cloud session 常駐。

- [NAS 自動更新快速指南](deploy/NAS_QUICK_START.md)
- [Web Station、網域與計數器設定](deploy/SYNOLOGY.md)
- [正式網站版本](https://tpencore.tw/version.json)

即時天氣只顯示於城市資訊，不影響場景。計數器使用 NAS PHP／SQLite，需完成一次性設定；只計頁面載入次數，不使用 Cookie。資料查核日期須人工查核後更新。

Designed by TPEncore © 2026 · Contact / TPEncore2026@gmail.com

### Archived experiment: geography preview v0.5.0

[Review v0.5.0](https://soulfyai.github.io/tpencore2026/greater-taipei-v0.5.0.html) · [Street view](https://soulfyai.github.io/tpencore2026/greater-taipei-v0.5.0.html?view=street) · [Technical notes](docs/GEOGRAPHIC_PREVIEW_V05.md). Real relative administrative placement, continuous mainland and structurally diverse buildings; separate from production and frozen v0.4.0.

### Current review: v0.4.1 architecture diversity

[City street preview](https://soulfyai.github.io/tpencore2026/greater-taipei-v0.4.1.html?view=street) · [24 building types](https://soulfyai.github.io/tpencore2026/architecture-v041-types.html). Uses the v0.4.0 map, policy campuses, existing towers and native UI; ordinary street buildings use different massings and facade systems. Production and the frozen v0.4.0 preview remain unchanged.

### Mobile opening preview v0.4.2

[Open the city](https://soulfyai.github.io/tpencore2026/greater-taipei-v0.4.2.html). Portrait phones open on the closer diagonal Taipei city view; Home returns to the same frame. Desktop/landscape, geometry, buildings, UI and frozen earlier previews are retained. `?view=street` is still available for deliberate close-up review.

### Mobile panorama preview v0.4.3

[Two-city panorama](https://soulfyai.github.io/tpencore2026/greater-taipei-v0.4.3.html?view=panorama) · [Ordinary Taipei opening](https://soulfyai.github.io/tpencore2026/greater-taipei-v0.4.3.html). Phone Full View uses the reference two-island composition; Home retains the v0.4.2 Taipei frame. Desktop, models and earlier previews remain unchanged.
