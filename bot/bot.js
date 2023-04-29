import {} from 'dotenv/config';
import {Client, Events, GatewayIntentBits} from 'discord.js';
import {Configuration, OpenAIApi} from 'openai';
import {optimizationStringArray} from "./optimizationStringArray.js";
import {clearQueue, processQueue} from "./processQueue.js";
import {drawSomething} from "./drawSomething.js";


// Create Discord client

export const client = new Client({intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// initialize queue

export const queue = {requests: [], position: {}};
await clearQueue();
export const queueState = {processing: false};
export let queueMessage;

const configuration = new Configuration ({apiKey: process.env.OPENAI_TOKEN,});
export const openai = new OpenAIApi(configuration)

let CONTAIN_BORPA = false;
if (process.env.CONTAIN_BORPA === 'true') {                 // set CONTAIN_BORPA=true in .env if you want borpa contained to one channel
    CONTAIN_BORPA = true
}


client.once(Events.ClientReady, c => {
    console.log(`Logged in as ${client.user.tag}.`);
});

setInterval(drawSomething, 3600000) // generate borpa's own image every hour
client.on(Events.MessageCreate, async msg => {
    if (CONTAIN_BORPA && msg.channel.id !== process.env.DISCORD_CHANNEL_ID) return;
    if (msg.author.id === client.user.id && !msg.content.includes("!draw")) return;
    if (msg.content === "!test") {
        return msg.channel.send("<:borpaLove:1100565172684328970>");
    }

    if (msg.content.includes("!borpadraw2") || msg.content.includes("!draw2")) {
        let prompt = msg.content
        queue.requests.push(msg);
        queue.position[msg.author.id] = queue.requests.length;
        queueMessage = await msg.reply(`Image prompt queued. There are ${queue.requests.length} requests ahead of you.`);
        await processQueue(prompt, 2)
    } else if (msg.content.includes("!borpadrawsomething") || msg.content.includes("!drawsomething")) {
        await drawSomething(msg.channelId);
    } else if (msg.content.includes("!borpadraw") || msg.content.includes("!draw")) {
        let prompt = msg.content
        queue.requests.push(msg);
        queue.position[msg.author.id] = queue.requests.length;
        queueMessage = await msg.reply(`Image prompt queued. There are ${queue.requests.length} requests ahead of you.`);
        await processQueue(prompt, 1)
    }

    if (msg.content.includes("!borpachat") || msg.content.includes("!chat")){
        let prompt = msg.content.replace(/^!(borpachat|chat|cletus)\s*/, "");
        let completion = await openai.createCompletion({
            model: process.env.OPENAI_MODEL,
            prompt: prompt,
            max_tokens: 250,
            temperature: 0.7
        });
        msg.reply(prompt + "\n" + completion.data.choices[0].text);
    }

    if (msg.content.includes("!borpaoptimize") || msg.content.includes("!optimize")) {
        let prompt = msg.content.replace(/^!(borpaoptimize|optimize|borptimize)\s*/, "");
        let randomIndex = Math.floor(Math.random() * (optimizationStringArray.length - 1))
        prompt = optimizationStringArray[randomIndex] + prompt;
        let completion = await openai.createCompletion({
            model: process.env.OPENAI_MODEL,
            prompt: prompt,
            max_tokens: 250,
            temperature: 0.8
        });
        console.log(optimizationStringArray[randomIndex])
        msg.reply(completion.data.choices[0].text)
    }
});

client.login(process.env.TOKEN)
