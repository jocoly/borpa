import {videoQueue} from "../bot.js";
import {processVideoQueue, videoMessageQueue} from "../tools/processVideoQueue.js";

export async function txt2vid(msg, processing) {
    let prompt = msg.content
    videoQueue.requests.push(msg);
    videoQueue.position[msg.author.id] = videoQueue.requests.length;
    videoMessageQueue[msg.author.id] = await msg.reply(`Video prompt queued. There are ${videoQueue.requests.length} requests ahead of you.`)
    await processVideoQueue(prompt);
}