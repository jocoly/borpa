require("dotenv").config();
const {Client, Events, GatewayIntentBits} = require('discord.js');
const winston = require('winston'); //for logging
const {callDalleService} = require("./backend_api");
const {useState} = require("react");

const [generatedImages, setGeneratedImages] = useState([]);
const [generatedImagesFormat, setGeneratedImagesFormat] = useState('jpeg');

const client = new Client({intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

client.once(Events.ClientReady, c => {
    console.log(`Logged in as ${client.user.tag}.`);
});

client.on(Events.MessageCreate, msg => {
    if (msg.author.id === client.user.id) return;
    //*

    //* commands

    //*

    if (msg.content === "!test") {
        return msg.channel.send("test deez");
    }

    if (msg.content.includes("!borpadraw")){
        let prompt = msg.content.replace(/^!borpadraw /, "");
        console.log('API call to DALL-E web service with the following prompt [' + prompt + ']')
        let apiError= ''
        callDalleService(process.env.BACKEND_URL, prompt, process.env.NUM_IMGS).then((response => {
            setGeneratedImages(response['serverResponse']['generatedImgs'])
            setGeneratedImagesFormat(response['serverResponse']['generatedImgsFormat'])
        }))
        return msg.channel.send(generatedImages)
    }

    //*

    //* commands

    //*

});

client.login(process.env.TOKEN)
