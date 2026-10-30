# 萬安聊天正式網站發布（2.4.0）

使用者於 2026-10-30 明確核准「可以更新正式網頁和 NAS」。本輪將已核准的獨立預覽體驗套入正式四頁，不再限於預覽。

`tools/package_site.py` 先建立獨立預覽，再由 `tools/promote_wanan.py` 在正式四頁內嵌 widget、版位調整及話題資料。正式頁保留原 canonical、SEO、站內連結，不帶預覽的 noindex。NAS 原本只同步固定 HTML 清單，因此沒有引入需要修改同步腳本的新本地資產依賴。API 與人像仍讀 `https://chat.tpencore.tw`，現有服務不可用時會如實顯示錯誤。

- 3D：音樂預設關、兩行非官方資訊卡、政策選單的十大網路話題。
- 四頁：右側萬安入口、桌機政策視窗避讓、聊天捲動、重新聊天話題、藍色霓虹焦點、五點動畫、Powered by SoulfyAI、禁用破折號前端處理。
- 話題資料為本次發布內嵌快照，不是每日自動更新或聲量排名；後續須重新建置發布。
- 保留目前 `site-config.json` 與本地音樂，沿用現有 `synology-update.sh` 行為。

## 驗證與發布

```sh
python3 tools/package_site.py --output out/wanan-production
python3 tools/check_wanan_production.py out/wanan-production
```

依既有 main → GitHub Pages → NAS 同步發布。Pages 成功不等於 NAS 已同步，必須另查 tpencore.tw 的 version.json 與正式 HTML。聊天後端版本由另一個儲存庫發布，不能因網站更新就宣稱新知識庫已在 NAS 啟用。

## 回復

發布前 main 為 `59ff6df2733e8f42664e5408f087737508bf7f47`，包含使用者最新社群預覽圖。若聊天介面造成問題，優先以新 PR 移除 package_site.py 中 `promote_wanan(output)` 的呼叫並改版號，再正常發布；獨立預覽仍保留，原始 3D 產生流程會還原正式頁。勿直接 force push 或刪除 NAS 的本地音樂／設定／計數資料。也可針對本次發布提交做 revert，需保留之後的新修改。
