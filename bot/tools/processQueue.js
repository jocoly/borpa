import {callDalleService} from "./backendAPI.js";
import {queue, queueState} from "../bot.js";
import fs from "fs";

const TIMEOUT = 600000

export const messageQueue = {};

export async function checkImageExists(imageFilePath) {
    try {
        await fs.promises.stat(imageFilePath);
        return true;
    } catch (error) {
        return false;
    }
}

export async function processQueue(prompt, numImages) {
    if (queueState.processing) {
        return;
    }
    queueState.processing = true;

    const msg = queue.requests.length > 0 ? queue.requests.shift() : undefined;
    if (!msg) {
        queueState.processing = false;
        return;
    }
    const resultsArray =[];
    prompt = msg.content.split(" ").slice(1).join(' ');
    let confirmationMessage = await msg.reply(`Generating image(s)...`);
    if (confirmationMessage) {
        if (messageQueue[msg.author.id].deletable) messageQueue[msg.author.id].delete().catch(() => null);
        setTimeout(() => {
            if (messageQueue[msg.author.id].deletable) messageQueue[msg.author.id].delete().catch(() => null);
        }, 5000);
    }
    try {
        const results = await Promise.race([
            callDalleService(process.env.BACKEND_URL, prompt, numImages),
            new Promise(resolve => setTimeout(() => resolve({timeout: true}), TIMEOUT))
        ]);
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
                            if (confirmationMessage) {
                                if (confirmationMessage.deletable) confirmationMessage.delete().catch(() => null);
                                setTimeout(() => {
                                    if (confirmationMessage.deletable) confirmationMessage.delete().catch(() => null);
                                }, 5000);
                            }
                            resultsArray.push(result.imageFilePath)
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
            const message = await msg.channel.messages.fetch(msg.id).catch(() => null);
            await message.reply({files:resultsArray});
        }
        if (queue.requests.length === 0) {
            queueState.processing = false;
        }
    } catch (error) {
        console.error('Error generating image:', error);
        await msg.reply('Error generating image. Please try again later.');
        queue.position[msg.author.id] = undefined;
        if (queue.requests.length === 0) {
            queueState.processing = false;
        }
    }
    queue.position[msg.author.id] = undefined;
    queueState.processing = false;
    if (queue.requests.length > 0) {
        await processQueue(prompt, numImages);
    }
}

export async function clearQueue() {
    queue.requests = [];
}
