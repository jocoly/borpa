import {optimizationStringArray} from "./optimizationStringArray.js";
import {client, openai} from "../bot.js";

export async function drawSomething(msg) {
    let channelID = ""
    if (!msg) {
        channelID = await client.channels.fetch(process.env.DISCORD_CHANNEL_ID)
    } else {
        channelID = await client.channels.fetch(msg.channelId)
    }
    const prompt = "Come up with a creative, descriptive prompt for an AI generated image for me. It can be anything.";
    let completion = await openai.createCompletion({ // create a prompt
        model: process.env.OPENAI_MODEL,
        prompt: prompt,
        max_tokens: Number(process.env.CHAT_PROMPT_MAX_TOKENS),
        temperature: Number(process.env.CHAT_TEMPERATURE)
    });
    let randomIndex = Math.floor(Math.random() * (optimizationStringArray.length - 1));
    let optimizedPrompt = optimizationStringArray[randomIndex] + completion.data.choices[0].text;
    let optimizedCompletion = await openai.createCompletion({
        model: process.env.OPENAI_MODEL,
        prompt: optimizedPrompt,
        max_tokens: Number(process.env.CHAT_PROMPT_MAX_TOKENS),
        temperature: Number(process.env.CHAT_TEMPERATURE)
    })
    await channelID.send("!draw" + optimizedCompletion.data.choices[0].text)
}