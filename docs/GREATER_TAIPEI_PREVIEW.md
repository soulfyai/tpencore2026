# 大台北範圍調整預覽

[開啟預覽](https://soulfyai.github.io/tpencore2026/greater-taipei.html?v=2)。此版本沿用正式站的地圖與介面，僅供確認；不替換正式網站，VERSION 維持 2.0.18。

## 沿用與調整

使用者要求優化迭代，已撤回先前重新製作圓形城市的方案。原臺北、新北海岸輪廓、相對位置、政策街區、政策建築、地標與操作方式均沿用正式站，不以新概念島嶼替代。

品牌副標改為「一起打造你我的大台北」，範圍只保留臺北、新北。初次進入與 Home 回到原生臺北市視角，全景仍可查看兩市。使用說明保持預設開啟。原招牌天際線、外框與主標保留，僅以文字層更新副標。

政策資料保留臺北 17 主題、新北 9 主題，合計 118 個政見／政績條目。移除範圍外的城市介紹、選單及完整細節敘述，保留正確地名「基隆河、基隆路」與既有來源連結；原始資料不變。原 2D 設計另輸出為 greater-taipei-2d.html，使用同一雙市範圍。

預覽配置關閉 counter，不增加計數。其餘功能沿用原生實作。

## 建置與驗證

```sh
python3 tools/build_greater_taipei_preserved.py
python3 tools/check_greater_taipei.py
python3 tools/package_site.py
```

建置器在暫存目錄複製正式來源後修改，不直接寫入正式 3d/、data/、template.html。使用原版匯出的 coast、cell、theme 配置鎖定兩市幾何，避免刪除另外兩市時重新計算布局。

WebGL 檢查直接載入正式 index3d.html 與預覽，比對兩市所有海岸座標、完整街區多邊形／主題指派、主題中心、政策建築包圍盒及地標位置／尺寸，容差 1e-8；另驗證臺北預設視角、兩市數量、內容範圍、預設說明、主題面板、手機寬度與瀏覽器錯誤。實拍在 out/preserved-*.png。

封裝只發布 greater-taipei.html、greater-taipei-2d.html、greater-taipei-config.json 三個預覽檔。NAS 原更新腳本不下載這些獨立入口。正式首頁的內容須與此次更改前保持相同；確認後才能規劃正式替換。
