from diffusers import DiffusionPipeline, DPMSolverMultistepScheduler
import torch
import os
from dotenv import load_dotenv

load_dotenv()
inference_steps = os.getenv("INFERENCE_STEPS")

class StableDiffusionWrapper:
    def __init__(self) -> None:
        repo_id = "stabilityai/stable-diffusion-2-base"
        pipe = DiffusionPipeline.from_pretrained(
            repo_id, revision="fp16",
            torch_dtype=torch.float16
        )

        pipe.scheduler = DPMSolverMultistepScheduler.from_config(
            pipe.scheduler.config)
        self.pipe = pipe.to("cuda")

            
    def generate_images(self, text_prompt: str, num_images: int):
        prompt = [text_prompt] * num_images
        images = self.pipe(prompt, num_inference_steps=inference_steps).images
        return images
