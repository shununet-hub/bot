var sent = {};
var _yfAuth = null;
var _yfAuthTs = 0;
var _dbgLog = [];
var _roomMap = {}; // 패턴 → 실제 방 전체 이름
var _tgBotToken = "8417495207:AAEVnHRc9hYbznzcbbX_yT5cAesYHHcgh3o";
var _tgOffset = 0;
var _tgThread = null;

// ── 종목 룩업: { s: 심볼, n: 표시명 } 또는 특수 문자열 ───────────────
var LOOKUP = {
  "지수":       "__ALL_INDICES__",
  "유가":       "__OILPRICE__",
  "반도체":     "__SEMI_COMBINED__",
  "한국반도체": "__KR_SEMI__",
  "해외반도체": "__INTL_SEMI__",
  "기술주":     "__US_TECH__",

  // 지수
  "코스피":   { s: "^KS11",  n: "코스피" },
  "kospi":    { s: "^KS11",  n: "코스피" },
  "코스닥":   { s: "^KQ11",  n: "코스닥" },
  "kosdaq":   { s: "^KQ11",  n: "코스닥" },
  "나스닥":   { s: "^IXIC",  n: "나스닥" },
  "nasdaq":   { s: "^IXIC",  n: "나스닥" },
  "에센피":   { s: "^GSPC",  n: "S&P500" },
  "sp500":    { s: "^GSPC",  n: "S&P500" },
  "s&p500":   { s: "^GSPC",  n: "S&P500" },
  "다우":     { s: "^DJI",   n: "다우존스" },
  "dow":      { s: "^DJI",   n: "다우존스" },
  "러셀":     { s: "^RUT",   n: "러셀2000" },
  "russell":  { s: "^RUT",   n: "러셀2000" },

  // 원자재
  "wti":      { s: "CL=F",   n: "WTI" },
  "브렌트":   { s: "BZ=F",   n: "브렌트유" },
  "금":       { s: "GC=F",   n: "금" },
  "gold":     { s: "GC=F",   n: "금" },
  "은":       { s: "SI=F",   n: "은" },
  "구리":     { s: "HG=F",   n: "구리" },

  // 미국 주식
  "샌디스크":       { s: "SNDK",   n: "샌디스크" },
  "샌디":           { s: "SNDK",   n: "샌디스크" },
  "웨스턴디지털":   { s: "WDC",    n: "웨스턴디지털" },
  "웬디":           { s: "WDC",    n: "웨스턴디지털" },
  "마이크론":       { s: "MU",     n: "마이크론" },
  "엔비디아":       { s: "NVDA",   n: "엔비디아" },
  "테슬라":         { s: "TSLA",   n: "테슬라" },
  "애플":           { s: "AAPL",   n: "애플" },
  "구글":           { s: "GOOGL",  n: "구글" },
  "알파벳":         { s: "GOOGL",  n: "알파벳" },
  "메타":           { s: "META",   n: "메타" },
  "아마존":         { s: "AMZN",   n: "아마존" },
  "마이크로소프트": { s: "MSFT",   n: "마이크로소프트" },
  "마소":           { s: "MSFT",   n: "마이크로소프트" },
  "브로드컴":       { s: "AVGO",   n: "브로드컴" },
  "퀄컴":           { s: "QCOM",   n: "퀄컴" },
  "인텔":           { s: "INTC",   n: "인텔" },
  "패스틀리":       { s: "FSLY",   n: "패스틀리" },
  "패슬리":         { s: "FSLY",   n: "패스틀리" },
  "fastly":         { s: "FSLY",   n: "Fastly" },
  "로켓랩":         { s: "RKLB",   n: "로켓랩" },
  "버노바":         { s: "GEV",    n: "버노바" },
  "베르노바":       { s: "GEV",    n: "버노바" },
  "폼팩터":         { s: "FORM",   n: "폼팩터" },
  "키오시아":       { s: "285A.T", n: "키오시아" },
  "키옥시아":       { s: "285A.T", n: "키오시아" },

  // 국내 대형주
  "삼성전자":         { s: "005930.KS", n: "삼성전자" },
  "삼전":             { s: "005930.KS", n: "삼성전자" },
  "sk하이닉스":       { s: "000660.KS", n: "SK하이닉스" },
  "하이닉스":         { s: "000660.KS", n: "SK하이닉스" },
  "하닉":             { s: "000660.KS", n: "SK하이닉스" },
  "현대차":           { s: "005380.KS", n: "현대자동차" },
  "현대자동차":       { s: "005380.KS", n: "현대자동차" },
  "카카오":           { s: "035720.KS", n: "카카오" },
  "네이버":           { s: "035420.KS", n: "NAVER" },
  "셀트리온":         { s: "068270.KS", n: "셀트리온" },
  "lg에너지솔루션":   { s: "373220.KS", n: "LG에너지솔루션" },
  "삼성바이오로직스": { s: "207940.KS", n: "삼성바이오로직스" },
  "kb금융":           { s: "105560.KS", n: "KB금융" },
  "신한지주":         { s: "055550.KS", n: "신한지주" },
  "포스코홀딩스":     { s: "005490.KS", n: "POSCO홀딩스" },
  "lg화학":           { s: "051910.KS", n: "LG화학" },
  "삼성sdi":          { s: "006400.KS", n: "삼성SDI" },
  "기아":             { s: "000270.KS", n: "기아" },
  "삼성물산":         { s: "028260.KS", n: "삼성물산" },
  "한국전력":         { s: "015760.KS", n: "한국전력" },
  "하나금융지주":     { s: "086790.KS", n: "하나금융지주" },
  "우리금융지주":     { s: "316140.KS", n: "우리금융지주" },
  "현대모비스":       { s: "012330.KS", n: "현대모비스" },
  "한화에어로스페이스": { s: "012450.KS", n: "한화에어로스페이스" },
  "한화에어로":       { s: "012450.KS", n: "한화에어로스페이스" },
  "두산에너빌리티":   { s: "034020.KS", n: "두산에너빌리티" },
  "두산":             { s: "000150.KS", n: "두산" },
  "sk이노베이션":     { s: "096770.KS", n: "SK이노베이션" },
  "sk":               { s: "034730.KS", n: "SK" },
  "한국조선해양":     { s: "009540.KS", n: "한국조선해양" },
  "현대중공업":       { s: "329180.KS", n: "현대중공업" },
  "삼성중공업":       { s: "010140.KS", n: "삼성중공업" },
  "대우조선해양":     { s: "042660.KS", n: "한화오션" },
  "한화오션":         { s: "042660.KS", n: "한화오션" },
  "lg전자":           { s: "066570.KS", n: "LG전자" },
  "lg":               { s: "003550.KS", n: "LG" },
  "롯데케미칼":       { s: "011170.KS", n: "롯데케미칼" },

  // 반도체·부품·장비
  "삼성전기":         { s: "009150.KS", n: "삼성전기" },
  "이수페타시스":     { s: "007660.KS", n: "이수페타시스" },
  "한미반도체":       { s: "042700.KS", n: "한미반도체" },
  "리노공업":         { s: "058470.KQ", n: "리노공업" },
  "테크윙":           { s: "089030.KQ", n: "테크윙" },
  "원익ips":          { s: "240810.KQ", n: "원익IPS" },
  "에이피시스템":     { s: "278990.KQ", n: "에이피시스템" },
  "피에스케이":       { s: "319660.KQ", n: "피에스케이" },
  "솔브레인":         { s: "357780.KQ", n: "솔브레인" },
  "동진쎄미켐":       { s: "005290.KS", n: "동진쎄미켐" },
  "isc":              { s: "095340.KQ", n: "ISC" },
  "고영":             { s: "098460.KQ", n: "고영테크놀러지" },
  "심텍":             { s: "222800.KQ", n: "심텍" },
  "대덕전자":         { s: "353200.KS", n: "대덕전자" },
  "코리아써키트":     { s: "007810.KS", n: "코리아써키트" },
  "삼성전기우":       { s: "009155.KS", n: "삼성전기우" },

  // 반도체 추가
  "한화엔진":         { s: "272210.KS", n: "한화엔진" },
  "오이솔루션":       { s: "138080.KQ", n: "오이솔루션" },
  "db하이텍":         { s: "000990.KS", n: "DB하이텍" },
  "네오셈":           { s: "389030.KQ", n: "네오셈" },
  "snt홀딩스":        { s: "036530.KS", n: "SNT홀딩스" },
  "snt":              { s: "036530.KS", n: "SNT홀딩스" },

  // 방산·에너지·조선
  "stx엔진":          { s: "077970.KS", n: "STX엔진" },
  "hd현대마린엔진":   { s: "082740.KS", n: "HD현대마린엔진" },
  "hsd엔진":          { s: "082740.KS", n: "HD현대마린엔진" },
  "현대마린엔진":     { s: "082740.KS", n: "HD현대마린엔진" },
  "hd현대":           { s: "267250.KS", n: "HD현대" },
  "현대일렉트릭":     { s: "267260.KS", n: "현대일렉트릭" },
  "효성중공업":       { s: "298040.KS", n: "효성중공업" },
  "ls일렉트릭":       { s: "010120.KS", n: "LS일렉트릭" },

  // 바이오·헬스
  "삼성바이오":       { s: "207940.KS", n: "삼성바이오로직스" },
  "유한양행":         { s: "000100.KS", n: "유한양행" },
  "한미약품":         { s: "128940.KS", n: "한미약품" },
  "셀트리온헬스케어": { s: "091990.KQ", n: "셀트리온헬스케어" },
  "에이치엘비":       { s: "028300.KQ", n: "HLB" },
  "hlb":              { s: "028300.KQ", n: "HLB" },
};

var ALL_INDICES = [
  { label: "코스피",   symbol: "^KS11" },
  { label: "코스닥",   symbol: "^KQ11" },
  { label: "나스닥",   symbol: "^IXIC" },
  { label: "S&P500",   symbol: "^GSPC" },
  { label: "다우",     symbol: "^DJI"  },
  { label: "러셀2000", symbol: "^RUT"  },
];

var KR_SEMI_STOCKS = [
  { s: "005930.KS", n: "삼성전자" },
  { s: "000660.KS", n: "SK하이닉스" },
  { s: "402340.KS", n: "SK스퀘어" },
  { s: "042700.KS", n: "한미반도체" },
  { s: "058470.KQ", n: "리노공업" },
  { s: "403870.KQ", n: "HPSP" },
  { s: "000990.KS", n: "DB하이텍" },
];

var INTL_SEMI_STOCKS = [
  { s: "NVDA",  n: "NVIDIA" },
  { s: "TSM",   n: "TSMC" },
  { s: "AVGO",  n: "Broadcom" },
  { s: "AMD",   n: "AMD" },
  { s: "QCOM",  n: "Qualcomm" },
  { s: "AMAT",  n: "Applied Materials" },
  { s: "MU",    n: "Micron" },
  { s: "KLAC",  n: "KLA" },
  { s: "INTC",  n: "Intel" },
  { s: "SNDK",  n: "SanDisk" },
];

var INTL_SEMI_EXTRA = [
  { s: "285A.T", n: "키오시아" },
];

var US_TECH_STOCKS = [
  { s: "AAPL",  n: "Apple" },
  { s: "MSFT",  n: "Microsoft" },
  { s: "NVDA",  n: "NVIDIA" },
  { s: "GOOGL", n: "Alphabet" },
  { s: "AMZN",  n: "Amazon" },
  { s: "META",  n: "Meta" },
  { s: "TSLA",  n: "Tesla" },
  { s: "AVGO",  n: "Broadcom" },
  { s: "NFLX",  n: "Netflix" },
  { s: "ORCL",  n: "Oracle" },
];

// ── URL 인코딩 ────────────────────────────────────────────────────────
function urlEncode(str) {
  try {
    return String(java.net.URLEncoder.encode(str, "UTF-8")).replace(/\+/g, "%20");
  } catch (e) {
    return encodeURIComponent(str);
  }
}

// ── 범용 HTTP GET ─────────────────────────────────────────────────────
function httpGet(url) {
  return httpGetWithHeaders(url, {});
}

function httpGetWithHeaders(url, extraHeaders) {
  try {
    var jURL = new java.net.URL(url);
    var conn = jURL.openConnection();
    conn.setRequestProperty("User-Agent",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36");
    conn.setConnectTimeout(5000);
    conn.setReadTimeout(5000);
    for (var k in extraHeaders) conn.setRequestProperty(k, extraHeaders[k]);
    var reader = new java.io.BufferedReader(
      new java.io.InputStreamReader(conn.getInputStream(), "UTF-8")
    );
    var sb = new java.lang.StringBuilder();
    var line;
    while ((line = reader.readLine()) !== null) sb.append(line);
    reader.close();
    return sb.toString();
  } catch (e) {
    return null;
  }
}

// ── Telegram long-poll용 HTTP GET (타임아웃 35초) ────────────────────
function httpGetPoll(url) {
  try {
    var jURL = new java.net.URL(url);
    var conn = jURL.openConnection();
    conn.setRequestProperty("User-Agent", "Mozilla/5.0");
    conn.setConnectTimeout(5000);
    conn.setReadTimeout(35000);
    var reader = new java.io.BufferedReader(
      new java.io.InputStreamReader(conn.getInputStream(), "UTF-8")
    );
    var sb = new java.lang.StringBuilder();
    var line;
    while ((line = reader.readLine()) !== null) sb.append(line);
    reader.close();
    return sb.toString();
  } catch (e) { return null; }
}

// ── HTTP POST (Gemini API 용) ─────────────────────────────────────────
function httpPost(url, jsonBody) {
  try {
    var jURL = new java.net.URL(url);
    var conn = jURL.openConnection();
    conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
    conn.setRequestProperty("User-Agent", "Mozilla/5.0");
    conn.setConnectTimeout(15000);
    conn.setReadTimeout(90000);
    conn.setDoOutput(true);
    var bytes = new java.lang.String(jsonBody).getBytes("UTF-8");
    var os = conn.getOutputStream();
    os.write(bytes);
    os.flush();
    os.close();
    var stream;
    try { stream = conn.getInputStream(); } catch(e2) { stream = conn.getErrorStream(); }
    if (!stream) return null;
    var reader = new java.io.BufferedReader(new java.io.InputStreamReader(stream, "UTF-8"));
    var sb = new java.lang.StringBuilder();
    var line;
    while ((line = reader.readLine()) !== null) sb.append(line);
    reader.close();
    return sb.toString();
  } catch(e) { return null; }
}

// ── 특정 방으로 메시지 전송 (세션 replier 우선, 3000자 단위 분할) ─────
function sendToRoom(roomName, message) {
  var MAX = 1000;
  var i = 0;
  while (i < message.length) {
    var chunk = message.substring(i, Math.min(i + MAX, message.length));
    var r = sent["__session__" + roomName];
    if (r) r.reply(chunk);
    else Api.replyRoom(roomName, chunk);
    i += MAX;
    if (i < message.length) java.lang.Thread.sleep(800);
  }
}

// ── Telegram Bot API 폴링 (전체 메시지 수신 → 카톡 전달) ─────────────
function startTgPolling() {
  if (_tgThread && _tgThread.isAlive()) return;
  _tgThread = new java.lang.Thread(function() {
    java.lang.Thread.sleep(3000); // 스크립트 초기화 대기
    while (true) {
      try {
        var raw = httpGetPoll(
          "https://api.telegram.org/bot" + _tgBotToken +
          "/getUpdates?offset=" + _tgOffset + "&timeout=30&allowed_updates=message"
        );
        if (raw) {
          var data = JSON.parse(raw);
          if (data.ok && data.result && data.result.length) {
            for (var i = 0; i < data.result.length; i++) {
              var update = data.result[i];
              _tgOffset = update.update_id + 1;
              var message = update.message;
              if (!message) continue;
              var text = message.text || message.caption || "";
              if (!text || text.length < 2) continue;
              var msgLower = text.toLowerCase();
              var matched = KEYWORDS.some(function(kw) {
                return msgLower.indexOf(kw.toLowerCase()) !== -1;
              });
              if (!matched) continue;
              var key = text.substring(0, 100).replace(/\s/g, "");
              if (sent[key]) continue;
              sent[key] = true;
              cleanSent();
              var targetRoom = _roomMap["삼하마샌"] || _roomMap["사또밥"] ||
                "삼하마샌 주주방 (샌디스크,마이크론,삼성전자,하이닉스)";
              sendToRoom(targetRoom, text);
            }
          }
        }
      } catch(e) {
        java.lang.Thread.sleep(5000);
      }
    }
  });
  _tgThread.setDaemon(true);
  _tgThread.start();
}

// ── sent 초기화 (세션 replier는 보존) ────────────────────────────────
function cleanSent() {
  if (Object.keys(sent).length > 500) {
    var keep = {};
    for (var k in sent) {
      if (k.indexOf("__session__") === 0) keep[k] = sent[k];
    }
    sent = keep;
  }
}

// ── 국내 종목 검색: 네이버 자동완성 (1차) → Yahoo KR 검색 (2차) ──────
// java.net.URI 사용: 한글 쿼리를 가장 정확하게 percent-encoding
function searchKrSymbol(query) {
  // 1차: 네이버 금융 자동완성
  try {
    var uri = new java.net.URI(
      "https", "ac.finance.naver.com", "/ac",
      "q=" + query + "&q_enc=UTF-8&target=stock&with_article=N",
      null
    );
    var raw = httpGetWithHeaders(uri.toURL().toString(), {
      "Referer":          "https://finance.naver.com/",
      "Accept":           "application/json, text/javascript, */*; q=0.01",
      "Accept-Language":  "ko-KR,ko;q=0.9",
      "X-Requested-With": "XMLHttpRequest",
      "User-Agent":       "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36"
    });
    if (raw && raw.charAt(0) === "{") {
      var data = JSON.parse(raw);
      var items = data.items;
      if (items && items.length) {
        for (var i = 0; i < items.length; i++) {
          var group = items[i];
          if (!group) continue;
          // 네이버 AC는 items[그룹][항목] 2단계 구조로 반환하는 경우가 있음
          var list = (group[0] !== undefined && group[0] !== null && typeof group[0] === "object" && group[0].length !== undefined)
            ? group : [group];
          for (var j = 0; j < list.length; j++) {
            var item = list[j];
            var code = null, market = "";
            if (item && item[1] !== undefined) {
              code   = String(item[1]).trim();
              market = item[2] ? String(item[2]) : "";
            } else if (item && item.code) {
              code   = String(item.code).trim();
              market = item.market ? String(item.market) : "";
            }
            if (!code || !/^\d{6}$/.test(code)) continue;
            var suffix = (market.indexOf("코스닥") !== -1) ? ".KQ" : ".KS";
            return code + suffix;
          }
        }
      }
    }
  } catch (e) { /* 1차 실패 → 2차로 */ }

  // 2차: Yahoo Finance search with region=KR (KS/KQ 심볼만 수용)
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
          if (sym && (sym.indexOf(".KS") !== -1 || sym.indexOf(".KQ") !== -1)) {
            return sym;
          }
        }
      }
    }
  } catch (e) { /* 2차도 실패 */ }

  // 3차: 네이버 모바일 검색 API
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
        var mkt3  = String(it3.stockExchangeType || it3.market || "");
        if (/^\d{6}$/.test(code3)) {
          return code3 + ((mkt3.indexOf("KOSDAQ") !== -1 || mkt3.indexOf("코스닥") !== -1) ? ".KQ" : ".KS");
        }
      }
    }
  } catch (e3) { /* 3차도 실패 */ }

  return null;
}

// ── Yahoo Finance crumb 인증 ──────────────────────────────────────────
function getYFAuth() {
  if (_yfAuth) return _yfAuth;
  var now = java.lang.System.currentTimeMillis();
  if (now - _yfAuthTs < 300000) return null; // 5분 이내 실패면 재시도 안함
  _yfAuthTs = now;
  var UA = "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.210 Mobile Safari/537.36";
  try {
    // 1단계: finance.yahoo.com 접속 → 쿠키 수집
    var conn1 = new java.net.URL("https://finance.yahoo.com/").openConnection();
    conn1.setInstanceFollowRedirects(true);
    conn1.setRequestProperty("User-Agent", UA);
    conn1.setRequestProperty("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8");
    conn1.setConnectTimeout(6000);
    conn1.setReadTimeout(6000);
    conn1.connect();
    var cookies = [];
    for (var i = 1; ; i++) {
      var hk = conn1.getHeaderFieldKey(i);
      if (!hk) break;
      if (String(hk).toLowerCase() === "set-cookie") {
        cookies.push(String(conn1.getHeaderField(i)).split(";")[0]);
      }
    }
    try { conn1.getInputStream().close(); } catch(e2) {}
    var cookieStr = cookies.join("; ");
    // 2단계: crumb 획득
    var conn2 = new java.net.URL("https://query1.finance.yahoo.com/v1/test/getcrumb").openConnection();
    conn2.setRequestProperty("User-Agent", UA);
    conn2.setRequestProperty("Cookie", cookieStr);
    conn2.setConnectTimeout(5000);
    conn2.setReadTimeout(5000);
    var br = new java.io.BufferedReader(new java.io.InputStreamReader(conn2.getInputStream(), "UTF-8"));
    var crumb = String(br.readLine() || "").trim();
    br.close();
    if (crumb && crumb.length > 0) {
      _yfAuth = { crumb: crumb, cookie: cookieStr };
    }
  } catch(e) {}
  return _yfAuth;
}

// ── 네이버 주가 조회 (국내 소형주 fallback) ──────────────────────────
function fetchNaverQuote(code, fallbackSymbol) {
  // 1차: polling 실시간 API
  try {
    var raw1 = httpGetWithHeaders(
      "https://polling.finance.naver.com/api/realtime/domestic/stock/" + code,
      { "Referer": "https://finance.naver.com/", "Accept": "application/json" }
    );
    if (raw1) {
      var d1 = JSON.parse(raw1);
      var stock = (d1.datas && d1.datas.length) ? d1.datas[0] : null;
      if (stock) {
        var p1 = parseFloat(String(stock.nv || stock.sv || "").replace(/,/g, ""));
        var c1 = parseFloat(String(stock.cv || "0").replace(/,/g, "").replace(/\+/g, ""));
        var r1 = parseFloat(String(stock.cr || "0").replace(/\+/g, ""));
        if (p1) return { symbol: fallbackSymbol || (code + ".KS"), name: stock.nm || code,
          price: p1, prevClose: p1 - c1, change: c1, changePct: r1, currency: "KRW" };
      }
    }
  } catch(e1) {}

  // 2차: mobile basic API (다양한 필드명 시도)
  try {
    var raw2 = httpGetWithHeaders(
      "https://m.stock.naver.com/api/stock/" + code + "/basic",
      { "Referer": "https://m.stock.naver.com/", "Accept": "application/json" }
    );
    if (raw2) {
      var d2 = JSON.parse(raw2);
      var p2 = parseFloat(String(d2.closePrice || d2.currentPrice || d2.stockPrice || "").replace(/,/g, ""));
      var c2 = parseFloat(String(d2.compareToPreviousClosePrice || d2.changePrice || d2.priceChange || "0").replace(/,/g, "").replace(/\+/g, ""));
      var r2 = parseFloat(String(d2.fluctuationsRatio || d2.changeRate || d2.rateOfChange || "0").replace(/\+/g, ""));
      if (p2) return { symbol: fallbackSymbol || (code + ".KS"), name: d2.stockName || d2.name || code,
        price: p2, prevClose: p2 - c2, change: c2, changePct: r2, currency: "KRW" };
    }
  } catch(e2) {}

  return null;
}

// ── Yahoo Finance 시세 일괄 조회 (섹터용) ────────────────────────────
function fetchQuoteBatch(symbols) {
  if (!symbols || !symbols.length) return {};
  var auth = getYFAuth();
  var parts = [];
  for (var i = 0; i < symbols.length; i++) parts.push(urlEncode(symbols[i]));
  var raw = httpGetWithHeaders(
    "https://query2.finance.yahoo.com/v7/finance/quote?symbols=" +
    parts.join("%2C") +
    (auth ? "&crumb=" + urlEncode(auth.crumb) : ""),
    auth ? { "Cookie": auth.cookie } : {}
  );
  if (!raw) return {};
  try {
    var data = JSON.parse(raw);
    var results = data.quoteResponse && data.quoteResponse.result;
    if (!results) return {};
    var map = {};
    for (var i = 0; i < results.length; i++) {
      var q = results[i];
      var price = q.regularMarketPrice;
      if (!price) continue;
      var prev = q.regularMarketPreviousClose || price;
      var change = price - prev;
      map[q.symbol] = {
        symbol:    q.symbol,
        name:      q.shortName || q.longName || q.symbol,
        price:     price,
        prevClose: prev,
        change:    change,
        changePct: prev ? (change / prev) * 100 : 0,
        currency:  q.currency || "USD"
      };
    }
    return map;
  } catch(e) { return {}; }
}

// ── Yahoo Finance 시세 조회 ───────────────────────────────────────────
function fetchQuote(symbol) {
  var auth = getYFAuth();
  var raw = httpGetWithHeaders(
    "https://query2.finance.yahoo.com/v8/finance/chart/" +
    urlEncode(symbol) +
    "?range=1d&interval=1d&includePrePost=false" +
    (auth ? "&crumb=" + urlEncode(auth.crumb) : ""),
    auth ? { "Cookie": auth.cookie } : {}
  );
  if (!raw) return null;
  try {
    var data = JSON.parse(raw);
    if (!data.chart || !data.chart.result || !data.chart.result[0]) return null;
    var meta = data.chart.result[0].meta;
    var price = meta.regularMarketPrice;
    var prev  = meta.chartPreviousClose || meta.regularMarketPreviousClose || meta.previousClose;
    if (!price) return null;
    if (!prev) prev = price;
    var change = price - prev;
    return {
      symbol:    meta.symbol || symbol,
      name:      meta.shortName || meta.longName || symbol,
      price:     price,
      prevClose: prev,
      change:    change,
      changePct: (change / prev) * 100,
      currency:  meta.currency || "USD"
    };
  } catch (e) {
    return null;
  }
}

// ── 숫자 포맷 ─────────────────────────────────────────────────────────
function commasInt(n) {
  return Math.round(Math.abs(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function commasFloat(n) {
  var parts = Math.abs(n).toFixed(2).split(".");
  parts[0]  = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

// ── 단일 종목 포맷 ────────────────────────────────────────────────────
function formatQuote(info, displayName) {
  var isKRW   = (info.currency === "KRW");
  var isJPY   = (info.currency === "JPY");
  var isIndex = (info.symbol.charAt(0) === "^");
  var arrow   = info.change >= 0 ? "▲" : "▼";
  var sign    = info.change >= 0 ? "+" : "";
  var dispSym = info.symbol.replace(/\.(KS|KQ|T)$/, "").replace(/^\^/, "");
  var name    = displayName || info.name;

  var priceStr, chgStr, prevStr;
  if (isKRW) {
    priceStr = "₩" + commasInt(info.price);
    chgStr   = sign + commasInt(info.change);
    prevStr  = "₩" + commasInt(info.prevClose);
  } else if (isJPY) {
    priceStr = "¥" + commasInt(info.price);
    chgStr   = sign + commasInt(info.change);
    prevStr  = "¥" + commasInt(info.prevClose);
  } else if (isIndex) {
    priceStr = commasFloat(info.price);
    chgStr   = sign + commasFloat(Math.abs(info.change));
    prevStr  = commasFloat(info.prevClose);
  } else {
    priceStr = "$" + commasFloat(info.price);
    chgStr   = sign + commasFloat(Math.abs(info.change));
    prevStr  = "$" + commasFloat(info.prevClose);
  }

  return "📊 " + name + " (" + dispSym + ")\n\n" +
    "현재가: " + priceStr + "\n" +
    arrow + " " + chgStr + " (" + sign + info.changePct.toFixed(2) + "%)\n" +
    "전일종가: " + prevStr;
}

// ── /지수 ─────────────────────────────────────────────────────────────
function fetchAllIndices() {
  var syms = [];
  for (var i = 0; i < ALL_INDICES.length; i++) syms.push(ALL_INDICES[i].symbol);
  var map = fetchQuoteBatch(syms);
  var lines = ["📈 주요 지수\n"];
  for (var i = 0; i < ALL_INDICES.length; i++) {
    var idx  = ALL_INDICES[i];
    var info = map[idx.symbol];
    if (!info) { lines.push(idx.label + " 조회 실패"); continue; }
    var arrow = info.change >= 0 ? "▲" : "▼";
    var sign  = info.change >= 0 ? "+" : "";
    lines.push(
      idx.label + " " + commasFloat(info.price) +
      " (" + arrow + sign + info.changePct.toFixed(2) + "%)"
    );
  }
  return lines.join("\n");
}

// ── /유가 ─────────────────────────────────────────────────────────────
function fetchOilPrice() {
  var map = fetchQuoteBatch(["CL=F", "BZ=F"]);
  function oilLine(label, symbol) {
    var info = map[symbol];
    if (!info) return label + ": 조회 실패";
    var arrow = info.change >= 0 ? "▲" : "▼";
    var sign  = info.change >= 0 ? "+" : "";
    return label + " " + commasFloat(info.price) +
      "(" + arrow + sign + info.changePct.toFixed(2) + "%)";
  }
  return oilLine("WTI", "CL=F") + "\n" + oilLine("브렌트유", "BZ=F");
}

// ── 섹터 요약 ─────────────────────────────────────────────────────────
function sectorLine(item, useTicker, preInfo) {
  var info = (preInfo !== undefined) ? preInfo : fetchQuote(item.s);
  var label = (useTicker && /^[A-Z]+$/.test(item.s)) ? item.s : item.n;
  if (!info) return label + "  -";
  var isKRW  = (info.currency === "KRW");
  var isJPY  = (info.currency === "JPY");
  var arrow  = info.change >= 0 ? "▲" : "▽";
  var pct    = Math.abs(info.changePct).toFixed(2) + "%";
  var price  = isKRW ? commasInt(info.price)
             : isJPY ? "¥" + commasInt(info.price)
             : "$" + commasFloat(info.price);
  return label + "  " + price + " (" + arrow + pct + ")";
}

function buildSectorMsg(title, stocks, extra, useTicker, footer) {
  var allItems = (extra && extra.length) ? stocks.concat(extra) : stocks;
  var syms = [];
  for (var i = 0; i < allItems.length; i++) syms.push(allItems[i].s);
  var map = fetchQuoteBatch(syms);
  var lines = [title + "\n"];
  for (var i = 0; i < stocks.length; i++) lines.push(sectorLine(stocks[i], useTicker, map[stocks[i].s] || null));
  if (extra && extra.length) {
    lines.push("");
    for (var j = 0; j < extra.length; j++) lines.push(sectorLine(extra[j], useTicker, map[extra[j].s] || null));
  }
  if (footer) lines.push("\n" + footer);
  return lines.join("\n");
}

// ── /반도체 (한국 TOP5 + 해외 통합) ──────────────────────────────────
function fetchCombinedSemi() {
  var krStocks = KR_SEMI_STOCKS.slice(0, 5);
  var allItems = krStocks.concat(INTL_SEMI_STOCKS).concat(INTL_SEMI_EXTRA);
  var syms = [];
  for (var i = 0; i < allItems.length; i++) syms.push(allItems[i].s);
  var map = fetchQuoteBatch(syms);

  var kr = ["🇰🇷 한국 반도체 시세\n"];
  for (var i = 0; i < krStocks.length; i++) {
    kr.push(sectorLine(krStocks[i], false, map[krStocks[i].s] || null));
  }

  var intl = ["🌐 해외 반도체 시세\n"];
  for (var j = 0; j < INTL_SEMI_STOCKS.length; j++) {
    intl.push(sectorLine(INTL_SEMI_STOCKS[j], true, map[INTL_SEMI_STOCKS[j].s] || null));
  }
  if (INTL_SEMI_EXTRA.length) {
    intl.push("");
    for (var k = 0; k < INTL_SEMI_EXTRA.length; k++) {
      intl.push(sectorLine(INTL_SEMI_EXTRA[k], true, map[INTL_SEMI_EXTRA[k].s] || null));
    }
  }
  intl.push("\n(본장시간 외 종가로 표기)");

  return kr.join("\n") + "\n\n" + intl.join("\n");
}

// ── /명령 처리 ────────────────────────────────────────────────────────
function handleSlash(query, replier) {
  var entry = LOOKUP[query];

  if (entry === "__ALL_INDICES__")   { replier.reply(fetchAllIndices());   return; }
  if (entry === "__OILPRICE__")      { replier.reply(fetchOilPrice());     return; }
  if (entry === "__SEMI_COMBINED__") { replier.reply(fetchCombinedSemi()); return; }
  if (entry === "__KR_SEMI__")       { replier.reply(buildSectorMsg("🇰🇷 한국 반도체 시세", KR_SEMI_STOCKS, null, false, null)); return; }
  if (entry === "__INTL_SEMI__")   { replier.reply(buildSectorMsg("🌐 해외 반도체 시세", INTL_SEMI_STOCKS, INTL_SEMI_EXTRA, true, "(본장시간 외 종가로 표기)")); return; }
  if (entry === "__US_TECH__")     { replier.reply(buildSectorMsg("🇺🇸 미국 기술주 시세", US_TECH_STOCKS, null, true, "(본장시간 외 종가로 표기)")); return; }

  if (query === "세션") {
    var rooms = [];
    for (var k in sent) {
      if (k.indexOf("__session__") === 0) rooms.push(k.replace("__session__", ""));
    }
    replier.reply("📋 활성 세션 방 목록:\n" + (rooms.length ? rooms.join("\n") : "없음"));
    return;
  }

  if (query === "디버그") {
    var log = _dbgLog.slice(-20);
    replier.reply("🔍 최근 수신 로그 (최대 20건):\n\n" + (log.length ? log.join("\n") : "없음"));
    return;
  }

  var symbol, displayName;

  if (entry) {
    symbol      = entry.s;
    displayName = entry.n;
  } else if (/^\d{6}$/.test(query)) {
    var ksInfo = fetchQuote(query + ".KS") || fetchNaverQuote(query, query + ".KS");
    if (ksInfo) { replier.reply(formatQuote(ksInfo, null)); return; }
    symbol      = query + ".KQ";
    displayName = null;
  } else if (/[가-힣]/.test(query)) {
    symbol = searchKrSymbol(query);
    if (!symbol) { replier.reply("⚠️ [" + query + "] 을 찾을 수 없습니다."); return; }
    displayName = query;
  } else {
    symbol      = query.toUpperCase();
    displayName = null;
  }

  var info = fetchQuote(symbol);
  if (!info && /\.(KS|KQ)$/.test(symbol)) {
    info = fetchNaverQuote(symbol.replace(/\.(KS|KQ)$/, ""), symbol);
  }
  if (!info) { replier.reply("⚠️ [" + query + "] 을 찾을 수 없습니다."); return; }
  replier.reply(formatQuote(info, displayName));
}

// ── 전달 키워드 (카카오·텔레그램 공용) ───────────────────────────────
var KEYWORDS = [
  "sndk", "mu", "micron", "마이크론",
  "fsly", "fastly", "viav", "crcl", "rklb", "pl",
  "삼성전자", "sk하이닉스", "하이닉스", "로켓랩", "플래닛랩스",
  "폼팩터", "버노바", "베르노바", "패슬리", "패스틀리",
  "form", "klac", "gev", "aaoi",
  "nvda", "엔비디아", "nvidia", "tsmc", "avgo",
  "샌디스크", "wd", "western digital",
  "hbm", "hbm3", "hbm4", "nand", "낸드", "dram", "디램",
  "반도체", "ai인프라", "hbf",
  "키오시아", "키옥시아",
  "cpu", "gpu", "젠슨황", "jensen huang",
  "openai", "chatgpt",
  "claude", "anthropic", "앤트로픽", "엔트로픽", "앤스로픽", "엔스로픽", "클로드",
  "kalc", "kal", "crdo", "크리도"
];

// ── 메인 ─────────────────────────────────────────────────────────────
function response(room, msg, sender, isGroupChat, replier, imageDB, packageName) {

  // 모든 수신 메시지 로깅 (최근 100건 유지)
  _dbgLog.push("[" + packageName + "] " + room + ": " + msg.substring(0, 40).replace(/\n/g, " "));
  if (_dbgLog.length > 100) _dbgLog.shift();

  if (packageName === "com.kakao.talk") {
    sent["__session__" + room] = replier;

    // 방 이름 패턴 매핑 (부분 이름 → 실제 전체 이름)
    var WATCH_PATTERNS = ["삼하마샌", "사또밥", "GE버노바", "멘탈케어"];
    for (var wp = 0; wp < WATCH_PATTERNS.length; wp++) {
      if (room.indexOf(WATCH_PATTERNS[wp]) !== -1) _roomMap[WATCH_PATTERNS[wp]] = room;
    }

    // ── 소스방 → 삼하마샌 전달 (소스 방에서 봇 무응답) ──
    var isFromEnergy = room.indexOf("GE버노바") !== -1;
    var isFromMiju   = room.indexOf("멘탈케어") !== -1;

    // 소스 방이 아닐 때만 슬래시 명령 응답
    if (!isFromEnergy && !isFromMiju) {
      if (msg.charAt(0) === "/" && msg.trim().length > 1) {
        var cmd = msg.trim().slice(1).toLowerCase();
        handleSlash(cmd, replier);
        return;
      }
    }

    if (isFromEnergy || isFromMiju) {
      // 타겟 방 추가할 때 여기에 패턴 추가
      var TARGET_ROOMS = ["삼하마샌", "사또밥"];

      function forwardMsg(m) {
        for (var t = 0; t < TARGET_ROOMS.length; t++) {
          var pattern = TARGET_ROOMS[t];
          var actualRoom = _roomMap[pattern] || pattern;
          var tSess = sent["__session__" + actualRoom];
          if (tSess) tSess.reply(m);
          else Api.replyRoom(actualRoom, m);
        }
      }

      if (isFromEnergy && msg.length > 5) {
        var key2 = msg.substring(0, 100).replace(/\s/g, "");
        if (!sent[key2]) {
          sent[key2] = true;
          forwardMsg(msg);
        }
        return;
      }

      if (isFromMiju && msg.length >= 100) {
        var msgLowerK = msg.toLowerCase();
        var hasKw = KEYWORDS.some(function(kw) {
          return msgLowerK.indexOf(kw.toLowerCase()) !== -1;
        });
        if (hasKw) {
          var key3 = msg.substring(0, 100).replace(/\s/g, "");
          if (!sent[key3]) {
            sent[key3] = true;
            forwardMsg(msg);
          }
        }
        return;
      }

      return;
    }

    return;
  }

  var isTelegram = packageName === "org.telegram.messenger" ||
                   packageName === "org.thunderdog.challegram" ||
                   packageName === "org.telegram.messenger.beta" ||
                   (packageName && packageName.indexOf("telegram") !== -1);
  if (!isTelegram) return;

  var msgLower = msg.toLowerCase();

  var matched = KEYWORDS.some(function(kw) {
    return msgLower.indexOf(kw.toLowerCase()) !== -1;
  });

  if (!matched) return;

  var key = msg.substring(0, 100).replace(/\s/g, "");
  if (sent[key]) return;
  sent[key] = true;

  cleanSent();

  java.lang.Thread.sleep(2000);
  sendToRoom(_roomMap["삼하마샌"] || _roomMap["사또밥"] || "삼하마샌 주주방 (샌디스크,마이크론,삼성전자,하이닉스)", msg);
}

// ── Telegram 봇 API 폴링 시작 ─────────────────────────────────────────
startTgPolling();
