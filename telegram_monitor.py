import asyncio
import logging
import aiohttp
from telethon import TelegramClient, events

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

# ══════════════════════════════════════════════════════
# ⚙️  설정
# ══════════════════════════════════════════════════════
API_ID     = 39179196
API_HASH   = '9e8723baa78737f27edf76f83ad4cca3'
PHONE      = '+821044484242'

# 봇 토큰: 텔레그램에서 @BotFather 로 만든 봇
BOT_TOKEN  = '8245986955:AAG1yc6Pxo_41CI2ll6-Rdcs73OjpEi7pxc'

# 내 텔레그램 user ID (봇이 메시지를 보낼 대상)
# @userinfobot 에게 /start 보내면 확인 가능
MY_CHAT_ID = 7629108771

# ══════════════════════════════════════════════════════
# 📡  감지할 키워드 목록
# ══════════════════════════════════════════════════════
KEYWORDS = [
    "sndk", "mu", "micron", "마이크론",
    "fsly", "fastly", "viav", "crcl", "rklb",
    "삼성전자", "sk하이닉스", "하이닉스",
    "로켓랩", "플래닛랩스",
    "폼팩터", "버노바", "베르노바", "패슬리", "패스틀리",
    "form", "gev", "aaoi",
    "nvda", "엔비디아", "nvidia", "tsmc", "avgo",
    "샌디스크", "western digital",
    "hbm", "hbm3", "hbm4", "nand", "낸드", "dram", "디램",
    "반도체", "ai인프라", "hbf", "키오시아", "키옥시아",
    "cpu", "gpu", "젠슨황",
    "openai", "chatgpt", "claude", "anthropic",
    "앤트로픽", "엔트로픽", "클로드",
    "kalc", "crdo", "크리도",
    "버티브", "vrt", "tsla", "테슬라",
    "데이터센터", "온디바이스",
]

TELEGRAM_API = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
MAX_LEN      = 4000   # Telegram 한 메시지 최대 4096자, 여유분 확보

client   = TelegramClient('또봇세션', API_ID, API_HASH)
seen     = set()
_session = None


async def get_session():
    global _session
    if _session is None or _session.closed:
        _session = aiohttp.ClientSession()
    return _session


async def send_to_me(text: str) -> bool:
    """
    봇 API 로 내 텔레그램에 메시지 전송.
    4000자 초과 시 자동으로 잘라서 여러 번 전송.
    반환값: 전체 성공 True / 하나라도 실패 False
    """
    session = await get_session()
    chunks  = [text[i:i + MAX_LEN] for i in range(0, len(text), MAX_LEN)]

    for chunk in chunks:
        try:
            async with session.post(
                TELEGRAM_API,
                json={"chat_id": MY_CHAT_ID, "text": chunk},
                timeout=aiohttp.ClientTimeout(total=10)
            ) as resp:
                if resp.status == 200:
                    logging.info(f"  봇 전송 성공 ({len(chunk)}자)")
                else:
                    body = await resp.text()
                    logging.warning(f"  봇 전송 실패 {resp.status}: {body[:200]}")
                    return False
        except Exception as e:
            logging.error(f"  봇 전송 오류: {e}")
            return False

    return True


@client.on(events.NewMessage)
async def on_new_message(event):
    # 내가 보낸 메시지 / 개인 DM 무시
    if event.out or event.is_private:
        return

    msg = event.message.message or ''
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

    ok = await send_to_me(msg)
    if ok:
        logging.info(f"✅ 카톡 전달 완료 [{chat_title}]")
    else:
        logging.warning(f"❌ 전달 실패 [{chat_title}]")


async def main():
    await client.start(phone=PHONE)
    me = await client.get_me()
    logging.info(f"✅ 로그인 성공: {me.first_name} ({me.phone})")
    logging.info("🔍 텔레그램 채널 모니터링 시작 — 키워드 감지 대기 중...")
    await client.run_until_disconnected()


if __name__ == '__main__':
    asyncio.run(main())
