import {} from 'dotenv/config'
import {Client, Events, GatewayIntentBits} from 'discord.js'
import { callDalleService } from "./backend_api.js";
import {Configuration, OpenAIApi} from 'openai';
import * as fs from "fs";

const TIMEOUT = 600000

const client = new Client({intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

const queue = {requests: [], position: {}};
await clearQueue();
let processing = false;

const configuration = new Configuration ({
    apiKey: process.env.OPENAI_TOKEN,
});
const openai = new OpenAIApi(configuration)

let numImages = 1;
let confirmationMessage = "";
let queueMessage;

async function processQueue(prompt, numImages) {
    if (processing) {
        return;
    }
    processing = true;
    const msg = queue.requests.shift();
    if (!msg || !msg.author || queue.position[msg.author.id] > 1) {
        const numRequestsInQueue = queue.requests.length;
        if (msg && msg.author && !queue.position[msg.author.id]) {
            queue.position[msg.author.id] = 1;
            queueMessage = await msg.reply(`Image prompt queued. There are ${numRequestsInQueue} requests ahead of you.`);
        }
        processing = false;
        return;
    }
    if (numImages === 1) {
        prompt = msg.content.replace(/^!borpadraw /, "");
    } else if (numImages > 1) {
        prompt = msg.content.replace(/^!borpadraw[0-9]/, "");
    }
    if (numImages > 1) {
        confirmationMessage = await msg.reply(`Generating ${numImages} images...`);
    } else {
        confirmationMessage = await msg.reply(`Generating image...`);
    }
    try {
        const results = await Promise.race([
            callDalleService(process.env.BACKEND_URL, prompt, numImages),
            new Promise(resolve => setTimeout(() => resolve({timeout: true}), TIMEOUT))
        ])
        if (results.timeout) {
            await msg.reply('Image generation timed out. Please try again later.');
        } else {
            for (const result of results) {
                let imageExists = await checkImageExists(result.imageFilePath);
                while (!imageExists) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    imageExists = await checkImageExists(result.imageFilePath);
                }
                try {
                    const message = await msg.channel.messages.fetch(msg.id).catch(() => null);
                    if (message) {
                        try {
                            await message.reply({files: [result.imageFilePath]});
                        } catch (error) {
                            console.error('Error sending image:', error);
                        }
                    } else {
                        console.error('Message not found:', msg.id);
                    }

                } catch (error) {
                    console.error('Error sending image:', error)
                }
            }
        }
        if (queue.requests.length === 0 || queue.position[msg.author.id] > 1) {
            processing = false;
        }
    } catch (error) {
        console.error('Error generating DALL-E image:', error);
        await msg.reply('Error generating DALL-E image. Please try again later.');
        queue.position[msg.author.id] = undefined;
        if (queue.requests.length === 0 || queue.position[msg.author.id] > 1) {
            processing = false;
        }
    }
    queue.position[msg.author.id] = undefined;
    processing = false;
    await processQueue(prompt, numImages);
}

async function checkImageExists(imageFilePath) {
    try {
        await fs.promises.stat(imageFilePath);
        return true;
    } catch (error) {
        return false;
    }
}

async function clearQueue() {
    queue.requests = [];
}

client.once(Events.ClientReady, c => {
    console.log(`Logged in as ${client.user.tag}.`);
});
client.on(Events.MessageCreate, async msg => {
    if (msg.author.id === client.user.id) return;
    if (msg.content === "!test") {
        return msg.channel.send("<:borpaLove:1076241086739140729>");
    }

    if (msg.content.includes("!borpadraw2")) {
        numImages = 2;
        let prompt = msg.content.replace(/^!borpadraw2 /, "");
        queue.requests.push(msg);
        queue.position[msg.author.id] = queue.requests.length;
        queueMessage = await msg.reply(`Image prompt queued. There are ${queue.requests.length} requests ahead of you.`);
        await processQueue(prompt, numImages)
    } else if (msg.content.includes("!borpadraw")) {
        numImages = 1;
        let prompt = msg.content.replace(/^!borpadraw /, "");
        queue.requests.push(msg);
        queue.position[msg.author.id] = queue.requests.length;
        queueMessage = await msg.reply(`Image prompt queued. There are ${queue.requests.length} requests ahead of you.`);
        await processQueue(prompt, numImages)
    }

    if (msg.content.includes("!borpachat")){
        let prompt = msg.content.replace(/^!borpachat /, "");
        let completion = await openai.createCompletion({
            model: process.env.OPENAI_MODEL,
            prompt: prompt,
            max_tokens: 250,
            temperature: 0.7
        });
        msg.reply(prompt + "\n" + completion.data.choices[0].text);
    }
});

client.login(process.env.TOKEN)
