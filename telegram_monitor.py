import asyncio
import logging
from telethon import TelegramClient, events

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

# ══════════════════════════════════════════════════════
# ⚙️  설정
# ══════════════════════════════════════════════════════
API_ID   = 39179196
API_HASH = '9e8723baa78737f27edf76f83ad4cca3'
PHONE    = '+821044484242'

# main.js 가 폴링(감시)하는 봇의 ID
# 봇 토큰 앞부분 숫자: 8245986955:AAG1yc6... → 8245986955
TG_BOT_ID = 8245986955

# ══════════════════════════════════════════════════════
# 📡  감지할 키워드 목록
# ══════════════════════════════════════════════════════
KEYWORDS = [
    "sndk", "mu", "micron", "마이크론",
    "fsly", "fastly", "viav", "crcl", "rklb", "pl",
    "삼성전자", "sk하이닉스", "하이닉스",
    "로켓랩", "플래닛랩스",
    "폼팩터", "버노바", "베르노바", "패슬리", "패스틀리",
    "form", "kla", "gev", "aaoi",
    "nvda", "엔비디아", "nvidia", "tsmc", "avgo",
    "샌디스크", "wd", "western digital",
    "hbm", "hbm3", "hbm4", "nand", "낸드", "dram", "디램",
    "반도체", "ai인프라", "hbf", "키오시아", "키옥시아",
    "cpu", "gpu", "젠슨황", "jensen huang",
    "openai", "chatgpt", "claude", "anthropic",
    "앤트로픽", "엔트로픽", "클로드",
    "kalc", "kal", "crdo", "크리도",
    "버티브", "vrt", "tsla", "테슬라",
    "데이터센터", "온디바이스",
]

MAX_LEN = 4000  # 텔레그램 메시지 최대 4096자, 여유분 확보

client = TelegramClient('또봇세션', API_ID, API_HASH)
seen   = set()


async def send_to_bot(text: str):
    """
    Telethon 으로 main.js 폴링 봇에게 직접 메시지 전송.
    main.js 의 getUpdates 가 이 메시지를 받아서 카톡으로 전달함.
    """
    chunks = [text[i:i + MAX_LEN] for i in range(0, len(text), MAX_LEN)]
    for chunk in chunks:
        await client.send_message(TG_BOT_ID, chunk)
        if len(chunks) > 1:
            await asyncio.sleep(0.5)


@client.on(events.NewMessage)
async def on_new_message(event):
    msg = event.message.message or ''
    logging.info(f"수신 [out={event.out}, private={event.is_private}]: {msg[:40]}")

    # 내가 보낸 메시지 / 개인 DM 무시
    if event.out or event.is_private:
        return

    if len(msg) < 5:
        return

    # ── 키워드 검사 ──────────────────────────────────────
    msg_lower = msg.lower()
    if not any(kw in msg_lower for kw in KEYWORDS):
        return

    # ── 중복 방지 ────────────────────────────────────────
    key = msg[:100].replace(' ', '')
    if key in seen:
        return
    seen.add(key)
    if len(seen) > 2000:
        old = list(seen)
        seen.clear()
        seen.update(old[-1000:])

    chat       = await event.get_chat()
    chat_title = getattr(chat, 'title', '') or getattr(chat, 'username', '') or '채널'

    logging.info(f"키워드 감지 [{chat_title}]: {msg[:80]}")

    try:
        await send_to_bot(msg)
        logging.info(f"✅ 봇 전달 완료 [{chat_title}]")
    except Exception as e:
        logging.error(f"❌ 봇 전달 실패 [{chat_title}]: {e}")


async def main():
    await client.start(phone=PHONE)
    me = await client.get_me()
    logging.info(f"✅ 로그인 성공: {me.first_name} ({me.phone})")
    logging.info("🔍 텔레그램 채널 모니터링 시작 — 키워드 감지 대기 중...")
    await client.run_until_disconnected()


if __name__ == '__main__':
    asyncio.run(main())
