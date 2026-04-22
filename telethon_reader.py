import asyncio
import logging
from telethon import TelegramClient, events

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

API_ID   = 39179196
API_HASH = '9e8723baa78737f27edf76f83ad4cca3'
PHONE    = '+821XXXXXXXXX'  # ← 또봇 폰 번호로 교체 (예: +821012345678)

# 키워드 매칭된 메시지를 전달할 텔레그램 채팅
# 'me' = 나와의 채팅(Saved Messages). Android AutoResponder가 이 메시지를 읽어 카카오톡으로 전달
RELAY_CHAT = 'me'

KEYWORDS = [
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
    "claude", "anthropic", "앤트로픽", "엔트로픽", "클로드",
    "kalc", "kal", "crdo", "크리도",
]

client = TelegramClient('또봇세션', API_ID, API_HASH)
seen = set()


@client.on(events.NewMessage)
async def on_new_message(event):
    if event.is_private:
        return

    msg = event.message.message or ''
    if len(msg) < 10:
        return

    msg_lower = msg.lower()
    if not any(kw.lower() in msg_lower for kw in KEYWORDS):
        return

    key = msg[:100].replace(' ', '')
    if key in seen:
        return
    seen.add(key)
    if len(seen) > 2000:
        seen.clear()

    chat = await event.get_chat()
    chat_title = getattr(chat, 'title', '') or getattr(chat, 'username', '') or '채널'

    forward_text = f"[{chat_title}]\n{msg}"
    await client.send_message(RELAY_CHAT, forward_text)
    logging.info(f"전달됨 [{chat_title}]: {msg[:60]}...")


async def main():
    await client.start(phone=PHONE)
    me = await client.get_me()
    logging.info(f"로그인 성공: {me.first_name} ({me.phone})")
    logging.info("채널 모니터링 시작...")
    await client.run_until_disconnected()


if __name__ == '__main__':
    asyncio.run(main())
