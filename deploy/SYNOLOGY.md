# tpencore.tw：Synology Web Station 部署

目前網站為純靜態內容；不需要 PHP、Node.js 或資料庫。這份文件採 DSM 7 的名稱，實際選單可能因版本不同。

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
{"musicUrl":"https://tpencore.tw/music/tpencoretheme.mp3"}
```

直接開此 MP3 網址應可正常播放；不可跳到 DSM 登入頁。Web server 應送出 `audio/mpeg`。有 Range 請求支援可改善串流／拖曳，但本網站只循環播放。音樂預設關閉，使用者按右上工具列的「音樂」才開始播放，再按可暫停。網址尚未可用時會提示播放失敗，網站不受影響。

## GitHub → NAS 自動更新

不必把 NAS 開放給 GitHub runner；讓 NAS 主動拉取 GitHub Pages 已建置且發布成功的版本。流程是工作分支 → 測試 → main → GitHub Actions／Pages → NAS 排程拉取。此機制不依賴 cloud session 持續在線。

1. 將 `synology-update.sh` 放在網站目錄以外，例如 `/volume1/scripts/tpencore/synology-update.sh`。
2. DSM「控制台 → 工作排程器」新增「使用者定義指令碼」。使用僅有網站寫入權限的帳號，每 5 分鐘執行（可依負載調整）：

```sh
/bin/sh /volume1/scripts/tpencore/synology-update.sh /volume1/web/tpencore
```

3. 第一次先手動「執行」，查看工作結果。此腳本只更新網站 HTML／版本檔；已存在的 `site-config.json` 與 `music/` 都保留。下載失敗或下載期間來源版本改變時不發布下載內容。每份 HTML 以同一檔案系統內的 rename 原子替換。
4. 用 `https://tpencore.tw/version.json` 的 commit 與 GitHub Pages 比對，並測試全景、城市、政策、點地圖關閉、音樂與 HTTPS。

GitHub Pages 暫時維持作為可預覽的發布來源。勿停用 Pages；若未來移除，先將來源改為另一個穩定的靜態發布端點。

## Cloud session

環境恢復時沿用 repo 的 build／截圖流程，不需 NAS 管理密碼或常駐背景程序。之後修改推到 main 並經 Pages 成功發布，NAS 下次排程即會更新。部署到真正 NAS、DNS 與憑證是否生效，必須以該 NAS／公網的實際測試為準；此文件和部署 ZIP 不表示上述設定已在 NAS 完成。
