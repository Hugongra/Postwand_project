import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { X } from 'lucide-react';
import * as api from '@services/api/api';

const InputField = ({label, value, onChange, name, placeholder = ""}) => {
    const textareaRef = useRef(null);
    
    const adjustHeight = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    };
    
    useEffect(() => {
        adjustHeight();
    }, [value]);
    
    useEffect(() => {
        adjustHeight();
        const timer = setTimeout(adjustHeight, 0);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div>
            <label className="block text-xs text-gray-700 mb-1">{label}</label>
            <textarea
                ref={textareaRef}
                className="border rounded-lg px-3 py-2 w-full text-justify text-sm resize-none overflow-hidden focus:outline-none focus:border-gray-300"
                name={name}
                value={value}
                onChange={onChange}
                rows={1}
                placeholder={placeholder}
            />
        </div>
    );
};

const EditableTagList = ({label, items, onAdd, onRemove, placeholder = "Add item..."}) => {
    const [newItem, setNewItem] = useState("");

    const handleAdd = () => {
        if (newItem.trim()) {
            onAdd(newItem.trim());
            setNewItem("");
        }
    };

    return (
        <div>
            <label className="block text-xs text-gray-700 mb-1">{label}</label>
            <div className="flex flex-wrap gap-2 mb-2">
                {items.map((item, i) => (
                    <span key={i} className="bg-white shadow border px-3 py-1 rounded-full text-xs flex items-center gap-2">
                        {item}
                        <button onClick={() => onRemove(i)} className="text-gray-600 hover:text-gray-900">×</button>
                    </span>
                ))}
            </div>
            <div className="relative">
                <input
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
                    placeholder={placeholder}
                    className="w-full border rounded-lg px-3 py-2 pr-12 text-sm focus:outline-none"
                />
                <button onClick={handleAdd} className="absolute right-2 top-1/2 -translate-y-1/2 font-medium text-gray-500 hover:text-gray-700 text-sm">
                    Add
                </button>
            </div>
        </div>
    );
};

const ColorPicker = ({colors, onAdd, onRemove}) => {
    const [newColor, setNewColor] = useState("#000000");
    const MAX_COLORS = 5;

    const handleAdd = () => {
        if (colors.length >= MAX_COLORS) {
            alert(`Maximum of ${MAX_COLORS} colors allowed`);
            return;
        }

        // Validate hex color
        const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        let colorValue = newColor.trim();
        
        if (!colorValue.startsWith('#')) {
            colorValue = '#' + colorValue;
        }
        
        if (!hexPattern.test(colorValue)) {
            alert('Please enter a valid hex color (e.g., #FF5733)');
            return;
        }
        
        if (!colors.includes(colorValue.toLowerCase())) {
            onAdd(colorValue.toLowerCase());
            setNewColor("#000000");
        }
    };

    return (
        <div className="w-full bg-white rounded-lg p-4">
            <h2 className="text-md font-medium text-gray-700 mb-4">Colors</h2>
            <div className="flex flex-wrap gap-3 items-start justify-start">
                {colors.length > 0 ? (
                    colors.map((color, i) => (
                        <div key={i} className="flex flex-col items-center relative group">
                            <div className="relative">
                                <div 
                                    className="rounded-full w-[50px] md:w-[65px] h-[50px] md:h-[65px] border border-gray-200"
                                    style={{backgroundColor: color}}
                                />
                                <button 
                                    onClick={() => onRemove(i)} 
                                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white font-medium w-6 h-6 flex items-center justify-center  opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            <span className="text-xs font-medium mt-1">{color.toUpperCase()}</span>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500 text-sm">No colors detected</p>
                )}
            </div>
            {colors.length < MAX_COLORS && (
                <div className="mt-4 flex items-center gap-2">
                    <input
                        type="text"
                        placeholder="Enter hex color (e.g., #FF5733)"
                        value={newColor}
                        onChange={(e) => setNewColor(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
                        className="px-2 py-1.5 text-gray-700 border rounded-lg flex-1 shadow-sm focus:outline-none text-sm"
                    />
                    <button 
                        onClick={handleAdd} 
                        className="text-gray-500 hover:text-gray-700 font-medium text-sm px-3 py-1.5"
                    >
                        Add Color
                    </button>
                </div>
            )}
        </div>
    );
};



const BrandProfile = forwardRef(({ brandId, brandData: initialBrandData }, ref) => {
    const [brandData, setBrandData] = useState(initialBrandData);
    const [editedData, setEditedData] = useState({});
    const [logoUrl, setLogoUrl] = useState("");
    const [fonts, setFonts] = useState([]);
    const [colors, setColors] = useState([]);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const fileInputRef = useRef(null);
    
    useEffect(() => {
        if (initialBrandData) {
            setBrandData(initialBrandData);
        }
    }, [initialBrandData]);

    useEffect(() => {
        if (brandData) {
            const brand_info = brandData.brand_info || {};
            const company_details = brand_info?.company_details || {};
            const audience = brand_info?.audience || {};
            const tone_data = brand_info?.tone || {};
            const product_features = brand_info?.product_features || {};
            
            setEditedData({
                company_description: company_details?.company_description || "",
                main_heading: company_details?.headers_taglines?.main_heading || "",
                taglines: company_details?.headers_taglines?.taglines || [],
                industry_category: company_details?.industry_type?.category || "",
                industry_subcategory: company_details?.industry_type?.subcategory || "",
                professions: audience?.professions?.join(", ") || "",
                age_range: audience?.age_range || "",
                gender: audience?.gender || "",
                tone: tone_data?.tone_emotion?.join(", ") || "",
                brand_character: tone_data?.brand_character?.join(", ") || "",
                language_style: tone_data?.language_style?.join(", ") || "",
                main_products: product_features?.main_products_services || [],
                pricing_model: product_features?.pricing_model || "",
            });
            
            setFonts(company_details?.fonts || []);
            setColors(brandData.colors?.dominant_colors || []);
            setLogoUrl(brandData.logo_url || "/images/no_photos.png");
            setHasUnsavedChanges(false);
        }
    }, [brandData]);

    const handleChange = (e) => {
        setEditedData({...editedData, [e.target.name]: e.target.value});
        setHasUnsavedChanges(true);
    };
    
    const addToList = (field, value) => {
        setEditedData({
            ...editedData,
            [field]: [...(editedData[field] || []), value]
        });
        setHasUnsavedChanges(true);
    };

    const removeFromList = (field, index) => {
        setEditedData({
            ...editedData,
            [field]: editedData[field].filter((_, i) => i !== index)
        });
        setHasUnsavedChanges(true);
    };

    const addFont = (value) => {
        setFonts([...fonts, value]);
        setHasUnsavedChanges(true);
    };

    const removeFont = (index) => {
        setFonts(fonts.filter((_, i) => i !== index));
        setHasUnsavedChanges(true);
    };

    const addColor = (value) => {
        setColors([...colors, value]);
        setHasUnsavedChanges(true);
    };

    const removeColor = (index) => {
        setColors(colors.filter((_, i) => i !== index));
        setHasUnsavedChanges(true);
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) { 
            setLogoUrl(URL.createObjectURL(file));
            setHasUnsavedChanges(true);
        }
        e.target.value = '';
    };

    const saveBrand = async () => {
        const dataToSave = {
            ...editedData,
            fonts: fonts,
            colors: colors
        };
        
        const response = await api.UpdateBrand(brandId, dataToSave);
        if (response.ok) {
            setHasUnsavedChanges(false);
            return true;
        } else {
            alert('Failed to save changes: ' + (response.data?.error || 'Unknown error'));
            return false;
        }
    };

    // Expose saveBrand method and hasUnsavedChanges to parent via ref
    useImperativeHandle(ref, () => ({
        saveBrand,
        hasUnsavedChanges
    }));

    return (
        <div className='bg-primary w-full min-w-[800px] min-h-screen mx-auto'>
            {/* Top Section - Colors and Logo side by side */}
            <div className="grid grid-cols-5 gap-3">
                {/* Colors Section - LEFT */}
                <div className='col-span-3'>
                <ColorPicker 
                    colors={colors} 
                    onAdd={addColor}
                    onRemove={removeColor}
                />
                </div>

                {/* Logo Section - RIGHT */}
                <div className='col-span-2'>
                <div className="bg-white p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-md font-medium text-gray-700">Logo</h2>
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="text-gray-500 hover:text-gray-700 text-xl font-medium"
                        >
                            +
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleLogoChange}
                            className="hidden"
                        />
                    </div>
                    <div className="flex justify-center items-center">
                        <img
                            src={logoUrl}
                            alt="Logo"
                            className="w-auto max-h-20 object-contain rounded-lg"
                            onError={(e) => {
                                e.target.src = "/images/no_photos.png";
                            }}
                        />
                    </div>
                </div>
            </div>
            </div>

            {/* Company Info Section - Full Width */}
            <div className="bg-white p-4 rounded-lg space-y-3 mt-3">
                <h2 className="text-md font-medium text-gray-700 mb-2">Company Info</h2>
                <InputField label="Company Description" name="company_description" value={editedData.company_description || ""} onChange={handleChange} />
                <InputField label="Main Heading" name="main_heading" value={editedData.main_heading || ""} onChange={handleChange} />
                
                <EditableTagList 
                    label="Fonts" 
                    items={fonts} 
                    onAdd={addFont}
                    onRemove={removeFont}
                    placeholder="Add font..."
                />
                
                <EditableTagList 
                    label="Taglines" 
                    items={editedData.taglines || []} 
                    onAdd={(value) => addToList('taglines', value)}
                    onRemove={(index) => removeFromList('taglines', index)}
                    placeholder="Add tagline..."
                />

                <div className="grid grid-cols-2 gap-3">
                    <InputField label="Industry Category" name="industry_category" value={editedData.industry_category || ""} onChange={handleChange} />
                    <InputField label="Industry Subcategory" name="industry_subcategory" value={editedData.industry_subcategory || ""} onChange={handleChange} />
                </div>
            </div>

            {/* Two Column Layout */}
            <div className="flex gap-3 mt-3">
                {/* Left Column */}
                <div className="flex-1 space-y-3">
                    {/* Audience Section */}
                    <div className="bg-white p-4 rounded-lg space-y-3">
                        <h2 className="text-md font-medium text-gray-700 mb-2">Audience</h2>
                        <InputField label="Professions" name="professions" value={editedData.professions || ""} onChange={handleChange} />
                        <div className="grid grid-cols-2 gap-3">
                            <InputField label="Age Range" name="age_range" value={editedData.age_range || ""} onChange={handleChange} />
                            <InputField label="Gender" name="gender" value={editedData.gender || ""} onChange={handleChange} />
                        </div>
                    </div>

                    {/* Product Features Section */}
                    <div className="bg-white p-4 rounded-lg space-y-3">
                        <h2 className="text-md font-medium text-gray-700 mb-2">Product Features</h2>
                        <EditableTagList 
                            label="Main Products" 
                            items={editedData.main_products || []} 
                            onAdd={(value) => addToList('main_products', value)}
                            onRemove={(index) => removeFromList('main_products', index)}
                            placeholder="Add product..."
                        />
                        <InputField label="Pricing Model" name="pricing_model" value={editedData.pricing_model || ""} onChange={handleChange} />
                    </div>
                </div>

                {/* Right Column */}
                <div className="flex-1 space-y-3">
                    {/* Tone Section */}
                    <div className="bg-white p-4 rounded-lg space-y-3">
                        <h2 className="text-md font-medium text-gray-700 mb-2">Tone</h2>
                        <InputField label="Tone" name="tone" value={editedData.tone || ""} onChange={handleChange} />
                        <InputField label="Brand Character" name="brand_character" value={editedData.brand_character || ""} onChange={handleChange} />
                        <InputField label="Language Style" name="language_style" value={editedData.language_style || ""} onChange={handleChange} />
                    </div>
                </div>
            </div>
        </div>
    )
});

export default BrandProfile;