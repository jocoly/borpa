
import base64
import os
import time
from pathlib import Path
from io import BytesIO
from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
from stable_diffusion_wrapper import StableDiffusionWrapper

app = Flask(__name__)
CORS(app)
print("--> Starting the image generation server. This might take up to two minutes.")

stable_diff_model = None

ip_address = os.getenv("BACKEND_URL")


@app.route("/generate", methods=["POST"])
@cross_origin()
def generate_images_api():
    start_time = time.time()
    json_data = request.get_json(force=True)
    text_prompt = json_data["text"]
    num_images = json_data["num_images"]
    print("Generating image(s)...")
    generated_imgs = stable_diff_model.generate_images(text_prompt, num_images)
    gen_time = time.time() - start_time

    returned_generated_images = []
    output_dir = '/app/images/'
    Path(output_dir).mkdir(parents=True, exist_ok=True)

    for idx, img in enumerate(generated_imgs):
        img.save(os.path.join(output_dir, f'{idx}.png'), format='png')
        buffered = BytesIO()
        img.save(buffered, format='png')
        img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
        returned_generated_images.append(img_str)

    print(f"Created {num_images} images from text prompt [{text_prompt}]")

    response = {'generatedImgs': returned_generated_images,
                'generatedImgsFormat': args.img_format}
    return jsonify(response)


@app.route("/", methods=["GET"])
@cross_origin()
def health_check():
    return jsonify(success=True)


with app.app_context():
    stable_diff_model = StableDiffusionWrapper()
    print("--> Image generation server is up and running!")

if __name__ == "__main__":
    app.run(host=ip_address, port=8000, debug=False)
