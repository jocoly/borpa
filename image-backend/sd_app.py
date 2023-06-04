import base64
import os
import time
from pathlib import Path
from io import BytesIO
import random
import torch
from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
from diffusers import DiffusionPipeline

app = Flask(__name__)
CORS(app)
print("--> Starting the image generation server. This might take up to two minutes.")

backend_address = "127.0.0.1"
port = 8000

# Load model
print("CUDA-enabled gpu: " + str(torch.cuda.is_available()))
device = torch.device('cuda:0')
pipe = DiffusionPipeline.from_pretrained('stabilityai/stable-diffusion-2-base', torch_dtype=torch.float16)
pipe.to("cuda")
inference_steps = 70


def generate(prompt: str, num_images: int):
    start_time = time.time()
    seed = random.randint(0, 100000)
    torch.manual_seed(seed)
    print("Generating image(s)...")

    image_output = []
    output_dir = './output/images/'
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    prompt = [prompt] * num_images
    generated_images = pipe(prompt, num_inference_steps=inference_steps).images

    for idx in range(num_images):
        img = generated_images[idx]
        img.save(os.path.join(output_dir, f'{idx}.png'), format='png')
        buffered = BytesIO()
        img.save(buffered, format='png')
        img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
        image_output.append(img_str)

    gen_time = time.time() - start_time
    print(f"Created {num_images} images in {gen_time}ms from text prompt {prompt}")
    return image_output


@app.route("/generate", methods=["POST"])
@cross_origin()
def generate_images_api():
    json_data = request.get_json(force=True)
    text_prompt = json_data["text"]
    num_images = json_data["num_images"]

    generated_images = generate(text_prompt, num_images)

    response = {'generatedImgs': generated_images,
                'generatedImgsFormat': 'png'}
    return jsonify(response)


@app.route("/", methods=["GET"])
@cross_origin()
def health_check():
    return jsonify(success=True)


with app.app_context():
    print("--> Image generation server is up and running!")

if __name__ == "__main__":
    app.run(host=backend_address, port=port, debug=False)
