from pydantic import BaseModel, Field
from typing import List, Optional


__all__ = [
    'StructuredPost',
    'SocialMediaPost',
    'ContentSuggestion',
    'HeadersTaglines',
    'IndustryType',
    'CompanyDetails',
    'Audience',
    'Tone',
    'ProductFeatures',
    'BrandAnalysis',
    'ProductAdCopy',
    'SocialProofAdCopy',
    'BeforeAfterAdCopy',
    'ComparisonAdCopy',
    'PainSolutionAdCopy',
    'LifestyleAdCopy',
    'ControversialAdCopy',
]


class SocialMediaPost(BaseModel):
    id: int = Field(description="Unique identifier for the post option")
    content: str = Field(description="The main text content without hashtags")
    content_with_hashtags: str = Field(description="Full content including hashtags")
    hashtags: List[str] = Field(description="List of hashtags for this post")
    platform: str = Field(description="Target platform (facebook, instagram, twitter, etc.)")
    tone: Optional[str] = Field(description="Tone of the post (professional, casual, enthusiastic, etc.)", default=None)
    call_to_action: Optional[str] = Field(description="Call to action if included", default=None)


class ContentSuggestion(BaseModel):
    tip: str = Field(description="A tip or suggestion for content improvement")
    category: str = Field(description="Category of the suggestion (engagement, timing, hashtags, etc.)")


class StructuredPost(BaseModel):
    posts: List[SocialMediaPost] = Field(description="List of social media post options")
    suggestions: Optional[List[ContentSuggestion]] = Field(description="Additional tips and suggestions", default=[])
    all_hashtags: List[str] = Field(description="All unique hashtags from all posts")
    summary: Optional[str] = Field(description="Brief summary of the content created", default=None)


class HeadersTaglines(BaseModel):
    main_heading: str = Field(description="Main heading from the website")
    taglines: List[str] = Field(description="5 relevant taglines from the site")


class IndustryType(BaseModel):
    category: str = Field(description="Choose one: SaaS, E-commerce, Agencies, Personal Brands, Local/SMBs")
    subcategory: str = Field(description="Specific industry like beauty, fashion, food, tech, health, finance, education, etc.")


class CompanyDetails(BaseModel):
    company_description: str = Field(description="3-4 sentences describing what the company does, their mission, values, and brand identity")
    headers_taglines: HeadersTaglines
    industry_type: IndustryType


class Audience(BaseModel):
    professions: List[str] = Field(description="Target professions like marketers, content creators, business owners, etc.")
    age_range: str = Field(description="Age range like 25-45")
    gender: str = Field(description="Gender targeting: all, primarily female, primarily male")


class Tone(BaseModel):
    tone_emotion: List[str] = Field(description="3-5 keywords describing tone and emotion like Encouraging, Empowering, Optimistic")
    brand_character: List[str] = Field(description="2-4 keywords describing brand character like Innovative, Supportive, Empowering")
    language_style: List[str] = Field(description="3-5 keywords describing language style like Direct, Conversational, Informal")


class ProductFeatures(BaseModel):
    main_products_services: List[str] = Field(description="5-10 main products or services offered")
    key_features: List[str] = Field(description="5-10 key features of the product/service")
    unique_selling_points: List[str] = Field(description="5-10 unique selling points")
    benefits: List[str] = Field(description="5-10 benefits to the customer")
    pricing_model: str = Field(description="Choose one: subscription, freemium, usage-based, advertising, one-time, custom")


class BrandAnalysis(BaseModel):
    company_details: CompanyDetails
    audience: Audience
    tone: Tone
    product_features: ProductFeatures


# Ad Factory Models

class ProductAdCopy(BaseModel):
    headline: str = Field(description="Highly converting headline based on product USPs and features. NEVER use em dashes, en dashes, or any dashes. Use simple punctuation only.")
    features: List[str] = Field(description="Three to five punchy features or benefits (each 3-5 words MAX) that make the product stand out. Keep extremely short and impactful. NEVER use em dashes, en dashes, or any dashes.")
    call_to_action: Optional[str] = Field(default=None, description="Short, action-oriented CTA such as 'Try it today' or 'Learn more'. NEVER use dashes.")
    background_description: str = Field(description="Clean, realistic background description appropriate for the brand and product (8-15 words MAX). Examples: 'clean white surface with soft shadows', 'natural wood desk with warm lighting', 'soft blurred modern office environment', 'minimal neutral backdrop', 'lifestyle setting with natural light'. Keep simple and avoid complex patterns or artificial graphics.")


class SocialProofAdCopy(BaseModel):
    review_text: str = Field(description="Short, believable 5-star review (1 sentence, 10-15 words MAX) highlighting ONE specific product benefit. Keep it extremely concise and punchy. Sound authentic, natural, and emotionally positive. Example: 'This made knowing what I needed super easy and transparent.' NEVER use em dashes, en dashes, or any dashes. Use simple punctuation only.")
    reviewer_name: str = Field(description="Full name of the reviewer or testimonial author")
    reviewer_title: Optional[str] = Field(default=None, description="Reviewer's professional title or role (optional, 2-3 words MAX)")
    emotion_tone: Optional[str] = Field(default="Grateful, Excited", description="Emotional tone reflected in the testimonial")
    background_description: str = Field(description="Clean, realistic background description appropriate for the brand and product (8-15 words MAX). Examples: 'clean white surface with soft shadows', 'natural wood desk with warm lighting', 'soft blurred modern office environment', 'minimal neutral backdrop', 'lifestyle setting with natural light'. Keep simple and avoid complex patterns or artificial graphics.")


class BeforeAfterAdCopy(BaseModel):
    headline: str = Field(description="Attention-grabbing headline highlighting the Before/After transformation (8-12 words MAX). NEVER use em dashes, en dashes, or any dashes.")
    before_state: Optional[str] = Field(default=None, description="Short description of the user's initial frustration or problem (5-8 words MAX). NEVER use dashes.")
    after_state: Optional[str] = Field(default=None, description="Short description of the user's improved state after using the product (5-8 words MAX). NEVER use dashes.")
    call_to_action: Optional[str] = Field(default=None, description="Encouraging CTA to prompt engagement or purchase (3-5 words MAX). NEVER use dashes.")
    background_description: str = Field(description="Clean, realistic background description appropriate for the brand and product (8-15 words MAX). Examples: 'clean white surface with soft shadows', 'natural wood desk with warm lighting', 'soft blurred modern office environment', 'minimal neutral backdrop', 'lifestyle setting with natural light'. Keep simple and avoid complex patterns or artificial graphics.")


class ComparisonAdCopy(BaseModel):
    headline: str = Field(description="Competitive headline positioning the brand as the superior solution (8-12 words MAX). NEVER use em dashes, en dashes, or any dashes.")
    competitor_reference: Optional[str] = Field(default=None, description="Reference to the generic 'old way' or common competitor approach (5-8 words MAX). NEVER use dashes.")
    key_difference: Optional[str] = Field(default=None, description="One clear differentiator that makes this brand stand out (8-12 words MAX). NEVER use dashes.")
    emotion_tone: Optional[str] = Field(default="Confident, Bold", description="Emotional energy of the comparison ad")
    background_description: str = Field(description="Clean, realistic background description appropriate for the brand and product (8-15 words MAX). Examples: 'clean white surface with soft shadows', 'natural wood desk with warm lighting', 'soft blurred modern office environment', 'minimal neutral backdrop', 'lifestyle setting with natural light'. Keep simple and avoid complex patterns or artificial graphics.")


class PainSolutionAdCopy(BaseModel):
    problem_statement: str = Field(description="One-sentence description of the user's pain point or frustration (8-12 words MAX). NEVER use em dashes, en dashes, or any dashes.")
    solution_headline: str = Field(description="Strong headline showing how the product solves the problem (8-12 words MAX). NEVER use dashes.")
    benefit_summary: List[str] = Field(description="Three short benefit phrases (each 3-5 words MAX) focused on relief and transformation. Keep extremely concise. NEVER use dashes.")
    call_to_action: Optional[str] = Field(default=None, description="Motivating CTA that promises relief or improvement (3-5 words MAX). NEVER use dashes.")
    emotion_tone: Optional[str] = Field(default="Empathetic, Hopeful", description="Emotional tone emphasizing empathy and empowerment")
    background_description: str = Field(description="Clean, realistic background description appropriate for the brand and product (8-15 words MAX). Examples: 'clean white surface with soft shadows', 'natural wood desk with warm lighting', 'soft blurred modern office environment', 'minimal neutral backdrop', 'lifestyle setting with natural light'. Keep simple and avoid complex patterns or artificial graphics.")


class LifestyleAdCopy(BaseModel):
    headline: str = Field(description="Emotionally-driven headline reflecting lifestyle aspiration or identity (8-12 words MAX). NEVER use em dashes, en dashes, or any dashes.")
    aspirational_quote: Optional[str] = Field(default=None, description="Inspirational quote or line connecting product to lifestyle (10-15 words MAX). NEVER use dashes.")
    scenario_description: Optional[str] = Field(default=None, description="Brief description of a lifestyle moment or visual scene (8-12 words MAX). NEVER use dashes.")
    emotion_tone: Optional[str] = Field(default="Inspiring, Warm, Aspirational", description="Emotional tone of the lifestyle ad")
    call_to_action: Optional[str] = Field(default=None, description="CTA aligned with lifestyle transformation (3-5 words MAX), e.g. 'Join the movement'. NEVER use dashes.")

class ControversialAdCopy(BaseModel):
    question: str = Field(description="Provocative, curiosity-driven question that challenges assumptions or exposes a pain point (8-12 words MAX). NEVER use em dashes, en dashes, or any dashes.")
    headline: str = Field(description="Bold statement or follow-up line that builds on the controversy and reinforces the brand's stance (8-12 words MAX). NEVER use dashes.")
    call_to_action: Optional[str] = Field(default=None, description="Strong, confident CTA encouraging the reader to take action or learn more (3-5 words MAX). NEVER use dashes.")
    emotion_tone: Optional[str] = Field(default="Challenging, Bold, Thought-provoking", description="Emotional tone of the ad that provokes curiosity or debate")
    background_description: str = Field(description="Clean, realistic background description appropriate for the brand and product (8-15 words MAX). Examples: 'clean white surface with soft shadows', 'natural wood desk with warm lighting', 'soft blurred modern office environment', 'minimal neutral backdrop', 'lifestyle setting with natural light'. Keep simple and avoid complex patterns or artificial graphics.")
