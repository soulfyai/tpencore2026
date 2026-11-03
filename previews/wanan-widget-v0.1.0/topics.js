(() => {
  const script = document.currentScript;
  const source = new URL('/api/public/topics', 'https://chat.tpencore.tw');
  const fallbackSnapshot = null;
  const fallbackSource = new URL('wanan-hot-topics-v0.1.0.json', script.src || location.href);
  function valid(data) {
    return data?.status==='published' && data.reviewed===true && data.mode==='editorial_web' && Array.isArray(data.topics) && typeof data.period==='string';
  }
  function freshness(data, fallback) {
    let marker=document.getElementById('wanan-news-checked');
    const checked=document.getElementById('checked');
    if(!marker && checked) {
      marker=document.createElement('span');marker.id='wanan-news-checked';
      checked.after(document.createElement('br'),marker);
    }
    if(marker) marker.textContent=(fallback?'話題歷史快照：':'新聞／話題查核至：')+String(data.updated_at||'尚無資料').slice(0,10);
  }
  async function readTopics() {
    try {
      const response=await fetch(source,{cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(8000)});
      if(!response.ok)throw Error();
      const data=await response.json();if(!valid(data))throw Error();
      freshness(data,false);return {data,fallback:false};
    } catch {
      let data=fallbackSnapshot;
      if(!data) {
        const response=await fetch(fallbackSource,{cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(8000)});
        if(!response.ok)throw Error();data=await response.json();
      }
      if(!valid(data))throw Error();freshness(data,true);return {data,fallback:true};
    }
  }
  // Every page visit re-reads the shared database. Opening the panel re-reads it again.
  readTopics().catch(()=>{
    const checked=document.getElementById('checked');
    if(checked && !document.getElementById('wanan-news-checked')) {
      const marker=document.createElement('span');marker.id='wanan-news-checked';marker.textContent='新聞／話題暫時無法讀取';checked.after(document.createElement('br'),marker);
    }
  });
  function init() {
    const menu = document.querySelector('.hi-policy-menu');
    const aside = document.querySelector('aside.panel');
    if (!menu || !aside) return true;
    if (menu.querySelector('[data-wanan-topics]')) return true;
    const style = document.createElement('style');
    style.textContent = `.wanan-topics{display:none;padding:28px 20px 20px;overflow:auto;min-height:0;color:var(--ink);font:14px/1.7 system-ui,sans-serif}.wanan-topics h2{font-size:22px;margin:0 0 4px}.wanan-topics .summary{font-size:12px;color:var(--muted)}.wanan-topics ol{padding:0;list-style:none;counter-reset:rank}.wanan-topics li{counter-increment:rank;padding:16px 0;border-top:1px solid var(--line)}.wanan-topics li h3{font-size:16px;margin:0}.wanan-topics li h3:before{content:counter(rank,decimal-leading-zero) ' ';color:var(--muted)}.wanan-topics li p{margin:6px 0}.wanan-topics .empty{padding:24px 0}.wanan-topics-open aside.panel>.tabs,.wanan-topics-open aside.panel>.pbody{display:none}.wanan-topics-open .wanan-topics{display:block}`;
    document.head.append(style);
    const section = document.createElement('section');section.className='wanan-topics';section.setAttribute('aria-label','近期公開新聞話題');
    const title=document.createElement('h2');title.textContent='熱門話題';
    const subtitle=document.createElement('p');subtitle.className='summary';subtitle.textContent='已核對公開新聞 · 最多10則';
    const content=document.createElement('div');content.setAttribute('aria-live','polite');
    const note=document.createElement('p');note.className='summary';note.textContent='依公開來源整理，編號不代表聲量排名。';
    section.append(title,subtitle,content,note);aside.append(section);
    const button=document.createElement('button');button.type='button';button.dataset.wananTopics='';button.textContent='熱門話題';menu.append(button);
    function message(text){const p=document.createElement('p');p.className='empty';p.textContent=text;content.replaceChildren(p);}
    async function load(){
      message('正在讀取熱門話題…');
      try {
        const {data,fallback}=await readTopics();
        if(data.status==='not_started'){message('熱門討論整理尚未啟用，已有的聊天不會回溯統計。開始收錄並完成審閱後，這裡將顯示前十大話題。');return;}
        if(data.status!=='published'||data.reviewed!==true||!Array.isArray(data.topics)||typeof data.period!=='string')throw Error();
        const editorial=data.mode==='editorial_web';
        title.textContent='近期網路話題';
        note.textContent='依已核對的公開來源，按報導日期選列最多10則；編號不代表聲量排名，不等同民調或聊天統計。'+(data.verification_mode==='ai_source_checked'?'由AI核對原文，仍可能有誤。':'');
        const ids=new Set();
        const topics=data.topics.filter(t=>{
          if(typeof t?.id!=='string'||ids.has(t.id)||typeof t.title!=='string'||typeof t.summary!=='string'||(!editorial&&(!Number.isSafeInteger(t.conversations)||t.conversations<1))||(editorial&&!Array.isArray(t.sources)))return false;
          ids.add(t.id);return true;
        });
        if(!editorial)topics.sort((a,b)=>b.conversations-a.conversations||a.id.localeCompare(b.id));
        topics.splice(10);
        subtitle.textContent=(fallback?'即時連線失敗，顯示歷史快照 · ':'')+data.period.slice(0,80)+' · 查核 '+String(data.updated_at||'').slice(0,10)+' · '+topics.length+'則';
        if(!topics.length){message('這個統計期間尚無可公布的話題。');return;}
        const list=document.createElement('ol');
        for(const t of topics){
          const li=document.createElement('li'),h=document.createElement('h3'),p=document.createElement('p');h.textContent=t.title.slice(0,100);p.textContent=t.summary.slice(0,400);li.append(h,p);
          if(editorial){
            for(const ref of t.sources.slice(0,3)){
              let url;try{url=new URL(ref.url);}catch{continue;}
              if(url.protocol!=='https:'||url.username||url.password||typeof ref.title!=='string')continue;
              const line=document.createElement('p'),a=document.createElement('a');a.href=url.href;a.target='_blank';a.rel='noopener noreferrer';a.textContent=String(ref.publisher||url.hostname)+' · '+String(ref.published_at||t.published_date||'').slice(0,10)+'｜'+ref.title.slice(0,140);line.className='summary';line.append(a);li.append(line);
            }
          }else{const n=document.createElement('small');n.textContent=t.conversations+' 個不同對話';li.append(n);}
          list.append(li);
        }
        content.replaceChildren(list);
      }catch{message('熱門話題暫時無法讀取，請稍後重新開啟。');}
    }
    menu.addEventListener('click',e=>{if(!e.target.closest('[data-wanan-topics]'))document.documentElement.classList.remove('wanan-topics-open');});
    button.onclick=()=>{
      menu.querySelector('[data-mode="list"]').click();
      document.documentElement.classList.add('wanan-topics-open');
      const tools=document.querySelector('.hi-tools-panel');if(matchMedia('(max-width:860px)').matches&&tools){tools.hidden=true;document.querySelector('.hi-tools-toggle')?.setAttribute('aria-expanded','false');}
      load();
    };
    new MutationObserver(()=>{if(document.documentElement.classList.contains('wanan-topics-open')&&!document.documentElement.classList.contains('drawer-open'))document.documentElement.classList.remove('wanan-topics-open');}).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
    return true;
  }
  if(!init()){const observer=new MutationObserver(()=>{if(init())observer.disconnect();});observer.observe(document.body,{childList:true,subtree:true});}
})();

