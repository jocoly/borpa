# borpa

## A hobby project by jocoly.

Stable Diffusion backend server from [saharmor/dalle-playground](https://github.com/saharmor/dalle-playground) hooked up to a Discord bot interface.

The bot takes user prompts for Stable Diffusion image-generation and GPT text-completion and replies with the generated content.

Currently running with SD 2.0 in the backend, and using the text-davinci-003 language model.

Video is generated using the Modelscope text2vid plugin for SD. I borrowed the backend setup from [deforum-art/sd-webui-text2video](https://github.com/deforum-art/sd-webui-text2video)

Provide an OpenAI token for the text completion.

## Supported Commands:
  `!test`
  -Sends a test response to show that the bot is working.

  `!chat <PROMPT GOES HERE>`
  -Sends a GPT text completion generated with the prompt that follows the command.

  `!drawsomething <PROMPT GOES HERE>`
  -The bot creates a prompt, optimizes it, and sends it with a '!draw' command.
  
  `!draw <PROMPT GOES HERE>`
  -Sends a Stable Diffusion image generated with the prompt that follows the command.
  
  `!drawX <PROMPT GOES HERE>`
  -Sends a user-specified number of Stable Diffusion images generated with the prompt that follows the command. (Replace X with an integer)

  `!optimize <PROMPT GOES HERE>`
  -Uses the GPT language model to generate a more optimized, descriptive image prompt.

  `!vid <PROMPT GOES HERE>`
  -Sends a Modelscope text2vid video generated with the prompt that follows the command.

## To run:

| Requirements                                                                                                    | Description                                                                                                                                                                                                                                     |
|-----------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **An Nvidia CUDA-enabled GPU (not required but dramatically speeds up image processing)**                       | [Full list of CUDA-enabled GPUs](https://developer.nvidia.com/cuda-gpus)                                                                                                                                                                        |
| **A valid Discord application token**                                                                           | [Reactiflux guide on creating a new Discord bot](https://github.com/reactiflux/discord-irc/wiki/Creating-a-discord-bot-&-getting-a-token)<br />Be sure that the bot is added to the intended server and has the 'GuildMessages' intent enabled. |
| **A valid OpenAI API token (required for GPT completion but not needed for Stable Diffusion image generation)** | [OpenAI API Key Manager](https://platform.openai.com/account/api-keys)                                                                                                                                                                          |
| **Docker**                                                                                                      | [Download and install from Docker.com](https://docs.docker.com/engine/install/)                                                                                                                                                                 |


### 1. Open a terminal window at the project directory and build the backend Docker image.
`cd backend && docker build . -t backend-image`

### 2. Create a Docker volume named 'images' (this is where images will be saved)
`docker volume create images`

### 3. Start the backend server using NVIDIA runtime.
**CUDA-enabled GPU required; omit the --runtime arg to use CPU only**

*Be sure to mount the Docker volume you just created.*

`docker run --runtime=nvidia --mount source=images,target=/app backend-image`

### 4. Copy the backend URL that outputs once the server is loaded.
`http://174.134.134.45` or something similar.

### 5. Create a new .env file in the /bot/ directory; add the following lines and provide your tokens, backend URL and image directory path.
**If CONTAIN_BORPA=true, the bot will only see messages in the channel with the ID provided in DISCORD_CHANNEL_ID**

*You should still provide a DISCORD_CHANNEL_ID even if you do not want the bot contained. This is the channel used for the bot's self-generated images.*

  `TOKEN=SAMPLETOKENrY0cV8.i47CjAau-RHQPqXb1Mk2.nEhe4iUcrGOuegj57zMC`
  
  `BACKEND_URL=http://127.0.0.1:3000/`

  `OUTPUT_DIR=/app/generated-images/`

  `OPENAI_TOKEN=sk-SAMPLETOKENJFoQkSNEhE5SA3EVji8AjnBpPlfdfj4hs8ljk`

  `OPENAI_MODEL=text-davinci-003`

  `CONTAIN_BORPA=true`

  `DISCORD_CHANNEL_ID=012345678910111213`

  `CHAT_PROMPT_MAX_TOKENS=250`

  `CHAT_TEMPERATURE=0.7`
  
  `MAX_NUM_IMGS=4`
  
  `SELF_DRAW=true`
  
  `SELF_DRAW_INTERVAL_MILLISECONDS=3600000`


### 6. Open a new terminal window at the project directory and build the Discord bot image.
`cd bot && docker build . -t bot-image`


### 7. Start the bot.
*Again, don't forget to mount your volume*

`docker run --mount source=images,target=/app bot-image`

### The bot should now be online. Type !test to generate a test message.
  
