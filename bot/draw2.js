import {messageQueue, processQueue} from "./processQueue.js";
import {queue} from "./bot.js";

export async function draw2(msg) {
    let prompt = msg.content;
    queue.requests.push(msg);
    queue.position[msg.author.id] = queue.requests.length;
    messageQueue[msg.author.id] = await msg.reply(`Image prompt queued. There are ${queue.requests.length} requests ahead of you.`);
    await processQueue(prompt, 2);
}