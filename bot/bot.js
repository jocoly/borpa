import {} from 'dotenv/config';
import {Client, Events, GatewayIntentBits} from 'discord.js';
import {Configuration, OpenAIApi} from 'openai';
import {clearQueue} from "./processQueue.js";
import {drawSomething} from "./drawSomething.js";
import {commands, prefixes} from "./commands.js";
import {optimize} from "./optimize.js";
import {chat} from "./chat.js";
import {draw} from "./draw.js";
import {draw2} from "./draw2.js";

export const client = new Client({intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent,],});
export const queue = {requests: [], position: {}};
await clearQueue();
export const queueState = {processing: false,};
export let queueMessage;
const configuration = new Configuration ({apiKey: process.env.OPENAI_TOKEN,});
export const openai = new OpenAIApi(configuration);

let CONTAIN_BORPA = false;
if (process.env.CONTAIN_BORPA === 'true') {
    CONTAIN_BORPA = true
}

client.once(Events.ClientReady, c => {
    console.log(`Logged in as ${client.user.tag}.`);
});

setInterval(drawSomething, 3600000) // generate borpa's own image every hour
client.on(Events.MessageCreate, async msg => {

    if (CONTAIN_BORPA && msg.channel.id !== process.env.DISCORD_CHANNEL_ID) return;

    if (msg.author.id === client.user.id && !msg.content.includes(prefixes.std + commands.draw)) return;

    if (msg.content === prefixes.std + commands.test) {
        return msg.channel.send("<:borpaLove:1100565172684328970>");
    }

    if (msg.content.includes(prefixes.std + commands.draw2) || msg.content.includes(prefixes.borpa + commands.draw2)) {
        await draw2(msg);
    }

    else if (msg.content.includes(prefixes.std + commands.drawSomething) || msg.content.includes(prefixes.borpa + commands.drawSomething)) {
        await drawSomething(msg);
    }

    else if (msg.content.includes(prefixes.std + commands.draw) || msg.content.includes(prefixes.borpa + commands.draw)) {
        await draw(msg);
    }

    if (msg.content.includes(prefixes.std + commands.chat) || msg.content.includes(prefixes.borpa + commands.chat)){
        await chat(msg);
    }

    if (msg.content.includes(prefixes.std + commands.optimize) || msg.content.includes(prefixes.borpa + commands.optimize) || msg.content.includes("!borptimize")) {
        await optimize(msg);
    }

});

client.login(process.env.TOKEN)
