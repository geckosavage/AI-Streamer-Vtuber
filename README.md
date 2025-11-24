Glitchii AI Streamer Bot
Discord Bot + YouTube Webhook + RAG + Groq LLaMA + Xenova Embedding + VoiceVox TTS + Subtitle + VB-Cable Playback

Bot này mô phỏng một AI Streamer độc lập, có thể:

Trả lời chat Discord và YouTube theo persona “Glitchii”.

Tự tìm thông tin từ RAG + ChromaDB + Xenova embedding để trả lời chính xác hơn.

Chuyển văn bản → tiếng Nhật → TTS qua VoiceVox.

Phát âm thanh qua VB-Audio Virtual Cable để đưa vào OBS.

Tạo phụ đề tiếng Việt theo đoạn.

Xuất text ra output.txt để OBS hiển thị.

Kết nối với Avatar ảo thông qua VtuberStudio

Ngăn spam YouTube Chat, xử lý theo hàng đợi queue tránh bị chồng tiếng.

<img width="731" height="306" alt="image" src="https://github.com/user-attachments/assets/d6de0d96-e4cc-4236-b86e-93ac28c30fe8" />

📌 Tính năng nổi bật
🎤 1. Discord AI streamer trả lời theo persona

Khi ai đó tag bot trong Discord, bot sẽ trả lời bằng <150 từ.

Persona: Glitchii – streamer nữ toxic, thượng đẳng, sinh ra từ code.

📚 2. Tích hợp RAG với ChromaDB

Bot tự lấy thông tin từ thư mục ./data/*.md

Tách văn bản → chunk → nhúng embedding → lưu vào ChromaDB.

Tự động retrieve những đoạn liên quan khi trả lời.

🧠 3. LLM: Groq LLaMA 3 / Scout 17B

Sử dụng Groq API để tạo câu trả lời cực nhanh.

🗣 4. VoiceVox TTS (tiếng Nhật)

Dịch tiếng Việt → tiếng Nhật → dựng audio bằng VoiceVox.

Trả file WAV vào Discord.

Phát audio vào VB-Cable để đưa vào OBS Livestream.

🔊 5. Phát tiếng qua VB-Cable

Hỗ trợ 2 chế độ:

play-sound

fallback VLC nếu device không chơi được

📝 6. Subtitle tiếng Việt

Tự động tạo file subtitle .txt chia theo 10 từ mỗi dòng để OBS Text Source đọc.

🕒 7. Output Delay

Viết nội dung vào output.txt trễ 25–36 giây để khớp thời điểm nói trên stream.

📺 8. YouTube Live Chat Integration

Qua webhook /youtube-chat.

Ngăn spam (duplicate / 3 tin trong 10s)

Hàng đợi xử lý tuần tự để tránh bot nói chồng nhau.

📺 9. Kết nối với avata ảo thông qua Vtuber Studio

Sử dụng Lipsync

Phát âm thanh qua mic ảo, sử dụng VB-Cable

📦 Yêu cầu hệ thống
1. Node.js 18+
2. ChromaDB chạy local
pip install chromadb
chromadb run --path ./chroma

3. VoiceVox Engine (bắt buộc)

Tải tại: https://voicevox.hiroshiba.jp/

Chạy:

run.exe --port 50021

4. VB-Audio Virtual Cable (để phát âm)

https://vb-audio.com/Cable/

Device output trong code:

CABLE Input (VB-Audio Virtual Cable)

5. Groq API Key

Tạo tại: https://console.groq.com/keys

6. Discord Bot Token

Trong .env:

TOKEN=your_discord_bot_token
GROQ_API_KEY=your_groq_key

7. Vtuber Stuio

Tải qua Steam: https://store.steampowered.com/app/1325860/VTube_Studio/
Model sử dụng: https://booth.pm/en/items/5975192

📁 Cấu trúc thư mục
project/
│ index.js
│ .env
│ output.txt
│ chroma/          (auto created)
│ data/
│   ├─ knowledge1.md
│   ├─ guide.md
│   └─ ...

🚀 Cách chạy bot
1. Clone repo
git clone https://github.com/your/repo.git
cd your-repo

2. Cài tất cả dependencies
npm install

3. Chuẩn bị ChromaDB
chromadb run --path ./chroma

4. Chạy VoiceVox Engine
run.exe --port 50021

5. Chạy server YouTube webhook

(đã tích hợp trong index.js)

6. Chạy bot
node index.js


Bot sẽ báo:

Glitchii#0000 đã online!
Webhook server chạy tại http://localhost:3030

📡 YouTube Webhook Usage

Gửi POST từ server YouTube Chat của bạn:

POST http://localhost:3030/youtube-chat
Content-Type: application/json

{
  "author": "ViewerName",
  "message": "Hello bot!"
}


Trả về:

{ "success": true, "queued": true }


Bot sẽ:

Lấy context → sinh phản hồi

VoiceVox → audio WAV

Tạo phụ đề

Phát qua VB-Cable

Gửi file lên Discord channel ID bạn cấu hình

🎧 VoiceVox + VB-Cable Flow
Text reply
 → dịch JP
 → VoiceVox synthesis
 → WAV file
 → playVB() → phát vào CABLE Input
 → OBS nhận CABLE Output
 → Livestream

📝 RAG Data Import

Lần đầu chạy:

📚 Đã import dữ liệu lần đầu.


Sau đó bot tự skip nếu data đã có:

📚 Dữ liệu đã tồn tại, bỏ qua import.

⚙️ Biến cần chỉnh trong code
Device VB-Cable
const PLAY_DEVICE_NAME = "CABLE Input (VB-Audio Virtual Cable)";

Discord channel để post YouTube response
client.channels.cache.get("1438779497359999106");

🛠 Các API chính trong bot
1. retrieveKnowledge()

Lấy context từ ChromaDB.

2. voicevoxTTS()

Sinh audio từ tiếng Nhật.

3. playVB()

Phát WAV vào VB-Cable (có fallback VLC).

4. processYTQueue()

Hệ thống hàng đợi cho YouTube Chat.

✔ Ưu điểm

Trả lời nhanh, tự nhiên, nhiều cảm xúc.

Tích hợp đầy đủ pipeline streamer AI.

Không bị chồng tiếng nhờ queue.

Có phụ đề + output.txt hỗ trợ OBS.

Chạy hoàn toàn local (trừ Groq API).

❗ Nhược điểm

Cần chạy nhiều service: Chroma, VoiceVox.

Yêu cầu cấu hình VB-Cable.

Nhiều I/O file tạm (nhưng đã được cleanup).

📄 License

MIT — bạn có thể chỉnh sửa và sử dụng thoải mái.
