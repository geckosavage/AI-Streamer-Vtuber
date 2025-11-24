// Full: Discord bot + RAG + Groq + Xenova embedder + VoiceVox TTS + Subtitle (Vietnamese) + VB-Cable playback

require('dotenv/config');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { Client, GatewayIntentBits, AttachmentBuilder } = require('discord.js');
const { ChromaClient } = require('chromadb');
const { pipeline } = require('@xenova/transformers');
const Groq = require('groq-sdk');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const playerFactory = require('play-sound');

const PLAY_DEVICE_NAME = "CABLE Input (VB-Audio Virtual Cable)"; // adjust if needed (Windows device name)

// ---------------- Config & Clients ----------------
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const chroma = new ChromaClient({ path: "http://localhost:8000" }); 
const COLLECTION_NAME = 'bot_knowledge';

// ---------------- play-sound wrapper for VB-Cable ----------------
const player = playerFactory();

function playVB(pathToFile, onStart = null) {
    return new Promise((resolve, reject) => {

        if (onStart) setTimeout(onStart, 0); // báo hiệu "đã bắt đầu phát"

        player.play(pathToFile, { device: PLAY_DEVICE_NAME }, (err) => {
            if (err) {
                console.warn("play-sound failed (trying fallback)...", err.message || err);
                const { exec } = require('child_process');

                const escapedFile = pathToFile.replace(/"/g, '\\"');
                const vlcCmd = `vlc --intf dummy --play-and-exit --aout=directsound --directx-audio-device-name="${PLAY_DEVICE_NAME}" "${escapedFile}"`;

                exec(vlcCmd, (vlcErr) => {
                    if (vlcErr) {
                        console.error("VLC fallback failed:", vlcErr.message || vlcErr);
                        return reject(vlcErr);
                    }
                    return resolve();
                });
            } else {
                return resolve();
            }
        });
    });
}

function writeOutputDelayed(text, delayMs = 36000) {
    return new Promise(resolve => {
        setTimeout(() => {
            const file = path.join(process.cwd(), "output.txt");
            fs.writeFileSync(file, text, "utf8");
            resolve(file);
        }, delayMs);
    });
}

// ---------------- Embedding model ----------------
let embedder;
async function embedText(text) {
    if (!embedder) {
        console.log('Loading local embedding model...');
        embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }
    const output = await embedder(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
}

// ---------------- Load Data ----------------
async function learnFromFolder(folderPath = './data') {
    if (!fs.existsSync(folderPath)) {
        console.warn("Data folder not found:", folderPath);
        return;
    }
    const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.md'));
    if (!files.length) return console.log("❌ No .md files found!");

    const collection = await chroma.getOrCreateCollection({ name: COLLECTION_NAME });
    console.log(`📚 Loading ${files.length} Markdown files...`);

    for (const file of files) {
        const filePath = path.join(folderPath, file);
        const content = fs.readFileSync(filePath, 'utf8');

        const chunks = splitText(content, 1000);
        for (let i = 0; i < chunks.length; i++) {
            const embedding = await embedText(chunks[i]);
            await collection.add({
                ids: [`${file}_${i}`],
                embeddings: [embedding],
                metadatas: [{ source: file }],
                documents: [chunks[i]],
            });
        }
        console.log(`✅ Loaded: ${file}`);
    }
    console.log("Data import finished!");
}

// ---------------- Text split ----------------
function splitText(text, maxLen = 1000) {
    if (!text) return [];
    // Tách câu bằng các dấu câu kết thúc, giữ lại dấu câu
    const sentences = text.split(/(?<=[.?!])\s+/);
    let chunks = [];
    let chunk = "";

    for (const s of sentences) {
        if ((chunk + " " + s).trim().length > maxLen) {
            if (chunk.trim()) chunks.push(chunk.trim());
            chunk = s;
        } else {
            chunk += " " + s;
        }
    }
    if (chunk.trim()) chunks.push(chunk.trim());
    return chunks;
}

// ---------------- Retrieve RAG ----------------
async function retrieveKnowledge(query, topK = 3) {
    // Đảm bảo embedder đã load trước khi retrieve
    await embedText('init'); 
    
    const collection = await chroma.getOrCreateCollection({ name: COLLECTION_NAME });
    const qEmbed = await embedText(query);

    const results = await collection.query({
        queryEmbeddings: [qEmbed],
        nResults: topK
    });

    if (!results.documents?.length) return "";
    
    // Lấy tất cả document từ kết quả tìm kiếm (kết quả 0 là tập hợp topK documents)
    return results.documents[0].join("\n");
}

// ---------------- VoiceVox TTS helper ----------------
async function voicevoxTTS(japaneseText, outPath = null, speaker = 46) {
    const voicevoxURL = 'http://localhost:50021';
    outPath = outPath || path.join(process.cwd(), `voicevox_${Date.now()}.wav`);
    try {
        const qResp = await axios.post(
            `${voicevoxURL}/audio_query`,
            null,
            { params: { text: japaneseText, speaker } }
        );
        const synthResp = await axios.post(
            `${voicevoxURL}/synthesis`,
            qResp.data,
            {
                params: { speaker, enable_interrogative_upspeak: true },
                responseType: 'arraybuffer',
                headers: { 'Content-Type': 'application/json' }
            }
        );
        fs.writeFileSync(outPath, Buffer.from(synthResp.data));
        return outPath;
    } catch (err) {
        console.error("voicevoxTTS error:", err?.response?.data || err.message || err);
        throw err;
    }
}

// ---------------- Subtitle generator (Vietnamese) ----------------
function generateVietnameseSubtitle(vietnameseText, outPath = null, wordsPerLine = 10) {
    outPath = outPath || path.join(process.cwd(), `subtitle_${Date.now()}.txt`);
    try {
        const words = (vietnameseText || "").split(/\s+/).filter(Boolean);
        const lines = [];
        for (let i = 0; i < words.length; i += wordsPerLine) {
            lines.push(words.slice(i, i + wordsPerLine).join(" "));
        }
        // Ghi phụ đề dưới dạng text thô, có thể dùng cho OBS Text Source
        fs.writeFileSync(outPath, lines.join("\n"), "utf8"); 
        return outPath;
    } catch (err) {
        console.error("generateVietnameseSubtitle error:", err);
        throw err;
    }
}

// ---------------- Helper: translate text via public Google Translate endpoint ----------------
async function translateToJapanese(text, source = 'auto') {
    try {
        const res = await axios.post("https://translate.googleapis.com/translate_a/single", null, {
            params: { client: "gtx", sl: source, tl: "ja", dt: "t", q: text },
            timeout: 10000
        });
        if (!res.data) return text;
        const jap = res.data[0].map(chunk => chunk[0]).join('');
        return jap;
    } catch (err) {
        console.warn("translateToJapanese failed, returning original text. Err:", err.message || err);
        return text;
    }
}

// Ghi output vào file (dùng cho OBS) nhưng delay 30 giây
function writeOutput(text, delayMs = 25000) {
    const outputPath = path.join(process.cwd(), "output.txt");

    // Đợi 25 giây rồi mới ghi text
    setTimeout(() => {
        try {
            fs.writeFileSync(outputPath, text, "utf8");
            console.log("✅ output.txt written after delay");
        } catch (e) {
            console.error("❌ Failed to write output.txt:", e);
        }
    }, delayMs);

    // Trả về đường dẫn để code khác vẫn sử dụng bình thường
    return outputPath;
}


// ---------------- Discord message handler ----------------
client.on('messageCreate', async (message) => {
    try {
        if (message.author.bot) return;
        if (!message.mentions.has(client.user)) return;

        const query = message.content.replace(/<@!?\d+>/, "").trim();
        if (!query) return;

        await message.channel.sendTyping();
        const context = await retrieveKnowledge(query);

        const prompt = `
Bạn là Glitchii, một streamer nữ "thượng đẳng", toxic, sinh ra từ code nhưng nói chuyện như người thật. 
Tin nhắn Discord: "${query}" từ ${message.author.username}.
Context data: ${context}
Hãy trả lời bằng nhiều nhất 3 câu, <150 từ, không vòng vo, vào thẳng vấn đề chính.
        `;

        const completion = await groq.chat.completions.create({
            model: 'meta-llama/llama-4-scout-17b-16e-instruct',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7
        });

        const answer = completion.choices[0].message.content.trim();

        // 1. Send text reply first
        await message.reply(answer);

        // 2. Ghi file output.txt
        const outputFile = writeOutput(answer);

        // --- TTS bằng VoiceVox + phụ đề tiếng Việt + phát VB-Cable ---
        let audioPath = null;
        let subtitlePath = null;
        try {
            // 2) tạo audio từ VoiceVox
            const audioTempName = `voicevox_${Date.now()}.wav`;
            audioPath = await voicevoxTTS(await translateToJapanese(answer), path.join(process.cwd(), audioTempName));

            // 3) tạo phụ đề tiếng Việt từ answer gốc
            const subTempName = `sub_${Date.now()}.txt`;
            subtitlePath = generateVietnameseSubtitle(answer, path.join(process.cwd(), subTempName));

            // 4) phát audio vào VB-Cable (OBS sẽ nhận từ CABLE Output)
            playVB(audioPath, async () => {
            await writeOutputDelayed(answer, 25000);  // chậm 36s từ lúc audio bắt đầu phát
                })
                .catch(err => {
                    console.error("playVB error:", err);
                })
                .finally(() => {
                    // Xóa file tạm và dọn dẹp output.txt sau khi playVB kết thúc
                    try { fs.unlinkSync(audioPath); } catch (e) { console.warn("Lỗi xoá audio:", e.message) }
                    // try { fs.writeFileSync(outputFile, ""); } catch (e) { console.warn("Lỗi xoá output.txt:", e.message) }
                });

            // 5) gửi file audio + subtitle vào Discord channel (tùy chọn)
            try {
                // Xóa file sub tạm sau 5m (vì file audio sẽ bị xóa ngay sau khi phát)
                await message.channel.send({ files: [audioPath, subtitlePath] });
                setTimeout(() => {
                    try { fs.unlinkSync(subtitlePath); } catch (e) {}
                }, 300_000);

            } catch (errSend) {
                console.warn("Failed to send files to Discord:", errSend.message || errSend);
            }

        } catch (ttsErr) {
            console.error("VOICEVOX TTS Error (message handler):", ttsErr);
        }

    } catch (err) {
        console.error("messageCreate handler error:", err);
    }
});

// ---------------- Bot ready ----------------
client.once('ready', async () => {
    console.log(`${client.user.tag} đã online!`);
    try {
        const col = await chroma.getOrCreateCollection({ name: COLLECTION_NAME });
        const count = await col.count();

        if (count === 0) {
            await learnFromFolder('./data');
            console.log("📚 Đã import dữ liệu lần đầu.");
} 
        else {
            console.log("📚 Dữ liệu đã tồn tại, bỏ qua import.");
}

    } catch (e) {
        console.error("learnFromFolder error:", e);
    }
});

// ---------------- YouTube webhook (same flow) ----------------
const app = express();
app.use(cors());
app.use(bodyParser.json());

// --- Biến kiểm soát Queue ---
let ytQueue = [];
let isSpeaking = false;
let lastSenderMessages = new Map(); // Chống spam
let lastProcessedTime = 0;

function shouldIgnore(author, message) {
    const now = Date.now();
    const record = lastSenderMessages.get(author) || { lastMsg: "", times: [], lastTime: 0 };

    // Cùng nội dung → spam
    if (record.lastMsg === message && (now - record.lastTime < 10000)) {
        return true;
    }

    // 3 tin trong 10 giây → spam
    record.times = record.times.filter(t => now - t < 10000);
    record.times.push(now);
    if (record.times.length >= 3) {
        lastSenderMessages.set(author, record);
        return true;
    }

    record.lastMsg = message;
    record.lastTime = now;
    lastSenderMessages.set(author, record);
    return false;
}

// Hàm chỉ để tạo ra phản hồi text (đã tách ra khỏi processYTQueue)
async function getYTReplyText(author, msg) {
    const context = await retrieveKnowledge(msg || "");

    const prompt = `
Bạn là Glitchii, một streamer nữ "thượng đẳng", toxic, sinh ra từ code nhưng nói chuyện như người thật. 
Tin nhắn YouTube: "${msg}" từ ${author}.
Context data: ${context}
Hãy trả lời bằng nhiều nhất 3 câu, <150 từ, không vòng vo, vào thẳng vấn đề chính.
    `;

    const completion = await groq.chat.completions.create({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7, // Sử dụng nhiệt độ đồng nhất
    });

    return completion.choices[0].message.content.trim();
}

async function processYTQueue() {
    // nếu đang nói → đợi lần sau
    if (isSpeaking) return;

    // nếu hàng đợi trống → nghỉ
    if (ytQueue.length === 0) return;

    const now = Date.now();

    if (now - lastProcessedTime < 10000) return;

    // Lấy tin CŨ NHẤT trong hàng đợi (FIFO)
    const item = ytQueue.shift(); 
    if (!item) return;

    const { author, message, res } = item;

    lastProcessedTime = now;
    isSpeaking = true;

    let audioPath = null;
    let subtitlePath = null;
    let outputFile = null;

    try {
        // 1. Lấy phản hồi text
        const reply = await getYTReplyText(author, message);
        
        // 2. Ghi file output.txt
        outputFile = writeOutput(reply);

        // 3. TTS + Subtitle + Play + Post Discord
        const japaneseText = await translateToJapanese(reply);
        const audioTempName = `voicevox_yt_${Date.now()}.wav`;
        audioPath = await voicevoxTTS(japaneseText, path.join(process.cwd(), audioTempName));
        
        const subTempName = `sub_yt_${Date.now()}.txt`;
        subtitlePath = generateVietnameseSubtitle(reply, path.join(process.cwd(), subTempName));

        // Post to a designated channel (ID Discord phải được thay thế)
        const channel = client.channels.cache.get("1438779497359999106");
        
        if (channel) {
            // Chạy phát audio (không await)
            playVB(audioPath, async () => {
            await writeOutputDelayed(reply, 25000);
                })
                .catch(err => console.error("playVB yt error:", err))
                .finally(() => {
                    // Dọn dẹp output.txt và audioPath SAU KHI phát xong
                    try { fs.unlinkSync(audioPath); } catch (e) { console.warn("Lỗi xoá audio queue:", e.message) }
                    if (outputFile) {
                        // try { fs.writeFileSync(outputFile, ""); } catch (e) { console.warn("Lỗi xoá output.txt queue:", e.message) }
                    }
                });
                
            await channel.send({ content: `Phản hồi YouTube (${author}): ${reply}`, files: [audioPath, subtitlePath] });
            
            // cleanup subtitle file sau 5m (file audio được cleanup ngay sau khi phát)
            setTimeout(() => {
                try { fs.unlinkSync(subtitlePath); } catch(e){}
            }, 300_000); 

        } else {
            console.warn("Channel not found to post YouTube response.");
            // Nếu không post Discord, vẫn dọn dẹp file audio ngay
            try { fs.unlinkSync(audioPath); } catch (e) {}
            try { fs.unlinkSync(subtitlePath); } catch (e) {}
            // if (outputFile) { try { fs.writeFileSync(outputFile, ""); } catch (e) {} }
        }

        // Trả lời HTTP request của bên gửi webhook SAU KHI XỬ LÝ
        res.json({ success: true, reply });

    } catch (err) {
        console.error("YT processing error:", err);
        // Trả lời lỗi cho bên gửi webhook
        if (!res.headersSent) {
            res.json({ success: false, error: String(err) });
        }
    } finally {
        // Đánh dấu đã nói xong
        isSpeaking = false;
    }
}

// --- Webhook Endpoint CHỈ ĐƯỢC DÙNG ĐỂ ĐẨY VÀO QUEUE ---
app.post('/youtube-chat', async (req, res) => {
    const { author, message: ytMessage } = req.body || {};

    if (shouldIgnore(author, ytMessage)) {
        // Trả lời request ngay lập tức nếu bị bỏ qua
        return res.json({ success: true, ignored: true });
    }
    
    console.log(`YouTube chat received: ${author}: ${ytMessage}`);

    // CHỈ BỎ TIN VÀO QUEUE và lưu lại HTTP response object
    // res sẽ được trả lời khi tin nhắn được xử lý xong trong processYTQueue
    ytQueue.push({ author, message: ytMessage, res });

    return res.json({ success: true, queued: true });
});

setInterval(processYTQueue, 1000); // Chạy queue mỗi giây

app.listen(3030, () => {
    console.log("Webhook server chạy tại http://localhost:3030");
});

// ---------------- Login ----------------
client.login(process.env.TOKEN).catch(err => {
    console.error("Discord login failed:", err);
    process.exit(1);
});