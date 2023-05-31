import argparse
import os
import random
import time
import torch
import uuid
import subprocess
from pathlib import Path

from flask import request, jsonify, Flask
from flask_cors import CORS, cross_origin
from modelscope import pipeline
from modelscope.outputs import OutputKeys

app = Flask(__name__)
CORS(app)
print("--> Starting the video generation server. This might take up to two minutes.")

ip_address = "127.0.0.1"
port = 8001

# Load model
# If you have one GPU (with CUDA drivers) this will use it
device = torch.device('cuda:0')
pipe = pipeline('text-to-video-synthesis', 'damo/text-to-video-synthesis', map_location=device)


def generate(prompt: str, seed: int):
    start_time = time.time()
    if seed == -1:
        seed = random.randint(0, 100000)
    torch.manual_seed(seed)
    print("Generating video...")
    video_output = pipe({'text': prompt})[OutputKeys.OUTPUT_VIDEO]
    gen_time = time.time() - start_time

    output_dir = '/app/videos/'
    Path(output_dir).mkdir(parents=True, exist_ok=True)

    # Save
    file_name = str(uuid.uuid4()) + ".mp4"
    mp4_file_path = os.path.join(output_dir, file_name)

    with open(mp4_file_path, 'wb') as f:
        f.write(video_output)

    # Convert to gif
    gif_file_path = convert_to_gif(mp4_file_path)

    # Delete old .mp4
    os.remove(mp4_file_path)

    print(f"Generated video, saved at {gif_file_path}, took {gen_time} seconds")

    return gif_file_path, gen_time


@app.route("/generateVideo", methods=["POST"])
@cross_origin()
def generate_video_api():
    json_data = request.get_json(force=True)
    text_prompt = json_data["text"]

    generated_video = generate(text_prompt, -1)

    print(f"Created video from text prompt [{text_prompt}]")

    response = {'actualOutPath': generated_video[0]}
    return jsonify(response)


@app.route("/", methods=["GET"])
@cross_origin()
def health_check():
    return jsonify(success=True)


def convert_to_gif(mp4_file_path):
    gif_file_path = mp4_file_path[:-4] + ".gif"
    subprocess.run(['ffmpeg', '-i', mp4_file_path, '-vf', 'fps=10,scale=320:-1:flags=lanczos', gif_file_path])
    return gif_file_path


with app.app_context():
    print("--> Video generation server is up and running!")

if __name__ == "__main__":
    app.run(host=ip_address, port=port, debug=False)
