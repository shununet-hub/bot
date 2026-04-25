import asyncio
import logging
import re
from time import time
from datetime import datetime, timezone, timedelta
from telethon import TelegramClient, events

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

API_ID   = 39179196
API_HASH = '9e8723baa78737f27edf76f83ad4cca3'
PHONE    = '+821044484242'
TG_BOT_ID = 8245986955

KEYWORDS = [
  "sndk","mu","micron","마이크론","fsly","fastly","viav","crcl","rklb","pl",
  "삼성전자","sk하이닉스","하이닉스","로켓랩","플래닛랩스","폼팩터","버노바","베르노바","패슬리","패스틀리",
  "form","kla","gev","aaoi","nvda","엔비디아","nvidia","tsmc","avgo","샌디스크","wd","western digital",
  "hbm","hbm3","hbm4","nand","낸드","dram","디램","반도체","ai인프라","hbf","키오시아","키옥시아",
  "cpu","gpu","젠슨황","jensen huang","openai","chatgpt","claude","anthropic","앤트로픽","엔트로픽","클로드",
  "kalc","kal","crdo","크리도","버티브","vrt","tsla","테슬라","일론","온디바이스","젠슨 황","마벨","암드",
  "amd","arm","soxl","mrvl","구글","google","메타","meta","마이크로소프트","msft","챗지피티",
  "pltr","팔란티어","amaz","아마존","orcl","오라클","aapl","애플","오픈ai","브로드컴",
  "현대중공업","삼성중공업","전력","데이터센터","spaceX","메모리","병목","냉각","낸야",
]

MAX_LEN = 4000
client = TelegramClient('봇세션', API_ID, API_HASH)
seen = {}


async def send_to_bot(text: str):
    chunks = [text[i:i + MAX_LEN] for i in range(0, len(text), MAX_LEN)]
    for chunk in chunks:
        await client.send_message(TG_BOT_ID, chunk)
        if len(chunks) > 1:
            await asyncio.sleep(0.5)


@client.on(events.NewMessage)
async def on_new_message(event):
    global seen
    if event.out or event.is_private:
        return

    # 메시지 ID 기반 중복 차단 (Telethon 재전송 방지)
    id_key = f"id_{event.chat_id}_{event.message.id}"
    if id_key in seen:
        return
    seen[id_key] = time()

    msg_age = datetime.now(timezone.utc) - event.message.date
    if msg_age > timedelta(minutes=30):
        return

    msg = event.message.message or ''
    if len(msg) < 5:
        return

    msg_lower = msg.lower()
    if not any(kw in msg_lower for kw in KEYWORDS):
        return

    chat = await event.get_chat()
    chat_title = getattr(chat, 'title', '') or getattr(chat, 'username', '') or '채널'

    now = time()

    # URL 기반 중복 차단
    url_match = re.search(r'https?://[^\s]+', msg)
    if url_match:
        url_key = "url_" + url_match.group(0)
        if url_key in seen and now - seen[url_key] < 7200:
            logging.info(f"[URL중복차단] {chat_title}")
            return
        seen[url_key] = now

    # 내용 기반 중복 차단 (15자 핑거프린트 — 채널별 도입부 차이 무관)
    cleaned = re.sub(r'[^가-힣a-zA-Z0-9]', '', msg_lower)
    if len(cleaned) >= 15:
        fps = [cleaned[i:i+15] for i in range(min(len(cleaned) - 15, 100))]
        for fp in fps:
            if fp in seen and now - seen[fp] < 7200:
                logging.info(f"[내용중복차단] {chat_title}")
                return
        for fp in fps:
            seen[fp] = now

    if len(seen) > 20000:
        seen = {k: v for k, v in seen.items() if now - v < 7200}

    logging.info(f"키워드 감지 [{chat_title}]: {msg[:80]}")

    try:
        await send_to_bot(msg)
        logging.info(f"✅ 봇 전달 완료 [{chat_title}]")
    except Exception as e:
        logging.error(f"❌ 봇 전달 실패 [{chat_title}]: {e}")


async def main():
    await client.start(phone=PHONE)
    me = await client.get_me()
    try:
        await client.get_entity(TG_BOT_ID)
    except Exception:
        pass
    logging.info(f"✅ 로그인 성공: {me.first_name} ({me.phone})")
    logging.info("🔍 텔레그램 채널 모니터링 시작 — 키워드 감지 대기 중...")
    await client.run_until_disconnected()


if __name__ == '__main__':
    asyncio.run(main())
