(() => {
  const script = document.currentScript;
  const source = new URL('wanan-hot-topics-v0.1.0.json', script.src);
  function init() {
    const menu = document.querySelector('.hi-policy-menu');
    const aside = document.querySelector('aside.panel');
    if (!menu || !aside || menu.querySelector('[data-wanan-topics]')) return false;
    const style = document.createElement('style');
    style.textContent = `.wanan-topics{display:none;padding:28px 20px 20px;overflow:auto;min-height:0;color:var(--ink);font:14px/1.7 system-ui,sans-serif}.wanan-topics h2{font-size:22px;margin:0 0 4px}.wanan-topics .summary{font-size:12px;color:var(--muted)}.wanan-topics ol{padding:0;list-style:none;counter-reset:rank}.wanan-topics li{counter-increment:rank;padding:16px 0;border-top:1px solid var(--line)}.wanan-topics li h3{font-size:16px;margin:0}.wanan-topics li h3:before{content:counter(rank,decimal-leading-zero) ' ';color:var(--muted)}.wanan-topics li p{margin:6px 0}.wanan-topics .empty{padding:24px 0}.wanan-topics-open aside.panel>.tabs,.wanan-topics-open aside.panel>.pbody{display:none}.wanan-topics-open .wanan-topics{display:block}`;
    document.head.append(style);
    const section = document.createElement('section');section.className='wanan-topics';section.setAttribute('aria-label','前十大熱門討論話題');
    const title=document.createElement('h2');title.textContent='熱門話題';
    const subtitle=document.createElement('p');subtitle.className='summary';subtitle.textContent='前十大熱門討論 · 依不同對話數排序';
    const content=document.createElement('div');content.setAttribute('aria-live','polite');
    const note=document.createElement('p');note.className='summary';note.textContent='聊天參與者的意見彙整，不代表全體市民；不是正式陳情受理紀錄。';
    section.append(title,subtitle,content,note);aside.append(section);
    const button=document.createElement('button');button.type='button';button.dataset.wananTopics='';button.textContent='熱門話題';menu.append(button);
    function message(text){const p=document.createElement('p');p.className='empty';p.textContent=text;content.replaceChildren(p);}
    async function load(){
      message('正在讀取熱門話題…');
      try {
        const response=await fetch(source,{cache:'no-store',credentials:'omit'});if(!response.ok)throw Error();
        const data=await response.json();
        if(data.status==='not_started'){message('熱門討論整理尚未啟用，已有的聊天不會回溯統計。開始收錄並完成審閱後，這裡將顯示前十大話題。');return;}
        if(data.status!=='published'||data.reviewed!==true||!Array.isArray(data.topics)||typeof data.period!=='string')throw Error();
        const ids=new Set();
        const topics=data.topics.filter(t=>{
          if(typeof t?.id!=='string'||ids.has(t.id)||typeof t.title!=='string'||typeof t.summary!=='string'||!Number.isSafeInteger(t.conversations)||t.conversations<1)return false;
          ids.add(t.id);return true;
        }).sort((a,b)=>b.conversations-a.conversations||a.id.localeCompare(b.id)).slice(0,10);
        subtitle.textContent='前十大熱門討論 · '+data.period.slice(0,80)+'（台北時間）';
        if(!topics.length){message('這個統計期間尚無可公布的話題。');return;}
        const list=document.createElement('ol');
        for(const t of topics){const li=document.createElement('li'),h=document.createElement('h3'),p=document.createElement('p'),n=document.createElement('small');h.textContent=t.title.slice(0,100);p.textContent=t.summary.slice(0,400);n.textContent=t.conversations+' 個不同對話';li.append(h,p,n);list.append(li);}
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
