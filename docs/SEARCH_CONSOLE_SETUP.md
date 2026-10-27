# tpencore.tw Google Search Console
1. 開啟 https://search.google.com/search-console ，用你的 Google 帳號登入。
2. 新增資源 → 網域 → 輸入 tpencore.tw（不加 https://）。
3. Google 會提供 google-site-verification=… TXT 記錄；到管理 tpencore.tw 的 DNS 服務商新增根網域 TXT，保留既有記錄。
4. 回到 Search Console 按驗證；DNS 生效時間依服務商而異。
5. 先將 tpencore-seo-files.zip 解壓到 NAS 目前網站根目錄，與 index.html 同層；不要另外建立子資料夾。只新增 robots.txt、sitemap.xml、llms.txt，不替換計數資料或音樂。
6. 開啟 https://tpencore.tw/sitemap.xml 確認可讀，再到 Sitemaps 提交 sitemap.xml。
7. 使用網址審查檢查 https://tpencore.tw/ 與 https://tpencore.tw/2d.html，執行即時測試後要求建立索引。
8. 查看「網頁」與「成效」報表追蹤收錄及實際搜尋字詞；提交不保證收錄、排名或處理時間。

llms.txt 是輔助說明，並非 Google 收錄必備，也不保證 AI 引用。核心內容仍是可讀政策全文、正確來源與日期。網域驗證與索引提交必須由擁有者帳號完成，不能宣稱已提交。
