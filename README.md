# 北北基桃政策城市 (tpencore2026)

獨立整理，非任何候選人或政黨官方網站。

北北基桃四位國民黨市長參選人的政見與任內政績，以模擬城市（SimCity BuildIt）風格的 3D 島嶼呈現。

- `3d/`：Three.js 3D 場景原始碼（core / world / env / models / landmarks / ships / decor / people / coaster / main / ui）
- `data/`：政見、政績、跨市協作與行政區輪廓（geo.json，內政部開放資料）
- `template.html`：頁面骨架與 2D 資料面板
- `build.py`：合併資料並輸出單檔 `index.html`（2D）與 `index3d.html`（3D）

建置：`python3 build.py`
