# AI萬安 widget：待確認的 github.io 預覽方案

2026-10-30，Asia/Taipei。此文件為提案，尚未發布預覽或修改 main。

## 工作分支與驗證

`feature/wanan-widget` 套用 `wanan_digitwin/feature/chatbot-core` 的
`deploy/tpencore/0001-wanan-widget.patch`。這個補丁會讓 package_site 的正式四頁加入 widget，
因此**不可用整支分支合併 main 的方式發布預覽**。

本輪完整建置與 `tools/check_wanan_widget.py out/site` 通過；與 main 68838d0 的建置逐檔比對：
四頁各只增加一行 script，其他公開頁面、預覽及同步清單內容不變。
`version.json` 的 commit/建置時間不同；候選人下載 ZIP 內的候選人頁也包含該行，
ZIP 時間戳不作內容差異。聊天專案完整 Python 測試 194 項通過。
本輪尚未重跑網站桌機／手機視覺驗收，也未以 github.io 呼叫真實聊天服務。

## 建議發布方式：獨立四頁副本

1. 從當時最新 `origin/main` 另開 `preview/wanan-widget-v0.1.0`，不 cherry-pick 正式四頁注入補丁。
2. 先建立未注入的 main 基準建置。新增預覽 builder，只複製這四份產物到網站根目錄的獨立檔名：
   - `wanan-widget-v0.1.0-index.html`
   - `wanan-widget-v0.1.0-index3d.html`
   - `wanan-widget-v0.1.0-2d.html`
   - `wanan-widget-v0.1.0-chiang-wan-an.html`
3. 僅在上述副本加入 widget、`noindex,nofollow` 與自指的預覽 canonical；
   將四頁間的站內導覽改指預覽副本，避免測試時跳回正式頁。
   使用根層獨立檔名可沿用既有資產相對路徑，減少子目錄解析錯誤。
   不改 sitemap、正式入口、正式四頁及舊預覽。
4. 加入建置檢查：正式四頁與基準 SHA-256 完全相同、沒有 widget tag；
   四個預覽各恰有一次 tag、含 noindex、獨立整理聲明及正確導覽。
   NAS updater 只抓固定檔名，預覽檔不加入同步清單。
5. 桌機／手機截圖驗收四頁，檢查 3D 控件、統計卡、聊天展開／收合與頁面錯誤。
   UI 替身測試與真實模型測試分開記錄，不能以替身冒充模型驗證。
6. 完成上述可審查提交與差異報告後，**取得使用者明確同意才推 main**。
   main 仍會觸發現有 Pages 與 NAS 同步，但正式四頁必須維持原始內容。
   不手動觸發 Pages、不調整部署分支限制。

核准並發布後，預計入口（目前尚未發布，勿當成可用網址）：
`https://soulfyai.github.io/tpencore2026/wanan-widget-v0.1.0-index.html`。

## 真實試聊前的 NAS 設定

由使用者在 10.0.1.108 的 `/volume1/docker/wanan/wanan.env` 暫時設定純文字：

```dotenv
ALLOWED_ORIGINS=https://tpencore.tw,https://soulfyai.github.io
```

重啟 `wanan-chat`，驗證 github.io 的 OPTIONS／POST 及串流。
這是兩個以逗號分隔的 origin，沒有 Markdown 連結、方括號或路徑。
測完恢復 `ALLOWED_ORIGINS=https://tpencore.tw` 並重啟。
Codex 本輪未連線 NAS、未變更設定、未搬移金鑰。

另請使用者確認 `nas-update.sh` 每五分鐘排程已啟用，並提供一次成功同步的時間與非敏感結果；
目前只能記為待確認，不能推定 GitHub 更新已到 NAS。

## 正式整合是下一次獨立核准

github.io 預覽通過不等於正式上線核准。
正式四頁 widget 必須再經使用者確認才合併 `feature/wanan-widget`；
若 main 在此期間新增預覽 builder，需先整合並重跑檢查。
