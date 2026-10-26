"""Reuse reviewed art builders without importing their separate review interfaces."""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
P=ROOT/'prototypes'

def build():
    imports='''import * as THREE from 'three';
import {createStreetArt} from './street-art-kit.js?rev=2';
import {createTaipeiCityPlan} from './taipei-city-layout.js?rev=2';
import {createRegionalCityPlan} from './regional-layout.js?rev=1';
import {createTaipeiCityKit} from './taipei-city-kit.js?rev=2';
import {createRegionalCityKit} from './regional-kit.js?rev=1';
import {REGIONAL_CITIES} from './regional-config.js?rev=1';
import {planTaipeiWater,buildTaipeiWater,inside,edgeDistance} from './taipei-city-water.js?rev=1';
import {createTaipeiLife} from './taipei-city-life.js?rev=1';
import {createRegionalLife} from './regional-life.js?rev=1';
import {createRegionalAircraft} from './review-models.js?rev=1';
import {createTaipeiRoads} from './taipei-city-roads.js?rev=2';
import {plantTaipeiForest} from './taipei-city-nature.js?rev=1';
import {createDetailStreetElements} from './detail-street-elements.js?rev=1';
import {LANDMARK_BUILD} from './taipei-landmarks.js?rev=1';
'''
    output=[imports]
    # Use the actual approved facade functions, including rear/side elevations.
    reference=(P/'taipei-detail.js').read_text()
    composition=(P/'taipei-composition.js').read_text()
    detail=reference[reference.index('const features='):reference.index('// A unified textured ground')]
    # Keep the review's exact street materials and facade vocabulary, completing
    # the rear elevation for a city that users can inspect from all directions.
    detail=detail.replace('art.reserve(x,z,(rotation?d:w)+3,(rotation?w:d)+5);', 'art.reserve(x,z,Math.abs(Math.cos(rotation))*w+Math.abs(Math.sin(rotation))*d+3,Math.abs(Math.sin(rotation))*w+Math.abs(Math.cos(rotation))*d+5);')
    rear=composition[composition.index('const rear=new THREE.Group()'):composition.index(' shops.forEach')]
    detail=detail.replace(' shops.forEach',rear+' shops.forEach')
    child=composition[composition.index('const childcare=group('):composition.index('// A slim modern office')]
    child=child.replace('group(-9,-26)','group(0,0)').replace("'臺北・生活托育館'","cityLabel+'・生活托育館'")
    child=child.replace("paving(-7,-14,17,3);sign('遊戲與散步的日常',-8,1.2,-12.48,5,.6);","")
    child=child.replace('const playground=group(1,-15);','const playground=new THREE.Group();playground.position.set(10,0,11);childcare.add(playground);')
    office=composition[composition.index('const office=group('):composition.index('// Recognizable Taipei context')].replace('group(28,-31)','group(0,0)').replace("'臺北・共創'","cityLabel+'・共創'")
    detail+='\nfunction childcare(){'+child+'\nreturn childcare;}\nfunction office(){'+office+'\nreturn office;}\n'

    output.append('function createReviewedFacades(art,scene,cityLabel){const {box,ball,line,shape,batch,texture,mat,between,rand}=art;\n'+detail+'\nreturn {apartment,features,childcare,office,material,tile,pavement,asphalt,planter,storefront,roofGarden};}\n')
    for city,source,plan_func in [('Taipei','taipei-city.js','createTaipeiCityPlan'),('NewTaipei','regional-city.js','createRegionalCityPlan')]:
        s=(P/source).read_text()
        body=s[s.index('const art=createStreetArt'):s.index('const cluster=ordinary')]
        start=body.index('const pmrem=')
        end=body.index('const SCALE=')
        body=body[:start]+body[end:]
        start=body.index('const seaMaterial=')
        end=body.index('// All shoreline checks',start)
        body=body[:start]+body[end:]
        body=body.replace('installTaipeiSkyClouds(sky);','')
        # Add details to existing urban parcels, keeping their footprints and roads.
        body=body.replace('const SCALE=plan.scale,coast=plan.coast;', 'const reviewedFacades=createReviewedFacades(art,scene,data.city.cityName),streetDetails=createDetailStreetElements(art,scene,reviewedFacades);\nart.pavement=reviewedFacades.pavement;art.asphalt=reviewedFacades.asphalt;art.grass.color.set("#d4dfb5");\nconst SCALE=plan.scale,coast=plan.coast;')
        body=body.replace('cityKit.policy(p);', 'if(!streetDetails.policy(p))cityKit.policy(p);')
        old='else cityKit.urban(p);'
        assert old in body
        body=body.replace(old,'else streetDetails.urban(p);')
        body=body.replace('if(index>=0)cityKit.highrise(p,highKinds[index]);','if(index>=0){cityKit.highrise(p,highKinds[index]);streetDetails.highriseFront(p);}')
        body=body.replace('const forestStats=plantTaipeiForest(art,coast);','streetDetails.parks(ponds);\nconst forestStats=plantTaipeiForest(art,coast);')
        # Descriptor includes the added detailed homes, without altering original builders.
        body=body.replace('const buildings=cityKit.records;', 'const buildings=[...cityKit.records,...streetDetails.records];')
        output.append(f'async function build{city}(data,renderer){{\nconst scene=new THREE.Group(),plan={plan_func}(data),ponds=planTaipeiWater(plan);\nconst cityId=data.city.city,cityConfig=REGIONAL_CITIES[cityId];\n'+body+'\nreturn {root:scene,art,plan,ponds,themeMeta,buildings,landmarks,life,forestStats,geometryStats,flag,tallest,roadSurface,picks:[...cityKit.picks,...streetDetails.picks],streetDetails,facadeDetails:reviewedFacades.features,...(typeof airTraffic!=="undefined"?{airTraffic}:{})};\n}\n')
    # Reuse the approved passenger/sailing-boat geometry independently of its old island.
    output.append('''export async function buildApprovedCityArt(data,renderer){return data.city.city==='taipei'?buildTaipei(data,renderer):buildNewTaipei(data,renderer);}
''')
    # Extract just model definitions, not the composition's island, placements or UI.
    elements=(P/'taipei-composition-elements.js').read_text()
    boatdefs=elements[elements.index(' function hull('):elements.index(" passenger(",elements.index(' function sail('))]
    output.append('''export function buildReviewedBoats(art,scene,coast){
const {box,line,shape,mat,texture}=art,boats=[],inventory=[],glass=mat('#668f98',.23,.36);
function group(x,z,rotation=0){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rotation;scene.add(g);return g;}
function record(id,name,x,z,r,root){inventory.push({id,name,x,z,r,root});return root;}
'''+boatdefs+'''
const shore=coast.reduce((a,b)=>a[1]>b[1]?a:b),harbour=group(shore[0],shore[1]-2);harbour.name='approved-waterfront-pier';
for(let i=0;i<45;i++)box(i%3?'#aa9370':'#b9a581',0,.18,i*.43,7,.2,.4,harbour);
for(const x of [-3.1,3.1])for(let z=0;z<19;z+=4){shape('cyl','#8f8972',x,-1.25,z,.14,3.2,.14,harbour);box('#e6d7ae',x,.55,z,.3,.2,.3,harbour);}
box('#d9ceb5',0,1.7,1,6,3,3.8,harbour);box('#6e9895',0,3.35,1,6.5,.25,4.3,harbour);
inventory.push({id:'harbour',name:'碼頭與停靠區',root:harbour});
const xs=coast.map(p=>p[0]),zs=coast.map(p=>p[1]),x0=Math.min(...xs),x1=Math.max(...xs),z0=Math.min(...zs),z1=Math.max(...zs),cx=(x0+x1)/2;
passenger('passenger-west',x0-14,(z0+z1)/2,-.5,1.2);
passenger('passenger-front',cx-25,z1+18,.4,1);
sail('sail-front',cx+25,z1+22,-.25,'#c88d73');sail('sail-west',x0-22,z1-15,-.6,'#8eaea5');
return {boats,inventory};}
''')
    (P/'greater-taipei-art.js').write_text('\n'.join(output))

if __name__=='__main__':build()
