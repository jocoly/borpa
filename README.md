# borpa: A Discord bot that generates AI images and text completions based on user-provided prompts.

## A hobby project by jocoly.

## To run:

| Requirements | Description |
| ----------- | ----------- |
| **an Nvidia CUDA-enabled GPU (not required but dramatically speeds up image processing)** | [Full list of CUDA-enabled GPUs](https://developer.nvidia.com/cuda-gpus) |
| **a valid Discord application token** | [Reactiflux guide on creating a new Discord bot](https://github.com/reactiflux/discord-irc/wiki/Creating-a-discord-bot-&-getting-a-token) |
| **a valid OpenAI API token (required for GPT completion but not needed for Stable Diffusion access)** | [OpenAI API Key Manager](https://platform.openai.com/account/api-keys) |
| **Python3 and pip package installer** | **For Linux users:**<br />`sudo apt upgrade`<br />`sudo apt install python3`<br />`sudo apt install pip`<br />**For Mac users:**<br />`brew install python3`<br />`brew install pip`<br />**For Windows users:**<br />-[Download from python.org and run the installer](https://www.python.org/downloads/)<br />`python get-pip.py` |
| **NodeJS** | **For Linux users:**<br />`sudo apt upgrade`<br />`sudo apt install node.js`<br />**For Mac users:**<br />`brew install node.js`<br />**For Windows users:**<br />-[Download from nodejs.org and run the installer](https://nodejs.org/en/download) |
| **PyTorch** | [PyTorch installation guide.](https://pytorch.org/get-started/locally/) |


### 1. Open a terminal window at the project directory and download dependencies.
`cd backend && pip install -r requirements.txt`


### 2. Start the backend server:
`python3 app.py --port 8080 // or your preferred port`

### 3. Copy the backend URL that outputs once the server is loaded.

### 4. Create a new .env file in the /bot/ directory and replace the placeholders below with your access info.

`.env

TOKEN=<YOUR DISCORD APPLICATION TOKEN GOES HERE>

BACKEND_URL=<BACKEND URL GOES HERE>

OUTPUT_DIR=/path/to/image/directory/ // Generated images are saved locally.

OPENAI_TOKEN=<YOUR OPENAI TOKEN GOES HERE> // required for GPT completion but not needed for Stable Diffusion access

OPENAI_MODEL="text-davinci-003" // the default OpenAI language model used if the user does not provide one`


**5. Open a new terminal window at the project directory and start the bot.**
`cd bot && node bot.js`

**The bot should now be online. Type !test to generate a test message.**

## Supported Commands:
  `!test`
  -Sends a test response to show that the bot is working.

  `!borpachat <PROMPT GOES HERE>`
  -Sends a GPT completion generated with the prompt that follows the command.
  
  `!borpadraw <PROMPT GOES HERE>`
  -Sends a Stable Diffusion image generated with the prompt that follows the command.
  
  `!borpadraw2 <PROMPT GOES HERE>`
  -Sends two Stable Diffusion images generated with the prompt that follows the command.
  -Takes twice as long as !borpadraw
  
