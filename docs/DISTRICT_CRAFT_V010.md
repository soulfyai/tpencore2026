# 街區美術 v0.1.0

基準：正式場景使用的 greater-taipei-v0.4.12.html / v049-art.js。
獨立預覽：district-craft-v0.1.0.html。正式入口與 VERSION 不變。

本次只替換臺北 tp-housing 與 urban-taipei:-2:-5 兩個原有基地的建築；保留城市岸線、道路、橋梁、地標、交通、政策資料及原有 Logo / UI。

- 居住基地：有真實柱廊空間的退台住宅、紅磚線腳街屋、遮陽百葉住宅。
- 鄰近商業基地：茶行、書店、食堂；不同高度與四面窗框。
- 花台、屋頂設備、棚架、背門與排水管、樹池及人行鋪面。
- 地面與所有模型均縮放置於原有可用基地範圍，不改道路。
- 街區近景、背面、俯瞰、全景；可自由旋轉、縮放。預設白天方便檢視材質。

示意店名不代表真實商家；此處不是實際地籍或建築復原。未達最終美術成品，先驗收實際 3D 細節，再決定是否擴展。

生成：python tools/build_district_craft.py
驗證：/workspace/.tpencore-setup/venv/bin/python tools/check_district_craft.py
完整封裝：python tools/package_site.py

撤回預覽僅需移除 package_site.py 中此預覽 builder 與三個複製檔名；無須回復正式城市。
