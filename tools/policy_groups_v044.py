"""Semantic topic grouping for the isolated policy-district preview."""
from copy import deepcopy
TP_NAMES={'tp-health':'健康與食安','tp-environment':'環境與循環','tp-culture':'文化與觀光','tp-safety':'防災與安全'}
EXTRA={'tp-environment':('environment','資源循環與環境園區','回收設施、水槽與低碳能源'), 'tp-culture':('culture','文化展演園區','展館、拱廊與戶外表演廣場'), 'tp-safety':('rescue','城市安全與應變中心','消防車庫、應變辦公與訓練設施')}
RECORD_TARGET={'tp-rec-transport':'tp-transport','tp-rec-housing':'tp-housing','tp-rec-education':'tp-education','tp-rec-environment':'tp-environment','tp-rec-culture':'tp-culture','tp-rec-sport':'tp-sports'}
SPECIAL={'tp-rec-welfare-1':'tp-childcare','tp-rec-welfare-2':'tp-childcare','tp-rec-welfare-3':'tp-senior','tp-rec-welfare-4':'tp-childcare','tp-rec-welfare-5':'tp-senior','tp-rec-misc-1':'tp-ai','tp-rec-misc-2':'tp-youth','tp-rec-misc-3':'tp-ai','tp-rec-misc-4':'tp-childcare','tp-rec-misc-5':'tp-safety','tp-rec-misc-6':'tp-health'}
def merge_themes(themes,city):
 original=deepcopy(themes);groups={t['id']:{**t,'items':[]} for t in original if t.get('kind')!='record'}
 for id in EXTRA:
  if city=='taipei':groups[id]={'id':id,'name':TP_NAMES[id],'sources':[],'items':[],'summary':'依公開來源整理的任內戰績，保留各項原始查核內容。'}
 for t in original:
  record=t.get('kind')=='record'
  for item in t.get('items',[]):
   target=(SPECIAL.get(item['id']) or RECORD_TARGET.get(t['id'])) if record else t['id']
   if target not in groups:raise ValueError('Unmapped record: '+item['id'])
   i=deepcopy(item);i.update(contentKind='record' if record else 'policy',originalTheme=t['id'],originalCategory=t['name'],theme=target)
   groups[target]['items'].append(i)
  if not record:continue
  for target in {SPECIAL.get(i['id']) or RECORD_TARGET.get(t['id']) for i in t['items']}:
   groups[target]['sources']=list(dict.fromkeys(groups[target].get('sources',[])+t.get('sources',[])))
 result=[]
 for t in groups.values():
  if not t['items']:continue
  if t['id'] in TP_NAMES:t['name']=TP_NAMES[t['id']]
  t['aliases']=list(dict.fromkeys([t['name']]+[i['originalCategory']for i in t['items']]))
  n=sum(i['contentKind']=='record' for i in t['items']);t['kind']='record' if n==len(t['items']) else 'mixed' if n else 'policy'
  t['policyCount']=len(t['items'])-n;t['recordCount']=n
  if t['kind']=='mixed':t['summary']=(t.get('summary')or'')+' 本主題整合相關政策與任內戰績，各項狀態及來源分別列示。'
  for j,i in enumerate(t['items'],1):i['no']=j
  result.append(t)
 assert sorted(i['id'] for t in original for i in t['items'])==sorted(i['id'] for t in result for i in t['items'])
 return result

def merge_cities(cities):
 for c in cities:c['themes']=merge_themes(c['themes'],c['city'])
 return cities
