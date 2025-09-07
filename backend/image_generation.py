import os
import openai
import requests
import sys  # Add this import
from openai import OpenAI
from dotenv import load_dotenv
from flask import jsonify
from flask import session
from usage.token_usage import check_token_limit, update_token_usage
# Load environment variables
load_dotenv()

IDEOGRAM_API_KEY = os.getenv('IDEOGRAM_API_KEY')
# Force unbuffered output to make prints appear immediately
sys.stdout.reconfigure(line_buffering=True)  # Python 3.7+ only

# Set your OpenAI API key from the environment variable or directly here.
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

# Function to print and immediately flush the output
def debug_print(*args, **kwargs):
    print(*args, **kwargs)
    sys.stdout.flush()  # Force flush output

def get_style_prompt(style):
    """Return prompt modifier based on selected style"""
    style_prompts = {
        "3d-model": "Create a 3D model with detailed textures and realistic lighting.",
        "analog-film": "Create an image with an analog film effect, featuring grain and vintage colors.",
        "anime": "Create an anime-style illustration with characteristic anime features.",
        "cinematic": "Create a cinematic image with dramatic lighting and composition.",
        "comic-book": "Create a comic book style image with bold lines and vibrant colors.",
        "digital-art": "Create a digital art piece with smooth gradients and modern aesthetics.",
        "enhance": "Enhance the image with improved clarity and vivid colors.",
        "fantasy-art": "Create a fantasy art piece with imaginative elements and vibrant colors.",
        "isometric": "Create an isometric image with a 3D perspective and clean lines.",
        "line-art": "Create a line art drawing with clear outlines and minimal shading.",
        "low-poly": "Create a low-poly image with simple geometric shapes and flat colors.",
        "modeling-compound": "Create an image with a modeling compound effect, featuring soft textures.",
        "neon-punk": "Create a neon punk style image with bright neon colors and futuristic elements.",
        "origami": "Create an origami style image with paper-like textures and folds.",
        "photographic": "Create a photographic image with realistic details and lighting.",
        "pixel-art": "Create a pixel art style image with visible pixels and limited color palette.",
        "tile-texture": "Create a tile texture image with repeating patterns and consistent colors."
    }
    return style_prompts.get(style.lower(), "")
#def get_style_prompt(style):
#    """Return prompt modifier based on selected style"""
#    style_prompts = {
#        "realistic": "Create a photorealistic image with natural lighting and textures.",
#        "cartoon": "Create a cartoonish image with bold outlines and vibrant colors.",
#        "anime": "Create an anime-style illustration with characteristic anime features.",
#        "watercolor": "Create a watercolor painting effect with soft edges and translucent colors.",
#        "oil painting": "Create an oil painting with visible brushstrokes and rich textures.",
#        "pixel art": "Create a pixel art style image with visible pixels and limited color palette.",
#        "minimalist": "Create a minimalist image with simple shapes and limited color palette.",
#        "abstract": "Create an abstract artistic representation using shapes, colors, and patterns.",
#        "3d render": "Create a 3D rendered image with realistic lighting and materials.",
#        "sketch": "Create a hand-drawn sketch with pencil/pen lines."
#    }
#    return style_prompts.get(style.lower(), "")

def get_text_position_prompt(position, text):
    """Return prompt modifier for text positioning"""
    position_prompts = {
         "top": f"Place the text '{text}' at the top of the image in a clear, readable font that contrasts with the background.",
        "bottom": f"Place the text '{text}' at the bottom of the image in a clear, readable font that contrasts with the background.",
        "center": f"Place the text '{text}' in the center of the image in a clear, readable font that contrasts with the background.",
        "top-left": f"Place the text '{text}' in the top-left corner of the image in a clear, readable font that contrasts with the background.",
        "top-right": f"Place the text '{text}' in the top-right corner of the image in a clear, readable font that contrasts with the background.",
        "bottom-left": f"Place the text '{text}' in the bottom-left corner of the image in a clear, readable font that contrasts with the background.",
        "bottom-right": f"Place the text '{text}' in the bottom-right corner of the image in a clear, readable font that contrasts with the background.",
    }
    return position_prompts.get(position.lower(), "")

def generate_image_openai(style, text, text_position, prompt):
    # Initialize complete_prompt with the base prompt
    complete_prompt = ""
    
    # Add style modifier
    style_prompt = get_style_prompt(style)
    if style_prompt:
        complete_prompt += f" {style_prompt}"
    
    # Add text positioning if text is provided
    if text:
        text_position_prompt = get_text_position_prompt(text_position, text)
        complete_prompt += f" {text_position_prompt}" 

    # Add the user's prompt at the beginning
    complete_prompt = prompt + " " + complete_prompt


    try:
        response = client.images.generate(
            model="dall-e-3",
            prompt=complete_prompt,
            n=1,
            size="1024x1024"
        )
        image_url = response.data[0].url
        
        # Download the image content
        image_response = requests.get(image_url)
        if image_response.status_code == 200:
            with open("generated_images/output.png", "wb") as f:
                f.write(image_response.content)
            print(f"Image saved as output.png")
            return image_url
        else:
            print("Failed to download image. Status code:", image_response.status_code)
            return None
    except Exception as e:
        print("Error generating image:", e)
        raise



def generate_image_stability(style, text, text_position, prompt, aspect_ratio):

    
        

    complete_prompt = ""

    if text:
        text_position_prompt = get_text_position_prompt(text_position, text)
        complete_prompt += f" {text_position_prompt}" 

    
    complete_prompt = prompt + " " + complete_prompt


    try:
        response = requests.post(
            f"https://api.stability.ai/v2beta/stable-image/generate/ultra",

            headers={
                "authorization": f"Bearer sk-LMnDP90rzV6c4iQ42l3gtpK3N9pumamxFIT4RHqMU0n1Pfg8",
                "accept": "image/*"
            },
            files={"none": ''},
            data={
                "prompt": complete_prompt,
                "output_format": "webp",
                "style_preset": style,
                "aspect_ratio": aspect_ratio,
            },
        )
        
        if response.status_code == 200:
            # Save the image locally with a unique name
            import uuid
            unique_filename = f"output_stability_{uuid.uuid4().hex}.webp"
            image_path = f"./generated_images/{unique_filename}"
            with open(image_path, 'wb') as file:
                file.write(response.content)
            
            # Instead of returning the binary data, return a path or indicator
            # that the image was saved successfully
            return image_path
        else:
            raise Exception(str(response.json()))
        
    except Exception as e:
        print("Error generating image:", e)
        raise

def generate_image_ideogram(style, text, text_position, prompt, aspect_ratio, num_images):
    # Check if user is over token limit
    user_id = session.get('user_id')
    if user_id and check_token_limit(user_id):
        return {
            "success": False,
            "status": "error",
            "error": "Monthly token limit exceeded",
            "message": "You have reached your monthly token usage limit. Please upgrade your plan to continue."
        }
    
    debug_print(f"STARTING IDEOGRAM IMAGE GENERATION: style={style}, text={text}, aspect_ratio={aspect_ratio}, num_images={num_images}")
    
    if aspect_ratio == "1:1":
        aspect_ratio = "ASPECT_1_1"
    elif aspect_ratio == "16:9":
        aspect_ratio = "ASPECT_16_9"
    elif aspect_ratio == "9:16":
        aspect_ratio = "ASPECT_9_16"
    elif aspect_ratio == "2:3":
        aspect_ratio = "ASPECT_2_3"
    elif aspect_ratio == "3:2":
        aspect_ratio = "ASPECT_3_2"
    elif aspect_ratio == "3:4":
        aspect_ratio = "ASPECT_3_4"
    elif aspect_ratio == "4:3":
        aspect_ratio = "ASPECT_4_3"

    debug_print(f"Converted aspect ratio: {aspect_ratio}")

    if style == "RENDER 3D":
        style = "RENDER_3D"
    
    debug_print(f"Converted style: {style}")

    complete_prompt = ""

    if text:
        text_position_prompt = get_text_position_prompt(text_position, text)
        complete_prompt += f" {text_position_prompt}"
        
    complete_prompt = prompt + " " + complete_prompt
    debug_print(f"Complete prompt: {complete_prompt}")
    debug_print(f"Number of images: {num_images}")
    
    try:
        url = "https://api.ideogram.ai/generate"

        payload = { "image_request": {
            "prompt": complete_prompt,
            "aspect_ratio": aspect_ratio,
            "model": "V_2A",
            "magic_prompt_option": "ON",
            "style_type": style,
            "num_images": num_images
        } }
        headers = {
            "Api-Key": IDEOGRAM_API_KEY,
            "Content-Type": "application/json"
        }

        debug_print(f"Sending request to Ideogram API with payload: {payload}")
        response = requests.post(url, json=payload, headers=headers)
        debug_print(f"IDEOGRAM API RESPONSE STATUS: {response.status_code}")
        
        if response.status_code == 200:
            debug_print("IDEOGRAM API SUCCESS - parsing response data")
            image_urls = []
            for data in response.json()["data"]:
                image_url = data["url"]
                unique_filename = f"output_{data['seed']}.webp"
                image_path = f"./generated_images/{unique_filename}"
                # Download the image content
                debug_print(f"Downloading image from URL: {image_url}")
                image_response = requests.get(image_url)
                if image_response.status_code == 200:
                    with open(image_path, 'wb') as file:
                        file.write(image_response.content)
                    image_urls.append(image_url)
                    debug_print(f"Saved image to {image_path}")
                else:
                    debug_print(f"Failed to download image: status {image_response.status_code}")
                    raise Exception({
                        "error": "Failed to download the image",
                        "status": "error",
                        "message": "Unable to save generated image"
                    })
            
            # Update token usage - estimate token usage for image generation
            # Each image costs approximately 1000 tokens
            if user_id:
                estimated_tokens = num_images * 1000
                update_token_usage(user_id, estimated_tokens)
                
            debug_print(f"Successfully generated {len(image_urls)} images")
            debug_print(f"Image URLs: {image_urls}")
            return {
                "status": "success", 
                "imageUrl": image_urls,
                "fullResponse": response.json()
            }
            
        elif response.status_code == 400:
            debug_print("IDEOGRAM API ERROR: Bad request (400)")
            return {
                "error": "Bad request error",
                "status": "error",
                "message": "Please check your input parameters"
            }
        elif response.status_code == 401:
            return {
                "error": "Unauthorized error", 
                "status": "error",
                "message": "Please check your API key"
            }
        elif response.status_code == 422:
            return {
                "error": "Unprocessable entity error",
                "status": "error", 
                "message": "Invalid request format"
            }
        elif response.status_code == 429:
            return {
                "error": "Too many requests error",
                "status": "error",
                "message": "Please try again later"
            }
        else:
            return {
                "error": f"Error {response.status_code}",
                "status": "error",
                "message": str(response.json())
            }

    except Exception as e:
        print("Error generating image:", e)
        raise


if __name__ == "__main__":
    generate_image_stability("neon-punk", "Welcome to cyberpunk city", "top", "Future city with neon lights and flying cars")


#def generate_image_variations(style, text, text_position, prompt):
#    # Initialize complete_prompt with the base prompt
#    complete_prompt = ""
#    
#    # Add style modifier
#    style_prompt = get_style_prompt(style)
#    if style_prompt:
#        complete_prompt += f" {style_prompt}"
#    
#    # Add text positioning if text is provided
#    if text:
#        text_position_prompt = get_text_position_prompt(text_position, text)
#        complete_prompt += f" {text_position_prompt}" 
#
#    # Add the user's prompt at the beginning
#    complete_prompt = prompt + " " + complete_prompt
#
#    complete_prompt = "I NEED to test how the tool works with extremely simple prompts. DO NOT add any detail, just use it AS-IS:" + complete_prompt
#
#    try:
#        response = client.images.generate(
#            model="dall-e-3",
#            prompt=complete_prompt,
#            n=1,
#            size="1024x1024"
#        )
#        image_url = response.data[0].url
#        
#        # Download the image content
#        image_response = requests.get(image_url)
#        if image_response.status_code == 200:
#            with open("output2.png", "wb") as f:
#                f.write(image_response.content)
#            print(f"Image saved as output.png")
#
#            with open("output2.png", "rb") as image_file:
#                response = client.images.create_variation(
#                    model="dall-e-2",
#                    image=image_file,
#                    n=5,  # Request 5 variations
#                    size="1024x1024"
#                )
#                
#            image_urls = [variation.url for variation in response.data]
#            return image_urls
#        
#        else:
#            print("Failed to download image. Status code:", image_response.status_code)
#            return None
#    except Exception as e:
#        print("Error generating image:", e)
#        raise
