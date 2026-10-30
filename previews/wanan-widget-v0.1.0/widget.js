// 萬安陪你說：可嵌入任何同源頁面的角落聊天入口。
// <script src="/wanan/widget.js" data-wanan-base="/wanan/" defer></script>
// 也可整段內嵌在單一頁面，此時以頁面網址為基準，並可用 data-wanan-figure 帶入 data:image 圖片。
// 所有資源與 /api/chat 都由 base 組出；樣式在 Shadow DOM 內，不影響宿主頁面。
(() => {
  const script = document.currentScript;
  if (!script || document.querySelector('wanan-widget')) return;
  // An inline script has no src; its page address is the base instead.
  const base = new URL(script.dataset.wananBase || '.', script.src || location.href);
  // The chat service may live on its own HTTPS host (chat.tpencore.tw); it only
  // answers sites on its allowlist. Plain-HTTP hosts elsewhere are refused.
  if (base.origin !== location.origin && base.protocol !== 'https:') {
    console.warn('萬安聊天：data-wanan-base 必須與頁面同源，或是 HTTPS 網址；未載入。');
    return;
  }
  const side = script.dataset.wananSide === 'right' ? 'right' : 'left';
  const bottom = Math.min(Math.max(Number.parseInt(script.dataset.wananBottom || '40', 10) || 40, 0), 400);
  const api = new URL('api/chat', base).href;
  // A self-contained page may embed the figure; only inline image data is accepted.
  const embedded = script.dataset.wananFigure || '';
  const figure = embedded.startsWith('data:image/') ? embedded : new URL('widget-character.webp', base).href;

  const host = document.createElement('wanan-widget');
  host.style.cssText = 'position:fixed;z-index:2147483000;inset:auto;pointer-events:none;';
  const root = host.attachShadow({mode: 'open'});
  root.innerHTML = `
<style>
:host{--ink:#14253e;--muted:#5b6b7f;--line:#d9e2ec;--brand:#173b5a;--soft:#f3f7fb;--warn:#a33a2c;
  font:15px/1.6 system-ui,-apple-system,"PingFang TC","Noto Sans TC","Microsoft JhengHei",sans-serif;color:var(--ink)}
*{box-sizing:border-box}
button,textarea{font:inherit;color:inherit}
.launcher,.panel{pointer-events:auto;position:fixed;${side}:max(40px,env(safe-area-inset-${side}));bottom:calc(${bottom}px + env(safe-area-inset-bottom))}
.launcher{display:flex;flex-direction:column;align-items:center;padding:0;border:0;background:transparent;cursor:pointer;touch-action:manipulation}
.launcher img{display:block;width:auto;height:264px;filter:drop-shadow(0 4px 8px rgba(20,37,62,.35));transition:transform .15s ease-out}
.launcher:hover img{transform:translateY(-3px)}
.launcher .tag{margin-top:2px;white-space:nowrap;padding:0 8px;border-radius:999px;background:var(--brand);color:#fff;font-size:11px;line-height:18px}
.launcher:focus-visible,.panel button:focus-visible,.panel textarea:focus-visible{outline:3px solid #f2b705;outline-offset:2px}
.launcher[aria-expanded="true"]{display:none}
.panel{display:flex;flex-direction:column;width:min(400px,calc(100vw - 32px));height:min(620px,calc(100vh - ${bottom}px - 40px));
  border:1px solid var(--line);border-radius:18px;background:#fff;box-shadow:0 12px 40px rgba(20,37,62,.3);overflow:hidden}
.panel[hidden]{display:none}
header{display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid var(--line);background:var(--soft)}
header img{width:auto;height:48px;margin:-4px 0}
.title{flex:1;min-width:0}
.title strong{display:block;font-size:15px}
.title small{display:block;color:var(--muted);font-size:11px}
.icon,.reset{min-width:44px;min-height:44px;border:0;border-radius:10px;background:transparent;cursor:pointer}
.reset{font-size:12px;color:var(--muted)}
.icon{font-size:22px;line-height:1}
.log{flex:1;overflow-y:auto;overscroll-behavior:contain;padding:12px;display:flex;flex-direction:column;gap:10px}
.intro{text-align:center;color:var(--muted);font-size:13px;padding:8px 4px}
.chips{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-top:8px}
.chips button{min-height:36px;padding:4px 10px;border:1px solid var(--line);border-radius:999px;background:#fff;cursor:pointer;font-size:13px}
.msg{max-width:88%;padding:8px 12px;border-radius:14px;white-space:pre-wrap;overflow-wrap:anywhere}
.user{align-self:flex-end;background:var(--brand);color:#fff}
.assistant{align-self:flex-start;background:var(--soft)}
.assistant.error .note{color:var(--warn)}
.label{display:block;color:var(--muted);font-size:11px}
.note:empty{display:none}
.note,.state{display:block;margin-top:6px;color:var(--muted);font-size:11px;white-space:normal}
.context,.sources{margin:6px 0 0;padding-left:18px;font-size:11px;color:var(--muted);white-space:normal}
.sources a{color:#145caf;overflow-wrap:anywhere}
.retry{margin-top:6px;min-height:36px;border:1px solid var(--line);border-radius:999px;background:#fff;cursor:pointer;font-size:12px}
form{display:flex;gap:8px;align-items:flex-end;padding:10px 12px;border-top:1px solid var(--line)}
textarea{flex:1;min-height:44px;max-height:120px;resize:none;padding:10px;border:1px solid var(--line);border-radius:12px;font-size:16px}
.send,.stop{min-width:56px;min-height:44px;border:0;border-radius:12px;background:var(--brand);color:#fff;cursor:pointer}
.stop{background:var(--warn)}
.send:disabled{opacity:.5;cursor:default}
.status{margin:0;padding:0 12px 8px;color:var(--muted);font-size:11px;min-height:0}
.status:empty{display:none}
@media (max-width:600px){
  .panel{inset:0;width:100%;height:100dvh;border-radius:0;border:0;
    padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)}
  .launcher img{height:198px}
  .launcher{${side}:max(20px,env(safe-area-inset-${side}))}
}
@media (prefers-reduced-motion:reduce){.launcher img{transition:none}}
@media (prefers-reduced-motion:no-preference){.panel{animation:rise .16s ease-out}@keyframes rise{from{opacity:0;transform:translateY(8px)}}}
</style>
<button class="launcher" type="button" aria-expanded="false" aria-controls="panel" aria-label="開啟萬安陪你說（非官方 AI 改編角色）">
  <img alt="" width="120" height="264"><span class="tag">AI萬安陪你聊</span>
</button>
<section class="panel" id="panel" role="dialog" aria-modal="false" aria-labelledby="title" tabindex="-1" hidden>
  <header>
    <img alt="" width="22" height="48">
    <div class="title"><strong id="title">萬安陪你說</strong><small>AI萬安陪你聊</small></div>
    <button class="reset" type="button">重新聊天</button>
    <button class="icon close" type="button" aria-label="關閉聊天">×</button>
  </header>
  <div class="log" aria-live="polite">
    <div class="intro"><p>政見問清楚，生活也能輕鬆聊。</p>
      <div class="chips" aria-label="試試這些開場">
        <button type="button">你有什麼具體政見？</button>
        <button type="button">任內做了哪些事？</button>
        <button type="button">來一句萬安金句</button>
      </div>
    </div>
  </div>
  <form>
    <textarea rows="1" aria-label="輸入訊息" placeholder="想聊什麼？" maxlength="3000"></textarea>
    <button class="send" type="submit">送出</button>
    <button class="stop" type="button" hidden>停止</button>
  </form>
  <p class="status" role="status"></p>
</section>`;
  root.querySelectorAll('img').forEach(image => { image.src = figure; });
  const $ = selector => root.querySelector(selector);
  const launcher = $('.launcher');
  const panel = $('.panel');
  const log = $('.log');
  const input = $('textarea');
  const send = $('.send');
  const stop = $('.stop');
  const reset = $('.reset');
  const status = $('.status');
  let history = [];
  let controller = null;

  // Clicks, typing and scrolling inside the widget must not reach the host
  // page: its click-to-dismiss cards, first-click music, shortcuts or 3D camera.
  for (const target of [launcher, panel]) {
    for (const type of ['click', 'pointerdown', 'pointerup', 'mousedown', 'mouseup', 'touchstart', 'touchend',
      'keydown', 'keyup', 'keypress', 'wheel', 'touchmove']) {
      target.addEventListener(type, event => event.stopPropagation(), {passive: type !== 'keydown'});
    }
  }

  function open() {
    panel.hidden = false;
    launcher.setAttribute('aria-expanded', 'true');
    // A coarse pointer would raise the keyboard over the conversation at once.
    (matchMedia('(pointer: coarse)').matches ? panel : input).focus();
  }
  function close() {
    panel.hidden = true;
    launcher.setAttribute('aria-expanded', 'false');
    launcher.focus();
  }
  launcher.onclick = open;
  $('.close').onclick = close;
  panel.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); close(); }
  });

  function bubble(text, role) {
    const el = document.createElement('div');
    el.className = 'msg ' + role;
    if (role === 'assistant') {
      const label = document.createElement('small');
      label.className = 'label';
      label.textContent = '萬安怎麼說';
      const content = document.createElement('div');
      content.className = 'content';
      content.textContent = text;
      const note = document.createElement('small');
      note.className = 'note';
      el.append(label, content, note);
    } else {
      el.textContent = text;
    }
    log.append(el);
    log.scrollTop = log.scrollHeight;
    return el;
  }

  // Same request limits as the full chat page: complete turns only, at most
  // 18 history messages, 3000 code points per message and 32000 UTF-8 bytes.
  function requestBody(text) {
    const turns = history.slice(-18);
    const oversized = turns.findLastIndex(message => [...message.content].length > 3000);
    if (oversized >= 0) turns.splice(0, (Math.floor(oversized / 2) + 1) * 2);
    if ([...text].length > 3000) throw Error('訊息太長，請縮短後再送出。');
    let body;
    do {
      body = JSON.stringify({messages: [...turns, {role: 'user', content: text}]});
      if (new TextEncoder().encode(body).length <= 32000) return body;
      if (!turns.length) throw Error('訊息太長，請縮短後再送出。');
      turns.splice(0, 2);
    } while (true);
  }

  const states = {
    material_lookup: {complete: '已查閱台北政見與政績整理', no_results: '政見整理尚無此項', unavailable: '政見整理目前無法讀取'},
    policy_lookup: {complete: '已查閱政策資料', no_results: '政策資料庫尚無此項資料', unavailable: '政策資料目前無法讀取'},
    news_lookup: {complete: '已查閱市長新聞稿', no_results: '收錄新聞尚無相關內容', unavailable: '新聞資料目前無法讀取'},
    web_search: {complete: '已查閱網路資料', no_results: '這次沒有找到可引用的資料', unavailable: '這次未能取得網路資料'},
  };

  // Sources are listed under the reply; inline markers such as [1] or ［2］ are dropped
  // from display and history so the conversation reads naturally.
  const conversational = text => text.replace(/[ \t]*[\[［]\d{1,2}[\]］]/g, '');

  function safeLink(source) {
    if (typeof source?.url !== 'string' || typeof source?.title !== 'string') return null;
    let url;
    try { url = new URL(source.url); } catch { return null; }
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return null;
    if (url.hostname === 'localhost' || url.hostname.endsWith('.localhost') || /^(127\.|10\.|192\.168\.|169\.254\.|0\.|\[)/.test(url.hostname) || /^172\.(1[6-9]|2[0-9]|3[01])\./.test(url.hostname)) return null;
    return url;
  }

  function showRetrieval(el, data) {
    const state = document.createElement('small');
    state.className = 'state';
    const label = data.code === 'SEARCH_DISABLED' ? '目前未啟用網路查詢' : states[data.type][data.status] || states[data.type].unavailable;
    state.textContent = data.used_for_answer === false && data.status === 'complete' ? '已定位相關資料，本輪另查其他來源' : label;
    if (data.type === 'material_lookup' && /^\d{4}-\d{2}-\d{2}$/.test(data.checked_at || '')) state.textContent += ' · 查核至 ' + data.checked_at;
    if (data.type === 'policy_lookup' && /^\d{4}-\d{2}-\d{2}$/.test(data.dataset_updated_at || '')) state.textContent += ' · 整理於 ' + data.dataset_updated_at;
    el.querySelector('.note').before(state);
    if (data.type === 'material_lookup' && data.status === 'complete' && Array.isArray(data.items)) {
      const context = document.createElement('ul');
      context.className = 'context';
      const labels = {policy: '政見', record: '任內政績'};
      for (const record of data.items.slice(0, 4)) {
        if (typeof record?.name !== 'string') continue;
        const item = document.createElement('li');
        item.textContent = record.name.slice(0, 120) + '｜' + (labels[record.contentKind] || '待確認');
        context.append(item);
      }
      if (context.childElementCount) state.after(context);
    }
    if (data.used_for_answer === false || data.status !== 'complete' || !Array.isArray(data.sources)) return;
    el.querySelectorAll('.sources').forEach(node => node.remove());
    const sources = document.createElement('ol');
    sources.className = 'sources';
    sources.setAttribute('aria-label', '本次查詢來源');
    const seen = new Set();
    for (const source of data.sources.slice(0, 8)) {
      const url = safeLink(source);
      if (!url || seen.has(url.href)) continue;
      seen.add(url.href);
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = url.href;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = source.title.slice(0, 160) || url.hostname;
      item.append(link);
      sources.append(item);
    }
    if (sources.childElementCount) el.querySelector('.note').before(sources);
  }

  function diagnostic(data, fallback) {
    const message = typeof data?.error === 'string' ? data.error : fallback;
    const code = typeof data?.code === 'string' && /^[A-Z_]{1,40}$/.test(data.code) ? ` (${data.code})` : '';
    return message + code;
  }

  function busy(active) {
    send.disabled = active;
    stop.hidden = !active;
    reset.disabled = active;
    root.querySelectorAll('.retry,.chips button').forEach(button => { button.disabled = active; });
  }

  async function submit(text, retryTarget = null) {
    if (controller || !text.trim()) return;
    root.querySelector('.intro')?.remove();
    const current = new AbortController();
    controller = current;
    busy(true);
    status.textContent = '正在接梗，可以隨時停止回覆。';
    if (!retryTarget) {
      bubble(text, 'user');
      input.value = '';
    }
    const el = retryTarget || bubble('', 'assistant');
    el.className = 'msg assistant';
    el.querySelectorAll('.retry,.state,.context,.sources').forEach(node => node.remove());
    const content = el.querySelector('.content');
    const note = el.querySelector('.note');
    content.textContent = '正在想怎麼接這一題…';
    note.textContent = '';
    let answer = '';
    let reader;
    try {
      const response = await fetch(api, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: requestBody(text),
        signal: current.signal,
        credentials: 'omit',
      });
      if (!response.ok) {
        let message = '暫時無法連線，請稍後重試。';
        try { message = diagnostic(await response.json(), message); } catch {}
        throw Error(message);
      }
      reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let completed = false;
      const readLine = line => {
        if (!line.startsWith('data:')) return;
        const event = line.slice(5).trim();
        if (event === '[DONE]') { completed = true; return; }
        if (!event) return;
        const data = JSON.parse(event);
        if (Object.hasOwn(states, data.type)) { showRetrieval(el, data); return; }
        if (data.error) throw Error(diagnostic(data, '模型連線中斷，請重試。'));
        const delta = data.choices?.[0]?.delta?.content;
        if (typeof delta === 'string') answer += delta;
        const follow = log.scrollHeight - log.clientHeight - log.scrollTop <= 48;
        content.textContent = conversational(answer) || '…';
        if (follow) log.scrollTop = log.scrollHeight;
      };
      while (!completed) {
        const {value, done} = await reader.read();
        buffer += decoder.decode(value, {stream: !done});
        let index;
        while ((index = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, index).replace(/\r$/, '');
          buffer = buffer.slice(index + 1);
          readLine(line);
          if (completed) break;
        }
        if (done) {
          if (buffer) readLine(buffer);
          break;
        }
      }
      if (current.signal.aborted) throw new DOMException('Stopped', 'AbortError');
      if (!completed) throw Error('模型連線中斷，請重試。');
      answer = conversational(answer);
      if (!answer.trim()) throw Error('沒有收到回答，請重試。');
      history.push({role: 'user', content: text}, {role: 'assistant', content: answer});
      history = history.slice(-18);
      root.querySelectorAll('.retry').forEach(button => button.remove());
      status.textContent = '';
    } catch (error) {
      const stopped = current.signal.aborted;
      content.textContent = conversational(answer);
      note.textContent = stopped ? '已停止回覆；這一輪未加入對話記憶。' : error.message;
      if (!stopped) el.classList.add('error');
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.className = 'retry';
      retry.textContent = '重試這一題';
      retry.onclick = () => submit(text, el);
      el.append(retry);
      status.textContent = stopped ? '已停止。可以重試或繼續聊。' : '這一輪未加入對話記憶，可重試或換一題。';
    } finally {
      if (reader) {
        try { await reader.cancel(); } catch {}
        reader.releaseLock();
      }
      controller = null;
      busy(false);
    }
  }

  $('form').onsubmit = event => { event.preventDefault(); submit(input.value); };
  input.addEventListener('keydown', event => {
    // Mobile keyboards keep Enter for newlines; never submit an IME composition.
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing && event.keyCode !== 229 &&
        !matchMedia('(pointer: coarse)').matches) {
      event.preventDefault();
      submit(input.value);
    }
  });
  root.querySelectorAll('.chips button').forEach(button => { button.onclick = () => submit(button.textContent); });
  stop.onclick = () => controller?.abort();
  reset.onclick = () => {
    if (controller) return;
    history = [];
    status.textContent = '';
    log.querySelectorAll('.msg').forEach(el => el.remove());
    input.value = '';
  };
  document.body.append(host);
})();
