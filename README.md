# borpa

## A hobby project by jocoly.

I hooked up the Stable Diffusion backend server from [saharmor/dalle-playground](https://github.com/saharmor/dalle-playground) to a Discord bot interface.

The bot takes user prompts for Stable Diffusion image-generation and GPT text-completion and replies with the generated content.

## Supported Commands:
  `!test`
  -Sends a test response to show that the bot is working.

  `!borpachat <PROMPT GOES HERE>`
  -Sends a GPT completion generated with the prompt that follows the command.
  
  `!borpadraw <PROMPT GOES HERE>`
  -Sends a Stable Diffusion image generated with the prompt that follows the command.
  
  `!borpadraw2 <PROMPT GOES HERE>`
  -Sends two Stable Diffusion images generated with the prompt that follows the command.
  (Takes twice as long as !borpadraw)

## To run:

| Requirements | Description |
| ----------- | ----------- |
| **An Nvidia CUDA-enabled GPU (not required but dramatically speeds up image processing)** | [Full list of CUDA-enabled GPUs](https://developer.nvidia.com/cuda-gpus) |
| **A valid Discord application token** | [Reactiflux guide on creating a new Discord bot](https://github.com/reactiflux/discord-irc/wiki/Creating-a-discord-bot-&-getting-a-token)<br />Be sure that the bot is added to the intended server and has the 'GuildMessages' intent enabled. |
| **A valid OpenAI API token (required for GPT completion but not needed for Stable Diffusion access)** | [OpenAI API Key Manager](https://platform.openai.com/account/api-keys) |
| **Python3 and pip package installer** | **Linux:**<br />`sudo apt upgrade`<br />`sudo apt install python3`<br />`sudo apt install pip`<br />**MacOS:**<br />`brew install python3`<br />`brew install pip`<br />**Windows:**<br />-[Download from python.org and run the installer](https://www.python.org/downloads/)<br />`python get-pip.py` |
| **NodeJS** | **Linux:**<br />`sudo apt upgrade`<br />`sudo apt install node.js`<br />**MacOS:**<br />`brew install node.js`<br />**Windows:**<br />-[Download from nodejs.org and run the installer](https://nodejs.org/en/download) |
| **PyTorch** | [PyTorch installation guide.](https://pytorch.org/get-started/locally/) |


### 1. Open a terminal window at the project directory and download dependencies.
`cd backend && pip install -r requirements.txt`


### 2. Start the backend server:
`python3 app.py --port 8080 // or your preferred port`

### 3. Copy the backend URL that outputs once the server is loaded.

### 4. Create a new .env file in the /bot/ directory and replace the placeholders below with your access info.

  .env

  TOKEN=<YOUR DISCORD APPLICATION TOKEN GOES HERE>

  BACKEND_URL=<BACKEND URL GOES HERE>

  OUTPUT_DIR=/path/to/image/directory/ // Generated images are saved locally.

  OPENAI_TOKEN=<YOUR OPENAI TOKEN GOES HERE> // required for GPT completion but not needed for Stable Diffusion access

  OPENAI_MODEL="text-davinci-003" // the default OpenAI language model used if the user does not provide one


### 5. Open a new terminal window at the project directory and start the bot.**
`cd bot && node bot.js`

**The bot should now be online. Type !test to generate a test message.**
  
