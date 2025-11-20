import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {  Upload, X } from 'lucide-react';
import BrandSkeletonLoader from '@components/skeletons/BrandSkeletonLoader';
import  BrandInput from '@components/BrandInput';
import * as api from '@services/api/api';

const BrandProfile = ({ isOnboarding = false, OnboardingBrandId = null}) => {
    const { brandId: urlBrandId } = useParams();
    const brandId = isOnboarding ? OnboardingBrandId : urlBrandId;
    const navigate = useNavigate();
    const [brandData, setBrandData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editedData, setEditedData] = useState({});
    const [saving, setSaving] = useState(false);
    const [newColorInput, setNewColorInput] = useState('');
    const [newFeatureInput, setNewFeatureInput] = useState('');
    const [newUspInput, setNewUspInput] = useState('');
    const [newBenefitInput, setNewBenefitInput] = useState('');
    const logoInputRef = useRef(null);
    const imageInputRefs = useRef({});
    
    useEffect(() => {
        const fetchBrandData = async () => {
            if (!brandId) {
                setLoading(false);
                return;
            }
       
            setLoading(true);
            const response = await api.GetBrand(brandId);
            
            if (!response.ok) {
                console.error(`Failed to fetch brand: ${response.status}`);
                setLoading(false);
                return;
            }
            setBrandData(response.data.brand);
            setLoading(false);
        
        };

        fetchBrandData();
    }, [brandId]);

    // Helper functions for edit mode
    const handleFieldChange = (path, value) => {
        setEditedData(prev => {
            const newData = { ...prev };
            const keys = path.split('.');
            let current = newData;
            
            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) current[keys[i]] = {};
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
            return newData;
        });
    };

    const getValue = (path) => {
        if (!isEditMode) {
            // In read-only mode, always use brandData
            const keys = path.split('.');
            let value = brandData;
            for (const key of keys) {
                value = value?.[key];
                if (value === undefined) return '';
            }
            return value ?? '';
        }
        
        // In edit mode, check editedData first
        const keys = path.split('.');
        let editedValue = editedData;
        let foundInEdited = true;
        
        for (const key of keys) {
            if (editedValue?.[key] !== undefined) {
                editedValue = editedValue[key];
            } else {
                foundInEdited = false;
                break;
            }
        }
        
        // If found in editedData, return it (even if empty string)
        if (foundInEdited) {
            return editedValue ?? '';
        }
        
        // Otherwise, fallback to brandData
        let originalValue = brandData;
        for (const key of keys) {
            originalValue = originalValue?.[key];
            if (originalValue === undefined) return '';
        }
        
        return originalValue ?? '';
    };

    const handleColorDelete = (index) => {
        const currentColors = getValue('colors.dominant_colors') || brandData?.colors?.dominant_colors || [];
        const newColors = currentColors.filter((_, i) => i !== index);
        handleFieldChange('colors.dominant_colors', newColors);
    };

    const handleColorAdd = () => {
        if (!newColorInput.trim()) return;
        
        // Validate hex color
        const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        let colorValue = newColorInput.trim();
        
        if (!colorValue.startsWith('#')) {
            colorValue = '#' + colorValue;
        }
        
        if (!hexPattern.test(colorValue)) {
            alert('Please enter a valid hex color (e.g., #FF5733 or #F57)');
            return;
        }
        
        const currentColors = getValue('colors.dominant_colors') || brandData?.colors?.dominant_colors || [];
        handleFieldChange('colors.dominant_colors', [...currentColors, colorValue.toLowerCase()]);
        setNewColorInput('');
    };

    const handleArrayItemAdd = (path, value, inputStateSetter) => {
        if (!value.trim()) return;
        
        const currentArray = getValue(path) || brandData?.brand_info?.product_features?.[path.split('.').pop()] || [];
        handleFieldChange(path, [...currentArray, value.trim()]);
        inputStateSetter('');
    };

    const handleArrayItemRemove = (path, index) => {
        const currentArray = getValue(path) || brandData?.brand_info?.product_features?.[path.split('.').pop()] || [];
        const newArray = currentArray.filter((_, i) => i !== index);
        handleFieldChange(path, newArray);
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file');
            return;
        }
        
        setEditedData(prev => ({
            ...prev,
            logoFile: file,
            logoPreview: URL.createObjectURL(file)
        }));
    };

    const handleImageAdd = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        
        const validFiles = files.filter(file => file.type.startsWith('image/'));
        if (validFiles.length === 0) {
            alert('Please upload image files only');
            return;
        }
        
        const currentImages = getValue('image_urls') || brandData?.image_urls || [];
        const newPreviews = validFiles.map(file => URL.createObjectURL(file));
        
        setEditedData(prev => ({
            ...prev,
            newImageFiles: [...(prev.newImageFiles || []), ...validFiles],
            image_urls: [...currentImages, ...newPreviews]
        }));
        
        handleFieldChange('image_urls', [...currentImages, ...newPreviews]);
    };

    const handleImageDelete = (index) => {
        const currentImages = getValue('image_urls') || brandData?.image_urls || [];
        const newImages = currentImages.filter((_, i) => i !== index);
        handleFieldChange('image_urls', newImages);
    };

    const toArray = (value) => {
        if (Array.isArray(value)) return value;
        if (typeof value === 'string') return value.split(', ').filter(t => t.trim());
        return [];
    };

    const handleSaveChanges = async () => {
        setSaving(true);
        try {
            const formData = new FormData();
            
            // Build brand data object
            const brandDataToSend = {
                name: getValue('name') || brandData.name,
                colors: {
                    dominant_colors: getValue('colors.dominant_colors') || brandData?.colors?.dominant_colors || []
                },
                brand_info: {
                    company_details: {
                        company_description: getValue('brand_info.company_details.company_description') || brandData?.brand_info?.company_details?.company_description || '',
                        headers_taglines: {
                            main_heading: getValue('brand_info.company_details.headers_taglines.main_heading') || brandData?.brand_info?.company_details?.headers_taglines?.main_heading || '',
                            taglines: toArray(getValue('brand_info.company_details.headers_taglines.taglines') || brandData?.brand_info?.company_details?.headers_taglines?.taglines)
                        },
                        purpose: getValue('brand_info.company_details.purpose') || brandData?.brand_info?.company_details?.purpose || '',
                        industry_type: {
                            category: getValue('brand_info.company_details.industry_type.category') || brandData?.brand_info?.company_details?.industry_type?.category || '',
                            subcategory: getValue('brand_info.company_details.industry_type.subcategory') || brandData?.brand_info?.company_details?.industry_type?.subcategory || ''
                        }
                    },
                    audience: {
                        professions: toArray(getValue('brand_info.audience.professions') || brandData?.brand_info?.audience?.professions),
                        age_range: getValue('brand_info.audience.age_range') || brandData?.brand_info?.audience?.age_range || '',
                        gender: getValue('brand_info.audience.gender') || brandData?.brand_info?.audience?.gender || ''
                    },
                    tone: {
                        tone_emotion: toArray(getValue('brand_info.tone.tone_emotion') || brandData?.brand_info?.tone?.tone_emotion),
                        brand_character: toArray(getValue('brand_info.tone.brand_character') || brandData?.brand_info?.tone?.brand_character),
                        language_style: toArray(getValue('brand_info.tone.language_style') || brandData?.brand_info?.tone?.language_style)
                    },
                    product_features: {
                        main_products_services: toArray(getValue('brand_info.product_features.main_products_services') || brandData?.brand_info?.product_features?.main_products_services),
                        key_features: getValue('brand_info.product_features.key_features') || brandData?.brand_info?.product_features?.key_features || [],
                        unique_selling_points: getValue('brand_info.product_features.unique_selling_points') || brandData?.brand_info?.product_features?.unique_selling_points || [],
                        benefits: getValue('brand_info.product_features.benefits') || brandData?.brand_info?.product_features?.benefits || [],
                        pricing_model: getValue('brand_info.product_features.pricing_model') || brandData?.brand_info?.product_features?.pricing_model || ''
                    }
                },
                image_urls: getValue('image_urls') || brandData?.image_urls || []
            };
            
            formData.append('brand_data', JSON.stringify(brandDataToSend));
            
            // Add logo file if changed
            if (editedData.logoFile) {
                formData.append('logo', editedData.logoFile);
            }
            
            // Add new image files if any
            if (editedData.newImageFiles && editedData.newImageFiles.length > 0) {
                editedData.newImageFiles.forEach((file, index) => {
                    formData.append(`new_image_${index}`, file);
                });
            }
            
            const response = await api.UpdateBrand(brandId, formData);
            
            if (response.ok) {
                // Refresh brand data
                const refreshResponse = await api.GetBrand(brandId);
                if (refreshResponse.ok) {
                    setBrandData(refreshResponse.data.brand);
                }
                setIsEditMode(false);
                setEditedData({});
                setNewColorInput('');
                setNewFeatureInput('');
                setNewUspInput('');
                setNewBenefitInput('');
            } else {
                alert('Failed to save changes: ' + (response.data?.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error saving changes:', error);
            alert('Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    const handleCancelEdit = () => {
        setIsEditMode(false);
        setEditedData({});
        setNewColorInput('');
        setNewFeatureInput('');
        setNewUspInput('');
        setNewBenefitInput('');
    };
    
    if (loading) return  <BrandSkeletonLoader />
     
    if (!brandData) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <p className="text-gray-600">No brand profile found.</p>
            </div>
        );
    }
    

    // Extract data from the structured format
    const logo_url = brandData.logo_url || "/images/no_photos.png";
    const images = brandData.image_urls || [];
    const palette = brandData.colors?.dominant_colors || [];
    const domain = brandData.domain || "";
    const brand_info = brandData.brand_info || {};

    // Company Details
    const company_details = brand_info?.company_details || {};
    const company_description = company_details?.company_description || "";
    const main_heading = company_details?.headers_taglines?.main_heading || "";
    const taglines = company_details?.headers_taglines?.taglines?.join(", ") || "";  
    const purpose = company_details?.purpose || "";
    const industry_category = company_details?.industry_type?.category || "";
    const industry_subcategory = company_details?.industry_type?.subcategory || "";

    // Audience
    const audience = brand_info?.audience || {};
    const professions = audience?.professions?.join(", ") || "";
    const age_range = audience?.age_range || "";
    const gender = audience?.gender || "";
    
    // Tone
    const tone_data = brand_info?.tone || {};
    const tone = tone_data?.tone_emotion?.join(", ") || "";
    const brand_character = tone_data?.brand_character?.join(", ") || "";
    const language_style = tone_data?.language_style?.join(", ") || "";
    
    // Product Features
    const product_features = brand_info?.product_features || {};
    const main_products = product_features?.main_products_services?.join(", ") || "";
    const key_features = product_features?.key_features || [];
    const unique_selling_points = product_features?.unique_selling_points || [];
    const benefits = product_features?.benefits || [];
    const pricing_model = product_features?.pricing_model || "";
    

    const brandName = brandData.name || domain;
    
    
    return (
        <div>
            <div className="rounded-lg min-h-[80vh] h-auto p-8">
                
                <div className="flex flex-col md:flex-row w-full mx-auto gap-4 h-auto">
                    <div className="space-y-3 w-full md:w-1/2">
                        {/* Brand Details */}
                        
                        <div className="w-full bg-white rounded-lg p-4 shadow space-y-3">
                        <h1 className="text-md font-medium text-gray-700">Brand Details</h1>
                            <BrandInput
                                label="Brand Name"
                                value={isEditMode ? getValue('name') : brandName}
                                onChange={(e) => handleFieldChange('name', e.target.value)}
                                readOnly={!isEditMode}
                            />
    
                            <div className="flex flex-col">
                                <label className="mb-1 text-xs text-gray-700">Company Description</label>
                                <textarea
                                    className="p-4 text-gray-700 h-auto border rounded-lg shadow-sm focus:outline-none focus:border-pink-300 resize-none overflow-hidden text-justify text-sm"
                                    value={isEditMode ? getValue('brand_info.company_details.company_description') : company_description}
                                    onChange={(e) => handleFieldChange('brand_info.company_details.company_description', e.target.value)}
                                    readOnly={!isEditMode}
                                    rows={1}
                                    ref={(textarea) => {
                                        if (textarea) {
                                            textarea.style.height = 'auto';
                                            textarea.style.height = textarea.scrollHeight + 'px';
                                        }
                                    }}
                                />
                            </div>
    
                            <BrandInput
                                label="Main header"
                                value={isEditMode ? getValue('brand_info.company_details.headers_taglines.main_heading') : main_heading}
                                onChange={(e) => handleFieldChange('brand_info.company_details.headers_taglines.main_heading', e.target.value)}
                                readOnly={!isEditMode}
                            />
    
                            <BrandInput
                                label="Taglines"
                                value={isEditMode ? getValue('brand_info.company_details.headers_taglines.taglines') : taglines}
                                onChange={(e) => handleFieldChange('brand_info.company_details.headers_taglines.taglines', e.target.value)}
                                readOnly={!isEditMode}
                            />
    
                            <BrandInput
                                label="Purpose"
                                value={isEditMode ? getValue('brand_info.company_details.purpose') : purpose}
                                onChange={(e) => handleFieldChange('brand_info.company_details.purpose', e.target.value)}
                                readOnly={!isEditMode}
                            />
    
                            <BrandInput
                                label="Category"
                                value={isEditMode ? getValue('brand_info.company_details.industry_type.category') : industry_category}
                                onChange={(e) => handleFieldChange('brand_info.company_details.industry_type.category', e.target.value)}
                                readOnly={!isEditMode}
                            />
    
                            <BrandInput
                                label="Subcategory"
                                value={isEditMode ? getValue('brand_info.company_details.industry_type.subcategory') : industry_subcategory}
                                onChange={(e) => handleFieldChange('brand_info.company_details.industry_type.subcategory', e.target.value)}
                                readOnly={!isEditMode}
                            />
                            </div>
                            <div className="mt-6">
                                
                            <div className="w-full bg-white rounded-lg p-4 shadow space-y-3">
                            <h1 className="text-md font-medium text-gray-700 mb-2">Audience</h1>
                            <BrandInput
                                label="Professions"
                                value={isEditMode ? getValue('brand_info.audience.professions') : professions}
                                onChange={(e) => handleFieldChange('brand_info.audience.professions', e.target.value)}
                                readOnly={!isEditMode}
                            />
    
                            <BrandInput
                                label="Age Range"
                                value={isEditMode ? getValue('brand_info.audience.age_range') : age_range}
                                onChange={(e) => handleFieldChange('brand_info.audience.age_range', e.target.value)}
                                readOnly={!isEditMode}
                            />
    
                            <BrandInput
                                label="Gender"
                                value={isEditMode ? getValue('brand_info.audience.gender') : gender}
                                onChange={(e) => handleFieldChange('brand_info.audience.gender', e.target.value)}
                                readOnly={!isEditMode}
                            />
                            </div>  
                            
                            
                        </div>
    
                        {/* Tone Section */}
                        <div className="mt-6">
                            <div className="w-full bg-white rounded-lg p-4 shadow space-y-3">
                            <h1 className="text-md font-medium text-gray-700 mb-2">Tone</h1>
                                <BrandInput
                                    label="Tone"
                                    value={isEditMode ? getValue('brand_info.tone.tone_emotion') : tone}
                                    onChange={(e) => handleFieldChange('brand_info.tone.tone_emotion', e.target.value)}
                                    readOnly={!isEditMode}
                                />
    
                                <BrandInput
                                    label="Brand Character"
                                    value={isEditMode ? getValue('brand_info.tone.brand_character') : brand_character}
                                    onChange={(e) => handleFieldChange('brand_info.tone.brand_character', e.target.value)}
                                    readOnly={!isEditMode}
                                />
    
                                <BrandInput
                                    label="Language Style"
                                    value={isEditMode ? getValue('brand_info.tone.language_style') : language_style}
                                    onChange={(e) => handleFieldChange('brand_info.tone.language_style', e.target.value)}
                                    readOnly={!isEditMode}
                                />
                            </div>
                        </div>
    
                        {/* Product Features */}
                        <div className="mt-6">
                            <div className="w-full bg-white rounded-lg p-4 shadow space-y-3">
                                <h1 className="text-md font-medium text-gray-700 mb-2">Product Features</h1>
                                {(main_products || isEditMode) && (
                                    <BrandInput
                                        label="Products"
                                        value={isEditMode ? getValue('brand_info.product_features.main_products_services') : main_products}
                                        onChange={(e) => handleFieldChange('brand_info.product_features.main_products_services', e.target.value)}
                                        readOnly={!isEditMode}
                                    />
                                )}
    
                                {((getValue('brand_info.product_features.key_features') || key_features).length > 0 || isEditMode) && (
                                    <div className="flex flex-col">
                                        <label className="mb-1 text-xs text-gray-700">Key Features</label>
                                        <div className="p-2 border rounded-lg shadow-sm min-h-[40px] bg-gray-50">
                                            <div className="flex flex-wrap gap-1">
                                                {(getValue('brand_info.product_features.key_features') || key_features).map((feature, index) => (
                                                    <span
                                                        key={index}
                                                        className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full relative group"
                                                    >
                                                        {feature}
                                                        {isEditMode && (
                                                            <button
                                                                onClick={() => handleArrayItemRemove('brand_info.product_features.key_features', index)}
                                                                className="ml-1 text-blue-900 hover:text-red-600"
                                                            >
                                                                <X size={12} />
                                                            </button>
                                                        )}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        {isEditMode && (
                                            <div className="mt-2 flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Add new feature"
                                                    value={newFeatureInput}
                                                    onChange={(e) => setNewFeatureInput(e.target.value)}
                                                    onKeyPress={(e) => e.key === 'Enter' && handleArrayItemAdd('brand_info.product_features.key_features', newFeatureInput, setNewFeatureInput)}
                                                    className="px-2 py-1.5 text-gray-700 border rounded-lg flex-1 shadow-sm focus:border-pink-300 text-sm"
                                                />
                                                <button
                                                    onClick={() => handleArrayItemAdd('brand_info.product_features.key_features', newFeatureInput, setNewFeatureInput)}
                                                    className="border border-pink-500 font-medium text-pink-500 px-3 py-1.5 rounded-lg text-xs font-medium"
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
    
                                {((getValue('brand_info.product_features.unique_selling_points') || unique_selling_points).length > 0 || isEditMode) && (
                                    <div className="flex flex-col">
                                        <label className="mb-1 text-xs text-gray-700">Unique Selling Points</label>
                                        <div className="p-2 border rounded-lg shadow-sm min-h-[40px] bg-gray-50">
                                            <div className="flex flex-wrap gap-1">
                                                {(getValue('brand_info.product_features.unique_selling_points') || unique_selling_points).map((usp, index) => (
                                                    <span
                                                        key={index}
                                                        className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full relative group"
                                                    >
                                                        {usp}
                                                        {isEditMode && (
                                                            <button
                                                                onClick={() => handleArrayItemRemove('brand_info.product_features.unique_selling_points', index)}
                                                                className="ml-1 text-green-900 hover:text-red-600"
                                                            >
                                                                <X size={12} />
                                                            </button>
                                                        )}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        {isEditMode && (
                                            <div className="mt-2 flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Add new USP"
                                                    value={newUspInput}
                                                    onChange={(e) => setNewUspInput(e.target.value)}
                                                    onKeyPress={(e) => e.key === 'Enter' && handleArrayItemAdd('brand_info.product_features.unique_selling_points', newUspInput, setNewUspInput)}
                                                    className="px-2 py-1.5 text-gray-700 border rounded-lg flex-1 shadow-sm focus:border-pink-300 text-sm"
                                                />
                                                <button
                                                    onClick={() => handleArrayItemAdd('brand_info.product_features.unique_selling_points', newUspInput, setNewUspInput)}
                                                    className="border border-pink-500 font-medium text-pink-500 px-3 py-1.5 rounded-lg text-xs font-medium"
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
    
                                {((getValue('brand_info.product_features.benefits') || benefits).length > 0 || isEditMode) && (
                                    <div className="flex flex-col">
                                        <label className="mb-1 text-xs text-gray-700">Benefits</label>
                                        <div className="p-2 border rounded-lg shadow-sm min-h-[40px] bg-gray-50">
                                            <div className="flex flex-wrap gap-1">
                                                {(getValue('brand_info.product_features.benefits') || benefits).map((benefit, index) => (
                                                    <span
                                                        key={index}
                                                        className="inline-block bg-pink-100 text-pink-800 text-xs px-2 py-1 rounded-full relative group"
                                                    >
                                                        {benefit}
                                                        {isEditMode && (
                                                            <button
                                                                onClick={() => handleArrayItemRemove('brand_info.product_features.benefits', index)}
                                                                className="ml-1 text-pink-900 hover:text-red-600"
                                                            >
                                                                <X size={12} />
                                                            </button>
                                                        )}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        {isEditMode && (
                                            <div className="mt-2 flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Add new benefit"
                                                    value={newBenefitInput}
                                                    onChange={(e) => setNewBenefitInput(e.target.value)}
                                                    onKeyPress={(e) => e.key === 'Enter' && handleArrayItemAdd('brand_info.product_features.benefits', newBenefitInput, setNewBenefitInput)}
                                                    className="px-2 py-1.5 text-gray-700 border rounded-lg flex-1 shadow-sm focus:border-pink-300 text-sm"
                                                />
                                                <button
                                                    onClick={() => handleArrayItemAdd('brand_info.product_features.benefits', newBenefitInput, setNewBenefitInput)}
                                                    className="border border-pink-500 font-medium text-pink-500 px-3 py-1.5 rounded-lg text-xs font-medium"
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
    
                                {(pricing_model || isEditMode) && (
                                    <BrandInput
                                        label="Pricing"
                                        value={isEditMode ? getValue('brand_info.product_features.pricing_model') : pricing_model}
                                        onChange={(e) => handleFieldChange('brand_info.product_features.pricing_model', e.target.value)}
                                        readOnly={!isEditMode}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
    
                    {/* Right Column: Style, Colors, Logo, Images */}
                    <div className="w-full md:w-1/2 mt-6 md:mt-0 space-y-6">
                        <div className="w-full items-center bg-white rounded-lg p-4 shadow">
                            <h1 className="text-md font-medium text-gray-700">Colors</h1>
                            <div className="flex items-center gap-3 mt-6 flex-wrap justify-center md:justify-start">
                                {(getValue('colors.dominant_colors') || palette).length > 0 ? (
                                    (getValue('colors.dominant_colors') || palette).map((color, index) => (
                                        <div key={index} className="flex flex-col items-center relative">
                                            {isEditMode && (
                                                <button
                                                    onClick={() => handleColorDelete(index)}
                                                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600 z-10"
                                                >
                                                    <X size={14} />
                                                </button>
                                            )}
                                            <div
                                                className="rounded-full w-[50px] md:w-[65px] h-[50px] md:h-[65px] border border-gray-200"
                                                style={{ backgroundColor: color }}
                                            ></div>
                                            <span className="text-xs font-medium mt-1">{color.toUpperCase()}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500">No colors detected</p>
                                )}
                            </div>
                            {isEditMode && (
                                <div className="mt-4 flex items-center gap-2">
                                    <input
                                        type="text"
                                        placeholder="Enter hex color (e.g., #FF5733)"
                                        value={newColorInput}
                                        onChange={(e) => setNewColorInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleColorAdd()}
                                        className="px-2 py-1.5 text-gray-700 border rounded-lg flex-1 shadow-sm focus:border-pink-300 text-sm"
                                    />
                                    <button
                                        onClick={handleColorAdd}
                                        className="border border-pink-500 font-medium text-pink-500 px-3 py-1.5 rounded-lg text-xs font-medium"
                                    >
                                        Add Color
                                    </button>
                                </div>
                            )}
                        </div>
    
                        <div className="w-full items-center bg-white rounded-lg p-4 shadow">
                            <div className="flex items-center justify-between">
                                <h1 className="text-md font-medium text-gray-700">Logo</h1>
                                {isEditMode && (
                                    <button
                                        onClick={() => logoInputRef.current?.click()}
                                        className="flex items-center gap-2 border border-pink-500 font-medium text-pink-500 px-3 py-1.5 rounded-lg text-xs font-medium"
                                    >
                                        <Upload size={18} />
                                        Upload Logo
                                    </button>
                                )}
                            </div>
                            <input
                                ref={logoInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleLogoUpload}
                                className="hidden"
                            />
                            <div className="mt-6 flex justify-center md:justify-start">
                                <img
                                    src={editedData.logoPreview || logo_url}
                                    alt="Logo"
                                    className="w-auto h-16 object-contain rounded-lg"
                                    onError={(e) => {
                                        e.target.src = "/images/no_photos.png";
                                    }}
                                />
                            </div>
                        </div>
    
                        <div className="w-full bg-white rounded-lg p-4 shadow">
                            <div className="flex items-center justify-between">
                                <h1 className="text-md font-medium text-gray-700">Images</h1>
                                {isEditMode && (
                                    <button
                                        onClick={() => imageInputRefs.current?.click()}
                                        className="flex items-center gap-2 border border-pink-500 font-medium text-pink-500 px-3 py-1.5 rounded-lg text-xs font-medium"
                                    >
                                        <Upload size={18} />
                                        Add Images
                                    </button>
                                )}
                            </div>
                            <input
                                ref={(el) => (imageInputRefs.current = el)}
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageAdd}
                                className="hidden"
                            />
                            <div className="flex flex-wrap gap-3 mt-6 justify-center">
                                {(getValue('image_urls') || images).length > 0 ? (
                                    (getValue('image_urls') || images).map((img, index) => (
                                        <div key={index} className="relative">
                                            {isEditMode && (
                                                <button
                                                    onClick={() => handleImageDelete(index)}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 z-10"
                                                >
                                                    <X size={16} />
                                                </button>
                                            )}
                                            <img
                                                src={img}
                                                alt={`Brand image ${index + 1}`}
                                                className="w-32 md:w-40 h-auto object-cover rounded-lg shadow"
                                                onError={(e) => {
                                                    e.target.src = "/images/no_photos.png";
                                                }}
                                            />
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500">No images available</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
    
}

export default BrandProfile;
