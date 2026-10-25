# 北北基桃與模型細節獨立預覽

正式網站維持原樣。入口為 [city-review.html](https://soulfyai.github.io/tpencore2026/city-review.html)，臺北仍連至已確認的 `taipei-city.html?v=3`；其他三市使用 `regional-city.html?city=newtaipei`、`city=keelung`、`city=taoyuan`。

## 各市內容

| 城市 | 政策主題 | 條目 | 地標 | 樹木 | 行駛車輛／民眾 |
| --- | ---: | ---: | ---: | ---: | ---: |
| 新北 | 9 | 56 | 5 | 1,274 | 26／89 |
| 基隆 | 15 | 51 | 5 | 755 | 26／89 |
| 桃園 | 14 | 42 | 6 | 960 | 26／89 |

各市保留既有政策 ID、內容、來源與政見／政績區分。從正式資料唯讀匯出輪廓、道路、地標，座標以各市中心歸零。新北黃、基隆粉、桃園紅用於介面與標牌。政策場景按類別配置醫療、托育、產業、港灣、防災、社區等建築；建築與路線均為示意，並不表示實際位置或政策已完成。

沿用臺北已確認的合併街廓、多樣建築、連續路網、材質標線、密植、自然池湖與背景雲層。每市四處水域、兩架飛機；飛機高度避開建築，動態可暫停，尊重減少動態偏好。保留日景／夕陽、畫質、原生旋轉縮放與政策來源面板。

## 模型細節

[model-study.html](https://soulfyai.github.io/tpencore2026/model-study.html?model=aircraft) 提供飛機、轎車、公車、成人、孩童、長者及合照七個選項。可查看機頭、引擎、機尾、輪圈、臉部與髮型，切換正側背頂視角、線框及底座。手動操作會停止自動旋轉；合照維持人物相對比例。

飛機是從正式頁面現有 `CITY3D.PEOPLE.planes` 的 shuttle 模型克隆匯出，而非另畫示意圖；車輛與人物使用新三市預覽共用的 `review-models.js` 建構函式。飛機客艙目前是連續窗帶。此頁呈現目前模型品質，沒有以高細節圖片替代實際幾何。

## 建置與檢查

`tools/export_regional_previews.py` 刻意更新三市快照及飛機 JSON；不要在發布流程自動重匯資料。`tools/package_site.py` 將新預覽檔案複製至靜態發布目錄，不修改正式場景。NAS 既有更新腳本不下載這些新預覽檔，審查請使用 GitHub Pages 連結。

```sh
python3 tools/package_site.py
python3 tools/check_regional_previews.py
```

瀏覽器檢查需 Playwright、Chromium `/usr/bin/chromium` 與本機 `three@0.160.0`。檢查七個模型、局部視角、相對比例、原生操作、三市所有政策及來源、人車飛機移動、桌機／手機版與正式檔案未變。實際 WebGL 截圖輸出於 `out/`。三市保留道路亦已檢查單一連通分量與政策基地／地標避讓。
