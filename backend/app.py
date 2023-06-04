import base64
import os
import threading
import time
from pathlib import Path
from io import BytesIO
import random
import torch
import uuid
import subprocess
from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
from diffusers import DiffusionPipeline
from modelscope import pipeline
from modelscope.outputs import OutputKeys

app = Flask(__name__)
CORS(app)
print("--> Starting the image and video generation server. This might take up to two minutes.")

backend_address = "127.0.0.1"
image_port = 8000
video_port = 8001

# Load image model
print("CUDA-enabled gpu: " + str(torch.cuda.is_available()))
device = torch.device('cuda:0')
image_pipe = DiffusionPipeline.from_pretrained('stabilityai/stable-diffusion-2-base', torch_dtype=torch.float16)
image_pipe.to("cuda")
inference_steps = 70

# Load video model
video_pipe = pipeline('text-to-video-synthesis', 'damo/text-to-video-synthesis', map_location=device)

processing_lock = threading.Lock()


def generate_image(prompt: str, num_images: int):
    start_time = time.time()
    seed = random.randint(0, 100000)
    torch.manual_seed(seed)
    print("Generating image(s)...")

    image_output = []
    output_dir = './output/images/'
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    prompt = [prompt] * num_images
    generated_images = image_pipe(prompt, num_inference_steps=inference_steps).images

    for idx in range(num_images):
        img = generated_images[idx]
        img.save(os.path.join(output_dir, f'{idx}.png'), format='png')
        buffered = BytesIO()
        img.save(buffered, format='png')
        img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
        image_output.append(img_str)

    gen_time = time.time() - start_time
    print(f"Created {num_images} images in {gen_time}ms from text prompt [{prompt[0]}]")
    return image_output


@app.route("/generateImage", methods=["POST"])
def generate_images_api():
    json_data = request.get_json(force=True)
    text_prompt = json_data["text"]
    num_images = json_data["num_images"]

    with processing_lock:
        generated_images = generate_image(text_prompt, num_images)

    response = {'generatedImgs': generated_images,
                'generatedImgsFormat': 'png'}
    return jsonify(response)


def generate_video(prompt: str, seed: int):
    start_time = time.time()
    if seed == -1:
        seed = random.randint(0, 100000)
    torch.manual_seed(seed)
    print("Generating video...")
    video_output = video_pipe({'text': prompt})[OutputKeys.OUTPUT_VIDEO]
    gen_time = time.time() - start_time

    output_dir = './output/videos'
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
def generate_video_api():
    json_data = request.get_json(force=True)
    text_prompt = json_data["text"]

    with processing_lock:
        generated_video = generate_video(text_prompt, -1)

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


def run_flask_app(port):
    app.run(host=backend_address, port=port, debug=False)


with app.app_context():
    print("--> Image and video generation server is up and running!")

if __name__ == "__main__":
    image_thread = threading.Thread(target=run_flask_app, args=(image_port,))
    video_thread = threading.Thread(target=run_flask_app, args=(video_port,))

    image_thread.start()
    video_thread.start()
