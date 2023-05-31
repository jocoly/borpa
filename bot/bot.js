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

export const client = new Client({intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent,],});
export const queue = {requests: [], position: {}};
export const videoQueue = {requests: [], position: {}};
await clearQueue();
export const queueState = {processing: false,};
export const videoQueueState = {processing: false,};
export let queueMessage;
const configuration = new Configuration ({apiKey: process.env.OPENAI_TOKEN,});
export const openai = new OpenAIApi(configuration);
let selfDraw = false;
if (process.env.SELF_DRAW === 'true') {
    selfDraw = true;
}
const selfDrawInterval = process.env.SELF_DRAW_INTERVAL_MILLISECONDS;

let CONTAIN_BORPA = false;
if (process.env.CONTAIN_BORPA === 'true') {
    CONTAIN_BORPA = true
}

client.once(Events.ClientReady, c => {
    console.log(`Logged in as ${client.user.tag}.`);
});

if (selfDraw) {
    setInterval(drawSomething, selfDrawInterval) // generate borpa's own image every hour
}
client.on(Events.MessageCreate, async msg => {

    if (CONTAIN_BORPA && msg.channel.id !== process.env.DISCORD_CHANNEL_ID) return;

    if (msg.author.id === client.user.id && !msg.content.includes(prefixes.std + commands.draw)) return;

    if (msg.content === prefixes.std + commands.test) {
        return msg.channel.send("<:borpaLove:1100565172684328970>");
    }

    if (msg.content.includes(prefixes.std + commands.drawSomething) || msg.content.includes(prefixes.borpa + commands.drawSomething)) {
        await drawSomething(msg);
    }

    else if (msg.content.includes(prefixes.std + commands.draw) || msg.content.includes(prefixes.borpa + commands.draw)) {
        const numImages = await getNumImages(msg);
        if (numImages > 1) {
            await drawX(msg, numImages);
        }
        else {
            await draw(msg);
        }
    }

    if (msg.content.includes(prefixes.std + commands.chat) || msg.content.includes(prefixes.borpa + commands.chat)){
        await chat(msg);
    }

    if (msg.content.includes(prefixes.std + commands.optimize) || msg.content.includes(prefixes.borpa + commands.optimize) || msg.content.includes("!borptimize")) {
        await optimize(msg);
    }

    if (msg.content.includes(prefixes.std + commands.video) || msg.content.includes(prefixes.std + commands.vid) || msg.content.includes(prefixes.std + commands.txt2vid)) {
        await txt2vid(msg);
    }

});

async function getNumImages(msg) {
    const content = msg.content.split(" ");
    return content[0].replace(/\D/g, '');
}

await client.login(process.env.TOKEN)