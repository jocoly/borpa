import {openai} from "./bot.js";

export async function chat(msg) {
    let prompt = msg.content.replace(/^!(borpachat|chat)\s*/, "");
    let completion = await openai.createCompletion({
        model: process.env.OPENAI_MODEL,
        prompt: prompt,
        max_tokens: Number(process.env.CHAT_PROMPT_MAX_TOKENS),
        temperature: Number(process.env.CHAT_TEMPERATURE)
    });
    msg.reply(prompt + "\n" + completion.data.choices[0].text);
}