# 街區美術 v0.2.0

此版本回應 v0.1.0 的整體美術差距，改為完整的湖岸親子街區構圖。
基準仍為 v0.4.12 城市場景；只替換 tp-childcare 政策基地。v0.1.0 原封保留。

- L 形退台親子館：真正不同高度的兩翼、陽台、屋頂花園及棚架。
- 弧形玻璃繪本室：圓角量體、曲面窗格、採光頂。
- 連棟商店：不同高度坡屋頂、屋瓦、窗面、遮棚與磚牆。
- 不規則湖岸：深淺水色、細紋法線、石岸、連續拱橋橋面與扶手。
- 園景：群落樹冠、花帶、鋪面路徑、遊具、長椅與燈具。
- 日間光影只在預覽調整，夜間與實際時間控制保留。
- 政策資料、Logo、UI、海岸、道路、橋梁、國旗與既有動態不變。

路徑：district-craft-v0.2.0.html
截圖比較：mockups/district-craft-v0.2.0-review.html

生成：python tools/build_district_craft_v2.py
測試：python tools/check_district_craft_v2.py（需 playwright、Chromium 與 localhost socket）
測試使用本機 Three.js 映射並抑制連續 loop，以軟體渲染擷取實際 WebGL 畫面；測試基地邊界、桌面/手機控制、無 JS 例外。這不是裝置 FPS 基準測試。

正式 promote_greater_taipei.py 仍指向 v0.4.12。只增加新的公開預覽資產，沒有將此樣板匯入正式頁。
