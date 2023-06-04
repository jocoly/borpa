import {} from 'dotenv/config';
import {Client, Events, GatewayIntentBits} from 'discord.js';
import {Configuration, OpenAIApi} from 'openai';
import {clearQueue} from "./tools/processQueue.js";
import {drawSomething} from "./commands/drawSomething.js";
import {commands, prefixes} from "./commands/commands.js";
import {optimize} from "./commands/optimize.js";
import {chat} from "./commands/chat.js";
import {draw} from "./commands/draw.js";
import {drawX} from "./commands/drawX.js";
import {txt2vid} from "./commands/txt2vid.js";
import {animateSomething} from "./commands/animateSomething.js";

export const client = new Client({intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent,],});
export const queue = {requests: [], position: {}};
export const videoQueue = {requests: [], position: {}};
await clearQueue();
export const queueState = {processing: false,};
export const videoQueueState = {processing: false,};
export let queueMessage;
const configuration = new Configuration ({apiKey: process.env.OPENAI_TOKEN,});
export const openai = new OpenAIApi(configuration);

let CONTAIN_BOT = false;
if (process.env.CONTAIN_BOT === 'true') {
    CONTAIN_BOT = true;
}
let ENABLE_GPT = false;
if (process.env.ENABLE_GPT === 'true') {
    ENABLE_GPT = true;
}
let ENABLE_STABLE_DIFFUSION = false;
if (process.env.ENABLE_STABLE_DIFFUSION === 'true') {
    ENABLE_STABLE_DIFFUSION = true;
}
let ENABLE_TEXT_TO_VIDEO = false;
if (process.env.ENABLE_TEXT_TO_VIDEO === 'true') {
    ENABLE_TEXT_TO_VIDEO = true;
}
let SELF_DRAW = false;
if (process.env.SELF_DRAW === 'true') {
    SELF_DRAW = true;
}
const selfDrawInterval = process.env.SELF_DRAW_INTERVAL_MILLISECONDS;
let SELF_ANIMATE = false;
if (process.env.SELF_ANIMATE === 'true') {
    SELF_ANIMATE = true;
}
const selfAnimateInterval = process.env.SELF_ANIMATE_INTERVAL_MILLISECONDS;

client.once(Events.ClientReady, c => {
    console.log(`Logged in as ${client.user.tag}.`);
});

const delay = ms => new Promise(res => setTimeout(res, ms));

if (SELF_DRAW) {
    setInterval(drawSomething, selfDrawInterval); // generate borpa's own image every x ms
}

if (SELF_ANIMATE) {
    if (SELF_DRAW) {
        setTimeout(() => {
            setInterval(animateSomething, selfAnimateInterval)
        }, 1800000); //offset by 30 min
    } else {
            setInterval(animateSomething, selfAnimateInterval);
    }
}

client.on(Events.MessageCreate, async msg => {

    if (CONTAIN_BOT && msg.channel.id !== process.env.DISCORD_CHANNEL_ID) return;

    if (msg.author.id === client.user.id){
        if (!msg.content.includes(prefixes.std + commands.draw) && !msg.content.includes(prefixes.std + commands.video)) {
            return;
        }
    }

    if (msg.content === prefixes.std + commands.test) {
        return msg.channel.send("Hello world!");
    }

    if ((msg.content.includes(prefixes.std + commands.drawSomething) || msg.content.includes(prefixes.borpa + commands.drawSomething)) && ENABLE_GPT && ENABLE_STABLE_DIFFUSION) {
        await drawSomething(msg);
    }

    else if ((msg.content.includes(prefixes.std + commands.draw) || msg.content.includes(prefixes.borpa + commands.draw)) && ENABLE_STABLE_DIFFUSION) {
        const numImages = await getNumImages(msg);
        if (numImages > 1) {
            await drawX(msg, numImages);
        }
        else {
            await draw(msg);
        }
    }

    if ((msg.content.includes(prefixes.std + commands.chat) || msg.content.includes(prefixes.borpa + commands.chat)) && ENABLE_GPT){
        await chat(msg);
    }

    if ((msg.content.includes(prefixes.std + commands.optimize) || msg.content.includes(prefixes.borpa + commands.optimize) || msg.content.includes("!borptimize")) && ENABLE_GPT) {
        await optimize(msg);
    }

    if ((msg.content.includes(prefixes.std + commands.video) || msg.content.includes(prefixes.std + commands.vid) || msg.content.includes(prefixes.std + commands.txt2vid)) && ENABLE_TEXT_TO_VIDEO) {
        await txt2vid(msg);
    }

    if ((msg.content.includes(prefixes.std + commands.animateSomething) || msg.content.includes(prefixes.borpa + commands.animateSomething)) && ENABLE_GPT && ENABLE_TEXT_TO_VIDEO) {
        await animateSomething(msg);
    }

});

async function getNumImages(msg) {
    const content = msg.content.split(" ");
    return content[0].replace(/\D/g, '');
}

await client.login(process.env.DISCORD_TOKEN)