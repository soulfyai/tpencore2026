"""Browser regression check for selected-city weather and asynchronous responses.

Uses the actual weather module with a minimal page and mocked fetch responses;
no external API or WebGL is required. Run with the same Playwright setup as shot.py.
"""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
source = (ROOT / '3d/main.js').read_text()
weather = source[source.index('const WEATHER_UI = {};'):source.index('/* ---------- label visibility:')]
with sync_playwright() as p:
    options = {}
    if os.environ.get('CHROMIUM_EXECUTABLE'):
        options['executable_path'] = os.environ['CHROMIUM_EXECUTABLE']
    browser = p.chromium.launch(**options)
    page = browser.new_page()
    page.set_content('<div id="stage"></div>')
    page.evaluate('''() => {
      window.stage=document.querySelector('#stage');window.dirty=false;
      window.A={D:{meta:{weather:{updatedAt:'2026-10-23T10:00:00Z',cities:{
        taipei:{temp:25,code:1},newtaipei:{temp:24,code:2},keelung:{temp:23,code:3},taoyuan:{temp:26,code:1}
      }}}}};
      window.ENV={onChange:null,setWeather(w){this.weather=w;}};
      window.requests=[];
      window.fetch=url=>new Promise((resolve,reject)=>requests.push({url,resolve,reject}));
    }''')
    page.evaluate(weather + '\nwindow.testWeather=WEATHER_UI;')
    result = page.evaluate('''async () => {
      const check=(ok,message)=>{if(!ok)throw new Error(message)};
      const settle=()=>new Promise(resolve=>setTimeout(resolve,0));
      const text=()=>document.querySelector('.wx').textContent;
      const city=id=>testWeather.setCity(id);
      const reply=(i,temp)=>requests[i].resolve({ok:true,json:async()=>({current:{temperature_2m:temp,weather_code:2,cloud_cover:20,precipitation:0,wind_speed_10m:5,time:'2026-10-23T18:00'}})});
      city('taipei');city('newtaipei');
      check(requests.length===2,'one request per selected city');
      check(requests[1].url.includes('latitude=25.012'),'New Taipei coordinates');
      reply(1,28);await settle();
      check(text().startsWith('新北 ')&&text().includes('28°C'),'selected-city response');
      check(!text().includes('台北')&&!text().includes('基隆'),'other cities omitted');
      reply(0,31);await settle();
      check(text().startsWith('新北 ')&&text().includes('28°C'),'late response must not replace selected city');
      city('keelung');requests[2].reject(new Error('offline'));await settle();
      check(text().startsWith('基隆 ')&&text().includes('23°C')&&text().includes('內建快照'),'offline selected-city fallback');
      city('taoyuan');requests[3].resolve({ok:true,json:async()=>({current:{}})});await settle();
      check(text().startsWith('桃園 ')&&text().includes('26°C')&&!text().includes('NaN'),'invalid response fallback');
      city('taipei');await settle();
      check(requests.length===4&&text().includes('31°C'),'fresh cached weather reused');
      check(ENV.weather.time==='2026-10-23T18:00+08:00','Taipei API timestamp');
      delete A.D.meta.weather.cities.keelung;
      city('keelung');requests[4].reject(new Error('offline'));await settle();
      check(text().startsWith('基隆 ')&&text().includes('天氣資料暫不可用')&&!text().includes('°C'),'missing city never uses another city');
      return 'selected-city weather, late responses, offline/invalid/missing-data fallback and cache: PASS';
    }''')
    print(result)
    browser.close()
