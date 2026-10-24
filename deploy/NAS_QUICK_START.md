# 已部署網站的自動更新：只需在 NAS 設定一次

沿用現有 Web Station 網站，不需重新建站。本例網站根目錄 `/volume1/web/tpencore`；若你原本選了其他目錄，只替換最後一個參數。

1. 將 `synology-update.sh` 放進網站目錄外的資料夾，例如 `/volume1/scripts/tpencore/`。File Station 看不到 `scripts` 時，可在 DSM 共用資料夾先建立它。
2. 控制台 → 工作排程器 → 新增 → 排程的工作 → 使用者定義指令碼。
3. 一般：名稱 `TPEncore 自動更新`；選可寫入網站目錄、可讀取指令碼的使用者。
4. 排程：每天，首次 00:00，頻率每 5 分鐘，最後 23:55。
5. 工作設定的使用者定義指令碼：

```sh
/bin/sh /volume1/scripts/tpencore/synology-update.sh /volume1/web/tpencore >> /volume1/scripts/tpencore/update.log 2>&1
```

6. 儲存後先選此工作按「執行」。查看 `update.log`，成功會含 `TPEncore updated to ...`，版本相同會顯示 `already at the latest published version`。
7. 比對兩個網址的 version／commit：
   - NAS：`https://tpencore.tw/version.json`
   - GitHub 發布來源：`https://soulfyai.github.io/tpencore2026/version.json`

流程為 GitHub main → Actions 建置／發布 → NAS 拉取發布檔。NAS 不需要安裝 Git、Python，也不用開放 SSH 給 GitHub；不依賴 cloud session 常駐。每份 HTML 以原子替換避免下載到一半就被讀取，來源版本變動或下載失敗時保留已部署版本。

更新會保留 `music/`、已存在的 `site-config.json` 和網站外的計數資料庫。新版音樂在舊設定檔未指定 `musicAutoplay` 時也預設啟用，瀏覽器阻擋則等待首次點擊／按鍵；使用者按暫停後不會被其他點擊重啟。

新加入的計數器需另外一次性啟用 PHP／SQLite 與私有資料目錄；詳見 `SYNOLOGY.md`。未啟用計數器時，地圖、音樂與自動更新仍可正常使用。
