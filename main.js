var sent = {};

// ── 종목 룩업: { s: 심볼, n: 표시명 } 또는 특수 문자열 ───────────────
var LOOKUP = {
  "지수":     "__ALL_INDICES__",
  "유가":     "__OILPRICE__",

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
  "웨스턴디지털":   { s: "WDC",    n: "웨스턴디지털" },
  "마이크론":       { s: "MU",     n: "마이크론" },
  "엔비디아":       { s: "NVDA",   n: "엔비디아" },
  "테슬라":         { s: "TSLA",   n: "테슬라" },
  "애플":           { s: "AAPL",   n: "애플" },
  "구글":           { s: "GOOGL",  n: "구글" },
  "알파벳":         { s: "GOOGL",  n: "알파벳" },
  "메타":           { s: "META",   n: "메타" },
  "아마존":         { s: "AMZN",   n: "아마존" },
  "마이크로소프트": { s: "MSFT",   n: "마이크로소프트" },
  "브로드컴":       { s: "AVGO",   n: "브로드컴" },
  "퀄컴":           { s: "QCOM",   n: "퀄컴" },
  "인텔":           { s: "INTC",   n: "인텔" },
  "패스틀리":       { s: "FSLY",   n: "패스틀리" },
  "fastly":         { s: "FSLY",   n: "Fastly" },
  "로켓랩":         { s: "RKLB",   n: "로켓랩" },
  "버노바":         { s: "GEV",    n: "버노바" },
  "베르노바":       { s: "GEV",    n: "버노바" },
  "폼팩터":         { s: "FORM",   n: "폼팩터" },
  "키오시아":       { s: "KYOCF",  n: "키오시아" },
  "키옥시아":       { s: "KYOCF",  n: "키오시아" },

  // 국내 주식
  "삼성전자":         { s: "005930.KS", n: "삼성전자" },
  "sk하이닉스":       { s: "000660.KS", n: "SK하이닉스" },
  "하이닉스":         { s: "000660.KS", n: "SK하이닉스" },
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
};

var ALL_INDICES = [
  { label: "코스피",   symbol: "^KS11" },
  { label: "코스닥",   symbol: "^KQ11" },
  { label: "나스닥",   symbol: "^IXIC" },
  { label: "S&P500",   symbol: "^GSPC" },
  { label: "다우",     symbol: "^DJI"  },
  { label: "러셀2000", symbol: "^RUT"  },
];

// ── URL 인코딩 (Rhino 환경 안전) ──────────────────────────────────────
function urlEncode(str) {
  try {
    return String(java.net.URLEncoder.encode(str, "UTF-8")).replace(/\+/g, "%20");
  } catch (e) {
    return encodeURIComponent(str);
  }
}

// ── HTTP GET ──────────────────────────────────────────────────────────
function httpGet(url) {
  try {
    var jURL = new java.net.URL(url);
    var conn = jURL.openConnection();
    conn.setRequestProperty(
      "User-Agent",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
    );
    conn.setConnectTimeout(8000);
    conn.setReadTimeout(8000);
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

// ── 특정 방으로 메시지 전송 (세션 replier 우선, 3000자 단위 분할) ─────
// [버그 수정] Api.replyRoom 대신 저장된 세션 replier 사용 → 안정적 전송
// [버그 수정] 긴 메시지 분할로 잘림 방지
function sendToRoom(roomName, message) {
  var MAX = 3000;
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

// ── sent 초기화 (세션 replier는 보존) ────────────────────────────────
// [버그 수정] 기존 sent={} 리셋이 세션까지 날려서 포워딩 불가해지는 문제 해결
function cleanSent() {
  if (Object.keys(sent).length > 500) {
    var keep = {};
    for (var k in sent) {
      if (k.indexOf("__session__") === 0) keep[k] = sent[k];
    }
    sent = keep;
  }
}

// ── 네이버 금융 자동완성으로 국내 종목 심볼 탐색 ─────────────────────
// [버그 수정] Yahoo Finance 검색이 한글에서 OTC/미국 심볼을 반환하는 문제 해결
// 네이버 금융은 한글 검색 완벽 지원 + 6자리 코드 + 시장(코스피/코스닥) 정보 제공
function searchKrSymbol(query) {
  try {
    var raw = httpGet(
      "https://ac.finance.naver.com/ac?q=" + urlEncode(query) +
      "&q_enc=UTF-8&target=stock&with_article=N"
    );
    if (!raw) return null;
    var data = JSON.parse(raw);
    var items = data.items;
    if (!items || !items.length) return null;
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      if (!item || !item[1]) continue;
      var code = String(item[1]);
      if (!/^\d{6}$/.test(code)) continue;
      // item[2] 에 시장 정보 포함 ("코스닥" 이면 .KQ, 나머지는 .KS)
      var market = item[2] ? String(item[2]) : "";
      var suffix = (market.indexOf("코스닥") !== -1) ? ".KQ" : ".KS";
      return code + suffix;
    }
    return null;
  } catch (e) {
    return null;
  }
}

// ── Yahoo Finance 시세 조회 ───────────────────────────────────────────
function fetchQuote(symbol) {
  var raw = httpGet(
    "https://query1.finance.yahoo.com/v8/finance/chart/" +
    urlEncode(symbol) +
    "?range=1d&interval=1d&includePrePost=false"
  );
  if (!raw) return null;
  try {
    var data = JSON.parse(raw);
    if (!data.chart || !data.chart.result || !data.chart.result[0]) return null;
    var meta = data.chart.result[0].meta;
    var price = meta.regularMarketPrice;
    var prev  = meta.chartPreviousClose || meta.previousClose;
    if (!price || !prev) return null;
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

// ── 숫자 포맷 헬퍼 ────────────────────────────────────────────────────
function commasInt(n) {
  return Math.round(Math.abs(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function commasFloat(n) {
  var parts = Math.abs(n).toFixed(2).split(".");
  parts[0]  = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

// ── 단일 종목 메시지 포맷 ─────────────────────────────────────────────
function formatQuote(info, displayName) {
  var isKRW   = (info.currency === "KRW");
  var isIndex = (info.symbol.charAt(0) === "^");
  var arrow   = info.change >= 0 ? "▲" : "▼";
  var sign    = info.change >= 0 ? "+" : "";
  var dispSym = info.symbol.replace(/\.(KS|KQ)$/, "").replace(/^\^/, "");
  var name    = displayName || info.name;

  var priceStr, chgStr, prevStr;
  if (isKRW) {
    priceStr = "₩" + commasInt(info.price);
    chgStr   = sign + commasInt(info.change);
    prevStr  = "₩" + commasInt(info.prevClose);
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

// ── /지수: 전체 지수 요약 ─────────────────────────────────────────────
function fetchAllIndices() {
  var lines = ["📈 주요 지수\n"];
  for (var i = 0; i < ALL_INDICES.length; i++) {
    var idx  = ALL_INDICES[i];
    var info = fetchQuote(idx.symbol);
    if (!info) { lines.push(idx.label + ": 조회 실패"); continue; }
    var arrow = info.change >= 0 ? "▲" : "▼";
    var sign  = info.change >= 0 ? "+" : "";
    lines.push(
      idx.label + ": " + commasFloat(info.price) +
      " (" + arrow + sign + info.changePct.toFixed(2) + "%)"
    );
  }
  return lines.join("\n");
}

// ── /유가: WTI + 브렌트 한줄씩 ──────────────────────────────────────
function fetchOilPrice() {
  function oilLine(label, symbol) {
    var info = fetchQuote(symbol);
    if (!info) return label + ": 조회 실패";
    var arrow = info.change >= 0 ? "▲" : "▼";
    var sign  = info.change >= 0 ? "+" : "";
    return label + " " + commasFloat(info.price) +
      "(" + arrow + sign + info.changePct.toFixed(2) + "%)";
  }
  return oilLine("WTI", "CL=F") + "\n" + oilLine("브렌트유", "BZ=F");
}

// ── /명령 처리 ────────────────────────────────────────────────────────
function handleSlash(query, replier) {
  var entry = LOOKUP[query];

  if (entry === "__ALL_INDICES__") { replier.reply(fetchAllIndices()); return; }
  if (entry === "__OILPRICE__")    { replier.reply(fetchOilPrice());   return; }

  var symbol, displayName;

  if (entry) {
    symbol      = entry.s;
    displayName = entry.n;
  } else if (/[가-힣]/.test(query)) {
    // 한글 종목명 → 네이버 금융으로 KS/KQ 심볼 탐색
    symbol = searchKrSymbol(query);
    if (!symbol) { replier.reply("❌ [" + query + "] 을 찾을 수 없습니다."); return; }
    displayName = query;
  } else {
    // 영문 티커 직접 시도
    symbol      = query.toUpperCase();
    displayName = null;
  }

  var info = fetchQuote(symbol);
  if (!info) { replier.reply("❌ [" + query + "] 을 찾을 수 없습니다."); return; }
  replier.reply(formatQuote(info, displayName));
}

// ── 메인 ─────────────────────────────────────────────────────────────
function response(room, msg, sender, isGroupChat, replier, imageDB, packageName) {

  if (packageName === "com.kakao.talk") {
    // 모든 카톡 방의 세션 저장 (포워딩에 사용)
    if (sent["__session__" + room] === undefined) {
      sent["__session__" + room] = replier;
    }

    // /종목명 → 주식 조회
    if (msg.charAt(0) === "/" && msg.trim().length > 1) {
      var cmd = msg.trim().slice(1).toLowerCase();
      handleSlash(cmd, replier);
      return;
    }

    // 카톡 → 카톡 (트럼프뉴스 → 삼하마샌)
    // [버그 수정] sendToRoom 사용으로 세션 유지 + 안정적 전송
    if (room === "트럼프뉴스" && msg.indexOf("트럼프") !== -1) {
      var key2 = msg.substring(0, 100).replace(/\s/g, "");
      if (!sent[key2]) {
        sent[key2] = true;
        sendToRoom("삼하마샌", msg);
      }
    }
    return;
  }

  // 텔레그램 → 카톡
  if (packageName !== "org.telegram.messenger") return;

  var msgLower = msg.toLowerCase();

  var KEYWORDS = [
    "sndk", "mu", "micron", "마이크론",
    "fsly", "fastly", "viav", "crcl", "rklb", "pl",
    "삼성전자", "sk하이닉스", "하이닉스",
    "폼팩터", "버노바", "베르노바",
    "form", "klac", "gev", "aaoi",
    "nvda", "엔비디아", "nvidia", "tsmc", "avgo",
    "샌디스크", "wd", "western digital",
    "hbm", "hbm3", "hbm4", "nand", "낸드", "dram", "디램",
    "반도체", "ai인프라", "hbf",
    "키오시아", "키옥시아",
    "cpu", "gpu", "젠슨황", "jensen huang",
    "openai", "chatgpt",
    "claude", "anthropic", "앤트로픽", "엔트로픽",
    "kalc", "kal", "crdo"
  ];

  var matched = KEYWORDS.some(function(kw) {
    return msgLower.indexOf(kw.toLowerCase()) !== -1;
  });

  if (!matched) return;

  var key = msg.substring(0, 100).replace(/\s/g, "");
  if (sent[key]) return;
  sent[key] = true;

  // [버그 수정] 세션 초기화 시 replier 보존 + sendToRoom으로 잘림 방지
  cleanSent();

  java.lang.Thread.sleep(2000);
  sendToRoom("삼하마샌", msg);
}
