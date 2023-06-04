import base64
import os
import threading
import time
import random
import torch
import uuid
import subprocess
from torch import mps
from pathlib import Path
from io import BytesIO
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
from diffusers import DiffusionPipeline, DPMSolverMultistepScheduler, TextToVideoSDPipeline
from diffusers.utils import export_to_video


ENV_DIR = '../bot/.env'
load_dotenv(ENV_DIR)
app = Flask(__name__)
CORS(app)
print("--> Starting the image and video generation server. This might take up to two minutes.")

ENABLE_STABLE_DIFFUSION = False
if os.getenv("ENABLE_STABLE_DIFFUSION") == 'true':
    ENABLE_STABLE_DIFFUSION = True
ENABLE_TEXT_TO_VIDEO = False
if os.getenv("ENABLE_TEXT_TO_VIDEO") == 'true':
    ENABLE_TEXT_TO_VIDEO = True

backend_address = os.getenv("BACKEND_URL")
image_port = int(os.getenv("IMAGE_PORT"))
video_port = int(os.getenv("VIDEO_PORT"))

negative_prompt = os.getenv("NEGATIVE_PROMPT")


print("CUDA-enabled gpu detected: " + str(torch.cuda.is_available()))
if torch.cuda.is_available():
    device = torch.device('cuda:0')
else:
    device = torch.device('cpu')

# Load image model
if ENABLE_STABLE_DIFFUSION:
    image_pipe = DiffusionPipeline.from_pretrained('stabilityai/stable-diffusion-2-base', torch_dtype=torch.float16, variant="fp16")
    image_pipe.scheduler = DPMSolverMultistepScheduler.from_config(image_pipe.scheduler.config)
    image_pipe = image_pipe.to(device)
    image_pipe.enable_model_cpu_offload()
    image_pipe.enable_vae_slicing()
    image_inference_steps = int(os.getenv("IMAGE_INFERENCE_STEPS"))
    image_guidance_scale = int(os.getenv("IMAGE_GUIDANCE_SCALE"))
    image_width = int(os.getenv("IMAGE_WIDTH"))
    image_height = int(os.getenv("IMAGE_HEIGHT"))

# Load video model
if ENABLE_TEXT_TO_VIDEO:
    video_pipe = TextToVideoSDPipeline.from_pretrained("damo-vilab/text-to-video-ms-1.7b", torch_dtype=torch.float16, variant="fp16")
    video_pipe.scheduler = DPMSolverMultistepScheduler.from_config(video_pipe.scheduler.config)
    video_pipe = video_pipe.to(device)
    video_pipe.enable_model_cpu_offload()
    video_pipe.enable_vae_slicing()
    video_inference_steps = int(os.getenv("VIDEO_INFERENCE_STEPS"))
    num_frames = int(os.getenv("NUM_FRAMES"))
    video_guidance_scale = int(os.getenv("VIDEO_GUIDANCE_SCALE"))
    video_width = int(os.getenv("VIDEO_WIDTH"))
    video_height = int(os.getenv("VIDEO_HEIGHT"))

processing_lock = threading.Lock()


def generate_image(prompt: str, num_images: int):
    start_time = time.time()
    seed = random.randint(0, 100000)
    print("Generating image(s)...")
    if torch.cuda.is_available():
        generator = torch.Generator().manual_seed(seed)
    else:
        if seed != 0:
            generator = torch.Generator(device=device).manual_seed(seed)
        else:
            generator = None
    prompt = [prompt] * num_images
    neg_prompt = [negative_prompt] * num_images
    output = image_pipe(
        prompt=prompt,
        num_inference_steps=image_inference_steps,
        negative_prompt=neg_prompt,
        guidance_scale=image_guidance_scale,
        width=image_width,
        height=image_height,
        generator=generator
    ).images

    output_dir = './output/images/'
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    image_output = []

    for idx in range(num_images):
        image = output[idx]
        image.save(os.path.join(output_dir, f'{idx}.png'), format='png')
        buffered = BytesIO()
        image.save(buffered, format='png')
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


def generate_video(prompt: str, neg_prompt: str, seed: int):
    start_time = time.time()
    print("Generating video...")
    if torch.cuda.is_available():
        generator = torch.Generator(device=device)
    else:
        if seed != 0:
            generator = torch.Generator()
            generator.manual_seed(seed)
        else:
            generator = None

    video_frames = video_pipe(
        prompt,
        num_inference_steps=video_inference_steps,
        num_frames=num_frames,
        negative_prompt=neg_prompt,
        guidance_scale=video_guidance_scale,
        width=video_width,
        height=video_height,
        generator=generator,

    ).frames

    output_dir = './output/videos/'
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    file_name = str(uuid.uuid4()) + '.mp4'
    mp4_file_path = os.path.join(output_dir, file_name)
    export_to_video(video_frames, mp4_file_path)
    gif_file_path = convert_to_gif(mp4_file_path)
    os.remove(mp4_file_path)
    gen_time = time.time() - start_time
    print(f"Generated video, saved at {gif_file_path}, took {gen_time} seconds")

    return gif_file_path


@app.route("/generateVideo", methods=["POST"])
def generate_video_api():
    json_data = request.get_json(force=True)
    text_prompt = json_data["text"]

    with processing_lock:
        generated_video = generate_video(text_prompt, negative_prompt, -1)

    print(f"Created video from text prompt [{text_prompt}]")

    response = {'generatedVideo': generated_video}
    return jsonify(response)


@app.route("/", methods=["GET"])
def health_check():
    return jsonify(success=True)


def convert_to_gif(mp4_file_path):
    gif_file_path = mp4_file_path[:-4] + ".gif"
    subprocess.run(['ffmpeg', '-i', mp4_file_path, '-vf', 'fps=10,scale=320:-1:flags=lanczos', gif_file_path], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
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
