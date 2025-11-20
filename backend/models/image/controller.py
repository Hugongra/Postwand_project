from .models.flux import FluxModel
from .models.openai import OpenAIModel
from .models.nano_banana import NanoBananaModel
from .models.stability import StabilityModel
import base64
from .models.esrgan import ESRGANModel
edit_models = {
    'flux': FluxModel(),
    'openai': OpenAIModel(),
    'nano_banana': NanoBananaModel(),
}

generate_models = {
    'flux': FluxModel(),
    'openai': OpenAIModel()
}

def edit_image(model, prompt, aspect_ratio, num_images, images):
    return edit_models[model].process_image(prompt, aspect_ratio, num_images, images)

def generate_image(model, prompt, aspect_ratio, num_images):
    return generate_models[model].process_image(prompt, aspect_ratio, num_images)
        
def remove_background(image):
    return StabilityModel().remove_background(image)

def improve_image(image):
    return ESRGANModel().improve_quality(image)




def png_to_base64_uri(image_path):
    with open(image_path, "rb") as image_file:
        encoded = base64.b64encode(image_file.read()).decode("utf-8")
        return f"data:image/png;base64,{encoded}"


def base64_to_png(base64_string, output_path):
    # Remove header if it exists (e.g., data:image/png;base64,)
    if base64_string.startswith("data:image"):
        base64_string = base64_string.split(",")[1]
    
    # Decode and save
    with open(output_path, "wb") as image_file:
        image_file.write(base64.b64decode(base64_string))





  