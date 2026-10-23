# 北北基桃政策城市 (tpencore2026)

獨立整理，非任何候選人或政黨官方網站。

北北基桃四位國民黨市長參選人的政見與任內政績，以模擬城市（SimCity BuildIt）風格的 3D 島嶼呈現。

- `3d/`：Three.js 3D 場景原始碼（core / world / env / models / models2 / models3 / landmarks / ships / decor / people / coaster / main / ui，樣式在 page.css）
- `data/`：政見、政績、跨市協作與行政區輪廓（geo.json，內政部開放資料）
- `template.html`：頁面骨架與 2D 資料面板
- `build.py`：合併資料並輸出單檔 `index.html`（2D）與 `index3d.html`（3D）

建置：`python3 build.py`

驗證（已安裝 Playwright、Chromium 與本機 Three.js 後）：

```bash
CHROMIUM_EXECUTABLE=/usr/bin/chromium python3 tools/shot.py --check mobile
CHROMIUM_EXECUTABLE=/usr/bin/chromium python3 tools/shot.py '{"out/day":"MAP3D.panorama()"}'
```

截圖工具自動啟動 UTF-8 本機 HTTP 伺服器、停用動畫排程，再呼叫完整畫格的 `CITY3D.snapshot()`，保留相機、霧距、人物與燈光更新。`--check` 會驗證十種人物角色、動態矩陣、船與飛機動畫、具名雙橋間距／過水／不交叉，以及手機招牌完整可見。手機預設降低像素倍率並停用陰影；桌機保留陰影。
