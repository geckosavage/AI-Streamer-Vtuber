# 🎥 AI-Streamer-Vtuber (Project Glitchii - OpenAI Edition)

Phiên bản cập nhật sử dụng **OpenAI API** thay cho **Grok**, tối ưu hóa pipeline tương tác thời gian thực giữa **Chat → AI → TTS → Vtuber Model**.

---

## 🧠 Giới Thiệu

**AI Vtuber/Streamer** là dự án tạo ra một nhân vật ảo có khả năng **đọc chat trực tiếp**, **phản hồi bằng giọng nói tự nhiên**, và **điều khiển mô hình VTuber trong thời gian thực**.  
**Mục tiêu:** xây dựng một hệ thống **AI Streamer hoàn toàn tự động** – có thể trò chuyện, đọc chat, phản ứng với người xem, và hoạt động độc lập như một streamer thật.

---

## 🧩 Thành Phần Hệ Thống

### 1. Module Chat (YouTube Integration)
- Đọc tin nhắn từ **YouTube Live Chat API** theo thời gian thực.  
- Lọc và phân loại tin nhắn theo **từ khóa kích hoạt** như `?`, `hỏi`, `bot`, v.v.  
- Gửi dữ liệu đã lọc đến module xử lý ngôn ngữ (**OpenAI**).

### 2. Module OpenAI Response
- Sử dụng **OpenAI API (GPT-5)** để tạo phản hồi ngắn gọn, phù hợp ngữ cảnh stream.  
- Hỗ trợ **“prompt priority”** để phân biệt câu hỏi thông thường và câu hỏi quan trọng (ví dụ: từ thành viên hoặc donator).  
- Có thể mở rộng để **huấn luyện tinh chỉnh (fine-tune)** trên dữ liệu hội thoại riêng.

### 3. Module TTS (Text-to-Speech)
- Chuyển phản hồi từ AI thành **giọng nói tiếng Việt tự nhiên**, dựa trên **ElevenLabs**, **VITS**, hoặc **OpenAI TTS**.  
- Hỗ trợ **voice cloning** để tái tạo giọng nhân vật riêng (vui, nghiêm túc, troll, v.v.).  
- Truyền luồng âm thanh đến **VTube Studio** qua **Virtual Audio Cable** để đồng bộ lip-sync.

### 4. Module Vtuber Control
- Nhận tín hiệu âm thanh và hoạt ảnh để điều khiển model 2D/3D.  
- Tích hợp **hotkey-triggered animations** cho biểu cảm (ví dụ: cười, bất ngờ, ngượng).  
- Có thể kích hoạt tự động bằng **từ khóa trong chat**.

---

## ⚙️ Yêu Cầu Hệ Thống

### 💻 Phần cứng
- **CPU:** ≥ 6 nhân  
- **RAM:** ≥ 16GB  
- **GPU:** NVIDIA (khuyến nghị nếu dùng mô hình TTS nội bộ)

### 🧰 Phần mềm
- **Python 3.10+**  
- Thư viện:
openai
google-api-python-client
flask
websockets
pyaudio
vtubestudio-api

- **IDE:** Visual Studio Code / PyCharm

### 🔑 API Keys
- **OpenAI API Key**  
- **YouTube API Key**
