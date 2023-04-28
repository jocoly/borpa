import {} from 'dotenv/config';
import {Client, Events, GatewayIntentBits} from 'discord.js';
import {callDalleService} from "./backend_api.js";
import {Configuration, OpenAIApi} from 'openai';
import * as fs from "fs";


const TIMEOUT = 600000

const optimizationStringArray = [
    "Give me an optimized AI image prompt to help make better quality images based on the following subject. You should be detailed, describing the scene, the camera or art style, color styles, textures, etc. The subject is: ",
    "Create a descriptive AI image prompt to show off the engine's ability to create beautiful art based on this subject. You should be extremely detailed, describing the specifics of the setting, camera or art style, color styles, textures, etc. The subject is: ",
    "Create a descriptive AI image prompt to show off the engine's ability to create realistic art based on this subject. You should be very detailed, describing the specifics of the setting, camera or art style, color styles, textures, etc. The subject is: ",
    "Take this prompt and modify it with details that will optimize for a better AI generated image You should be very detailed, describing the specifics of the setting, camera or art style, color styles, textures, etc. The subject is: ",
    "Describe a picture you want commissioned based on this prompt. You should be very detailed, describing the specifics of the setting, camera or art style, color styles, textures, etc. The subject is: ",
    "Describe a painting you want commissioned based on this prompt. You should be very detailed, describing the specifics of the setting, camera or art style, color styles, textures, etc. The subject is: ",
    "Describe a piece of art you want create based on this prompt. You should be very detailed, describing the specifics of the setting, camera or art style, color styles, textures, etc. The subject is: ",
    "Add more details to this prompt so that it can be used to generate a thought-provoking image: ",
]

let CONTAIN_BORPA = false;
if (process.env.CONTAIN_BORPA === 'true') {
    CONTAIN_BORPA = true //set to 'true' if you want borpa to be contained to one channel
}

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

let confirmationMessage;
let queueMessage;
let readyToMeDraw=false;

async function processQueue(prompt, numImages) {
    if (processing) { // currently one at a time
        return;
    }
    processing = true;
    const msg = queue.requests.length > 0 ? queue.requests.shift() : undefined; // shift only if queue is not empty
    if (!msg) {
        processing = false;
        return;
    }
    prompt = msg.content.replace(/^!(borpadraw2|borpadraw|medraw|draw)\s*/, ""); // replace the prompt prefix if it's still there
    confirmationMessage = await msg.reply(`Generating image(s)...`);
    if (confirmationMessage) {  // timeout to avoid trying to delete an empty message
        if (queueMessage.deletable) queueMessage.delete().catch(()=> null);
        setTimeout(() => {
            if (queueMessage.deletable) queueMessage.delete().catch(() => null);
        }, 5000);
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
                            if (confirmationMessage) {  // timeout to avoid trying to delete an empty message
                                if (confirmationMessage.deletable) confirmationMessage.delete().catch(()=> null);
                                setTimeout(() => {
                                    if (confirmationMessage.deletable) confirmationMessage.delete().catch(() => null);
                                }, 5000);
                            }
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
        if (queue.requests.length === 0) {
            processing = false;
        }
    } catch (error) {
        console.error('Error generating image:', error);
        await msg.reply('Error generating image. Please try again later.');
        queue.position[msg.author.id] = undefined;
        if (queue.requests.length === 0) {
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

async function borpaDrawSomething() {
    const PRIMARY_CHANNEL = await client.channels.fetch(process.env.DISCORD_CHANNEL_ID)
    const prompt = "Come up with a creative, descriptive prompt for an AI generated image for me. It can be anything.";
    let completion = await openai.createCompletion({ // create a prompt
        model: process.env.OPENAI_MODEL,
        prompt: prompt,
        max_tokens: 250,
        temperature: 1.7
    });
    let randomIndex = Math.floor(Math.random() * (optimizationStringArray.length - 1));
    let optimizedPrompt = optimizationStringArray[randomIndex] + completion.data.choices[0].text;
    let optimizedCompletion = await openai.createCompletion( {
        model: process.env.OPENAI_MODEL,
        prompt: optimizedPrompt,
        max_tokens: 250,
        temperature: 0.8
    })
    await PRIMARY_CHANNEL.send("!medraw" + optimizedCompletion.data.choices[0].text)
}

client.once(Events.ClientReady, c => {
    console.log(`Logged in as ${client.user.tag}.`);
});

setInterval(borpaDrawSomething, 3600000) // generate borpa's own image every hour
client.on(Events.MessageCreate, async msg => {
    if (CONTAIN_BORPA && msg.channel.id !== process.env.DISCORD_CHANNEL_ID) return;
    if (msg.content.includes("!medraw") && msg.author.id === client.user.id) {
        let prompt = msg.content;
        queue.requests.push(msg);
        queue.position[msg.author.id] = queue.requests.length;
        queueMessage = await msg.reply(`Image prompt queued. There are ${queue.requests.length} requests ahead of you.`);
        await processQueue(prompt, 1)
    }
    if (msg.author.id === client.user.id) return;
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
        await borpaDrawSomething();
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
