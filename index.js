const { Telegraf } = require('telegraf');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { pipeline } = require('stream'); // Node.js v20 bilan mavjud
const fetch = require('node-fetch');  // 'fetch'ni o'rnatish kerak

const bot = new Telegraf('7889682229:AAFYu_c6O20tpKS63-PHbiSeXb7lMVgS9LU');

let onStartMsg = "Salom! Men sizga qo'shiq topib berishim mumkin, Qo'shiq nomini yozing...";
bot.start((ctx) => ctx.reply(onStartMsg));

const downloadFile = async (url, filePath) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to download file: ${response.statusText}`);
    const streamPipeline = promisify(pipeline);
    await streamPipeline(response.body, fs.createWriteStream(filePath));
};

bot.on('text', async (ctx) => {
    const term = ctx.message.text;
    let endpoint = "https://www.shazam.com/services/amapi/v1/catalog/UZ/search?";
    endpoint = endpoint + "term=" + encodeURIComponent(term) + "&limit=1&types=songs,artists";

    try {
        const response = await fetch(endpoint);
        const data = await response.json();

        if (data.results && data.results.songs && data.results.songs.data.length > 0) {
            const song = data.results.songs.data[0];
            const songName = song.attributes.name;
            const artistName = song.attributes.artistName;
            const previewUrl = song.attributes.previews[0].url; // Qo'shiq preview fayl URL

            const fileName = artistName + " - " + songName + ".mp3"; // Fayl nomini belgilash
            const filePath = path.join(__dirname, fileName);

            await downloadFile(previewUrl, filePath);

            await ctx.replyWithAudio({ source: filePath });

            fs.unlinkSync(filePath); // Faylni yuborganingizdan keyin uni o'chirib tashlash (ixtiyoriy)
        } else {
            ctx.reply("Afsuski, siz kiritgan qo'shiq topilmadi.");
        }
    } catch (error) {
        console.error('Xatolik yuz berdi:', error);
        ctx.reply('Maʼlumot olishda xatolik yuz berdi.');
    }
});

bot.launch();
