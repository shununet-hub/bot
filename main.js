var sent = {};

// ── 종목명/별칭 → Yahoo Finance 심볼 매핑 ──────────────────────────
var LOOKUP = {
  // 전체 지수 한번에 보기
  "지수":    "__ALL_INDICES__",

  // 개별 지수
  "코스피":  "^KS11",
  "kospi":   "^KS11",
  "코스닥":  "^KQ11",
  "kosdaq":  "^KQ11",
  "나스닥":  "^IXIC",
  "nasdaq":  "^IXIC",
  "에센피":  "^GSPC",
  "sp500":   "^GSPC",
  "s&p500":  "^GSPC",
  "다우":    "^DJI",
  "dow":     "^DJI",
  "러셀":    "^RUT",
  "russell": "^RUT",

  // 원자재
  "유가":   "CL=F",
  "wti":    "CL=F",
  "브렌트": "BZ=F",
  "금":     "GC=F",
  "gold":   "GC=F",
  "은":     "SI=F",
  "구리":   "HG=F",

  // 미국 주식 한글명
  "샌디스크":       "SNDK",
  "웨스턴디지털":   "WDC",
  "마이크론":       "MU",
  "엔비디아":       "NVDA",
  "nvidia":         "NVDA",
  "테슬라":         "TSLA",
  "애플":           "AAPL",
  "구글":           "GOOGL",
  "알파벳":         "GOOGL",
  "메타":           "META",
  "아마존":         "AMZN",
  "마이크로소프트": "MSFT",
  "브로드컴":       "AVGO",
  "퀄컴":           "QCOM",
  "인텔":           "INTC",
  "패스틀리":       "FSLY",
  "fastly":         "FSLY",
  "로켓랩":         "RKLB",
  "버노바":         "GEV",
  "베르노바":       "GEV",
  "폼팩터":         "FORM",
  "키오시아":       "KYOCF",
  "키옥시아":       "KYOCF",

  // 국내 주식
  "삼성전자":         "005930.KS",
  "sk하이닉스":       "000660.KS",
  "하이닉스":         "000660.KS",
  "현대차":           "005380.KS",
  "현대자동차":       "005380.KS",
  "카카오":           "035720.KS",
  "네이버":           "035420.KS",
  "셀트리온":         "068270.KS",
  "lg에너지솔루션":   "373220.KS",
  "삼성바이오로직스": "207940.KS",
  "kb금융":           "105560.KS",
  "신한지주":         "055550.KS",
  "포스코홀딩스":     "005490.KS",
  "lg화학":           "051910.KS",
  "삼성sdi":          "006400.KS",
  "기아":             "000270.KS",
  "삼성물산":         "028260.KS",
  "한국전력":         "015760.KS",
};

// /지수 명령 시 표시할 지수 목록
var ALL_INDICES = [
  { label: "코스피",   symbol: "^KS11" },
  { label: "코스닥",   symbol: "^KQ11" },
  { label: "나스닥",   symbol: "^IXIC" },
  { label: "S&P500",   symbol: "^GSPC" },
  { label: "다우",     symbol: "^DJI"  },
  { label: "러셀2000", symbol: "^RUT"  },
];

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

// ── Yahoo Finance 시세 조회 ───────────────────────────────────────────
function fetchQuote(symbol) {
  var raw = httpGet(
    "https://query1.finance.yahoo.com/v8/finance/chart/" +
    encodeURIComponent(symbol) +
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

// ── 단일 종목 메시지 포맷 ─────────────────────────────────────────────
function formatQuote(info) {
  var isKRW   = (info.currency === "KRW");
  var isIndex = (info.symbol.charAt(0) === "^");
  var arrow   = info.change >= 0 ? "▲" : "▼";
  var sign    = info.change >= 0 ? "+" : "";
  var display = info.symbol.replace(/\.(KS|KQ)$/, "");

  function fmt(v) {
    if (isIndex)     return v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    if (isKRW)       return "₩" + Math.round(v).toLocaleString();
    return "$" + v.toFixed(2);
  }
  function fmtChg(v) {
    if (isIndex) return sign + Math.abs(v).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    if (isKRW)   return sign + Math.round(Math.abs(v)).toLocaleString();
    return sign + Math.abs(v).toFixed(2);
  }

  return "📊 " + info.name + " (" + display + ")\n\n" +
    "현재가: " + fmt(info.price) + "\n\n" +
    arrow + " " + fmtChg(info.change) + " (" + sign + info.changePct.toFixed(2) + "%)\n\n" +
    "전일종가: " + fmt(info.prevClose);
}

// ── /지수 전체 요약 ───────────────────────────────────────────────────
function fetchAllIndices() {
  var lines = ["📈 주요 지수\n"];
  for (var i = 0; i < ALL_INDICES.length; i++) {
    var idx  = ALL_INDICES[i];
    var info = fetchQuote(idx.symbol);
    if (!info) {
      lines.push(idx.label + ": 조회 실패");
      continue;
    }
    var arrow = info.change >= 0 ? "▲" : "▼";
    var sign  = info.change >= 0 ? "+" : "";
    lines.push(
      idx.label + ": " +
      info.price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
      "  " + arrow + " " + sign + info.changePct.toFixed(2) + "%"
    );
  }
  return lines.join("\n");
}

// ── /명령 처리 ────────────────────────────────────────────────────────
function handleSlash(cmd, replier) {
  var symbol = LOOKUP[cmd];

  if (symbol === "__ALL_INDICES__") {
    replier.reply(fetchAllIndices());
    return;
  }

  // 매핑 없으면 대문자 티커로 직접 시도 (예: /sndk → SNDK)
  if (!symbol) symbol = cmd.toUpperCase();

  var info = fetchQuote(symbol);
  if (!info) {
    replier.reply("❌ [" + cmd + "] 을 찾을 수 없습니다.");
    return;
  }
  replier.reply(formatQuote(info));
}

// ── 메인 ─────────────────────────────────────────────────────────────
function response(room, msg, sender, isGroupChat, replier, imageDB, packageName) {

  if (packageName === "com.kakao.talk") {
    if (sent["__session__" + room] === undefined) {
      sent["__session__" + room] = replier;
    }

    // /종목명 or /티커 → 주식 조회
    if (msg.charAt(0) === "/" && msg.trim().length > 1) {
      var cmd = msg.trim().slice(1).toLowerCase();
      handleSlash(cmd, replier);
      return;
    }

    // 카톡 → 카톡 (트럼프뉴스 → 삼하마샌)
    if (room === "트럼프뉴스" && msg.indexOf("트럼프") !== -1) {
      var key2 = msg.substring(0, 100).replace(/\s/g, "");
      if (!sent[key2]) {
        sent[key2] = true;
        Api.replyRoom("삼하마샌", msg);
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

  if (Object.keys(sent).length > 500) sent = {};

  java.lang.Thread.sleep(2000);
  Api.replyRoom("삼하마샌", msg.substring(0, 10000));
}
