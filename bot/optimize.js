import {optimizationStringArray} from "./optimizationStringArray.js";
import {openai} from "./bot.js";

export async function optimize(msg) {
    let prompt = msg.content.replace(/^!(borpaoptimize|optimize|borptimize)\s*/, "");
    let randomIndex = Math.floor(Math.random() * (optimizationStringArray.length - 1))
    prompt = optimizationStringArray[randomIndex] + prompt;
    let completion = await openai.createCompletion({
        model: process.env.OPENAI_MODEL,
        prompt: prompt,
        max_tokens: Number(process.env.CHAT_PROMPT_MAX_TOKENS),
        temperature: Number(process.env.CHAT_TEMPERATURE)
    });
    console.log(optimizationStringArray[randomIndex])
    msg.reply(completion.data.choices[0].text)
}