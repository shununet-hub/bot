var sent = {};

// 국내 주요 종목명 → Yahoo Finance 코드 매핑
var KR_STOCKS = {
  "삼성전자":        { code: "005930.KS" },
  "sk하이닉스":     { code: "000660.KS" },
  "하이닉스":       { code: "000660.KS" },
  "현대차":         { code: "005380.KS" },
  "현대자동차":     { code: "005380.KS" },
  "카카오":         { code: "035720.KS" },
  "네이버":         { code: "035420.KS" },
  "셀트리온":       { code: "068270.KS" },
  "lg에너지솔루션": { code: "373220.KS" },
  "삼성바이오로직스": { code: "207940.KS" },
  "kb금융":         { code: "105560.KS" },
  "신한지주":       { code: "055550.KS" },
  "포스코홀딩스":   { code: "005490.KS" },
  "lg화학":         { code: "051910.KS" },
  "삼성sdi":        { code: "006400.KS" },
  "기아":           { code: "000270.KS" },
  "삼성물산":       { code: "028260.KS" },
  "한국전력":       { code: "015760.KS" },
};

// Yahoo Finance chart API로 종목 시세 조회
function fetchStockQuote(symbol) {
  try {
    var url = "https://query1.finance.yahoo.com/v8/finance/chart/" +
      encodeURIComponent(symbol) +
      "?range=1d&interval=1d&includePrePost=false";

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
    while ((line = reader.readLine()) !== null) {
      sb.append(line);
    }
    reader.close();

    var data = JSON.parse(sb.toString());
    if (!data.chart || !data.chart.result || !data.chart.result[0]) return null;

    var meta = data.chart.result[0].meta;
    var price = meta.regularMarketPrice;
    var prevClose = meta.chartPreviousClose;
    if (!price || !prevClose) return null;

    var change = price - prevClose;
    return {
      symbol:    meta.symbol || symbol,
      name:      meta.shortName || meta.longName || symbol,
      price:     price,
      prevClose: prevClose,
      change:    change,
      changePct: (change / prevClose) * 100,
      currency:  meta.currency || "USD"
    };
  } catch (e) {
    return null;
  }
}

// 조회 결과를 카톡 메시지 형식으로 포맷
function formatStockMessage(info) {
  var isKRW = (info.currency === "KRW");
  var prefix = isKRW ? "₩" : "$";
  var arrow  = info.change >= 0 ? "▲" : "▼";
  var sign   = info.change >= 0 ? "+" : "";
  var displaySymbol = info.symbol.replace(/\.(KS|KQ)$/, "");

  function fmtPrice(v) {
    return isKRW
      ? prefix + Math.round(v).toLocaleString()
      : prefix + v.toFixed(2);
  }
  function fmtChange(v) {
    return isKRW
      ? sign + Math.round(v).toLocaleString()
      : sign + v.toFixed(2);
  }

  return "📊 " + info.name + " (" + displaySymbol + ")\n\n" +
    "현재가: " + fmtPrice(info.price) + "\n\n" +
    arrow + " " + fmtChange(info.change) + " (" + sign + info.changePct.toFixed(2) + "%)\n\n" +
    "전일종가: " + fmtPrice(info.prevClose);
}

// /티커 명령 처리 (미국 + 국내 모두)
function handleTicker(msg, replier) {
  var parts = msg.trim().split(/\s+/);
  if (parts.length < 2) {
    replier.reply(
      "사용법: /티커 [종목코드 또는 종목명]\n" +
      "예) /티커 SNDK\n" +
      "예) /티커 삼성전자"
    );
    return;
  }

  var query = parts.slice(1).join(" ").trim();
  var kr = KR_STOCKS[query.toLowerCase()];
  var symbol = kr ? kr.code : query.toUpperCase();

  var info = fetchStockQuote(symbol);
  if (!info) {
    replier.reply("❌ [" + symbol + "] 정보를 불러올 수 없습니다.\n종목코드를 확인해 주세요.");
    return;
  }
  replier.reply(formatStockMessage(info));
}

// /국내주식 명령 처리 (종목명 또는 6자리 코드)
function handleKrStock(msg, replier) {
  var parts = msg.trim().split(/\s+/);
  if (parts.length < 2) {
    replier.reply(
      "사용법: /국내주식 [종목명 또는 종목코드]\n" +
      "예) /국내주식 삼성전자\n" +
      "예) /국내주식 005930"
    );
    return;
  }

  var query = parts.slice(1).join(" ").trim();
  var queryLower = query.toLowerCase();
  var symbol;

  if (KR_STOCKS[queryLower]) {
    symbol = KR_STOCKS[queryLower].code;
  } else if (/^\d{6}$/.test(query)) {
    symbol = query + ".KS";
  } else {
    replier.reply(
      "❌ [" + query + "] 을 찾을 수 없습니다.\n" +
      "6자리 코드 또는 등록된 종목명으로 입력해 주세요."
    );
    return;
  }

  var info = fetchStockQuote(symbol);
  if (!info) {
    replier.reply("❌ [" + symbol + "] 정보를 불러올 수 없습니다.");
    return;
  }
  replier.reply(formatStockMessage(info));
}

function response(room, msg, sender, isGroupChat, replier, imageDB, packageName) {

  if (packageName === "com.kakao.talk") {
    if (sent["__session__" + room] === undefined) {
      sent["__session__" + room] = replier;
    }

    // 주식 조회 명령어 (카톡 어느 방에서든 동작)
    if (msg.startsWith("/티커")) {
      handleTicker(msg, replier);
      return;
    }
    if (msg.startsWith("/국내주식")) {
      handleKrStock(msg, replier);
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
