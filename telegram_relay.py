import asyncio
import logging
import aiohttp
from telethon import TelegramClient, events

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

API_ID    = 39179196
API_HASH  = '9e8723baa78737f27edf76f83ad4cca3'
PHONE     = '+821057804448'

BOT_TOKEN  = '8417495207:AAEVnHRc9hYbznzcbbX_yT5cAesYHHcgh3o'
MY_CHAT_ID = 7685069145

client   = TelegramClient('또봇세션', API_ID, API_HASH)
seen     = set()
_session = None


async def get_session():
    global _session
    if _session is None or _session.closed:
        _session = aiohttp.ClientSession()
    return _session


async def send_to_me(text):
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    session = await get_session()
    try:
        async with session.post(url, json={"chat_id": MY_CHAT_ID, "text": text}) as resp:
            if resp.status != 200:
                body = await resp.text()
                logging.warning(f"봇 전송 실패: {resp.status} {body}")
    except Exception as e:
        logging.error(f"봇 전송 오류: {e}")


@client.on(events.NewMessage)
async def on_new_message(event):
    if event.is_private:
        return

    msg = event.message.message or ''
    if len(msg) < 10:
        return

    key = msg[:100].replace(' ', '')
    if key in seen:
        return
    seen.add(key)
    if len(seen) > 2000:
        seen.clear()

    chat = await event.get_chat()
    chat_title = getattr(chat, 'title', '') or getattr(chat, 'username', '') or '채널'

    await send_to_me(msg)
    logging.info(f"전달됨 [{chat_title}]: {msg[:60]}...")


async def main():
    await client.start(phone=PHONE)
    me = await client.get_me()
    logging.info(f"로그인 성공: {me.first_name} ({me.phone})")
    logging.info("채널 모니터링 시작...")
    await client.run_until_disconnected()


if __name__ == '__main__':
    asyncio.run(main())
