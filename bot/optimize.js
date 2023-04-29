import {ActionRowBuilder, ButtonBuilder, ButtonStyle} from "discord.js";
import {optimizationStringArray} from "./optimizationStringArray.js";
import {client, openai} from "./bot.js";
import {commands, prefixes} from "./commands.js";

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

    const draw = new ButtonBuilder().setCustomId('draw').setLabel('Draw this').setStyle(ButtonStyle.Success);
    const cancel = new ButtonBuilder().setCustomId('cancel').setLabel('Cancel').setStyle(ButtonStyle.Danger);
    const row = new ActionRowBuilder().addComponents(draw, cancel);

    const reply = await msg.reply({
        content: completion.data.choices[0].text,
        components: [row],
    })

    const filter = (interaction) => {
        // Check if the interaction is from the user who received the reply
        return interaction.customId === 'draw' || interaction.customId === 'cancel' && interaction.user.id === msg.author.id;
    };

    const collector = reply.createMessageComponentCollector({filter, time: 15000});

    collector.on('collect', async (interaction) => {
        if(!interaction.isButton()) return;

        if (interaction.customId === 'draw') {
            await msg.channel.send(prefixes.std+commands.draw+" "+completion.data.choices[0].text);
            await interaction.update({
                content: 'Submitting prompt...',
                components: []
            });
        }
        else if (interaction.customId === 'cancel') {
            await interaction.update({
                content: 'Canceled.',
                components: []
            });
        }
        collector.stop();
    })

    collector.on('end', async (collected) => {
        // Disable the buttons after the collector ends
        if (collected.size === 0) {
            await reply.edit({
                components: [],
            });
        }
    });
}