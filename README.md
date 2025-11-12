# 🎥 AI-Streamer-Vtuber (Project Glitchii - OpenAI Edition)

Phiên bản cập nhật sử dụng **OpenAI API** thay cho **Grok**, tối ưu hóa pipeline tương tác thời gian thực giữa **Chat → AI → TTS → Vtuber Model**.

Một chatbot Discord sử dụng Groq API (tương thích OpenAI) với mô hình Llama/Mixtral, có khả năng trò chuyện tự nhiên và ghi nhớ ngữ cảnh hội thoại.
Được xây dựng bằng Discord.js v14, bot sẽ tự động tải lại tin nhắn gần nhất trong kênh, hiển thị trạng thái đang gõ, và tự chia tin nhắn dài để tránh vượt giới hạn 2000 ký tự của Discord.

Tính năng nổi bật:
Ghi nhớ ngữ cảnh hội thoại (lấy 36 tin nhắn gần nhất)
Hiển thị “đang gõ” khi bot đang xử lý
Tự động chia nhỏ tin nhắn dài
Có thể nạp thêm kiến thức từ file .txt để mở rộng hiểu biết

Biến môi trường cần có:
TOKEN: Discord bot token
GROQ_API_KEY: API key từ Groq

Cách chạy:
npm install
node index.js
