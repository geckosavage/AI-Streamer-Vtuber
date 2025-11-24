// --- Google Translate + VOICEVOX for Node.js ---
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const VOICEVOX_URL = "http://localhost:50021";
const DEFAULT_SPEAKER = 3;

// --- Translate to Japanese ---
async function translateToJapanese(text) {
    try {
        const res = await axios.post(
            `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_API_KEY}`,
            {
                q: text,
                target: "ja",
                format: "text"
            }
        );
        return res.data.data.translations[0].translatedText;
    } catch (err) {
        console.error("Translate error:", err.response?.data || err);
        return text;
    }
}

// --- Generate VOICEVOX audio ---
async function voicevoxTTS(text, speaker = DEFAULT_SPEAKER) {
    try {
        // Step 1: Audio_query
        const query = await axios.post(
            `${VOICEVOX_URL}/audio_query`,
            null,
            { params: { text, speaker } }
        );

        // Step 2: synthesis
        const result = await axios.post(
            `${VOICEVOX_URL}/synthesis`,
            JSON.stringify(query.data),
            {
                params: { speaker },
                headers: { "Content-Type": "application/json" }
            }
        );

        const file = path.join(__dirname, `voice_${Date.now()}.wav`);
        fs.writeFileSync(file, result.data);

        return file;
    } catch (e) {
        console.error("VOICEVOX error:", e);
        return null;
    }
}

module.exports = {
    translateToJapanese,
    voicevoxTTS
};
