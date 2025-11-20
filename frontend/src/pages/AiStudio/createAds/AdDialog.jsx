import UploaderAd from '@components/uploaders/UploaderAd';
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as api from '@services/api/api'
import image1 from '/ad_images/ad1.png';
import image2 from '/ad_images/ad2.png';
import image3 from '/ad_images/ad3.png';
import image4 from '/ad_images/ad4.png';
import image5 from '/ad_images/ad5.png';
import image6 from '/ad_images/ad6.png';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';

const AD_TYPES = [
    { id: 'product', name: 'Product Features', image: image1 },
    { id: 'social_proof', name: 'Social Proof', image: image2 },
    { id: 'before_after', name: 'Before & After', image: image3 },
    { id: 'problem_solution', name: 'Problem Solution', image: image4 },
    { id: 'controversial_question', name: 'Controversial Question', image: image5 },
    { id: 'comparison', name: 'Comparison', image: image6 },
];

const FIELD_CONFIGS = {
    product: [
        { name: 'headline', label: 'Headline', type: 'text', required: true },
        { name: 'features', label: 'Features (comma separated)', type: 'textarea', required: true, isArray: true },
        { name: 'call_to_action', label: 'Call to Action', type: 'text', required: false },
        { name: 'background_description', label: 'Background Description', type: 'textarea', required: true },
    ],
    social_proof: [
        { name: 'review_text', label: 'Review Text', type: 'textarea', required: true },
        { name: 'reviewer_name', label: 'Reviewer Name', type: 'text', required: true },
        { name: 'reviewer_title', label: 'Reviewer Title', type: 'text', required: false },
        { name: 'emotion_tone', label: 'Emotion Tone', type: 'text', required: false },
        { name: 'background_description', label: 'Background Description', type: 'textarea', required: true },
    ],
    before_after: [
        { name: 'headline', label: 'Headline', type: 'text', required: true },
        { name: 'before_state', label: 'Before State', type: 'text', required: false },
        { name: 'after_state', label: 'After State', type: 'text', required: false },
        { name: 'call_to_action', label: 'Call to Action', type: 'text', required: false },
        { name: 'background_description', label: 'Background Description', type: 'textarea', required: true },
    ],
    comparison: [
        { name: 'headline', label: 'Headline', type: 'text', required: true },
        { name: 'competitor_reference', label: 'Competitor Reference', type: 'text', required: false },
        { name: 'key_difference', label: 'Key Difference', type: 'text', required: false },
        { name: 'emotion_tone', label: 'Emotion Tone', type: 'text', required: false },
        { name: 'background_description', label: 'Background Description', type: 'textarea', required: true },
    ],
    problem_solution: [
        { name: 'problem_statement', label: 'Problem Statement', type: 'text', required: true },
        { name: 'solution_headline', label: 'Solution Headline', type: 'text', required: true },
        { name: 'benefit_summary', label: 'Benefits (comma separated)', type: 'textarea', required: true, isArray: true },
        { name: 'call_to_action', label: 'Call to Action', type: 'text', required: false },
        { name: 'emotion_tone', label: 'Emotion Tone', type: 'text', required: false },
        { name: 'background_description', label: 'Background Description', type: 'textarea', required: true },
    ],
    controversial_question: [
        { name: 'question', label: 'Question', type: 'text', required: true },
        { name: 'headline', label: 'Headline', type: 'text', required: true },
        { name: 'call_to_action', label: 'Call to Action', type: 'text', required: false },
        { name: 'emotion_tone', label: 'Emotion Tone', type: 'text', required: false },
        { name: 'background_description', label: 'Background Description', type: 'textarea', required: true },
    ],
};

const AdDialog = ({ closeDialog, onAdGenerated }) => {
const navigate = useNavigate();
const [images, setImages] = useState([undefined, undefined, undefined]);
const [brands, setBrands] = useState([]);
const [selectedBrand, setSelectedBrand] = useState(null);
const [loading, setLoading] = useState(true);
const [step, setStep] = useState(1);
const [selectedAdType, setSelectedAdType] = useState(null);
const [copyData, setCopyData] = useState({});
const [generatingCopy, setGeneratingCopy] = useState(false);
const [generatingAd, setGeneratingAd] = useState(false); 
const handleImageUpload = (newImages) => {
    setImages(newImages);
};

useEffect(() => {
    const fetchBrands = async () => {
        setLoading(true);
        const response = await api.GetBrands();

        if (!response.ok) {
            console.error(`Failed to fetch brands: ${response.status}`);
            setLoading(false);
            return;
        }

        const fetchedBrands = response.data.brands || [];
        setBrands(fetchedBrands);
        
        if (fetchedBrands.length === 1) {
            setSelectedBrand(fetchedBrands[0]);
        }
        
        setLoading(false);
    };

    fetchBrands();
}, []);

const brandImages = selectedBrand?.image_urls || [];

const handleImageClick = (image) => {
    // Find the first empty slot  add to the end
    const newImages = [...images];
    const firstEmptyIndex = newImages.findIndex(img => !img);

    if (firstEmptyIndex !== -1) { newImages[firstEmptyIndex] = image; } 
    else { newImages[newImages.length - 1] = image; }

    setImages(newImages);
};

const handleNext = () => {
    console.log(images);
    setStep((prev) => prev + 1);
};

const handleCopyChange = (fieldName, value, isArray = false) => {
    setCopyData(prev => ({
        ...prev,
        [fieldName]: isArray ? value.split(',').map(s => s.trim()) : value
    }));
};

const handleGenerateWithAI = async () => {
    if (!selectedBrand) return;
    
    setGeneratingCopy(true);
    const response = await api.GenerateAdCopy(selectedAdType, selectedBrand.id);
    if (response.ok) {
        setCopyData(response.data.copy);
    } else { alert('Failed to generate copy. Please try again.') }
    setGeneratingCopy(false);
};

const isStep3Valid = () => {
    const fields = FIELD_CONFIGS[selectedAdType] || [];
    return fields.every(field => {
        if (!field.required) return true;
        const value = copyData[field.name];
        if (field.isArray) {
            return Array.isArray(value) && value.length > 0 && value[0] !== '';
        }
        return value && value.trim() !== '';
    });
};

const handleGenerateAd = async () => {
    if (!selectedBrand || !images[0]) {
        alert('Please select a brand and upload at least one image');
        return;
    }
    
    setGeneratingAd(true);
    
    const formData = new FormData();
    formData.append('ad_type', selectedAdType);
    formData.append('brand_id', selectedBrand.id);
    formData.append('copy_data', JSON.stringify(copyData));
    
    // Get the first image - could be File or URL
    const firstImage = images[0];
    formData.append('image', firstImage);
    const result = await api.CreateAdWithCopy(formData);
        
    if (result.ok) {
        onAdGenerated(result.data.image_url);
        closeDialog();
    } else {
        console.error('Failed to generate ad:', result.data);
        alert('Failed to generate ad. Please try again.');
    }
    setGeneratingAd(false);
};


return (
   <div className="w-full h-full fixed inset-0 bg-gray-400 bg-opacity-30 backdrop-blur-[3px] flex items-center justify-center z-50">
        <div className="relative bg-white rounded-lg p-6 w-[70%] h-[75vh] bg-primary transition-all duration-200 flex flex-col">
     {step === 1 && (     
    <>
        <div className="flex flex-col gap-1 mb-4">
            <div className="flex items-center justify-between">
                <p>Select images from your brand library or upload new ones</p>
                {brands.length > 1 && (
                    <Select value={selectedBrand?.id} onValueChange={(value) => {
                        const brand = brands.find(b => b.id === value);
                        setSelectedBrand(brand);
                    }}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select brand" />
                        </SelectTrigger>
                        <SelectContent>
                            {brands.map((brand) => (
                                <SelectItem key={brand.id} value={brand.id}>
                                    {brand.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </div>
        </div>
        
            <div className="flex flex-1 gap-12 min-h-0">
                {/* Left Panel */}
                <div className="flex-[2] flex flex-col rounded-lg">
                    <UploaderAd
                        images={images}
                        onImagesChange={handleImageUpload}
                        maxImages={3}
                    />
                </div>

                {/* Right Panel */}
                <div className="flex-[4] flex flex-col items-center min-h-0 rounded-lg">
                    {loading ? (
                        <div className="grid grid-cols-3 gap-3 w-full h-full overflow-y-auto" style={{ gridAutoRows: 'calc((100% - 12px) / 2)' }}>
                            {Array.from({ length: 5 }).map((_, index) => (
                                <div
                                    key={index}
                                    className="w-full bg-gray-200 rounded-lg flex items-center justify-center"
                                >
                                </div>
                            ))}
                        </div>
                    ) : brands.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4">
                            <p className="text-gray-600 text-center text-md">You dont have any brands connected, to create ads with your brand assets go to brands and connect a brand</p>
                            <button
                                onClick={() => navigate('/brands')}
                                className="bg-accent text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity text-sm"
                            >
                                Go to Brands
                            </button>
                        </div>
                    ) : !selectedBrand && brands.length > 1 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4">
                            <p className="text-gray-600 text-center text-md">Please select a brand to view images</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-3 w-full h-full overflow-y-auto" style={{ gridAutoRows: 'calc((100% - 12px) / 2)' }}>
                            {brandImages.map((image, index) => (
                                <img
                                    key={index}
                                    src={image}
                                    alt="Brand Image"
                                    onClick={() => handleImageClick(image)}
                                    className="w-full h-full object-cover rounded-lg shadow-md border cursor-pointer hover:opacity-80 transition-opacity"
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <div className="flex justify-between items-center mt-4"> 
                <button onClick={closeDialog} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg" >Back</button>
                <button onClick={handleNext} className="bg-accent text-white px-4 py-2 rounded-lg" >Next</button>
            </div>
            </>
            )}
            {step === 2 && (
            <>
            <div className="flex flex-col gap-4 h-full">
                <p className="text-center">Select an ad type</p>
                
                <div className="grid grid-cols-3 gap-4 flex-1 overflow-auto p-4">
                    {AD_TYPES.map((adType) => (
                        <div
                            key={adType.id}
                            onClick={() => setSelectedAdType(adType.id)}
                            className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                                selectedAdType === adType.id 
                                    ? 'border-accent shadow-lg scale-105' 
                                    : 'border-gray-200 hover:border-gray-400'
                            }`}
                        >
                            <img
                                src={adType.image}
                                alt={adType.name}
                                className="w-full h-full object-contain"
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-2 text-center text-sm">
                                {adType.name}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-between items-center"> 
                    <button onClick={() => setStep((prev) => prev - 1)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg">Back</button>
                    <button 
                        onClick={handleNext} 
                        disabled={!selectedAdType}
                        className="bg-accent text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
            </div>
            </>
            )}
            {step === 3 && (
            <>
            <div className="flex flex-col gap-4 h-full">
                <div className="flex justify-between items-center">
                    <p className="text-lg font-semibold">Configure your ad copy</p>
                    <button 
                        onClick={handleGenerateWithAI}
                        disabled={generatingCopy || !selectedBrand}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {generatingCopy ? 'Generating...' : 'Generate with AI'}
                    </button>
                </div>
                
                <div className="flex-1 overflow-auto p-4 space-y-4">
                    {FIELD_CONFIGS[selectedAdType]?.map((field) => (
                        <div key={field.name} className="flex flex-col gap-2">
                            <label className="text-sm font-medium">
                                {field.label} {field.required && <span className="text-red-500">*</span>}
                            </label>
                            {field.type === 'textarea' ? (
                                <textarea
                                    value={field.isArray && Array.isArray(copyData[field.name]) 
                                        ? copyData[field.name].join(', ') 
                                        : copyData[field.name] || ''}
                                    onChange={(e) => handleCopyChange(field.name, e.target.value, field.isArray)}
                                    className="border rounded-lg p-2 min-h-[80px] resize-none"
                                    placeholder={`Enter ${field.label.toLowerCase()}`}
                                />
                            ) : (
                                <input
                                    type="text"
                                    value={copyData[field.name] || ''}
                                    onChange={(e) => handleCopyChange(field.name, e.target.value)}
                                    className="border rounded-lg p-2"
                                    placeholder={`Enter ${field.label.toLowerCase()}`}
                                />
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex justify-between items-center"> 
                    <button 
                        onClick={() => setStep((prev) => prev - 1)} 
                        className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg"
                    >
                        Back
                    </button>
                    <button 
                        onClick={handleGenerateAd}
                        disabled={generatingAd || !isStep3Valid()}
                        className="bg-accent text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {generatingAd ? 'Generating Ad...' : 'Generate Ad'}
                    </button>
                </div>
            </div>
            </>
            )}
        </div>
        </div>
);


};

export default AdDialog;
