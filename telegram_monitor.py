import asyncio
import logging
from telethon import TelegramClient, events

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

# ══════════════════════════════════════════════════════
# ⚙️  텔레그램 로그인 정보  (변경하지 마세요)
# ══════════════════════════════════════════════════════
API_ID   = 39179196
API_HASH = '9e8723baa78737f27edf76f83ad4cca3'
PHONE    = '+821044484242'

# ══════════════════════════════════════════════════════
# 📡  감지할 키워드 목록
#     이 단어가 들어간 메시지만 카톡으로 전달됩니다
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

client = TelegramClient('또봇세션', API_ID, API_HASH)
seen   = set()


@client.on(events.NewMessage)
async def on_new_message(event):
    # 내가 보낸 메시지 / 개인 DM 은 무시
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
    if len(seen) > 2000:          # 오래된 절반 비우기
        old = list(seen)
        seen.clear()
        seen.update(old[-1000:])

    chat       = await event.get_chat()
    chat_title = getattr(chat, 'title', '') or getattr(chat, 'username', '') or '채널'

    try:
        # ★ 핵심: 텔레그램 "나에게 저장"으로 전달
        #   → 폰에서 텔레그램 알림 발생
        #   → MessengerBot R 이 알림을 가로챔
        #   → main.js 가 카톡방 "삼하마샌" 으로 전달
        await client.forward_messages("me", event.message)
        logging.info(f"✅ 저장완료 [{chat_title}]: {msg[:80]}")
    except Exception as e:
        logging.error(f"❌ 저장실패 [{chat_title}]: {e}")


async def main():
    await client.start(phone=PHONE)
    me = await client.get_me()
    logging.info(f"✅ 로그인 성공: {me.first_name} ({me.phone})")
    logging.info("🔍 텔레그램 채널 모니터링 시작 — 키워드 감지 대기 중...")
    await client.run_until_disconnected()


if __name__ == '__main__':
    asyncio.run(main())
