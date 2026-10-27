# 專頁自動同步更新
1. 解壓縮 tpencore-sync-update.zip。
2. 在 DSM「控制台 → 工作排程器」查看原本 TPEncore 自動更新工作的指令，確認 synology-update.sh 的實際路徑。
3. 用此新版 synology-update.sh 覆蓋該路徑的舊檔（先保留一份備份）；不必修改排程參數或網站根目錄。
   先前範例路徑是 /volume1/scripts/tpencore/synology-update.sh；以你的工作設定為準。不要只放進 web/tpencore，除非排程原本指向那裡。
4. 在工作排程器選該工作，按「執行」。檢查既有 update.log 是否成功。

新版會同步 chiang-wan-an.html、robots.txt、sitemap.xml、llms.txt 及原有首頁與政策清單。
第一次執行新版會強制刷新，即使版本號相同；之後版本不變且檔案齊全就略過。
下載途中任一檔案失敗不會開始替換。每個檔案原子替換；這並非整站交易式切換。
保留原有音樂、site-config.json、計數資料庫及 DNS 驗證記錄。
腳本不會自動更新自己，這次需手動替換一次。
