# Codex → Claude Code 交接（2026-10-24，Asia/Taipei）

## 先讀這裡

使用者最新指令：「wait，先打包目前的進度準備 handoff 回 Claude Code」。目前暫停部署，不再修改 DNS、啟用 Pages 或重跑發布。接手後依使用者的新指令繼續。

- 專案：`soulfyai/tpencore2026`，品牌「台北安可」。回覆使用繁體中文。
- 工作分支：`claude/modest-newton-t9y5uj`；不是 `main`。
- 打包前已推送的程式／部署進度：`a84f557ad8bbed1299b4d3c6335272556a5c44c8`。
- 本交接文件另外在本機提交，放入 bundle；打包期間不推送，避免再次觸發部署。以 bundle 分支的完整 HEAD 為準。
- 先讀本檔，再讀 `CLAUDE.md`、`HANDOFF.md` §0.0、`README.md`。`HANDOFF.md` §0.1–0.6 的「未完成／未驗證」主要是最初移轉的歷史快照，不能直接當成現在狀態。

## 程式已完成的部分

1. 網頁組已合併：收合品牌資訊窗、天氣移入資訊窗、置底獨立聲明；修正手機聲明遮住地標標籤按鈕。
2. 最新城市配色：台北藍、新北黃、基隆粉紅、桃園紅；切換按鈕、城市色點、2D／3D 使用相同識別色。黃／粉紅選中標籤改深色字。
3. 美術 WIP 已整合：沙灘設施成組與留白、岸線平滑、白色／玻璃藍建築、屋頂細節／太陽能／空中綠化、冷色 LED、方形政策底盤、雙發客機。
4. 六座跨島橋；關渡／淡江位於台北面向新北的正面。取消縮小雙橋間距的 fallback。檢查最小間距 15.7997，門檻 15.7402；具名橋過水，六橋不交叉。
5. 十種 chibi 人物：上班族、學童、長者、推嬰兒車家長、工人、登山客、撐傘行人、氣球小孩、跑者、購物者。低飽和衣服、instanced 配件；原車／船／飛機動畫程式段落保持不變。
6. 人物遠景 LOD：省略手臂、頭髮與配件；近景恢復。手機像素倍率上限 1.25，停用陰影，重用人物臨時向量。尚未量測實機 FPS。
7. 手機全景使用實際長寬比；城市招牌限制在畫面內並防重疊。全景仍是最遠縮放，台北居中。
8. 2D 跨市協作分頁會自動顯示連線；新北候選人卡顯示參考政績數。其 `achievements` 目前為空，所以如實顯示 0，沒有補造政績。

重要提交：`81c10fb` 網頁組、`fc7e400` 手機遮擋、`90065f9` 配色、`7b9c805` 美術整合、`64d883e` 人物／取景／驗證、`894250c` Pages 工作流程。遠端協作者的 `3ef19b3`、`e073721`、`3f4ef1d` 已合併，沒有用 reset 或 force push 覆蓋。

## 部署狀態：尚未上線

使用者最後選擇 GitHub Pages 免費方案，指定自訂網域 **`tpencore.tw`**，DNS 管理商為 **HiNet／中華電信**。NAS 只是討論過的替代方案，沒有取得或設定 NAS。

- 儲存庫已由 API 確認是 **public**，免費 Pages 適用。
- `.github/workflows/pages.yml` 已推送；推送工作分支後自動建置發布，另有 `workflow_dispatch`。
- `tools/package_site.py` 執行建置與來源驗證，僅打包 HTML、版本資訊與 `.nojekyll` 到 `out/site`。首頁為 3D，另有 `2d.html`、`index3d.html`、`version.json`；加入 UTF-8、`lang=zh-Hant` 與手機 viewport。
- 已確認的部署 run：<https://github.com/soulfyai/tpencore2026/actions/runs/39993206448>。checkout、Python、Build and validate public site **成功**；Configure GitHub Pages **失敗**；Upload／Publish **未執行**。
- API `GET /repos/soulfyai/tpencore2026/pages` 回覆 404；`POST` 啟用 Pages 回覆 **403 Resource not accessible by integration**。
- 現有 GitHub 連線可讀／推送，`admin=false`、`maintain=false`。原先 Git push 403 已解決；現在阻擋是 Pages 初次啟用權限，不能混為一談。
- 已請使用者以管理員到 <https://github.com/soulfyai/tpencore2026/settings/pages>：Source 選 **GitHub Actions**，Custom domain 設 **tpencore.tw**。尚未收到完成確認。
- Actions 發布使用官方 Pages actions；不需額外建立部署秘密。若 `github-pages` environment 有分支限制，需允許目前工作分支。
- 自訂 Actions workflow **不會因 CNAME 檔自動綁定網域**；GitHub 官方說明此模式會忽略 CNAME 檔。需設定 Pages 的 Custom domain；目前未建立 CNAME 檔。
- 不曾宣稱 Pages 或 `tpencore.tw` 已可閱覽；沒有完成 HTTPS 憑證或 Enforce HTTPS 驗證。

已交給使用者的 HiNet DNS 設定（尚未確認已套用）：

| 主機 | 類型 | 目標 | TTL |
|---|---|---|---|
| `@`／根網域留白 | A | `185.199.108.153` | 3600 |
| `@`／根網域留白 | A | `185.199.109.153` | 3600 |
| `@`／根網域留白 | A | `185.199.110.153` | 3600 |
| `@`／根網域留白 | A | `185.199.111.153` | 3600 |
| `www`（可選） | CNAME | `soulfyai.github.io` | 3600 |

公司郵件的 MX／TXT 不在本次網站變更範圍。曾嘗試解析 `tpencore.tw`／`www.tpencore.tw`，本環境回覆 temporary failure in name resolution；這不構成網域未註冊或 DNS 未設定的證據，需從可用網路重新查證。

## 環境與認證邊界

- GitHub HTTPS proxy／既有 `gh` 認證可用；不需要把 token 複製進檔案或交接包。
- 雲端設定草稿已加入 `api.github.com`、`soulfyai.github.io`、`tpencore.tw`。最後一次檢查 GitHub API 已可讀；`tpencore.tw` HTTPS 仍被環境代理拒絕。草稿儲存不等於全部網域已套用；Claude Code 的執行環境可能不同。
- 不要因環境代理 403 而判定網站本身故障，也不要因 Git 可推送就假設有 Pages 管理權限。
- 原 Claude Artifact：<https://claude.ai/artifact/Ssboakje3hi8UHQp4nHQQA>。本輪沒有發布它；其目前線上版本沒有重新查證。
- Artifact 的 `weather/now` 與原 Claude session 的每小時排程未遷移。Pages 版目前使用內建快照，沒有建立新的逐時天氣排程。

## 已驗證與限制

- `python3 build.py`：四市、55 個主題、128 個原始政見項目、15 案協作、229 筆來源，輸出 `no problems`。128 不是包含所有政績的總數。
- 3D module 的 Node 語法檢查、Python 編譯檢查、`git diff --check` 通過。
- 桌機日／夜完整畫格：11:00 路燈關，19:00 路燈開。`panorama()` 不會清除 `ENV.forced`；原問題是截圖跳過相機／霧距等完整畫格更新。
- `tools/shot.py --check mobile` 通過：十種人物、413 位行人、6 批配件、47 艘船、3 架飛機、遠近 LOD、動態矩陣、橋梁幾何、城市切換、手機聲明與招牌位置。
- 十種人物近景、桌機日夜、手機全景均已人工檢視；交接包附截圖。
- 2D 桌機 1400 與手機 400 寬：參考政績數、15 案／24 條協作線自動顯示通過。
- 真正 `out/site` 部署包已以本機 HTTP／Chromium 驗證：3D 首頁啟動、2D 55 區塊、UTF-8、真實手機 viewport 400、獨立聲明與版本 JSON。原始碼路徑／`.git/config` 回覆 404。
- 未驗證：實機 FPS、正式 Pages 發布、自訂網域 DNS／TLS、線上即時天氣。

## 還原與本機操作

Git bundle 含完整分支歷史，不含憑證。解壓交接包後可用：

```bash
git clone -b claude/modest-newton-t9y5uj tpencore2026.bundle tpencore2026
cd tpencore2026
git remote set-url origin https://github.com/soulfyai/tpencore2026.git
git status
python3 build.py
python3 tools/package_site.py
```

`repository/` 另附純原始碼快照，`website/` 可直接供靜態主機部署，但目前未被發布。`version.json` 記錄包內的 commit。不要把整個交接包或 repository/ 當成公開網站目錄。

一般開發環境需要 Python 3、Node/npm（安裝本機 Three.js）、Playwright 與 Chromium：

```bash
npm install --no-save --package-lock=false three@0.160.0
python3 -m venv .venv
. .venv/bin/activate
python -m pip install playwright==1.58.0
CHROMIUM_EXECUTABLE=/usr/bin/chromium python tools/shot.py --check mobile
```

Chromium 路徑依新環境調整；若用 Playwright 管理的已安裝瀏覽器，可省略 CHROMIUM_EXECUTABLE。勿沿用 Codex 容器 `/workspace/.tpencore-setup` 的絕對路徑作為新環境必要依賴。

## 使用者恢復部署工作後的順序

1. 先 fetch 檢查遠端是否又有新提交，保留並整合協作者工作；不要 force push。
2. 確認管理員已啟用 Pages／Source=GitHub Actions，再重跑 Deploy website；不要直接推論先前失敗已消失。
3. 確認 Pages Custom domain=tpencore.tw；查證 HiNet 的 A 記錄與可選 www CNAME。
4. 等 GitHub 憑證可用後啟用 HTTPS，驗證 3D、2D、聲明、手機與 version.json 的實際 commit。
5. 後續改動推送同一工作分支即可觸發自動更新；公開網址以實際 Pages 回傳與 DNS／TLS 驗證為準。

不要擅自把儲存庫改私人、切換到 main 發布或另開付費服務。回報已執行結果，不要只停在規劃，也不要把建置成功等同網站已上線。
