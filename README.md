✨ Glitchii AI Streamer Bot
Discord Bot + YouTube Webhook + RAG + Groq LLaMA + Xenova Embedding + VoiceVox TTS + Subtitle + VB-Cable + VTube Studio

Bot này mô phỏng một AI Streamer độc lập, có thể nói chuyện, phản hồi, tạo giọng, tạo phụ đề, phát âm thanh qua VB-Cable để đưa vào OBS và đồng bộ với avatar Vtuber trong VTube Studio.

<img width="731" height="306" alt="image" src="https://github.com/user-attachments/assets/d6de0d96-e4cc-4236-b86e-93ac28c30fe8" />

🚀 Tính năng chính

🎤 1. Discord AI Streamer (persona Glitchii)

Bot trả lời khi được tag trong Discord.

Mỗi phản hồi <150 từ.

Persona: Glitchii – streamer nữ toxic, thượng đẳng, sinh ra từ code.

📚 2. RAG + ChromaDB

Thu thập dữ liệu từ thư mục ./data/*.md.

Tách đoạn → nhúng → lưu vào ChromaDB.

Tự retrieve nội dung liên quan + đưa vào prompt.

🧠 3. Groq LLaMA 3 / Scout 17B

Sử dụng Groq API → tốc độ phản hồi cực nhanh.

🗣 4. VoiceVox TTS (tiếng Nhật)

Dịch Việt → Nhật → dựng audio bằng VoiceVox.

Xuất file WAV và gửi vào Discord.

Phát âm thanh qua VB-Cable vào OBS.

🔊 5. Playback qua VB-Audio Cable

Hỗ trợ 2 chế độ:

play-sound (mặc định)

Fallback dùng VLC nếu device lỗi

📝 6. Tự tạo phụ đề tiếng Việt

Xuất file .txt chia đoạn mỗi 10 từ cho OBS Text Source.

🕒 7. Output Delay (25–36s)

Ghi text vào output.txt trễ 25–36 giây để khớp thời điểm bot nói trên livestream.

📺 8. YouTube Live Chat Integration

Nhận tin nhắn qua webhook /youtube-chat.

Anti-spam (loại duplicate / giới hạn 3 tin trong 10 giây).

Hàng đợi xử lý tuần tự → tránh chồng tiếng.

🎭 9. Kết nối avatar ảo qua VTube Studio

Sử dụng Lipsync theo audio bot phát qua VB-Cable.

Avatar hoạt động mượt, đồng bộ miệng theo từng câu nói.

📦 Yêu cầu hệ thống
1️⃣ Node.js 18+
2️⃣ ChromaDB (local)
pip install chromadb
chromadb run --path ./chroma

3️⃣ VoiceVox Engine

Tải: https://voicevox.hiroshiba.jp/

Chạy:

run.exe --port 50021

4️⃣ VB-Audio Virtual Cable

https://vb-audio.com/Cable/

Device cần trong code:

CABLE Input (VB-Audio Virtual Cable)

5️⃣ Groq API Key

Tạo tại:
https://console.groq.com/keys

6️⃣ Discord Bot Token

Thêm vào file .env:

TOKEN=your_discord_bot_token
GROQ_API_KEY=your_groq_key

7️⃣ VTube Studio (avatar)

Tải trên Steam:
https://store.steampowered.com/app/1325860/VTube_Studio/

Model sử dụng:
https://booth.pm/en/items/5975192

📁 Cấu trúc dự án
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

2. Cài dependency
npm install

3. Chạy ChromaDB
chromadb run --path ./chroma

4. Chạy VoiceVox
run.exe --port 50021

5. Khởi động bot
node index.js


Khi thành công:

Glitchii#0000 đã online!
Webhook server chạy tại http://localhost:3030

📡 YouTube Webhook (Gửi tin nhắn vào bot)
POST example
POST http://localhost:3030/youtube-chat
Content-Type: application/json

{
  "author": "ViewerName",
  "message": "Hello bot!"
}

Response
{ "success": true, "queued": true }

Pipeline xử lý
Tin nhắn → lấy context → sinh phản hồi  
→ dịch JP → VoiceVox → audio WAV  
→ tạo phụ đề → phát qua VB-Cable  
→ gửi file WAV lên Discord

🎧 VoiceVox + VB-Cable Flow
Text reply
 → dịch tiếng Nhật
 → VoiceVox synthesis
 → tạo file WAV
 → playVB() phát qua CABLE Input
 → OBS nhận CABLE Output
 → Avatar VTube Studio lipsync
 → Livestream

📚 RAG Data Import

Lần đầu chạy:

📚 Đã import dữ liệu lần đầu.


Nếu dữ liệu đã có:

📚 Dữ liệu đã tồn tại, bỏ qua import.

⚙️ Biến cấu hình quan trọng
VB-Cable device
const PLAY_DEVICE_NAME = "CABLE Input (VB-Audio Virtual Cable)";

Discord channel nhận YouTube response
client.channels.cache.get("1438779497359999106");

🛠 API nội bộ
API	Chức năng
retrieveKnowledge()	Lấy context từ ChromaDB
voicevoxTTS()	Sinh audio bằng VoiceVox
playVB()	Phát WAV vào VB-Cable
processYTQueue()	Xử lý hàng đợi YouTube chat
✔ Ưu điểm

Phản hồi tự nhiên, cảm xúc như streamer thật.

Pipeline AI streamer FULL STACK.

Không chồng tiếng nhờ queue.

Có phụ đề & output delay khớp với stream.

Chạy gần như full local (trừ Groq LLM).

❗ Nhược điểm

Cần chạy nhiều service (Chroma, VoiceVox).

Yêu cầu VB-Cable để đồng bộ âm thanh.

Nhiều file tạm (đã tối ưu).

📄 License

MIT License — tự do chỉnh sửa và sử dụng.
