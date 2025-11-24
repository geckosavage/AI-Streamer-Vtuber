import pytchat
import requests
import time

BACKEND_URL = "http://localhost:3030/youtube-chat"   # Node.js endpoint
VIDEO_ID = "5nHR00j9Wgg"

def send_chat_to_node(author, message):
    data = {
        "author": author,
        "message": message
    }
    try:
        requests.post(BACKEND_URL, json=data, timeout=3)
    except Exception as e:
        print("Error sending:", e)

def main():
    chat = pytchat.create(video_id=VIDEO_ID)

    print(" Bắt đầu đọc live chat YouTube...")

    while chat.is_alive():
        chatdata = chat.get()
        for c in chatdata.sync_items():
            author = c.author.name
            message = c.message
            print(f"{author}: {message}")
            send_chat_to_node(author, message)

        time.sleep(1)

    try:
        chat.raise_for_status()
    except pytchat.ChatdataFinished:
        print("Chat kết thúc")
    except Exception as e:
        print("Lỗi:", e)

if __name__ == "__main__":
    main()
