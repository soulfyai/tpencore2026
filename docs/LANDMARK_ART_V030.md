# 地標模型美術 v0.3.0

本次交付是「模型資產替換」的第一個可驗收項目，不代表全市美術或真實行政地理已完成。

- 正式站及 district-craft-v0.2.0 保留；獨立頁 landmark-art-v0.3.0.html。
- 原創 Blender 建模腳本：tools/art/build_taipei101.py。
- 實際匯入 Three.js 的資產：assets/art-v030/taipei101-v1.glb。
- 八段外傾塔身、逐層玻璃分格、垂直窗框、設備層、裝飾環、觀景層、塔冠與尖塔。
- 裙樓有石材、零售玻璃、分層水平線、入口雨棚、屋頂設備與植栽。
- 材質分組匯出，避免每個玻璃窗各自成為一個繪製呼叫。
- 不使用外部付費模型。是依辨識特徵建立的美術重建，不是建築測繪資料。
- 同鏡頭、同光照下切換新舊模型；地標全貌、帷幕近看、地面商場三個視角。
- 維持原地標的世界座標與高度，國旗位置不變；以新舊幾何聯集作為填充建築的避讓範圍。

重新產生資產：blender -b --python tools/art/build_taipei101.py
產生預覽：python tools/build_landmark_assets_v030.py
測試：python tools/check_landmark_assets_v030.py

模型未完成項目：全市一般建築資產庫、松山機場、橋梁專屬資產、依真實河道/山區重建的行政地理。此版本不把以上項目標示為完成。
