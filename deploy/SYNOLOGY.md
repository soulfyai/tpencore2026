# tpencore.tw：Synology Web Station 部署

城市網站本體為靜態內容，不需要 Node.js；新增的瀏覽計數器使用 PHP／SQLite，啟用方式見本文末段。這份文件採 DSM 7 的名稱，實際選單可能因版本不同。

## 首次設定

1. 在套件中心安裝 Web Station、Nginx／Apache（使用 Web Station 的預設靜態服務即可）。
2. 在 File Station 建立專用目錄，例如 `/volume1/web/tpencore`。Web Station 的服務帳號 `http` 需有讀取權限；排程更新用的帳號只需能寫入此目錄。
3. 將部署 ZIP **裡面的檔案**解壓至該目錄，讓 `index.html` 位於根目錄。保留既有 `music/tpencoretheme.mp3`；若 MP3 原本在其他 Web Station 資料夾，請移入此網站的 `music/` 子目錄。
4. 在 Web Station 建立「靜態網站／Web 服務」，文件根目錄選此目錄，預設文件為 `index.html`。在「網頁入口／Web 入口」設定名稱型虛擬主機，主機名稱 `tpencore.tw`，連接埠 80／443，綁定剛建立的服務。
5. LAN 內先測試網站。外網發布時，路由器將 TCP 80、443 轉至 NAS 的固定 LAN IP；NAS 防火牆允許這兩個 Web 連接埠。DSM 的 5000／5001 和 SSH 22 不需要對外開放。

若公司線路沒有可接受外部連線的固定／浮動公網 IP（例如 CGNAT），需先向網管／ISP 確認可用的發布方式；不要把內網 IP 填入公網 DNS。

## HiNet DNS

將以下「公司公網 IPv4」換成路由器的真實 WAN IP，本 session 尚未取得該 IP。

| 類型 | 名稱 | 值 |
| --- | --- | --- |
| A | @ 或空白（依 HiNet 介面） | 公司公網 IPv4 |
| CNAME（選用） | www | tpencore.tw |

若使用 `www`，需一併建立入口名稱／重新導向及憑證。只在確定 NAS 已有可用公網 IPv6 與防火牆規則時才設定 AAAA；移除指向其他舊主機的網站 A／AAAA。**保留公司郵件 MX／TXT。** 不要再將此網域指向 GitHub Pages。

## HTTPS

DNS 已指向公司且外部 TCP 80 可到 NAS 後，在 DSM「控制台 → 安全性 → 憑證」申請 Let's Encrypt 憑證，名稱 `tpencore.tw`，需要時加入 `www.tpencore.tw`。將憑證指定給此 Web Station 入口，驗證 HTTPS，再設定 HTTP 導向 HTTPS。續期時仍需讓驗證路徑可以由外網存取。

## 音樂

`site-config.json` 已設定：

```json
{"musicUrl":"https://tpencore.tw/music/tpencoretheme.mp3","musicAutoplay":true}
```

直接開此 MP3 網址應可正常播放；不可跳到 DSM 登入頁。Web server 應送出 `audio/mpeg`。有 Range 請求支援可改善串流／拖曳，但本網站只循環播放。音樂預設嘗試自動播放；瀏覽器阻擋時，第一次點選畫面或按鍵會啟播。使用者在工具列按「音樂」暫停後，本次頁面不會因其他點擊自動恢復。可設 `musicAutoplay:false` 改為完全手動播放；舊設定檔未含此欄位時也預設啟播。自動播放遇到連線失敗時不會阻擋網站；手動點選音樂可重試並取得失敗提示。

## GitHub → NAS 自動更新

不必把 NAS 開放給 GitHub runner；讓 NAS 主動拉取 GitHub Pages 已建置且發布成功的版本。流程是工作分支 → 測試 → main → GitHub Actions／Pages → NAS 排程拉取。此機制不依賴 cloud session 持續在線。

1. 將 `synology-update.sh` 放在網站目錄以外，例如 `/volume1/scripts/tpencore/synology-update.sh`。
2. DSM「控制台 → 工作排程器」新增「使用者定義指令碼」。使用僅有網站寫入權限的帳號，每 5 分鐘執行（可依負載調整）：

```sh
/bin/sh /volume1/scripts/tpencore/synology-update.sh /volume1/web/tpencore
```

3. 第一次先手動「執行」，查看工作結果。此腳本更新網站 HTML、計數程式與版本檔；已存在的 `site-config.json` 與 `music/` 都保留。下載失敗或下載期間來源版本改變時不發布下載內容。每份 HTML 以同一檔案系統內的 rename 原子替換。
4. 用 `https://tpencore.tw/version.json` 的 commit 與 GitHub Pages 比對，並測試全景、城市、政策、點地圖關閉、音樂與 HTTPS。

GitHub Pages 暫時維持作為可預覽的發布來源。勿停用 Pages；若未來移除，先將來源改為另一個穩定的靜態發布端點。

## Cloud session

環境恢復時沿用 repo 的 build／截圖流程，不需 NAS 管理密碼或常駐背景程序。之後修改推到 main 並經 Pages 成功發布，NAS 下次排程即會更新。部署到真正 NAS、DNS 與憑證是否生效，必須以該 NAS／公網的實際測試為準；此文件和部署 ZIP 不表示上述設定已在 NAS 完成。

## 無 Cookie 的瀏覽計數器

這是累積「瀏覽次數」，每次載入頁面加一；重新整理也會增加，不宣稱是獨立訪客數。程式不使用 Cookie、session、瀏覽器儲存、IP 或裝置指紋，只保存一個累積整數。GET 查詢不增加，網頁只在新載入時 POST 一次。

1. 套件中心安裝 NAS 支援的 **PHP 8.2 或更新版本**。
2. Web Station → 指令碼語言設定／PHP 設定檔，啟用 **PDO、pdo_sqlite**（保持 `session.auto_start=0`）。將此網站從純靜態服務改用啟用該 PHP 設定檔的 Web 服務，文件根目錄沿用原資料夾，網站入口仍綁 `tpencore.tw`。
3. 在 DSM 建立網站根目錄以外的共用資料夾 **`tpencore-data`**，例如 `/volume1/tpencore-data`，給 Web Station 服務帳號 `http` 讀寫權限。**不要放在 `web/tpencore` 裡**。PHP 的 `open_basedir` 若有限制，加入此目錄；保留原有網站／暫存目錄允許路徑。
4. 部署包已包含 `counter.php`。預設資料庫為 `/volume1/tpencore-data/visits.sqlite`（網站在 `/volume1/web/tpencore`）；不同目錄配置可設定 PHP 環境變數 `TPENCORE_COUNTER_DB` 為私有資料庫完整路徑。
5. 開啟 `https://tpencore.tw/counter.php`，應看到類似 `{"ok":true,"views":0}` 的 JSON，不能是 PHP 原始碼或下載提示。這個 GET 不計次。若回 `counter_unavailable`，先檢查 PHP SQLite 擴充、資料夾權限及 `open_basedir`。
6. 網站不顯示瀏覽次數，只在背景計數。管理者可開啟 `https://tpencore.tw/counter.php` 查看累計數字；此端點目前沒有登入限制，知道網址的人也可查詢。切換城市／選單不會增加，重新整理會增加。計數服務失敗不影響網站其他功能。

不需修改既有 `site-config.json`：`tpencore.tw` 及子網域預設使用同站 `counter.php`。可設 `counterEnabled:false` 關閉，或以 `counterUrl:"counter.php"` 在其他同站網址測試。前端只接受同源端點，請求使用 `credentials:"omit"`。GitHub Pages 不執行 PHP，因此預覽站預設不顯示計數；公開來源 `counter.php.txt` 只是開源程式碼，不含金鑰或資料庫。

NAS 更新腳本會把 GitHub 已發布的 `counter.php.txt` 更新為 NAS 的 `counter.php`，只更新程式，不接觸網站外的計數資料庫。
