import {messageQueue, processQueue} from "./processQueue.js";
import {queue} from "./bot.js";

const maxNumImgs = Number(process.env.MAX_NUM_IMGS)
export async function drawX(msg, numImgs) {
    let prompt = msg.content;
    if (!msg || !msg.id) {
        await msg.reply('Internal error. Try again later.')
        return;
    }
    if (numImgs > maxNumImgs) {
        await msg.reply(`Too many images requested. Max image prompt size: ` + process.env.MAX_NUM_IMGS)
        return;
    }
    queue.requests.push(msg);
    queue.position[msg.author.id] = queue.requests.length;
    messageQueue[msg.author.id] = await msg.reply(`Image prompt queued. There are ${queue.requests.length} requests ahead of you.`);
    await processQueue(prompt, numImgs);
}