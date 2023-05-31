import {callTextToVideoService} from "./backendAPI.js";
import {videoQueue, videoQueueState} from "../bot.js";
import fs from "fs";
const TIMEOUT = 600000

export const videoMessageQueue = {};

export async function checkFileExists(filePath){
    try {
        await fs.promises.stat(filePath);
        return true;
    } catch (error) {
        return false;
    }
}

export async function processVideoQueue(prompt) {
    if (videoQueueState.processing) {
        return;
    }
    videoQueueState.processing = true;

    const msg = videoQueue.requests.length > 0 ? videoQueue.requests.shift() : undefined;
    if (!msg) {
        videoQueueState.processing = false;
        return;
    }
    let videoFile = "";
    prompt = msg.content.split(" ").slice(1).join(' ');
    let confirmationMessage = await msg.reply(`Generating video...`);

    if (confirmationMessage) {
        if (videoMessageQueue[msg.author.id].deletable) videoMessageQueue[msg.author.id].delete().catch(() => null);
        setTimeout(() => {
            if (videoMessageQueue[msg.author.id].deletable) videoMessageQueue[msg.author.id].delete().catch(() => null);
        }, 5000);
    } try {
        const results = await Promise.race([
            callTextToVideoService(process.env.VIDEO_BACKEND_URL, prompt, -1),
            new Promise(resolve => setTimeout(() => resolve({timeout: true}), TIMEOUT))
        ]);
        if (results.timeout) {
            await msg.reply('Video generation timed out. Please try again later.');
        } else {
            for (const result of results) {
                let videoExists = await checkFileExists(result.videoFilePath);
                while (!videoExists) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    videoExists = await checkFileExists(result.videoFilePath);
                } try {
                    const message = await msg.channel.messages.fetch(msg.id).catch(() => null);
                    if (message) {
                        try {
                            if (confirmationMessage) {
                                if (confirmationMessage.deletable) confirmationMessage.delete().catch(() => null);
                                setTimeout(() => {
                                    if (confirmationMessage.deletable) confirmationMessage.delete().catch(() => null);
                                }, 5000);
                            }
                            videoFile = result.videoFilePath;
                        } catch (error) {
                            console.error('Error sending video:', error);
                        }
                    } else {
                        console.error('Message not found:', msg.id);
                    }
                } catch (error) {
                    console.error('Error sending video:', error)
                }
            }

            const message = await msg.channel.messages.fetch(msg.id).catch((error) => {
                console.error('Error fetching message:', error);
                return null;
            });
            if (message) {
                try {
                    const file = fs.readFileSync(videoFile);
                    await message.reply({files: [{attachment: file, name: videoFile}]});
                } catch (error) {
                    console.error('Error sending video:', error);
                }
            } else {
                console.error('Message not found:', msg.id);
            }

        }
        if (videoQueue.requests.length === 0) {
            videoQueueState.processing = false;
        }
    } catch (error) {
        console.error('Error generating video:', error);
        await msg.reply('Error generating video. Please try again later.');
        videoQueue.position[msg.author.id] = undefined;
        if (videoQueue.requests.length === 0) {
            videoQueueState.processing = false;
        }
    }
    videoQueue.position[msg.author.id] = undefined;
    videoQueueState.processing = false;
    if (videoQueue.requests.length > 0) {
        await processVideoQueue(prompt);
    }
}

export async function clearVideoQueue() {
    videoQueue.requests = [];
}