import { useState, useEffect } from 'react';
import BrandSkeletonLoader from '../skeletons/BrandSkeletonLoader';

const Brand = ({ brandName, extractedData }) => {
    const [brandData, setBrandData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        const fetchBrandProfile = async () => {
            try {
                setLoading(true);
                
                // If we have extracted data, use it directly
                if (extractedData) {
                    setBrandData({
                        assets: {
                            logo: extractedData.assets?.logo,
                            images: extractedData.assets?.images || []
                        },
                        colors: extractedData.colors || {},
                        brand_info: extractedData.brand_info || {}
                    });
                    setLoading(false);
                    return;
                }
                
                // Otherwise, fetch from the database
                const url = brandName 
                    ? `https://app.postwand.io/api/brand-profile/${encodeURIComponent(brandName)}`
                    : 'https://app.postwand.io/api/brand-profile';
                
                const response = await fetch(url, {
                    method: 'GET',
                    credentials: 'include',
                });
                
                if (!response.ok) {
                    throw new Error(`Failed to fetch brand profile: ${response.status}`);
                }
                
                const data = await response.json();
                
                if (data.brand_profile) {
                    setBrandData({
                        assets: {
                            logo: data.brand_profile.logo_url,
                            images: data.brand_profile.image_urls || []
                        },
                        colors: data.brand_profile.colors || {},
                        brand_info: data.brand_profile.brand_info || {}
                    });
                }
            } catch (err) {
                console.error('Error fetching brand profile:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        
        fetchBrandProfile();
    }, [brandName, extractedData]);
    
    if (loading) {
        return (
            <>
            
            <BrandSkeletonLoader />
            </>
        );
    }
    
    if (error) {
        return (
            <div className="w-[92%] mx-auto py-6">
                <div className="bg-white rounded-lg p-6 shadow-md border border-pink-100">
                    <div className="flex flex-col items-center text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-pink-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-700 mb-2">Unable to load brand profile</h3>
                        <p className="text-gray-500 mb-4">We encountered a problem while loading your brand data. Please try again.</p>
                        <button 
                            className="px-5 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition-colors duration-200"
                            onClick={() => window.location.reload()}
                        >
                            Refresh
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    
    if (!brandData) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <p className="text-gray-600">No brand profile found.</p>
            </div>
        );
    }
    
    // Extract specific information for display
    const { assets, colors, brand_info } = brandData;
    const logo_url = assets?.logo || "/images/no_photos.png";
    const images = assets?.images || [];
    const palette = colors?.dominant_colors || [];
    
    // Get brand info values or provide defaults
    const main_heading = brand_info?.headers_taglines?.main_heading || "";
    const purpose = brand_info?.purpose || "";
    const audience = brand_info?.audience || {};
    const professions = audience?.professions?.join(", ") || "";
    const industry = audience?.consumer_business_industry || "";
    const tone = brand_info?.tone_emotion?.join(", ") || "";
    const character = brand_info?.brand_character?.join(", ") || "";
    const company_description = brand_info?.company_description || "";
    
    // Get domain name from brand info URL
    const url = brand_info?.url || "";
    const domainMatch = url.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:/\n?]+)/i);
    const domainName = domainMatch ? domainMatch[1] : "";
    
    
    return (
        <div className="flex flex-col md:flex-row w-[92%] mx-auto py-6 gap-4 h-auto">
            <div className="space-y-3 w-full md:w-1/2">
                <h1 className="text-2xl font-medium text-gray-700">Brand Details</h1>
            <div className="w-full bg-white rounded-lg p-4 shadow space-y-3">
                <div className="flex items-center">
                    <label className="mb-1 text-xs w-20 text-gray-700">
                        Brand Name
                    </label>
                    <input 
                        className="p-2 border rounded-md flex-1 shadow-sm focus:border-pink-300" 
                        type="text"
                        value={domainName}
                        readOnly
                    />
                </div>

                <div className="flex flex-col">
    <label className="mb-1 text-xs text-gray-700">
        Company Description
    </label>
    <textarea 
        className="p-2 border rounded-md shadow-sm focus:border-pink-300 resize-none overflow-hidden text-justify" 
        value={company_description}
        readOnly
        rows={1}
        style={{
            height: 'auto',
            minHeight: '40px'
        }}
        ref={(textarea) => {
            if (textarea) {
                textarea.style.height = 'auto';
                textarea.style.height = textarea.scrollHeight + 'px';
            }
        }}
    />
</div>

                <div className="flex items-center">
                    <label className="mb-1 text-xs w-20 text-gray-700">
                        Main header
                    </label>
                    <input 
                        className="p-2 border rounded-md flex-1 shadow-sm focus:border-pink-300" 
                        type="text"
                        value={main_heading}
                        readOnly
                    />
                </div>

                <div className="flex items-center">
                    <label className="mb-1 text-xs w-20 text-gray-700">
                        Purpose
                    </label>
                    <input 
                        className="p-2 border rounded-md flex-1 shadow-sm focus:border-pink-300" 
                        type="text"
                        value={purpose}
                        readOnly
                    />
                </div>

                <div className="flex items-center">
                    <label className="mb-1 text-xs w-20 text-gray-700">
                        Audience
                    </label>
                    <input 
                        className="p-2 border rounded-md flex-1 shadow-sm focus:border-pink-300" 
                        type="text"
                        value={professions}
                        readOnly
                    />
                </div>

                <div className="flex items-center">
                    <label className="mb-1 text-xs w-20 text-gray-700">
                        Industry
                    </label>
                    <input 
                        className="p-2 border rounded-md flex-1 shadow-sm focus:border-pink-300" 
                        type="text"
                        value={industry}
                        readOnly
                    />
                </div>

                <div className="flex items-center">
                    <label className="mb-1 text-xs w-20 text-gray-700">
                        Tone
                    </label>
                    <input 
                        className="p-2 border rounded-md flex-1 shadow-sm focus:border-pink-300" 
                        type="text"
                        value={tone}
                        readOnly
                    />
                </div>

                <div className="flex items-center">
                    <label className="mb-1 text-xs w-20 text-gray-700">
                        Character
                    </label>
                    <input 
                        className="p-2 border rounded-md flex-1 shadow-sm focus:border-pink-300" 
                        type="text"
                        value={character}
                        readOnly
                    />
                </div>
                </div>
            </div>

            <div className="w-full md:w-1/2 mt-6 md:mt-0">
                <h1 className="text-2xl font-medium text-gray-700 mb-2">Style</h1>
                <div className="space-y-3">
                    <div className="w-full items-center bg-white rounded-lg p-4 shadow ">
                        <h1 className="text-xl font-medium text-gray-700">Colors</h1>
                        <div className="flex items-center gap-3 mt-6 flex-wrap justify-center md:justify-start">
                            {palette.length > 0 ? (
                                palette.map((color, index) => (
                                    <div key={index} className="flex flex-col items-center">
                                        <div 
                                            className="rounded-full w-[60px] md:w-[75px] h-[60px] md:h-[75px] border border-gray-200" 
                                            style={{backgroundColor: color}}
                                        ></div>
                                        <span className="text-xs font-medium mt-1">{color.toUpperCase()}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500">No colors detected</p>
                            )}
                        </div>
                    </div>
                    <h1 className="text-2xl font-medium text-gray-700 mb-2">Logo</h1>
                    <div className="w-full items-center bg-white rounded-lg p-4 shadow">
                        
                        <div className="mt-6 flex justify-center md:justify-start">
                            <img 
                                src={logo_url} 
                                alt="Logo" 
                                className="w-auto h-24 object-contain rounded-lg" 
                                onError={(e) => {
                                    e.target.src = "/images/no_photos.png";
                                }}
                            />
                        </div>
                    </div>
                    <h1 className="text-2xl font-medium text-gray-700 mb-2">Images</h1>
                    <div className="w-full bg-white rounded-lg p-4 shadow">
                        <div className="flex flex-wrap gap-3 mt-6 justify-center">
                            {images.length > 0 ? (
                                images.map((img, index) => (
                                    <div key={index} className="relative group">
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
    )
}

export default Brand;
