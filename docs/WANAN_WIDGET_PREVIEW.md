# 萬安獨立預覽 v0.1.0

2026-10-30（Asia/Taipei）。分支 `preview/wanan-widget-v0.1.0` 基於正式 main 68838d0，
沒有套用 `feature/wanan-widget` 對正式四頁的注入補丁。

新增四份根目錄預覽副本：`wanan-widget-v0.1.0-` 加上 `index.html`、`index3d.html`、
`2d.html`、`chiang-wan-an.html`。頁間連結指向副本；原有頁面內錨點保留。
每份副本有 noindex,nofollow、自指 canonical、原有獨立整理聲明及左側 widget。
widget 腳本固定為 wanan_digitwin@3f6a444 的來源，預覽版資產名稱獨立，
聊天 API 與人物圖片仍來自 https://chat.tpencore.tw/，不含金鑰、不搬移 NAS 設定。

## 重建與檢查

```sh
python3 tools/package_site.py --output out/wanan-preview
python3 tools/check_wanan_preview.py out/wanan-preview /path/to/clean-main-build
```

比對正式四頁、舊預覽、其他公開內容與 ZIP 內檔案，僅允許 version.json 建置資訊不同；
正式頁面與原站完全相同，預覽不加入 sitemap 或 NAS updater 固定清單。
main 的 Pages workflow 和既有 NAS 同步仍會執行，故發布需使用者明確核准。
本分支與正式四頁整合分支分開審查，不能用後者合併 main 來發布預覽。

## 發布與真實試聊待辦

目前尚未推 main、尚未發布。預計網址（發布前不可用）：
https://soulfyai.github.io/tpencore2026/wanan-widget-v0.1.0-index.html

由使用者在 NAS 10.0.1.108 的 wanan.env 暫設純文字：

```dotenv
ALLOWED_ORIGINS=https://tpencore.tw,https://soulfyai.github.io
```

並重啟 wanan-chat；測完改回 https://tpencore.tw 並重啟。
NAS 自動同步排程尚未確認啟用，不能推定 GitHub 的更新已送到聊天服務。
此預覽固定左側腳本，因此不依賴 NAS 已更新 widget.js 才能呈現左側入口。
本輪不操作 NAS、不合併聊天專案 PR #1、不改正式四頁。

## 本輪驗證結果

- 完整網站建置與原站逐檔內容檢查通過，四份正式 HTML 的 SHA-256 完全相同。
- Chromium 桌機 1280×800、手機 390×844，四頁共八個瀏覽器案例通過：左側入口、聊天開啟、替身 SSE 回覆、無頁面 JavaScript 例外；手機面板寬度填滿螢幕。
- 已檢視桌機 3D 與手機全螢幕聊天截圖。3D 測試使用本機 three@0.160.0；人物圖片用本機同版資產。
- 此為本機宿主頁與明確替身回覆，未驗證已發布 github.io、NAS CORS 或真實模型。尚無可用的公開預覽網址。


## 2026-10-30：預覽改回右側
依使用者最新偏好，四份獨立預覽的 data-wanan-side 改為 right；正式四頁與聊天服務設定不變。覆寫預覽位置，不修改固定 widget 腳本來源。


## 2026-10-30：回覆只保留最多五個來源連結
預覽widget更新自聊天專案f5d1bcd，移除政策／政績明細及成功檢索狀態文字，最多顯示五個安全且去重的相關連結；保留錯誤提示。只改獨立預覽資產，正式四頁不變。後台聊天彙整仍是提案，未蒐集任何對話。模型正文精簡指引需另由使用者更新NAS聊天服務，這次預覽不代表NAS已更新。

## 2026-10-30：音樂與政策視窗避讓

僅在獨立預覽的3D副本取消自動音樂及一般點擊觸發音樂，保留音樂按鈕手動播放。
桌機入口從右40px改右80px（向左一步40px）；政策側欄開啟時依側欄實際寬度移到左側並留16px間距，關閉後復位。
手機不使用桌機避讓，保留入口右20px與全螢幕聊天。此為預覽專屬layout adapter，不改NAS或正式四頁。
公開話題位置與審閱方案另見 WANAN_PUBLIC_TOPICS.md，尚未啟用蒐集或發布資料。

驗證：Chromium桌機1280×844使用實際政策清單按鈕開啟／關閉側欄，人形避讓與復位通過；手機390×844保留原位置，展開工具選單後可手動開啟音樂。兩種尺寸均驗證載入與一般地圖點擊不呼叫audio.play，只有音樂按鈕會呼叫；音訊方法採測試替身，未宣稱實際音檔播放驗收。已檢視桌機政策側欄與手機截圖，無頁面JavaScript例外。完整建置與原站逐檔檢查通過。
