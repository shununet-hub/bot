var sent = {};
var _fwdCache = [];
var _yfAuth = null;
var _yfAuthTs = 0;
var pendingTelegramMsgs = [];
var GEMINI_API_KEY = "AIzaSyD2Vm5YH0I-gYQXM2HfojfHNhka5V1Ihqk";  // ← YouTube 요약용 Gemini API 키

var _roomMap    = {};
var _tgBotToken = "8245986955:AAG1yc6Pxo_41CI2ll6-Rdcs73OjpEi7pxc"; // ← 텔레그램 봇 토큰
var _tgOffset   = 0;
var _tgThread   = null;
var _pollGen    = new Date().getTime();

// 재시작 후 방이름 자동 복원
(function() {
  try { var s = DataBase.getDataDB("roomMap"); if (s) _roomMap = JSON.parse(s); } catch(e) {}
})();


// ════════════════════════════════════════════════════════════════
// 📡 텔레그램→카톡 퍼오기: 감지할 키워드 목록
// 이 단어가 포함된 텔레그램 메시지만 카톡방으로 전달됨
// ════════════════════════════════════════════════════════════════
var KEYWORDS = [
  "sndk","mu","micron","마이크론","fsly","fastly","viav","crcl","rklb","pl",
  "삼성전자","sk하이닉스","하이닉스","로켓랩","플래닛랩스","폼팩터","버노바","베르노바","패슬리","패스틀리",
  "form","kla","gev","aaoi","nvda","엔비디아","nvidia","tsmc","샌디스크","wd","western digital",
  "hbm","hbm3","hbm4","nand","낸드","dram","디램","반도체","ai인프라","hbf","키오시아","키옥시아",
  "cpu","gpu","젠슨황","jensen huang","openai","chatgpt","claude","anthropic","앤트로픽","엔트로픽","클로드",
  "kalc","kal","crdo","크리도","버티브","vrt","tsla","테슬라","일론", "온디바이스", "젠슨 황", "마벨", "암드",
  "amd", "arm", "soxl", "mrvl", "구글", "google", "메타", "meta", "마이크로소프트", "msft", "챗지피티",
  "pltr", "팔란티어", "amaz", "아마존", "orcl", "오라클", "aapl", "애플", "오픈ai", "avgo", "브로드컴",
  "현대중공업", "삼성중공업", "전력", "데이터센터", "spaceX", "메모리", "병목", "냉각", "낸야", "인텔"
];


// ════════════════════════════════════════════════════════════════
// 📊 주가 명령어: 종목 룩업 테이블
// /삼성전자, /nvda, /나스닥 등 슬래시 명령어로 조회할 종목들
// ════════════════════════════════════════════════════════════════
var LOOKUP = {
  "명령어":     "__HELP__",
  "환율":       "__EXCHANGE__",
  "야선":       "__YAMARKET__",
  "나선":       "__NAMARKET__",
  "금속":       "__METAL__",
  "원자재":     "__COMMODITY__",
  "금리":       "__WORLDRATE__",
  "국채":       "__USTREASURY__",
  "코인":       "__CRYPTO__",
  "공탐":       "__FEAR_GREED__",
  "지수":       "__ALL_INDICES__",
  "유가":       "__OILPRICE__",
  "반도체":     "__SEMI_COMBINED__",
  "한국반도체": "__KR_SEMI__",
  "해외반도체": "__INTL_SEMI__",
  "기술주":     "__US_TECH__",
  "조선":       "__SHIPBUILDING__",
  "방산":       "__DEFENSE__",
  "화학":       "__CHEM__",
  "건설":       "__CONSTRUCTION__",
  "에너지":     "__ENERGY__",
  "로봇":       "__ROBOT__",
  "바이오":     "__BIO__",
  "자동차":     "__AUTO__",
  "금융":       "__KR_FINANCE__",
  "증권":       "__KR_SEC__",
  "철강":       "__STEEL__",
  "2차전지":  "__BATTERY__",
  "미국금융":   "__US_FINANCE__",
  "미국헬스":   "__US_HEALTH__",
  "미국에너지": "__US_ENERGY__",
  "미국방산":   "__US_DEFENSE__",
  "미국바이오": "__US_BIO__",
  "미국소비재": "__US_CONSUMER__",
  "미국통신":   "__US_TELECOM__",
  "미국전기차": "__US_EV__",
  "미국리츠":   "__US_REIT__",
  "미국클라우드":"__US_CLOUD__",
  "코스피":   { s: "^KS11",  n: "코스피" }, "kospi":   { s: "^KS11",  n: "코스피" },
  "코스닥":   { s: "^KQ11",  n: "코스닥" }, "kosdaq":  { s: "^KQ11",  n: "코스닥" },
  "나스닥":   { s: "^IXIC",  n: "나스닥" }, "nasdaq":  { s: "^IXIC",  n: "나스닥" },
  "에센피":   { s: "^GSPC",  n: "S&P500" }, "sp500":   { s: "^GSPC",  n: "S&P500" },
  "s&p500":   { s: "^GSPC",  n: "S&P500" }, "다우":    { s: "^DJI",   n: "다우존스" },
  "dow":      { s: "^DJI",   n: "다우존스" },"러셀":   { s: "^RUT",   n: "러셀2000" },
  "russell":  { s: "^RUT",   n: "러셀2000" },
  "wti":    { s: "CL=F", n: "WTI" },   "브렌트": { s: "BZ=F", n: "브렌트유" },
  "금":     { s: "GC=F", n: "금" },    "gold":   { s: "GC=F", n: "금" },
  "은":     { s: "SI=F", n: "은" },    "구리":   { s: "HG=F", n: "구리" },
  "샌디스크":       { s: "SNDK",   n: "샌디스크" },  "샌디":     { s: "SNDK",   n: "샌디스크" },
  "웨스턴디지털":   { s: "WDC",    n: "웨스턴디지털" },"웬디":    { s: "WDC",    n: "웨스턴디지털" },
  "마이크론":       { s: "MU",     n: "마이크론" },   "엔비디아": { s: "NVDA",   n: "엔비디아" },
  "테슬라":         { s: "TSLA",   n: "테슬라" },     "애플":     { s: "AAPL",   n: "애플" },
  "구글":           { s: "GOOGL",  n: "구글" },       "알파벳":   { s: "GOOGL",  n: "알파벳" },
  "메타":           { s: "META",   n: "메타" },       "아마존":   { s: "AMZN",   n: "아마존" },
  "마이크로소프트": { s: "MSFT",   n: "마이크로소프트" },"마소":   { s: "MSFT",   n: "마이크로소프트" },
  "브로드컴":       { s: "AVGO",   n: "브로드컴" },   "퀄컴":     { s: "QCOM",   n: "퀄컴" },
  "인텔":           { s: "INTC",   n: "인텔" },
  "패스틀리":       { s: "FSLY",   n: "패스틀리" },   "패슬리":   { s: "FSLY",   n: "패스틀리" },
  "fastly":         { s: "FSLY",   n: "Fastly" },     "로켓랩":   { s: "RKLB",   n: "로켓랩" },
  "버노바":         { s: "GEV",    n: "버노바" },      "베르노바": { s: "GEV",    n: "버노바" },
  "폼팩터":         { s: "FORM",   n: "폼팩터" },
  "키오시아":       { s: "285A.T", n: "키오시아" },   "키옥시아": { s: "285A.T", n: "키오시아" },
  "삼성전자":         { s: "005930.KS", n: "삼성전자" },  "삼전":     { s: "005930.KS", n: "삼성전자" },
  "sk하이닉스":       { s: "000660.KS", n: "SK하이닉스" },"하이닉스": { s: "000660.KS", n: "SK하이닉스" },
  "하닉":             { s: "000660.KS", n: "SK하이닉스" },"현대차":   { s: "005380.KS", n: "현대자동차" },
  "현대자동차":       { s: "005380.KS", n: "현대자동차" },"카카오":   { s: "035720.KS", n: "카카오" },
  "네이버":           { s: "035420.KS", n: "NAVER" },     "셀트리온": { s: "068270.KS", n: "셀트리온" },
  "lg에너지솔루션":   { s: "373220.KS", n: "LG에너지솔루션" },
  "삼성바이오로직스": { s: "207940.KS", n: "삼성바이오로직스" },
  "kb금융":           { s: "105560.KS", n: "KB금융" },    "신한지주": { s: "055550.KS", n: "신한지주" },
  "포스코홀딩스":     { s: "005490.KS", n: "POSCO홀딩스" },"lg화학":  { s: "051910.KS", n: "LG화학" },
  "삼성sdi":          { s: "006400.KS", n: "삼성SDI" },   "기아":     { s: "000270.KS", n: "기아" },
  "삼성물산":         { s: "028260.KS", n: "삼성물산" },  "한국전력": { s: "015760.KS", n: "한국전력" },
  "하나금융지주":     { s: "086790.KS", n: "하나금융지주" },
  "우리금융지주":     { s: "316140.KS", n: "우리금융지주" },
  "현대모비스":       { s: "012330.KS", n: "현대모비스" },
  "한화에어로스페이스":{ s: "012450.KS", n: "한화에어로스페이스" },
  "한화에어로":       { s: "012450.KS", n: "한화에어로스페이스" },
  "두산에너빌리티":   { s: "034020.KS", n: "두산에너빌리티" },
  "두산":             { s: "000150.KS", n: "두산" },
  "sk이노베이션":     { s: "096770.KS", n: "SK이노베이션" },
  "sk":               { s: "034730.KS", n: "SK" },
  "sk스퀘어":   { s: "402340.KS", n: "SK스퀘어" },
  "한국조선해양":     { s: "009540.KS", n: "한국조선해양" },
  "현대중공업":       { s: "329180.KS", n: "현대중공업" },
  "삼성중공업":       { s: "010140.KS", n: "삼성중공업" },
  "대우조선해양":     { s: "042660.KS", n: "한화오션" },  "한화오션": { s: "042660.KS", n: "한화오션" },
  "lg전자":           { s: "066570.KS", n: "LG전자" },    "lg":       { s: "003550.KS", n: "LG" },
  "롯데케미칼":       { s: "011170.KS", n: "롯데케미칼" },"삼성전기": { s: "009150.KS", n: "삼성전기" },
  "이수페타시스":     { s: "007660.KS", n: "이수페타시스" },
  "한미반도체":       { s: "042700.KS", n: "한미반도체" },"리노공업": { s: "058470.KQ", n: "리노공업" },
  "테크윙":           { s: "089030.KQ", n: "테크윙" },    "원익ips":  { s: "240810.KQ", n: "원익IPS" },
  "에이피시스템":     { s: "278990.KQ", n: "에이피시스템" },
  "피에스케이":       { s: "319660.KQ", n: "피에스케이" },"솔브레인": { s: "357780.KQ", n: "솔브레인" },
  "동진쎄미켐":       { s: "005290.KS", n: "동진쎄미켐" },"isc":      { s: "095340.KQ", n: "ISC" },
  "고영":             { s: "098460.KQ", n: "고영테크놀러지" },
  "심텍":             { s: "222800.KQ", n: "심텍" },       "대덕전자": { s: "353200.KS", n: "대덕전자" },
  "코리아써키트":     { s: "007810.KS", n: "코리아써키트" },
  "삼성전기우":       { s: "009155.KS", n: "삼성전기우" },"한화엔진": { s: "272210.KS", n: "한화엔진" },
  "오이솔루션":       { s: "138080.KQ", n: "오이솔루션" },"db하이텍": { s: "000990.KS", n: "DB하이텍" },
  "네오셈":           { s: "389030.KQ", n: "네오셈" },     "snt홀딩스":{ s: "036530.KS", n: "SNT홀딩스" },
  "snt":              { s: "036530.KS", n: "SNT홀딩스" },  "stx엔진":  { s: "077970.KS", n: "STX엔진" },
  "hd현대마린엔진":   { s: "082740.KS", n: "HD현대마린엔진" },
  "hsd엔진":          { s: "082740.KS", n: "HD현대마린엔진" },
  "현대마린엔진":     { s: "082740.KS", n: "HD현대마린엔진" },
  "hd현대":           { s: "267250.KS", n: "HD현대" },
  "현대일렉트릭":     { s: "267260.KS", n: "현대일렉트릭" },
  "효성중공업":       { s: "298040.KS", n: "효성중공업" },"ls일렉트릭":{ s: "010120.KS", n: "LS일렉트릭" },
  "삼성바이오":       { s: "207940.KS", n: "삼성바이오로직스" },
  "유한양행":         { s: "000100.KS", n: "유한양행" },   "한미약품": { s: "128940.KS", n: "한미약품" },
  "셀트리온헬스케어": { s: "091990.KQ", n: "셀트리온헬스케어" },
  "에이치엘비":       { s: "028300.KQ", n: "HLB" },        "hlb":      { s: "028300.KQ", n: "HLB" }
};


// ════════════════════════════════════════════════════════════════
// 📊 주가 명령어: 섹터별 종목 배열
// 새 종목 추가할 때 여기에 { s:"심볼", n:"이름" } 추가하면 됨
// ════════════════════════════════════════════════════════════════
var ALL_INDICES = [
  { label:"코스피",   symbol:"^KS11" },{ label:"코스닥",   symbol:"^KQ11" },
  { label:"나스닥",   symbol:"^IXIC" },{ label:"S&P500",   symbol:"^GSPC" },
  { label:"다우",     symbol:"^DJI"  },{ label:"러셀2000", symbol:"^RUT"  }
];
var KR_SEMI_STOCKS = [
  { s:"005930.KS",n:"삼성전자" },{ s:"000660.KS",n:"SK하이닉스" },
  { s:"042700.KS",n:"한미반도체" },
  { s:"058470.KQ",n:"리노공업" },{ s:"403870.KQ",n:"HPSP" },
  { s:"000990.KS",n:"DB하이텍" },{ s:"240810.KQ",n:"원익IPS" },
  { s:"007660.KS",n:"이수페타시스" },{ s:"319660.KQ",n:"피에스케이" }
];
var INTL_SEMI_STOCKS = [
  { s:"NVDA",n:"NVIDIA" },{ s:"TSM",n:"TSMC" },{ s:"AVGO",n:"Broadcom" },
  { s:"AMD",n:"AMD" },{ s:"QCOM",n:"Qualcomm" },{ s:"AMAT",n:"Applied Materials" },
  { s:"MU",n:"Micron" },{ s:"INTC",n:"Intel" },{ s:"SNDK",n:"SanDisk" }
];
var INTL_SEMI_EXTRA = [{ s:"285A.T",n:"키오시아" }];
var US_TECH_STOCKS = [
  { s:"NVDA",n:"NVIDIA" },{ s:"AAPL",n:"Apple" },{ s:"MSFT",n:"Microsoft" },
  { s:"GOOGL",n:"Alphabet" },{ s:"AMZN",n:"Amazon" },{ s:"META",n:"Meta" },
  { s:"AVGO",n:"Broadcom" },{ s:"TSLA",n:"Tesla" },{ s:"ORCL",n:"Oracle" },{ s:"NFLX",n:"Netflix" }
];
var SHIPBUILDING_STOCKS = [
  { s:"267250.KS",n:"HD현대" },{ s:"009540.KS",n:"한국조선해양" },
  { s:"329180.KS",n:"HD현대중공업" },{ s:"042660.KS",n:"한화오션" },
  { s:"010140.KS",n:"삼성중공업" },{ s:"082740.KS",n:"HD현대마린엔진" },
  { s:"100090.KS",n:"SK오션플랜트" },{ s:"097230.KS",n:"HJ중공업" },
  { s:"075580.KQ",n:"세진중공업" },{ s:"075520.KQ",n:"동성화인텍" }
];
var DEFENSE_STOCKS = [
  { s:"012450.KS",n:"한화에어로스페이스" },{ s:"079550.KS",n:"LIG넥스원" },
  { s:"064350.KS",n:"현대로템" },{ s:"272210.KS",n:"한화시스템" },
  { s:"047810.KS",n:"한국항공우주" },{ s:"103140.KS",n:"풍산" },
  { s:"000880.KS",n:"한화" },{ s:"065420.KQ",n:"빅텍" },
  { s:"010820.KQ",n:"퍼스텍" },{ s:"013810.KQ",n:"스페코" }
];
var CHEM_STOCKS = [
  { s:"051910.KS",n:"LG화학" },{ s:"011170.KS",n:"롯데케미칼" },
  { s:"011780.KS",n:"금호석유" },{ s:"009830.KS",n:"한화솔루션" },
  { s:"011790.KS",n:"SKC" },{ s:"004800.KS",n:"효성" },
  { s:"120110.KS",n:"코오롱인더" },{ s:"298050.KS",n:"효성화학" },
  { s:"004000.KS",n:"롯데정밀화학" },{ s:"010060.KS",n:"OCI홀딩스" }
];
var CONSTRUCTION_STOCKS = [
  { s:"000720.KS",n:"현대건설" },{ s:"006360.KS",n:"GS건설" },
  { s:"047040.KS",n:"대우건설" },{ s:"028050.KS",n:"삼성엔지니어링" },
  { s:"294870.KS",n:"HDC현대산업개발" },{ s:"375500.KS",n:"DL이앤씨" },
  { s:"000215.KS",n:"DL" },{ s:"013580.KS",n:"계룡건설" },
  { s:"004960.KS",n:"한신공영" },{ s:"003070.KS",n:"코오롱글로벌" }
];
var ENERGY_STOCKS = [
  { s:"015760.KS",n:"한국전력" },{ s:"036460.KS",n:"한국가스공사" },
  { s:"096770.KS",n:"SK이노베이션" },{ s:"010950.KS",n:"S-OIL" },
  { s:"034020.KS",n:"두산에너빌리티" },{ s:"267260.KS",n:"HD현대일렉트릭" },
  { s:"298040.KS",n:"효성중공업" },{ s:"010120.KS",n:"LS ELECTRIC" },
  { s:"051600.KS",n:"한전KPS" },{ s:"078930.KS",n:"GS" }
];
var ROBOT_STOCKS = [
  { s:"454910.KS",n:"두산로보틱스" },{ s:"277810.KQ",n:"레인보우로보틱스" },
  { s:"090360.KQ",n:"로보스타" },{ s:"056080.KQ",n:"유진로봇" },
  { s:"108490.KQ",n:"로보티즈" },{ s:"307950.KS",n:"현대오토에버" },
  { s:"389550.KQ",n:"에스비비테크" },{ s:"117730.KQ",n:"티로보틱스" },
  { s:"462580.KQ",n:"뉴로메카" },{ s:"060280.KQ",n:"큐렉소" }
];
var BIO_STOCKS = [
  { s:"207940.KS",n:"삼성바이오로직스" },{ s:"068270.KS",n:"셀트리온" },
  { s:"000100.KS",n:"유한양행" },{ s:"128940.KS",n:"한미약품" },
  { s:"028300.KQ",n:"HLB" },{ s:"196170.KQ",n:"알테오젠" },
  { s:"145020.KQ",n:"휴젤" },{ s:"141080.KQ",n:"리가켐바이오" },
  { s:"003850.KS",n:"보령" },{ s:"185750.KS",n:"종근당" }
];
var AUTO_STOCKS = [
  { s:"005380.KS",n:"현대차" },{ s:"000270.KS",n:"기아" },
  { s:"012330.KS",n:"현대모비스" },{ s:"204320.KS",n:"HL만도" },
  { s:"011210.KS",n:"현대위아" },{ s:"086280.KS",n:"현대글로비스" },
  { s:"161390.KS",n:"한국타이어앤테크놀로지" },{ s:"005850.KS",n:"에스엘" },
  { s:"015750.KS",n:"성우하이텍" },{ s:"018880.KS",n:"한온시스템" }
];
var KR_FINANCE_STOCKS = [
  { s:"105560.KS",n:"KB금융" },{ s:"055550.KS",n:"신한지주" },
  { s:"086790.KS",n:"하나금융지주" },{ s:"316140.KS",n:"우리금융지주" },
  { s:"138040.KS",n:"메리츠금융지주" },{ s:"032830.KS",n:"삼성생명" },
  { s:"000810.KS",n:"삼성화재" },{ s:"005830.KS",n:"DB손해보험" },
  { s:"032640.KS",n:"LG유플러스" },{ s:"033780.KS",n:"KT&G" }
];
var KR_SEC_STOCKS = [
  { s:"006800.KS",n:"미래에셋증권" },{ s:"071050.KS",n:"한국금융지주" },
  { s:"016360.KS",n:"삼성증권" },{ s:"039490.KQ",n:"키움증권" },
  { s:"005940.KS",n:"NH투자증권" },{ s:"008560.KS",n:"메리츠증권" },
  { s:"003540.KS",n:"대신증권" },{ s:"001500.KS",n:"현대차증권" },
  { s:"030610.KS",n:"교보증권" },{ s:"006140.KS",n:"하이투자증권" }
];
var BATTERY_STOCKS = [
  { s:"373220.KS",n:"LG에너지솔루션" },{ s:"006400.KS",n:"삼성SDI" },
  { s:"096770.KS",n:"SK이노베이션" },{ s:"003670.KS",n:"포스코퓨처엠" },
  { s:"247540.KQ",n:"에코프로비엠" },{ s:"086520.KQ",n:"에코프로" },
  { s:"066970.KQ",n:"L&F" },{ s:"278280.KQ",n:"천보" },
  { s:"005070.KS",n:"코스모신소재" },{ s:"336370.KQ",n:"솔루스첨단소재" }
];
var STEEL_STOCKS = [
  { s:"005490.KS",n:"POSCO홀딩스" },{ s:"004020.KS",n:"현대제철" },
  { s:"010130.KS",n:"고려아연" },{ s:"001230.KS",n:"동국제강" },
  { s:"001430.KS",n:"세아베스틸지주" },{ s:"000670.KS",n:"영풍" },
  { s:"016380.KS",n:"동부제철" },{ s:"306200.KS",n:"세아제강지주" },
  { s:"084010.KS",n:"대한제강" },{ s:"104700.KQ",n:"한국철강" }
];
var US_FINANCE_STOCKS = [
  { s:"BRK-B",n:"버크셔해서웨이" },{ s:"JPM",n:"JP모건" },
  { s:"V",n:"비자" },{ s:"MA",n:"마스터카드" },
  { s:"BAC",n:"뱅크오브아메리카" },{ s:"WFC",n:"웰스파고" },
  { s:"GS",n:"골드만삭스" },{ s:"MS",n:"모건스탠리" },
  { s:"C",n:"시티그룹" },{ s:"AXP",n:"아메리칸익스프레스" }
];
var US_HEALTH_STOCKS = [
  { s:"LLY",n:"일라이릴리" },{ s:"UNH",n:"유나이티드헬스" },
  { s:"JNJ",n:"존슨앤존슨" },{ s:"ABBV",n:"애브비" },
  { s:"MRK",n:"머크" },{ s:"TMO",n:"써모피셔" },
  { s:"ABT",n:"애보트" },{ s:"ISRG",n:"인튜이티브서지컬" },
  { s:"PFE",n:"화이자" },{ s:"CI",n:"시그나" }
];
var US_ENERGY_STOCKS = [
  { s:"XOM",n:"엑슨모빌" },{ s:"CVX",n:"쉐브론" },
  { s:"COP",n:"코노코필립스" },{ s:"SLB",n:"슐럼버거" },
  { s:"EOG",n:"EOG리소시스" },{ s:"MPC",n:"마라톤페트롤리엄" },
  { s:"PSX",n:"필립스66" },{ s:"VLO",n:"발레로에너지" },
  { s:"OXY",n:"옥시덴탈" },{ s:"WMB",n:"윌리엄스컴퍼니" }
];
var US_DEFENSE_STOCKS = [
  { s:"RTX",n:"RTX(레이시온)" },{ s:"LMT",n:"록히드마틴" },
  { s:"NOC",n:"노스롭그루먼" },{ s:"GD",n:"제너럴다이나믹스" },
  { s:"LHX",n:"L3해리스" },{ s:"BA",n:"보잉" },
  { s:"HII",n:"헌팅턴잉걸스" },{ s:"GE",n:"GE에어로스페이스" },
  { s:"LDOS",n:"레이도스" },{ s:"TDG",n:"트랜스다임" }
];
var US_BIO_STOCKS = [
  { s:"NVO",n:"노보노디스크" },{ s:"AMGN",n:"암젠" },
  { s:"GILD",n:"길리어드" },{ s:"REGN",n:"리제네론" },
  { s:"VRTX",n:"버텍스" },{ s:"AZN",n:"아스트라제네카" },
  { s:"BIIB",n:"바이오젠" },{ s:"MRNA",n:"모더나" },
  { s:"BNTX",n:"바이오엔텍" },{ s:"ILMN",n:"일루미나" }
];
var US_CONSUMER_STOCKS = [
  { s:"AMZN",n:"아마존" },{ s:"WMT",n:"월마트" },
  { s:"HD",n:"홈디포" },{ s:"MCD",n:"맥도날드" },
  { s:"COST",n:"코스트코" },{ s:"NKE",n:"나이키" },
  { s:"SBUX",n:"스타벅스" },{ s:"LOW",n:"로우스" },
  { s:"TGT",n:"타겟" },{ s:"TJX",n:"TJX컴퍼니" }
];
var US_TELECOM_STOCKS = [
  { s:"T",n:"AT&T" },{ s:"VZ",n:"버라이즌" },
  { s:"TMUS",n:"T-모바일" },{ s:"CMCSA",n:"컴캐스트" },
  { s:"DIS",n:"디즈니" },{ s:"NFLX",n:"넷플릭스" },
  { s:"CHTR",n:"차터커뮤니케이션" },{ s:"WBD",n:"워너브러더스" },
  { s:"PARA",n:"파라마운트" },{ s:"ROKU",n:"로쿠" }
];
var US_EV_STOCKS = [
  { s:"TSLA",n:"테슬라" },{ s:"GM",n:"GM" },
  { s:"F",n:"포드" },{ s:"RIVN",n:"리비안" },
  { s:"LCID",n:"루시드" },{ s:"NIO",n:"니오" },
  { s:"LI",n:"리오토" },{ s:"XPEV",n:"샤오펑" },
  { s:"STLA",n:"스텔란티스" },{ s:"PSNY",n:"폴스타" }
];
var US_REIT_STOCKS = [
  { s:"PLD",n:"프로로지스" },{ s:"AMT",n:"아메리칸타워" },
  { s:"EQIX",n:"에퀴닉스" },{ s:"CCI",n:"크라운캐슬" },
  { s:"SPG",n:"사이먼프라퍼티" },{ s:"O",n:"리얼티인컴" },
  { s:"PSA",n:"퍼블릭스토리지" },{ s:"VICI",n:"비씨아이프라퍼티" },
  { s:"WELL",n:"웰타워" },{ s:"IRM",n:"아이언마운틴" }
];
var US_CLOUD_STOCKS = [
  { s:"MSFT",n:"마이크로소프트" },{ s:"AMZN",n:"아마존" },
  { s:"GOOGL",n:"구글" },{ s:"CRM",n:"세일즈포스" },
  { s:"NOW",n:"서비스나우" },{ s:"SNOW",n:"스노우플레이크" },
  { s:"NET",n:"클라우드플레어" },{ s:"DDOG",n:"데이터독" },
  { s:"PLTR",n:"팔란티어" },{ s:"ZS",n:"지스케일러" }
];


// ════════════════════════════════════════════════════════════════
// 🔧 내부 유틸 함수 (건드릴 일 거의 없음)
// ════════════════════════════════════════════════════════════════
function urlEncode(str) {
  try { return String(java.net.URLEncoder.encode(str,"UTF-8")).replace(/\+/g,"%20"); }
  catch(e) { return encodeURIComponent(str); }
}
function httpGet(url) { return httpGetWithHeaders(url,{}); }
function httpGetWithHeaders(url, extraHeaders) {
  try {
    var conn = new java.net.URL(url).openConnection();
    conn.setRequestProperty("User-Agent","Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36");
    conn.setConnectTimeout(5000); conn.setReadTimeout(5000);
    for (var k in extraHeaders) conn.setRequestProperty(k,extraHeaders[k]);
    var reader = new java.io.BufferedReader(new java.io.InputStreamReader(conn.getInputStream(),"UTF-8"));
    var sb = new java.lang.StringBuilder(), line;
    while ((line=reader.readLine())!==null) sb.append(line);
    reader.close(); return sb.toString();
  } catch(e) { return null; }
}
function httpGetPoll(url) {  // 텔레그램 롱폴링 전용 (35초 타임아웃)
  try {
    var conn = new java.net.URL(url).openConnection();
    conn.setRequestProperty("User-Agent","Mozilla/5.0");
    conn.setConnectTimeout(5000); conn.setReadTimeout(35000);
    var reader = new java.io.BufferedReader(new java.io.InputStreamReader(conn.getInputStream(),"UTF-8"));
    var sb = new java.lang.StringBuilder(), line;
    while ((line=reader.readLine())!==null) sb.append(line);
    reader.close(); return sb.toString();
  } catch(e) { return null; }
}
function httpPost(url, jsonBody) {
  try {
    var conn = new java.net.URL(url).openConnection();
    conn.setRequestProperty("Content-Type","application/json; charset=UTF-8");
    conn.setRequestProperty("User-Agent","Mozilla/5.0");
    conn.setConnectTimeout(15000); conn.setReadTimeout(90000); conn.setDoOutput(true);
    var bytes = new java.lang.String(jsonBody).getBytes("UTF-8");
    var os = conn.getOutputStream(); os.write(bytes); os.flush(); os.close();
    var stream; try { stream=conn.getInputStream(); } catch(e2) { stream=conn.getErrorStream(); }
    if (!stream) return null;
    var reader = new java.io.BufferedReader(new java.io.InputStreamReader(stream,"UTF-8"));
    var sb = new java.lang.StringBuilder(), line;
    while ((line=reader.readLine())!==null) sb.append(line);
    reader.close(); return sb.toString();
  } catch(e) { return null; }
}
function sendToRoom(roomName, message) {
  var MAX=3000, i=0;
  while (i<message.length) {
    var chunk=message.substring(i,Math.min(i+MAX,message.length));
    var r=sent["__session__"+roomName];
    try {
      if (r) r.reply(chunk);
      else Api.replyRoom(roomName,chunk);
    } catch(e) {
      sent["__session__"+roomName]=null;
      try { Api.replyRoom(roomName,chunk); } catch(e2) {}
    }
    i+=MAX; if (i<message.length) java.lang.Thread.sleep(800);
  }
}

var DEDUP_TTL = 2 * 60 * 60 * 1000; // 2시간

function cleanSent() {
  var now = new Date().getTime();
  var keep = {};
  for (var k in sent) {
    if (k.indexOf("__session__") === 0) { keep[k] = sent[k]; continue; }
    if (typeof sent[k] === "number" && now - sent[k] < DEDUP_TTL) keep[k] = sent[k];
  }
  sent = keep;
}

function dedupKey(text) {
  return text.replace(/[^가-힣a-zA-Z0-9]/g, "").substring(0, 80);
}

function isDup(key) {
  var now = new Date().getTime();
  if (sent[key] && now - sent[key] < DEDUP_TTL) return true;
  sent[key] = now;
  cleanSent();
  return false;
}

function getYFAuth() {
  if (_yfAuth) return _yfAuth;
  var now=java.lang.System.currentTimeMillis();
  if (now-_yfAuthTs<300000) return null;
  _yfAuthTs=now;
  var UA="Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.210 Mobile Safari/537.36";
  try {
    var conn1=new java.net.URL("https://finance.yahoo.com/").openConnection();
    conn1.setInstanceFollowRedirects(true); conn1.setRequestProperty("User-Agent",UA);
    conn1.setRequestProperty("Accept","text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8");
    conn1.setConnectTimeout(6000); conn1.setReadTimeout(6000); conn1.connect();
    var cookies=[]; for (var i=1;;i++) { var hk=conn1.getHeaderFieldKey(i); if (!hk) break; if (String(hk).toLowerCase()==="set-cookie") cookies.push(String(conn1.getHeaderField(i)).split(";")[0]); }
    try { conn1.getInputStream().close(); } catch(e2) {}
    var cookieStr=cookies.join("; ");
    var conn2=new java.net.URL("https://query1.finance.yahoo.com/v1/test/getcrumb").openConnection();
    conn2.setRequestProperty("User-Agent",UA); conn2.setRequestProperty("Cookie",cookieStr);
    conn2.setConnectTimeout(5000); conn2.setReadTimeout(5000);
    var br=new java.io.BufferedReader(new java.io.InputStreamReader(conn2.getInputStream(),"UTF-8"));
    var crumb=String(br.readLine()||"").trim(); br.close();
    if (crumb&&crumb.length>0) _yfAuth={crumb:crumb,cookie:cookieStr};
  } catch(e) {}
  return _yfAuth;
}
function fetchNaverQuote(code, fallbackSymbol) {
  try {
    var raw1=httpGetWithHeaders("https://polling.finance.naver.com/api/realtime/domestic/stock/"+code,{"Referer":"https://finance.naver.com/","Accept":"application/json"});
    if (raw1) { var d1=JSON.parse(raw1); var stock=(d1.datas&&d1.datas.length)?d1.datas[0]:null; if (stock) { var p1=parseFloat(String(stock.nv||stock.sv||"").replace(/,/g,"")); var c1=parseFloat(String(stock.cv||"0").replace(/,/g,"").replace(/\+/g,"")); var r1=parseFloat(String(stock.cr||"0").replace(/\+/g,"")); if (p1) return {symbol:fallbackSymbol||(code+".KS"),name:stock.nm||code,price:p1,prevClose:p1-c1,change:c1,changePct:r1,currency:"KRW"}; } }
  } catch(e1) {}
  try {
    var raw2=httpGetWithHeaders("https://m.stock.naver.com/api/stock/"+code+"/basic",{"Referer":"https://m.stock.naver.com/","Accept":"application/json"});
    if (raw2) { var d2=JSON.parse(raw2); var p2=parseFloat(String(d2.closePrice||d2.currentPrice||d2.stockPrice||"").replace(/,/g,"")); var c2=parseFloat(String(d2.compareToPreviousClosePrice||d2.changePrice||d2.priceChange||"0").replace(/,/g,"").replace(/\+/g,"")); var r2=parseFloat(String(d2.fluctuationsRatio||d2.changeRate||d2.rateOfChange||"0").replace(/\+/g,"")); if (p2) return {symbol:fallbackSymbol||(code+".KS"),name:d2.stockName||d2.name||code,price:p2,prevClose:p2-c2,change:c2,changePct:r2,currency:"KRW"}; }
  } catch(e2) {}
  return null;
}
function fetchQuoteBatch(symbols) {
  if (!symbols||!symbols.length) return {};
  var auth=getYFAuth(); var parts=[]; for (var i=0;i<symbols.length;i++) parts.push(urlEncode(symbols[i]));
  var raw=httpGetWithHeaders("https://query2.finance.yahoo.com/v7/finance/quote?symbols="+parts.join("%2C")+(auth?"&crumb="+urlEncode(auth.crumb):""),auth?{"Cookie":auth.cookie}:{});
  if (!raw) return {};
  try {
    var data=JSON.parse(raw); var results=data.quoteResponse&&data.quoteResponse.result; if (!results) return {};
    var map={};
    for (var i=0;i<results.length;i++) { var q=results[i]; var price=q.regularMarketPrice; if (!price) continue; var prev=q.regularMarketPreviousClose||price; var change=price-prev; map[q.symbol]={symbol:q.symbol,name:q.shortName||q.longName||q.symbol,price:price,prevClose:prev,change:change,changePct:prev?(change/prev)*100:0,currency:q.currency||"USD"}; }
    return map;
  } catch(e) { return {}; }
}
function fetchQuote(symbol) {
  var auth=getYFAuth();
  var raw=httpGetWithHeaders("https://query2.finance.yahoo.com/v8/finance/chart/"+urlEncode(symbol)+"?range=1d&interval=1d&includePrePost=false"+(auth?"&crumb="+urlEncode(auth.crumb):""),auth?{"Cookie":auth.cookie}:{});
  if (!raw) return null;
  try {
    var data=JSON.parse(raw); if (!data.chart||!data.chart.result||!data.chart.result[0]) return null;
    var meta=data.chart.result[0].meta; var price=meta.regularMarketPrice;
    var prev=meta.chartPreviousClose||meta.regularMarketPreviousClose||meta.previousClose;
    if (!price) return null; if (!prev) prev=price; var change=price-prev;
    return {symbol:meta.symbol||symbol,name:meta.shortName||meta.longName||symbol,price:price,prevClose:prev,change:change,changePct:(change/prev)*100,currency:meta.currency||"USD"};
  } catch(e) { return null; }
}
function fetchQuoteDetailed(symbol) {
  var auth = getYFAuth();
  var raw = httpGetWithHeaders(
    "https://query2.finance.yahoo.com/v11/finance/quoteSummary/" +
    urlEncode(symbol) + "?modules=assetProfile%2Cprice" +
    (auth ? "&crumb=" + urlEncode(auth.crumb) : ""),
    auth ? { "Cookie": auth.cookie } : {}
  );
  if (!raw) return null;
  try {
    var data = JSON.parse(raw);
    var result = data.quoteSummary && data.quoteSummary.result && data.quoteSummary.result[0];
    if (!result) return null;
    var profile = result.assetProfile || {};
    var priceData = result.price || {};
    var cap = (priceData.marketCap && priceData.marketCap.raw) || null;
    return {
      sector: profile.sector || null,
      marketCap: cap,
      summary: profile.longBusinessSummary || null,
      detailCurrency: priceData.currency || null
    };
  } catch(e) { return null; }
}
function searchKrSymbol(query) {
  var tries = [query];
  if (query.toUpperCase() !== query) tries.push(query.toUpperCase());

  for (var ti = 0; ti < tries.length; ti++) {
    try {
      var uri = new java.net.URI(
        "https", "ac.finance.naver.com", "/ac",
        "q=" + tries[ti] + "&q_enc=UTF-8&target=stock&with_article=N", null
      );
      var raw = httpGetWithHeaders(uri.toURL().toString(), {
        "Referer": "https://finance.naver.com/",
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "Accept-Language": "ko-KR,ko;q=0.9",
        "X-Requested-With": "XMLHttpRequest",
        "User-Agent": "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36"
      });
      if (raw && raw.charAt(0) === "{") {
        var data = JSON.parse(raw);
        var items = data.items;
        if (items && items.length) {
          for (var i = 0; i < items.length; i++) {
            var group = items[i];
            var list = (group[0] !== undefined && group[0] !== null && typeof group[0] === "object" && group[0].length !== undefined)
              ? group : [group];
            for (var j = 0; j < list.length; j++) {
              var item = list[j];
              var code = null, market = "";
              if (item && item[1] !== undefined) {
                code = String(item[1]).trim();
                market = item[2] ? String(item[2]) : "";
              } else if (item && item.code) {
                code = String(item.code).trim();
                market = item.market ? String(item.market) : "";
              }
              if (!code || !/^\d{6}$/.test(code)) continue;
              return code + ((market.indexOf("코스닥") !== -1) ? ".KQ" : ".KS");
            }
          }
        }
      }
    } catch(e) {}
  }

  try {
    var raw2 = httpGet(
      "https://query1.finance.yahoo.com/v1/finance/search?q=" +
      urlEncode(query) + "&quotesCount=5&newsCount=0&region=KR&lang=ko-KR"
    );
    if (raw2) {
      var data2 = JSON.parse(raw2);
      if (data2.quotes && data2.quotes.length) {
        for (var j = 0; j < data2.quotes.length; j++) {
          var sym = data2.quotes[j].symbol;
          if (sym && (sym.indexOf(".KS") !== -1 || sym.indexOf(".KQ") !== -1)) return sym;
        }
      }
    }
  } catch(e) {}

  try {
    var raw3 = httpGetWithHeaders(
      "https://m.stock.naver.com/api/search/all?keyword=" + urlEncode(query) + "&page=1&pageSize=5",
      { "Referer": "https://m.stock.naver.com/", "Accept": "application/json" }
    );
    if (raw3) {
      var data3 = JSON.parse(raw3);
      var stocks3 = (data3.stocks && data3.stocks.items) ? data3.stocks.items
                  : (data3.items ? data3.items : null);
      if (stocks3 && stocks3.length) {
        var it3 = stocks3[0];
        var code3 = String(it3.itemCode || it3.code || "").trim();
        var mkt3 = String(it3.stockExchangeType || it3.market || "");
        if (/^\d{6}$/.test(code3)) {
          return code3 + ((mkt3.indexOf("KOSDAQ") !== -1 || mkt3.indexOf("코스닥") !== -1) ? ".KQ" : ".KS");
        }
      }
    }
  } catch(e3) {}

  return null;
}

function commasInt(n) { return Math.round(Math.abs(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g,","); }
function commasFloat(n) { var parts=Math.abs(n).toFixed(2).split("."); parts[0]=parts[0].replace(/\B(?=(\d{3})+(?!\d))/g,","); return parts.join("."); }
function formatMarketCap(cap, currency) {
  if (!cap) return null;
  if (currency === "KRW") {
    var jo = cap / 1e12;
    if (jo >= 1) return commasFloat(jo) + "조원";
    return commasInt(cap / 1e8) + "억원";
  }
  var eok = cap / 1e8;
  var krwJo = (cap * 1380) / 1e12;
  var usdStr = (eok >= 10000) ? commasFloat(eok / 10000) + "조달러" : commasInt(eok) + "억달러";
  var krwStr = (krwJo >= 1) ? krwJo.toFixed(1) + "조" : commasInt(krwJo * 1000) + "억";
  return usdStr + " (" + krwStr + ")";
}
function formatQuote(info, displayName) {
  var isKRW=(info.currency==="KRW"),isJPY=(info.currency==="JPY"),isIndex=(info.symbol.charAt(0)==="^");
  var arrow=info.change>=0?"▲":"▼";
  var dispSym=info.symbol.replace(/\.(KS|KQ|T)$/,"").replace(/^\^/,""),name=displayName||info.name;
  var priceStr,chgStr,prevStr;
  if (isKRW)       {priceStr="₩"+commasInt(info.price);      chgStr=commasInt(Math.abs(info.change));        prevStr="₩"+commasInt(info.prevClose);}
  else if (isJPY)  {priceStr="¥"+commasInt(info.price);      chgStr=commasInt(Math.abs(info.change));        prevStr="¥"+commasInt(info.prevClose);}
  else if (isIndex){priceStr=commasFloat(info.price);        chgStr=commasFloat(Math.abs(info.change));      prevStr=commasFloat(info.prevClose);}
  else             {priceStr="$"+commasFloat(info.price);    chgStr=commasFloat(Math.abs(info.change));      prevStr="$"+commasFloat(info.prevClose);}
  return "📊 "+name+" ("+dispSym+")\n\n현재가: "+priceStr+"\n"+arrow+" "+chgStr+" ("+Math.abs(info.changePct).toFixed(2)+"%)\n전일종가: "+prevStr;
}
function callGeminiDesc(name, sector, summary) {
  if (!summary || summary.length < 50) return null;
  try {
    var url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + GEMINI_API_KEY;
    var prompt = "기업 설명을 보고 투자자 관점 핵심 특징 3가지를 한국어 짧은 문장으로 작성해. 각 항목은 '- '로 시작. 각 항목 35자 이내. 마크다운 기호 금지. 서두 없이 불렛 3개만 출력.\n\n회사: " + name + (sector ? "\n섹터: " + sector : "") + "\n설명: " + summary.substring(0, 600);
    var body = JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] });
    var raw = httpPost(url, body);
    if (!raw) return null;
    var res = JSON.parse(raw);
    if (res.error) return null;
    return (res.candidates[0].content.parts[0].text || "").trim();
  } catch(e) { return null; }
}
function formatQuoteDetailed(info, detail, displayName, bullets) {
  var isKRW = (info.currency === "KRW"), isJPY = (info.currency === "JPY");
  var arrow = info.change >= 0 ? "▲" : "▼";
  var pctSign = info.change >= 0 ? "+" : "-";
  var dispSym = info.symbol.replace(/\.(KS|KQ|T)$/, "").replace(/^\^/, "");
  var name = displayName || info.name;
  var priceStr, chgStr;
  if (isKRW)      { priceStr = "₩" + commasInt(info.price);    chgStr = commasInt(Math.abs(info.change)); }
  else if (isJPY) { priceStr = "¥" + commasInt(info.price);    chgStr = commasInt(Math.abs(info.change)); }
  else            { priceStr = "$" + commasFloat(info.price);   chgStr = commasFloat(Math.abs(info.change)); }
  var lines = ["📊 " + name + " (" + dispSym + ")\n"];
  lines.push(priceStr + " " + arrow + chgStr + " (" + pctSign + Math.abs(info.changePct).toFixed(2) + "%)");
  if (detail) {
    if (detail.sector) lines.push("섹터 : " + detail.sector);
    var capCurrency = detail.detailCurrency || info.currency;
    var capStr = formatMarketCap(detail.marketCap, capCurrency);
    if (capStr) lines.push("시총 : " + capStr);
  }
  if (bullets) { lines.push("\n[기업개요]"); lines.push(bullets); }
  return lines.join("\n");
}
function fetchAndFormatDetailed(info, symbol, displayName) {
  var detail = null, bullets = null;
  try { detail = fetchQuoteDetailed(symbol); } catch(e) {}
  if (detail && detail.summary) {
    try { bullets = callGeminiDesc(displayName || info.name, detail.sector, detail.summary); } catch(e) {}
  }
  return formatQuoteDetailed(info, detail, displayName, bullets);
}
function sectorLine(item, useTicker, preInfo) {
  var info=(preInfo!==undefined)?preInfo:fetchQuote(item.s);
  var label=(useTicker&&/^[A-Z]+$/.test(item.s))?item.s:item.n;
  if (!info) return label+"  -";
  var isKRW=(info.currency==="KRW"),isJPY=(info.currency==="JPY");
  var arrow=info.change>=0?"▲":"▽",pct=Math.abs(info.changePct).toFixed(2)+"%";
  var price=isKRW?commasInt(info.price):isJPY?"¥"+commasInt(info.price):"$"+commasFloat(info.price);
  return label+"  "+price+" ("+arrow+pct+")";
}
function buildSectorMsg(title, stocks, extra, useTicker, footer) {
  var allItems=(extra&&extra.length)?stocks.concat(extra):stocks;
  var syms=[]; for (var i=0;i<allItems.length;i++) syms.push(allItems[i].s);
  var map=fetchQuoteBatch(syms); var lines=[title+"\n"];
  for (var i=0;i<stocks.length;i++) lines.push(sectorLine(stocks[i],useTicker,map[stocks[i].s]||null));
  if (extra&&extra.length){lines.push(""); for (var j=0;j<extra.length;j++) lines.push(sectorLine(extra[j],useTicker,map[extra[j].s]||null));}
  if (footer) lines.push("\n"+footer);
  return lines.join("\n");
}
function fetchAllIndices() {
  var syms=[]; for (var i=0;i<ALL_INDICES.length;i++) syms.push(ALL_INDICES[i].symbol);
  var map=fetchQuoteBatch(syms); var lines=["📈 주요 지수\n"];
  for (var i=0;i<ALL_INDICES.length;i++) { var idx=ALL_INDICES[i],info=map[idx.symbol]; if (!info){lines.push(idx.label+" 조회 실패");continue;} var arrow=info.change>=0?"▲":"▼"; lines.push(idx.label+" "+commasFloat(info.price)+" ("+arrow+Math.abs(info.changePct).toFixed(2)+"%)");
 }
  return lines.join("\n");
}
function fetchOilPrice() {
  var map=fetchQuoteBatch(["CL=F","BZ=F"]);
  function oilLine(label,sym){var info=map[sym];if(!info)return label+": 조회 실패";var arrow=info.change>=0?"▲":"▼";return label+" "+commasFloat(info.price)+"("+arrow+Math.abs(info.changePct).toFixed(2)+"%)"}

  return oilLine("WTI","CL=F")+"\n"+oilLine("브렌트유","BZ=F");
}
function fetchCombinedSemi() {
  var krStocks=KR_SEMI_STOCKS.slice(0,5); var allItems=krStocks.concat(INTL_SEMI_STOCKS).concat(INTL_SEMI_EXTRA);
  var syms=[]; for (var i=0;i<allItems.length;i++) syms.push(allItems[i].s); var map=fetchQuoteBatch(syms);
  var kr=["🇰🇷 한국 반도체 시세\n"]; for (var i=0;i<krStocks.length;i++) kr.push(sectorLine(krStocks[i],false,map[krStocks[i].s]||null));
  var intl=["🌐 해외 반도체 시세\n"]; for (var j=0;j<INTL_SEMI_STOCKS.length;j++) intl.push(sectorLine(INTL_SEMI_STOCKS[j],true,map[INTL_SEMI_STOCKS[j].s]||null));
  if (INTL_SEMI_EXTRA.length){intl.push("");for (var k=0;k<INTL_SEMI_EXTRA.length;k++) intl.push(sectorLine(INTL_SEMI_EXTRA[k],true,map[INTL_SEMI_EXTRA[k].s]||null));}
  intl.push("\n(본장시간 외 종가로 표기)");
  return kr.join("\n")+"\n\n"+intl.join("\n");
}
function fetchExchangeRates() {
  var pairs=[{s:"USDKRW=X",unit:"1달러  "},{s:"EURKRW=X",unit:"1유로  "},{s:"JPYKRW=X",unit:"100엔  ",per:100},{s:"CNYKRW=X",unit:"1위안  "},{s:"GBPKRW=X",unit:"1파운드"}];
  var syms=[]; for (var i=0;i<pairs.length;i++) syms.push(pairs[i].s); var map=fetchQuoteBatch(syms);
  var lines=["💱 환율 (원화 기준)\n"];
  for (var i=0;i<pairs.length;i++) { var p=pairs[i],info=map[p.s]; if (!info){lines.push(p.unit+" = 조회 실패");continue;} var mul=p.per||1,rate=info.price*mul,prev=info.prevClose*mul,change=rate-prev,pct=prev?(change/prev)*100:0; var arrow=change>=0?"▲":"▼"; lines.push(p.unit+" "+commasInt(rate)+"원 ("+arrow+Math.abs(pct).toFixed(2)+"%)"); }
  return lines.join("\n");
}
function fetchMetals() {
  var items=[{s:"GC=F",n:"금 GLD "},{s:"SI=F",n:"실버 SLV"},{s:"PL=F",n:"백금 PL "},{s:"HG=F",n:"구리 HG "},{s:"PA=F",n:"팔라듐  "}];
  var syms=[]; for (var i=0;i<items.length;i++) syms.push(items[i].s); var map=fetchQuoteBatch(syms);
  var lines=["🥇 금속 시세 (달러 기준)\n"];
  for (var i=0;i<items.length;i++) { var it=items[i],info=map[it.s]; if (!info){lines.push(it.n+" -");continue;} var arrow=info.change>=0?"▲":"▽"; lines.push(it.n+" "+commasFloat(info.price)+" ("+arrow+Math.abs(info.changePct).toFixed(2)+"%)"); }
  return lines.join("\n");
}
function fetchCommodities() {
  var items=[{s:"CL=F",n:"WTI원유  "},{s:"BZ=F",n:"브렌트유 "},{s:"NG=F",n:"천연가스 "},{s:"ZW=F",n:"밀       "},{s:"ZC=F",n:"옥수수   "},{s:"ZS=F",n:"대두     "}];
  var syms=[]; for (var i=0;i<items.length;i++) syms.push(items[i].s); var map=fetchQuoteBatch(syms);
  var lines=["📦 원자재 시세 (달러 기준)\n"];
  for (var i=0;i<items.length;i++) { var it=items[i],info=map[it.s]; if (!info){lines.push(it.n+" -");continue;} var arrow=info.change>=0?"▲":"▽"; lines.push(it.n+" "+commasFloat(info.price)+" ("+arrow+Math.abs(info.changePct).toFixed(2)+"%)"); }
  return lines.join("\n");
}
function fetchWorldRates() {
  var items=[{s:"^TNX",n:"미국10Y"},{s:"^TYX",n:"미국30Y"},{s:"DE10YT=RR",n:"독일10Y"},{s:"JP10YT=RR",n:"일본10Y"},{s:"GB10YT=RR",n:"영국10Y"}];
  var syms=[]; for (var i=0;i<items.length;i++) syms.push(items[i].s); var map=fetchQuoteBatch(syms);
  var lines=["📉 세계국채금리\n"];
  for (var i=0;i<items.length;i++) { var it=items[i],info=map[it.s]; if (!info){lines.push(it.n+" 조회 실패");continue;} var arrow=info.change>=0?"▲":"▼",bp=Math.round(Math.abs(info.change)*100); lines.push(it.n+" "+info.price.toFixed(2)+"% ("+arrow+bp+"bp)"); }
  return lines.join("\n");
}
function fetchUSTreasury() {
  var items=[{s:"^IRX",n:"3개월"},{s:"^FVX",n:"5년  "},{s:"^TNX",n:"10년 "},{s:"^TYX",n:"30년 "}];
  var syms=[]; for (var i=0;i<items.length;i++) syms.push(items[i].s); var map=fetchQuoteBatch(syms);
  var lines=["🏛️ 미국국채금리\n"];
  for (var i=0;i<items.length;i++) { var it=items[i],info=map[it.s]; if (!info){lines.push(it.n+" 조회 실패");continue;} var arrow=info.change>=0?"▲":"▼",bp=Math.round(Math.abs(info.change)*100); lines.push(it.n+" "+info.price.toFixed(2)+"% ("+arrow+bp+"bp)"); }
  return lines.join("\n");
}
function fetchCrypto() {
  var coins=[{sym:"BTC-USD",upbit:"KRW-BTC",name:"BTC"},{sym:"ETH-USD",upbit:"KRW-ETH",name:"ETH"},{sym:"SOL-USD",upbit:"KRW-SOL",name:"SOL"},{sym:"XRP-USD",upbit:"KRW-XRP",name:"XRP"}];
  var usdSyms=["USDKRW=X"]; for (var i=0;i<coins.length;i++) usdSyms.push(coins[i].sym);
  var usdMap=fetchQuoteBatch(usdSyms); var usdkrw=(usdMap["USDKRW=X"]&&usdMap["USDKRW=X"].price)?usdMap["USDKRW=X"].price:0;
  var upbitRaw=httpGet("https://api.upbit.com/v1/ticker?markets="+coins.map(function(c){return c.upbit;}).join(",")); var upbitMap={};
  if (upbitRaw){try{var arr=JSON.parse(upbitRaw);for(var j=0;j<arr.length;j++)upbitMap[arr[j].market]=arr[j];}catch(e){}}
  var blocks=["🪙 코인 시세"];
  for (var i=0;i<coins.length;i++) { var c=coins[i],uInfo=usdMap[c.sym],kInfo=upbitMap[c.upbit],lines=[c.name]; if (uInfo){var uArrow=uInfo.changePct>=0?"▲":"▼";lines.push("$ "+commasFloat(uInfo.price)+" ("+uArrow+Math.abs(uInfo.changePct).toFixed(2)+"%)");} else lines.push("$ 조회 실패"); if (kInfo){var kPct=kInfo.change_rate*100,kArrow=kPct>=0?"▲":"▼";lines.push("₩ "+commasInt(kInfo.trade_price)+" ("+kArrow+Math.abs(kPct).toFixed(2)+"%)");if(uInfo&&usdkrw){var kimchi=((kInfo.trade_price/(uInfo.price*usdkrw))-1)*100,kpSign=kimchi>=0?"+":"";lines.push("김프 "+kpSign+kimchi.toFixed(2)+"%");}} else lines.push("₩ 조회 실패"); blocks.push(lines.join("\n")); }
  return blocks[0]+"\n"+blocks.slice(1).join("\n\n");
}
function fetchYaMarket() {
  var items=[{s:"^KS11",n:"코스피 "},{s:"^KQ11",n:"코스닥 "},{s:"USDKRW=X",n:"달러/원"}];
  var syms=[]; for (var i=0;i<items.length;i++) syms.push(items[i].s); var map=fetchQuoteBatch(syms);
  var lines=["🇰🇷 한국 시장\n"];
  for (var i=0;i<items.length;i++){var it=items[i],info=map[it.s];if(!info){lines.push(it.n+" -");continue;}var arrow=info.change>=0?"▲":"▼";lines.push(it.n+" "+commasFloat(info.price)+" ("+arrow+Math.abs(info.changePct).toFixed(2)+"%)");} return lines.join("\n");
}
function fetchNaMarket() {
  var items=[{s:"NQ=F",n:"나스닥선물"},{s:"ES=F",n:"S&P500선물"},{s:"YM=F",n:"다우선물  "},{s:"RTY=F",n:"러셀선물  "}];
  var syms=[]; for (var i=0;i<items.length;i++) syms.push(items[i].s); var map=fetchQuoteBatch(syms);
  var lines=["🇺🇸 미국 선물\n"];
  for (var i=0;i<items.length;i++){var it=items[i],info=map[it.s];if(!info){lines.push(it.n+" -");continue;}var arrow=info.change>=0?"▲":"▼";lines.push(it.n+" "+commasFloat(info.price)+" ("+arrow+Math.abs(info.changePct).toFixed(2)+"%)");} return lines.join("\n");
}

function fetchFearGreed() {
  var usScore = -1;
  var btcScore = -1;

  try {
    var usRes = org.jsoup.Jsoup.connect("https://production.dataviz.cnn.io/index/fearandgreed/graphdata")
      .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
      .header("Referer", "https://www.cnn.com/markets/fear-and-greed")
      .header("Origin", "https://www.cnn.com")
      .ignoreContentType(true)
      .ignoreHttpErrors(true)
      .timeout(10000)
      .get().body().text();
    var usData = JSON.parse(usRes);
    usScore = Math.round(usData.fear_and_greed.score);
  } catch (e) {}

  try {
    var btcRes = org.jsoup.Jsoup.connect("https://api.alternative.me/fng/")
      .header("User-Agent", "Mozilla/5.0")
      .ignoreContentType(true)
      .timeout(10000)
      .get().body().text();
    var btcData = JSON.parse(btcRes);
    btcScore = parseInt(btcData.data[0].value);
  } catch (e) {}

  function fgLabel(s) {
    if (s >= 75) return "🤑 극단적 탐욕";
    if (s >= 55) return "😋 탐욕";
    if (s >= 45) return "😐 중립";
    if (s >= 25) return "😰 공포";
    return "😱 극단적 공포";
  }

  var out = "현재 공포&탐욕 지수\n\n";
  if (usScore >= 0) {
    out += "🇺🇸 미국 증시 상태: " + fgLabel(usScore) + "\n";
    out += "지수: " + usScore + " / 100\n";
  } else {
    out += "미국 증시  조회 실패\n";
  }
  if (btcScore >= 0) {
    out += "₿ 비트코인 상태: " + fgLabel(btcScore) + "\n";
    out += "지수: " + btcScore + " / 100\n";
  } else {
    out += "비트코인  조회 실패\n";
  }
  out += "\n[구간별 의미]\n";
  out += "😱 극단적 공포(0~25) → 매도세 강함\n";
  out += "😰 공포(26~45) → 투자 심리 위축\n";
  out += "😐 중립(46~55) → 균형 상태\n";
  out += "😋 탐욕(56~75) → 매수세 강화\n";
  out += "🤑 극단적 탐욕(76~100) → 과열·거품 우려";
  return out;
}



// ════════════════════════════════════════════════════════════════
// 📋 /명령어 기능
// /로 시작하는 명령어 처리 (주가조회, 섹터, 환율 등)
// 새 명령어 추가: LOOKUP에 키 추가 + 여기에 if문 추가
// ════════════════════════════════════════════════════════════════
function handleSlash(query, replier) {
  if (query.indexOf("ai ") === 0) {
    var q = query.slice(3).trim();
    if (!q) { replier.reply("사용법: /ai 질문내용"); return; }
    replier.reply("🤖 답변 생성 중...");
    replier.reply(callGemini(q));
    return;
  }
  var entry=LOOKUP[query];

  var KR_FOOTER=null, US_FOOTER="(본장시간 외 종가로 표기)";
  if (entry==="__HELP__")         { replier.reply("📋 명령어 안내\n/환율 /지수 /야선 /나선 /유가 /금속 /원자재 /코인 /공탐 /금리 /국채\n\n📈 한국 섹터\n/반도체  /조선  /방산\n/화학  /건설  /에너지\n/로봇  /바이오  /자동차\n/금융  /철강\n\n🇺🇸 미국 섹터\n/기술주\n/미국금융\n/미국헬스  /미국에너지\n/미국방산  /미국바이오\n/미국소비재  /미국통신\n/미국전기차  /미국리츠\n/미국클라우드\n\n🔍 개별 종목\n/삼성전자  /NVDA  /122630 등"); return; }
  if (entry==="__EXCHANGE__")     { replier.reply(fetchExchangeRates()); return; }
  if (entry==="__YAMARKET__")     { replier.reply(fetchYaMarket());      return; }
  if (entry==="__NAMARKET__")     { replier.reply(fetchNaMarket());      return; }
  if (entry==="__METAL__")        { replier.reply(fetchMetals());        return; }
  if (entry==="__COMMODITY__")    { replier.reply(fetchCommodities());   return; }
  if (entry==="__WORLDRATE__")    { replier.reply(fetchWorldRates());    return; }
  if (entry==="__USTREASURY__")   { replier.reply(fetchUSTreasury());   return; }
  if (entry==="__CRYPTO__")       { replier.reply(fetchCrypto());        return; }
  if (entry==="__FEAR_GREED__")   { replier.reply(fetchFearGreed());     return; }
  if (entry==="__ALL_INDICES__")  { replier.reply(fetchAllIndices());    return; }
  if (entry==="__OILPRICE__")     { replier.reply(fetchOilPrice());      return; }
  if (entry==="__SEMI_COMBINED__"){ replier.reply(fetchCombinedSemi());  return; }
  if (entry==="__KR_SEMI__")      { replier.reply(buildSectorMsg("🇰🇷 한국 반도체 시세",KR_SEMI_STOCKS,null,false,KR_FOOTER));  return; }
  if (entry==="__INTL_SEMI__")    { replier.reply(buildSectorMsg("🌐 해외 반도체 시세",INTL_SEMI_STOCKS,INTL_SEMI_EXTRA,true,US_FOOTER)); return; }
  if (entry==="__US_TECH__")      { replier.reply(buildSectorMsg("🇺🇸 미국 기술주",US_TECH_STOCKS,null,true,US_FOOTER));        return; }
  if (entry==="__SHIPBUILDING__") { replier.reply(buildSectorMsg("🇰🇷 조선주",SHIPBUILDING_STOCKS,null,false,KR_FOOTER));      return; }
  if (entry==="__DEFENSE__")      { replier.reply(buildSectorMsg("🇰🇷 방산주",DEFENSE_STOCKS,null,false,KR_FOOTER));           return; }
  if (entry==="__CHEM__")         { replier.reply(buildSectorMsg("🇰🇷 화학주",CHEM_STOCKS,null,false,KR_FOOTER));              return; }
  if (entry==="__CONSTRUCTION__") { replier.reply(buildSectorMsg("🇰🇷 건설주",CONSTRUCTION_STOCKS,null,false,KR_FOOTER));     return; }
  if (entry==="__ENERGY__")       { replier.reply(buildSectorMsg("🇰🇷 에너지주",ENERGY_STOCKS,null,false,KR_FOOTER));         return; }
  if (entry==="__ROBOT__")        { replier.reply(buildSectorMsg("🇰🇷 로봇주",ROBOT_STOCKS,null,false,KR_FOOTER));            return; }
  if (entry==="__BIO__")          { replier.reply(buildSectorMsg("🇰🇷 바이오주",BIO_STOCKS,null,false,KR_FOOTER));            return; }
  if (entry==="__AUTO__")         { replier.reply(buildSectorMsg("🇰🇷 자동차주",AUTO_STOCKS,null,false,KR_FOOTER));           return; }
  if (entry === "__KR_FINANCE__")    { replier.reply(buildSectorMsg("🏦 금융 시세", KR_FINANCE_STOCKS, null, false, null)); return; }
  if (entry === "__KR_SEC__")        { replier.reply(buildSectorMsg("📈 증권 시세", KR_SEC_STOCKS, null, false, null)); return; }
  if (entry==="__STEEL__")        { replier.reply(buildSectorMsg("🇰🇷 철강주",STEEL_STOCKS,null,false,KR_FOOTER));            return; }
  if (entry==="__BATTERY__")      { replier.reply(buildSectorMsg("🔋 2차전지",BATTERY_STOCKS,null,false,KR_FOOTER));     return; }
  if (entry==="__US_FINANCE__")   { replier.reply(buildSectorMsg("🇺🇸 미국 금융주",US_FINANCE_STOCKS,null,true,US_FOOTER));   return; }
  if (entry==="__US_HEALTH__")    { replier.reply(buildSectorMsg("🇺🇸 미국 헬스케어",US_HEALTH_STOCKS,null,true,US_FOOTER));  return; }
  if (entry==="__US_ENERGY__")    { replier.reply(buildSectorMsg("🇺🇸 미국 에너지주",US_ENERGY_STOCKS,null,true,US_FOOTER));  return; }
  if (entry==="__US_DEFENSE__")   { replier.reply(buildSectorMsg("🇺🇸 미국 방산주",US_DEFENSE_STOCKS,null,true,US_FOOTER));   return; }
  if (entry==="__US_BIO__")       { replier.reply(buildSectorMsg("🇺🇸 미국 바이오주",US_BIO_STOCKS,null,true,US_FOOTER));     return; }
  if (entry==="__US_CONSUMER__")  { replier.reply(buildSectorMsg("🇺🇸 미국 소비재",US_CONSUMER_STOCKS,null,true,US_FOOTER));  return; }
  if (entry==="__US_TELECOM__")   { replier.reply(buildSectorMsg("🇺🇸 미국 통신/미디어",US_TELECOM_STOCKS,null,true,US_FOOTER)); return; }
  if (entry==="__US_EV__")        { replier.reply(buildSectorMsg("🇺🇸 미국 전기차",US_EV_STOCKS,null,true,US_FOOTER));        return; }
  if (entry==="__US_REIT__")      { replier.reply(buildSectorMsg("🇺🇸 미국 리츠",US_REIT_STOCKS,null,true,US_FOOTER));        return; }
  if (entry==="__US_CLOUD__")     { replier.reply(buildSectorMsg("🇺🇸 미국 클라우드/SaaS",US_CLOUD_STOCKS,null,true,US_FOOTER)); return; }
  if (query==="세션") {
    var rooms=[]; for (var k in sent){if(k.indexOf("__session__")===0)rooms.push(k.replace("__session__",""));} replier.reply("📋 활성 세션:\n"+(rooms.length?rooms.join("\n"):"없음")); return;
  }
  var symbol,displayName;
  if (entry){symbol=entry.s;displayName=entry.n;}
  else if (/^\d{6}$/.test(query)){var ksInfo=fetchQuote(query+".KS")||fetchNaverQuote(query,query+".KS");if(ksInfo){replier.reply(fetchAndFormatDetailed(ksInfo,ksInfo.symbol,null));return;}symbol=query+".KQ";displayName=null;}
  else if (/[가-힣]/.test(query)){symbol=searchKrSymbol(query);if(!symbol){replier.reply("⚠️ ["+query+"] 을 찾을 수 없습니다.");return;}displayName=query;}
  else {symbol=query.toUpperCase();displayName=null;}
  var info=fetchQuote(symbol);
  if (!info&&/\.(KS|KQ)$/.test(symbol)) info=fetchNaverQuote(symbol.replace(/\.(KS|KQ)$/,""),symbol);
  if (!info){replier.reply("⚠️ ["+query+"] 을 찾을 수 없습니다.");return;}
  replier.reply(fetchAndFormatDetailed(info,symbol,displayName));
}


// ════════════════════════════════════════════════════════════════
// 🎬 YouTube 요약 기능
// 카톡방에 유튜브 링크가 오면 Gemini AI로 자동 요약
// 요약 형식 바꾸려면 summarizeYoutube 안의 text 프롬프트 수정
// ════════════════════════════════════════════════════════════════
function extractYoutubeUrl(msg) {
  var m=msg.match(/https?:\/\/(?:(?:www\.)?youtube\.com\/(?:watch\?[^\s)]*|shorts\/[^\s)]*)|youtu\.be\/[^\s)]*)/);
  return m?m[0]:null;
}
function summarizeYoutube(ytUrl) {
  try {
    var apiUrl="https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key="+GEMINI_API_KEY;
    var reqBody=JSON.stringify({contents:[{parts:[
      {fileData:{mimeType:"video/mp4",fileUri:ytUrl}},
{text:"아래 형식을 그대로 복사해서 내용만 채워. #이나 **나 --- 같은 마크다운 기호는 절대 쓰지 마. 서두 문장도 없이 바로 시작.\n\n (주제 한 줄)\n\n📌 핵심 포인트\n• (포인트1)\n• (포인트2)\n• (포인트3)\n\n💡 (결론 한 줄)"}
    ]}]});
    var raw=httpPost(apiUrl,reqBody); if (!raw) return "⚠️ API 응답 없음";
    var resp=JSON.parse(raw); if (resp.error) return "⚠️"+(resp.error.message||"API 오류");
    var text=resp.candidates&&resp.candidates[0]&&resp.candidates[0].content&&resp.candidates[0].content.parts&&resp.candidates[0].content.parts[0]&&resp.candidates[0].content.parts[0].text;
    return text||"⚠️ 요약 실패";
  } catch(e) { return "⚠️ 오류: "+String(e); }
}


// ════════════════════════════════════════════════════════════════
// ai에 질문하는 기능
// ════════════════════════════════════════════════════════════════
function callGemini(prompt) {
  try {
var url="https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key="+GEMINI_API_KEY;

    var GEMINI_SYSTEM = "너는 시크하고 위트있는 AI야. 재치 있게 촌철살인 스타일로 핵심만 대답해. 때에 따라 약간 비꼬는 말투도 괜찮아. 단, 슬프거나 무거운 주제엔 진심으로 대답할 것. 이모티콘 사용하는 것도 오케이. 불필요한 설명, 서두, 인사말 절대 금지. 300자 이내로 대답해.";

var body=JSON.stringify({
  systemInstruction:{parts:[{text:GEMINI_SYSTEM}]},
  contents:[{parts:[{text:prompt}]}]
});
    var raw=httpPost(url, body);
    if (!raw) return "AI 응답 실패: 응답 없음";
    var res=JSON.parse(raw);
    if (res.error) return "AI 오류: "+(res.error.message||"알 수 없음");
    return res.candidates[0].content.parts[0].text;
  } catch(e) {
    return "AI 응답 실패: "+e.message;
  }
}




// ════════════════════════════════════════════════════════════════
// 📡 텔레그램→카톡 퍼오기 기능 (봇 API 폴링 방식)
// 텔레그램 채널에서 KEYWORDS 단어 감지 시 삼하마샌 방으로 전달
// 봇 토큰 바꾸려면 맨 위 _tgBotToken 수정
// ════════════════════════════════════════════════════════════════
function startTgPolling() {
  if (_tgThread&&_tgThread.isAlive()) return;
  var myGen=_pollGen;
  try { DataBase.setDataDB("pollGen",String(myGen)); } catch(e) {}
  _tgThread=new java.lang.Thread(function(){
    java.lang.Thread.sleep(3000);
    try {
      var skipRaw=httpGet("https://api.telegram.org/bot"+_tgBotToken+"/getUpdates?offset=-1&limit=1&timeout=1");
      if (skipRaw) { var skipData=JSON.parse(skipRaw); if (skipData.ok&&skipData.result&&skipData.result.length) { _tgOffset=skipData.result[skipData.result.length-1].update_id+1; } }
    } catch(e) {}
    while (true) {
      try {
        var curGen=DataBase.getDataDB("pollGen");
        if (curGen&&curGen!==String(myGen)) break;
      } catch(e) {}
      try {

        var raw=httpGetPoll("https://api.telegram.org/bot"+_tgBotToken+"/getUpdates?offset="+_tgOffset+"&timeout=30&allowed_updates=message");
        if (raw) {
          var data=JSON.parse(raw);
          if (data.ok&&data.result&&data.result.length) {
            for (var i=0;i<data.result.length;i++) {
              var upd=data.result[i]; _tgOffset=upd.update_id+1;
              var message=upd.message; if (!message) continue;
              var text=message.text||message.caption||""; if (!text||text.length<2) continue;
              var msgLower=text.toLowerCase();
              var matched=KEYWORDS.some(function(kw){return msgLower.indexOf(kw)!==-1;});
              if (!matched) continue;
                            var key=text.replace(/[^\uAC00-\uD7A3a-zA-Z0-9]/g,"").substring(0,80);
                            if (isDup(key)) continue;




// ── 삼하마샌 주주방 전달 (세션 우선, 폴백 Api.replyRoom) ──
var samRoom=null;
for (var k in sent) {
  if (k.indexOf("__session__")===0&&k.indexOf("삼하마샌")!==-1) {
    samRoom=k.replace("__session__",""); break;
  }
}
if (samRoom&&sent["__session__"+samRoom]) sendToRoom(samRoom,text);
else try { Api.replyRoom("삼하마샌",text); } catch(e) {}

// ── 사또 공부방 전달 (세션 우선, 폴백 Api.replyRoom) ──
var sRoom=null;
for (var k in sent) {
  if (k.indexOf("__session__")===0&&k.indexOf("사또밥")!==-1) {
    sRoom=k.replace("__session__",""); break;
  }
}
if (!sRoom) sRoom="사또밥";
if (sent["__session__"+sRoom]) sendToRoom(sRoom,text);
else try { Api.replyRoom(sRoom,text); } catch(e) {}


            }
          }
        }
      } catch(e) { java.lang.Thread.sleep(5000); }
    }
  });
  _tgThread.setDaemon(true); _tgThread.start();
}




function response(room, msg, sender, isGroupChat, replier, imageDB, packageName) {
  if (packageName==="com.kakao.talk") {
    sent["__session__"+room]=replier;

    var WATCH=["삼하마샌","사또밥","사또 공부방"];
    for (var wp=0;wp<WATCH.length;wp++) {
      if (room.indexOf(WATCH[wp])!==-1&&_roomMap[WATCH[wp]]!==room) {
        _roomMap[WATCH[wp]]=room;
        try{DataBase.setDataDB("roomMap",JSON.stringify(_roomMap));}catch(e){}
      }
    }

    if (msg.charAt(0)==="/"&&msg.charAt(1)!=="/"&&msg.trim().length>1) {
      var cmd=msg.trim().slice(1).toLowerCase();
      handleSlash(cmd,replier);
      return;
    }

    if (msg.indexOf("또봇") !== -1) {
      var q = msg.replace(/또봇/g, "").trim();
      if (q.length > 1) { replier.reply(callGemini(q)); return; }
    }


    if (room.indexOf("삼하마샌")!==-1 && pendingTelegramMsgs.length>0) {
      var toSend=pendingTelegramMsgs.splice(0);
      for (var pi=0;pi<toSend.length;pi++) { replier.reply(toSend[pi]); if (pi<toSend.length-1) java.lang.Thread.sleep(400); }
    }

    var ytUrl=extractYoutubeUrl(msg);
    if (ytUrl) {
      var ytKey="yt_"+ytUrl.slice(-20);
      if (!isDup(ytKey)) {
        replier.reply("🎬 영상분석, 요약 중...");
        replier.reply("📝 요약\n"+summarizeYoutube(ytUrl));
      }
    }

    return;
  }

  if (packageName!=="org.telegram.messenger") return;
}



// ════════════════════════════════════════════════════════════════
// 🚀 봇 시작 (건드리지 말 것)
// ════════════════════════════════════════════════════════════════
(function() {
  var t=new java.lang.Thread(function(){try{java.lang.Thread.sleep(2000);getYFAuth();}catch(e){}});
  t.setDaemon(true); t.start();
})();
startTgPolling();