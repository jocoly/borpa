# borpa

## Beta Release: Modelscope Text-to-Video

Type !video \<prompt\> for a 2-second video.

https://github.com/jocoly/borpa/assets/62028785/30894c88-3fad-4413-b6ab-09b228b4729a

## A hobby project by jocoly.

A Discord bot that facilitates an AI sandbox in your server.

Everything here is locally-hosted EXCEPT text-based functions. (GPT text models are relatively cheap and far-better than locally-hosted LLM solutions presently.)

I made this because other options were not what I wanted or were prohibitively expensive with regard to API access/tokens.

### Built on:

-[Stable Diffusion 2](https://github.com/Stability-AI/stablediffusion) for image generation

-[Modelscope text-to-video](https://huggingface.co/spaces/damo-vilab/modelscope-text-to-video-synthesis) for video generation

-[OpenAI](https://platform.openai.com/account/api-keys) (gpt/text-davinci-003) for text completion.

## Supported Commands:

  `!test`
  -Sends a test response to show that the bot is working.

  `!chat <PROMPT GOES HERE>`
  -Sends a GPT text completion generated with the prompt that follows the command.

  `!drawsomething`
  -The bot creates a prompt, optimizes it, and sends it with a '!draw' command.

  `!animatesomething`
  --The bot creates a prompt, optimizes it, and sends it with a '!video' command.
  
  `!draw <PROMPT GOES HERE>`
  -Sends a Stable Diffusion image generated with the prompt that follows the command.
  
  `!drawX <PROMPT GOES HERE>`
  -Sends a user-specified number of Stable Diffusion images generated with the prompt that follows the command. (Replace X with an integer)

  `!optimize <PROMPT GOES HERE>`
  -Uses the GPT language model to generate a more optimized, descriptive image prompt.

  `!video <PROMPT GOES HERE>`
  -Sends a Modelscope text-to-vid video generated with the prompt that follows the command.

## To run:

| Requirements                                                                                                                    | Description                                                                                                                                                                                                                                     |
|---------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **An Nvidia CUDA-enabled GPU (not required for images but dramatically speeds up image processing; mandatory for text-to-vid)** | [Full list of CUDA-enabled GPUs](https://developer.nvidia.com/cuda-gpus)                                                                                                                                                                        |
| **16GB of VRAM if you want to use text-to-video**                                                                               | TODO: Low-VRAM or CPU options                                                                                                                                                                                                                   |
| **A valid Discord application token**                                                                                           | [Reactiflux guide on creating a new Discord bot](https://github.com/reactiflux/discord-irc/wiki/Creating-a-discord-bot-&-getting-a-token)<br />Be sure that the bot is added to the intended server and has the 'GuildMessages' intent enabled. |
| **A valid OpenAI API token (required for GPT completion but not needed for Stable Diffusion image generation)**                 | [OpenAI API Key Manager](https://platform.openai.com/account/api-keys)                                                                                                                                                                          |                                                                                                                                                         |


### 1. Install Python (3.7 or newer)

[python.org](https://www.python.org/downloads/)

### 2. Install NodeJS 18

[nodejs.org](https://nodejs.org/en/download)

### 3. Create a new file called '.env' in the ./bot/ folder and copy the following into it.

Add your Discord and OpenAI tokens.

Tweak the other settings to suit your needs at your own risk.

`DISCORD_TOKEN=<Discord Token goes here>`

`OPENAI_TOKEN=sk-SAMPLETOKENkalspdj2klja4kdfj2l2a2u6iugoiu`

`CONTAIN_BOT=true`

`DISCORD_CHANNEL_ID=<Channel ID for CONTAIN_BOT & SELF_DRAW/ANIMATE>`

`BACKEND_URL=127.0.0.1`

`IMAGE_PORT=8000`

`VIDEO_PORT=8001`

`DELETE_AFTER_SENDING=true`

`IMAGE_INFERENCE_STEPS=70`

`MAX_NUM_IMGS=4`

`IMAGE_GUIDANCE_SCAL=16`

`IMAGE_WIDTH=512`

`IMAGE_HEIGHT=512`

`VIDEO_INFERENCE_STEPS=70`

`NUM_FRAMES=20`

`VIDEO_GUIDANCE_SCALE=16`

`VIDEO_WIDTH=256`

`VIDEO_HEIGHT=256`

`SELF_DRAW=true`

`SELF_DRAW_INTERVAL_MILLISECONDS=3600000`

`SELF_ANIMATE=true`

`SELF_ANIMATE_INTERVAL_MILLISECONDS=3600000`

`OPENAI_MODEL=text-davinci-003`

`CHAT_PROMPT_MAX_TOKENS=250`

`CHAT_TEMPERATURE=0.7`


### 4. Install the requirements and video models if you want to use text-to-vid

`./backend/install.sh`

or just `pip install -r requirements.txt` if you just want the image service.

Sometimes the video model download crashes on the download host's end; just try again if it does.

### 5. Start the backend server (This takes a while if models aren't downloaded.)

`cd backend && python3 app.py`

### 6. In a new terminal window, start the bot.
`cd bot && node bot.js`

### The bot should now be online. Type !test to generate a test message.
  
### FAQ

- Images save to ./backend/output/images/ by default.

- Videos save as gifs (so Discord properly displays them on mobile) to ./backend/output/videos/ by default.

- `CONTAIN_BOT` will make the bot ignore messages that aren't in the channel matching the provided channel id.

- `SELF_DRAW` and `SELF_ANIMATE` will make the bot generate its own image/video in the provided channel on the interval provided below. If you don't provide a channel ID, set this to false.

### TODO:

- Low-vram video alternative

