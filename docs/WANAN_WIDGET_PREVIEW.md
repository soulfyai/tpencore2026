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
