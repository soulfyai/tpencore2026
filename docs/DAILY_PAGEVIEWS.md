# 每日網頁瀏覽計數

網站2.4.2的 `counter.php` 保留既有 `views` 累積值，新增台北時區的今日計數。既有NAS更新腳本會同步 `counter.php.txt` 為網站 `counter.php`，版本更新後即可沿既有排程上線，不搬移或重建原SQLite檔案。

## API

使用 `GET https://tpencore.tw/counter.php` 取得：

- `ok`：資料是否可用。
- `views`：原有累積瀏覽數，維持相容。
- `today`：`date` 當日已接收的計數POST次數。
- `date`：台北日期，`YYYY-MM-DD`。
- `timezone`：固定 `Asia/Taipei`。
- `daily_tracking_started_at`：每日統計第一次啟用時間，含時區；不會每次查詢重設。
- `today_is_partial`：首次啟用日為true，代表該日僅自啟用後累積；隔日為false。false不表示系統未曾中斷，也不表示整日已結束，只表示沒有首日資料缺口。

GET不增加計數。符合來源限制的POST以同一SQLite交易更新累積與當日值。舊的總數不回填今日；首次升級即使已有大量累積值，今日從0開始。來源無法存取或資料庫異常回503，報告應顯示無法取得，不可補成0。

## 範圍與限制

自2.4.2起，正式四頁 `index.html`、`index3d.html`、`2d.html`、`chiang-wan-an.html` 都會計數，重新載入會再計一次。3D維持原有recordVisit，2D與候選人專頁新增同源計數，避免3D重複計數。新增兩頁只在tpencore.tw或www.tpencore.tw啟用，沿用site-config.json的counterEnabled與counterUrl，拒絕跨站計數目的地；GitHub預覽不計入。

舊累積views先前只涵蓋3D頁，因此它的歷史口徑與新版不同；不回推或重算舊總數。新每日today從本版啟用才開始，首日維持partial標示。這些都是頁面瀏覽次數，不是獨立訪客或登入人數。若網站停用計數、瀏覽器阻擋請求或網路中斷，將不計入，不能聲稱涵蓋所有實際訪問。

資料庫只新增 `daily_views(day,views)` 與 `counter_metadata(name,value)`，不保存IP、Cookie或使用者識別碼。每日資料保留90天；累積總數不因清理每日紀錄下降。沒有過去每日紀錄，無法重建歷史日報。

## 測試

`python3 tools/check_counter.py` 需PHP CLI及PDO SQLite；可透過 `TPENCORE_PHP_BIN` 指向可用的PHP執行器。測試涵蓋既有累積值遷移、首日標示、GET不增計數、40次並發POST、瀏覽器重新載入、Cookie/識別碼不保存、日期分隔、90天清理及程序重啟。
