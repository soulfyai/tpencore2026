export const REGIONAL_CITIES={
 newtaipei:{name:'新北市',accent:'#89671f',border:'#d7b05a',soft:'#fbf4dd',focus:'nt-family'},
 keelung:{name:'基隆市',accent:'#a44d74',border:'#d893b1',soft:'#faf0f5',focus:'kl-family'},
 taoyuan:{name:'桃園市',accent:'#a04f49',border:'#d99a91',soft:'#fbf0eb',focus:'ty-health'}
};
const kinds={
 transport:['交通轉乘站','車站入口、候車棚、轉乘月台與公車'],housing:['居住更新街廓','不同高度的住宅、連接裙樓與公共內院'],
 childcare:['托育與親子空間','托育館、遊戲場與家長等候區'],family:['家庭照顧街廓','托育、長照與無障礙休憩空間'],senior:['長者照顧中心','日照、無障礙入口與遮蔭花園'],
 medical:['醫療與照護園區','診療樓、門診入口、照護庭院與救護車停靠空間'],education:['教育學習園區','教學樓、餐廳與戶外活動空間'],
 enterprise:['就業與創業園區','工作室、職訓教室、企業辦公與交流廣場'],research:['科技研發園區','研發辦公、實驗室、太陽能與空中連廊'],
 flood:['水務與防災設施','抽水機房、滯洪池、閘門與防汛平台'],community:['地方與多元文化中心','文化交流館、共享市集與社區廣場'],
 port:['港市觀光街區','旅客服務、展演館與港邊活動廣場'],culture:['文化展演街廓','紅磚拱廊、展館與雕塑廣場'],
 youth:['青年工作與交流','共創空間、自行車架與屋頂露台'],welfare:['社區照顧中心','公共服務、友善步道與活動館'],
 environment:['環境循環設施','資源分類、水槽與太陽能屋頂'],sports:['運動與賽事場館','跑道、球場、看台及體育館'],
 rescue:['消防與應變中心','消防車庫、瞭望塔與應變空間'],urban:['城市建設與環境','公共建設服務、綠化廣場與工程示意'],
 civic:['市民服務中心','公共服務大廳與開放式廣場']
};
export function regionalPolicyScenes(data){return Object.fromEntries(data.themes.map(t=>{const n=t.theme.name;let kind;
 if(/消防|治安/.test(n))kind='rescue';else if(/治水|防災|水利/.test(n))kind='flood';
 else if(/長照與育兒/.test(n))kind='family';else if(/醫療|口腔|健康/.test(n))kind='medical';
 else if(/托育|親子|好孕|育兒/.test(n))kind='childcare';else if(/長者|銀髮|長照|高齡/.test(n))kind='senior';
 else if(/居住|都更|住宅/.test(n))kind='housing';else if(/交通|軌道/.test(n))kind='transport';
 else if(/教育|午餐/.test(n))kind='education';else if(/運動|體育/.test(n))kind='sports';
 else if(/城市建設/.test(n))kind='urban';else if(/環境|環保/.test(n))kind='environment';
 else if(/科技|AI/.test(n))kind='research';else if(/產業|就業/.test(n))kind='enterprise';
 else if(/族群|地方發展/.test(n))kind='community';else if(/港市|觀光/.test(n))kind=data.city.city==='keelung'?'port':'culture';
 else if(/文化/.test(n))kind='culture';else if(/青年/.test(n))kind='youth';else if(/社福/.test(n))kind='welfare';
 else if(/其他/.test(n))kind='civic';else throw Error('Policy category needs an explicit visual mapping: '+t.id+' '+n);
 return [t.id,[kind,...kinds[kind]]];}));}
