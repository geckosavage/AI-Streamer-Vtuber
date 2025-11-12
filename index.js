require('dotenv/config');
const { Client, GatewayIntentBits } = require('discord.js');
const OpenAI = require('openai'); 

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.on('ready', () => {
    console.log('💀 Me Ly is online!');
});

const IGNORE_PREFIX = "!";
const CHANNELS = ['1423612026269335563'];

// ⚙️ Cấu hình Groq API
const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1"
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (message.content.startsWith(IGNORE_PREFIX)) return;
    if (!CHANNELS.includes(message.channelId) && !message.mentions.users.has(client.user.id)) return;

    await message.channel.sendTyping();
    const sendTypingInterval = setInterval(() => {
        message.channel.sendTyping();
    }, 5000);

    // 🧠 Chuẩn bị context hội thoại
    let conversation = [
        { role: 'system', content: 'Cô là mẹ của Độ. Ask me anything!' }
    ];

    const prevMessages = await message.channel.messages.fetch({ limit: 36 });
    prevMessages.reverse().forEach((msg) => {
        if (msg.author.bot && msg.author.id !== client.user.id) return;
        if (msg.content.startsWith(IGNORE_PREFIX)) return;

        const username = msg.author.username.replace(/\s+/g, '_').replace(/[^\w\s]/gi, '');
        if (msg.author.id === client.user.id) {
            conversation.push({
                role: 'assistant',
                name: username,
                content: msg.content,
            });
        } else {
            conversation.push({
                role: 'user',
                name: username,
                content: msg.content,
            });
        }
    });

    try {
        const response = await groq.chat.completions.create({
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            messages: conversation,
        });

        const replyText = response.choices?.[0]?.message?.content || "💀 Chết não rồi";

        // CHIA TIN NHẮN DÀI THÀNH NHIỀU PHẦN
        const chunkSize = 1900; 
        for (let i = 0; i < replyText.length; i += chunkSize) {
            const chunk = replyText.substring(i, i + chunkSize);
            await message.reply(chunk);
        }

    } catch (error) {
        console.error("💀 Me Ly khoc that roi:\n", error);
        await message.reply("TÔI BỊ NGU!");
    } finally {
        clearInterval(sendTypingInterval);
    }
});

client.login(process.env.TOKEN);
