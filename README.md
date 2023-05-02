# borpa

## A hobby project by jocoly.

Stable Diffusion backend server from [saharmor/dalle-playground](https://github.com/saharmor/dalle-playground) hooked up to a Discord bot interface.

The bot takes user prompts for Stable Diffusion image-generation and GPT text-completion and replies with the generated content.

Currently running with SD 2.0 in the backend, and using the text-davinci-003 language model.

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
  
  `!draw2 <PROMPT GOES HERE>`
  -Sends two Stable Diffusion images generated with the prompt that follows the command.
  (Takes twice as long :wink:)

  `!optimize <PROMPT GOES HERE>`
  -Uses the GPT language model to generate a more optimized, descriptive image prompt.

## To run:

| Requirements | Description |
| ----------- | ----------- |
| **An Nvidia CUDA-enabled GPU (not required but dramatically speeds up image processing)** | [Full list of CUDA-enabled GPUs](https://developer.nvidia.com/cuda-gpus) |
| **A valid Discord application token** | [Reactiflux guide on creating a new Discord bot](https://github.com/reactiflux/discord-irc/wiki/Creating-a-discord-bot-&-getting-a-token)<br />Be sure that the bot is added to the intended server and has the 'GuildMessages' intent enabled. |
| **A valid OpenAI API token (required for GPT completion but not needed for Stable Diffusion image generation)** | [OpenAI API Key Manager](https://platform.openai.com/account/api-keys) |
| **Python3 and pip package installer** | **Linux:**<br />`sudo apt upgrade`<br />`sudo apt install python3`<br />`sudo apt install pip`<br />**MacOS:**<br />`brew install python3`<br />`brew install pip`<br />**Windows:**<br />-[Download from python.org and run the installer](https://www.python.org/downloads/)<br />`python get-pip.py` |
| **NodeJS** | **Linux:**<br />`sudo apt upgrade`<br />`sudo apt install node.js`<br />**MacOS:**<br />`brew install node.js`<br />**Windows:**<br />-[Download from nodejs.org and run the installer](https://nodejs.org/en/download) |
| **PyTorch** | [PyTorch installation guide.](https://pytorch.org/get-started/locally/) |


### 1. Clone the repo and navigate to the backend folder. Here, create a file called '.env' and store a path to a local directory.
**This will be where generated images are saved locally.**

`OUTPUT_DIR=/PATH/TO/LOCAL/DIR/`

### 2. Open a terminal window at the project directory and build the backend Docker image.
`cd backend && sudo docker build . -t backend-image`

### 3. Start the backend server using NVIDIA runtime.
**CUDA-enabled GPU required; omit the --runtime arg to use CPU only**

*Be sure to mount the same directory you stored in the '.env' file.*

`sudo docker run --runtime=nvidia -v /PATH/TO/LOCAL/DIR backend-image`

### 4. Copy the backend URL that outputs once the server is loaded.
`http://127.0.0.0.1:3000` or something similar.

### 5. Create a new .env file (yes, another one) in the /bot/ directory; add the following lines and provide your tokens, backend URL and image directory path.
**If CONTAIN_BORPA=true, the bot will only see messages in the channel with the ID provided in DISCORD_CHANNEL_ID**

*You should still provide a DISCORD_CHANNEL_ID even if you do not want the bot contained. This is the channel used for the bot's self-generated images.*

  `TOKEN=SAMPLETOKENrY0cV8.i47CjAau-RHQPqXb1Mk2.nEhe4iUcrGOuegj57zMC`
  
  `BACKEND_URL=http://127.0.0.1:3000/`

  `OUTPUT_DIR=/PATH/TO/LOCAL/DIR/`

  `OPENAI_TOKEN=sk-SAMPLETOKENJFoQkSNEhE5SA3EVji8AjnBpPlfdfj4hs8ljk`

  `OPENAI_MODEL=text-davinci-003`

  `CONTAIN_BORPA=true`

  `DISCORD_CHANNEL_ID=012345678910111213`

  `CHAT_PROMPT_MAX_TOKENS=250`

  `CHAT_TEMPERATURE=0.7`


### 6. Open a new terminal window at the project directory and build the Discord bot image.
`cd bot && sudo docker build . -t bot-image`


### 7. Start the bot.
`sudo docker run -v /PATH/TO/LOCAL/DIR bot-image`

**Don't forget to mount the same local directory that is shared by the backend.**

### The bot should now be online. Type !test to generate a test message.
  
