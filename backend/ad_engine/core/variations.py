"""Ad layout variations and prompt templates."""

from datetime import datetime
from models.chat.controller import (
    ProductAdCopy,
    SocialProofAdCopy,
    BeforeAfterAdCopy,
    ComparisonAdCopy,
    ControversialAdCopy,
    PainSolutionAdCopy,
)

AD_STRATEGIES = {
    "product": {
        "name": "Feature Spotlight",
        "goal": "Highlight the product's standout features with benefit-driven messaging",
        "approach": "Create a compelling headline showcasing the product category and name. List 3-5 punchy features that solve customer pain points. Use an action-oriented CTA.",
    },
    
    "social_proof": {
        "name": "Social Proof Showcase",
        "goal": "Build trust and credibility through authentic customer testimonials",
        "approach": "Write a short, believable 5-star review highlighting one specific benefit. Make it sound natural and emotionally positive. Include reviewer details to add authenticity.",
    },
    
    "before_after": {
        "name": "Before & After Transformation",
        "goal": "Show clear transformation and results in a specific timeframe",
        "approach": "Create an attention-grabbing headline about the transformation. Describe the 'before' problem state and the 'after' improved state concisely. Use an encouraging CTA.",
    },
    
    "problem_solution": {
        "name": "Problem-Solution",
        "goal": "Identify a relatable pain point and position the product as the solution",
        "approach": "Start with a clear problem statement describing the user's frustration. Follow with a strong solution headline. List 3 short benefit phrases focused on relief and transformation.",
    },
    
    "controversial_question": {
        "name": "Controversial Question",
        "goal": "Grab attention with a bold, thought-provoking question",
        "approach": "Ask a provocative question that challenges assumptions or exposes a pain point. Follow with a bold statement reinforcing the brand's stance. Use a confident CTA.",
    },
    
    "comparison": {
        "name": "Competitive Comparison",
        "goal": "Position the brand as superior to alternatives",
        "approach": "Create a competitive headline positioning the brand as the better solution. Reference the 'old way' or generic competitor approach. Highlight one clear differentiator.",
    },
}

RESPONSE_MODELS = {
    "product": ProductAdCopy,
    "social_proof": SocialProofAdCopy,
    "before_after": BeforeAfterAdCopy,
    "comparison": ComparisonAdCopy,
    "problem_solution": PainSolutionAdCopy,
    "controversial_question": ControversialAdCopy,
}

VARIATIONS = {
    # -------------------------
    # PRODUCT ADS
    # -------------------------
    "product": [
        {
        "name": "Studio Focued Features Arrows",
        "prompt_template": (
           "Create a high-end studio advertisement for {brand_name}. "
    "Show the product being used by a person in a natural setting centered on a clean, minimalist background — with a color from {color_palette}. The background takes the whole space of the image. "
    "Use gentle shadows and natural reflections to emphasize quality and texture. "
    "Headline: '{headline}' in VERY LARGE, VERY BOLD {font} font. Use all caps. The text is placed in the background in a contrast color to the background to differenciate."
    "Display product features clearly around the product **in a precise, technical annotated diagram style**. "
    "**STRICT CONSTRAINT:** Each listed feature must have **EXACTLY ONE** corresponding label and **EXACTLY ONE** arrow. "
    "Each feature label is connected to the product by a **single, clean, gracefully curved line** with a small, solid, round arrowhead. "
    "**ARROWHEAD RULE:** The arrowhead must **PRECISELY point to a specific point on the product's surface** and must **NEVER point to the feature label itself**. The arrowhead must stop just short of touching the product: {features}. "
    "Include a sleek call-to-action button reading '{call_to_action}'. that blends with the background. Place the CTA in the bottom left corner of the image."
    "Keep the focus entirely on the product; avoid clutter. "
    "Use the brand’s color palette: {color_palette}."
        ),
        "font": "geometric sans-serif",
    },
       
    ],

   
}



def get_variation_index(base_date=None, total=11):
    """Cycle variation index based on day of year."""
    base_date = base_date or datetime.now()
    return base_date.timetuple().tm_yday % total

