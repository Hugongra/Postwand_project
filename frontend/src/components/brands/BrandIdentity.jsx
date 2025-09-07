import { Plus, Globe, X, ArrowLeft, Ellipsis, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";

import FacebookAuth from '../auth/FacebookAuth';
import Brand from './Brand'; // Import the Brand component
import { useLocation } from "react-router-dom"; // Add this import
import Lottie from "lottie-react";
import { useTranslation } from 'react-i18next';



const BrandStyle = ({ facebookData, instagramData, threadsData }) => {
    const { t } = useTranslation();
    const [showDialog, setShowDialog] = useState(false);
    const [showConnectDialog, setShowConnectDialog] = useState(false);
    const [dialogAnimation, setDialogAnimation] = useState(false);
    const [connectDialogAnimation, setConnectDialogAnimation] = useState(false);
    const [websiteUrl, setWebsiteUrl] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [brandData, setBrandData] = useState(null);
    const [extractionError, setExtractionError] = useState(null);
    
    // Loading step states
    const [loadingStep, setLoadingStep] = useState("");
    const [extractionComplete, setExtractionComplete] = useState(false);
    
    // New states for available brands
    const [availableBrands, setAvailableBrands] = useState([]);
    const [selectedBrand, setSelectedBrand] = useState(null);
    const [selectedBrandName, setSelectedBrandName] = useState(null);
    const [loadingBrands, setLoadingBrands] = useState(true);
    
    // Add state for storing extracted brand data
    const [extractedBrandData, setExtractedBrandData] = useState(null);
    
    // Add state for delete functionality
    const [menuOpenForBrand, setMenuOpenForBrand] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [brandToDelete, setBrandToDelete] = useState(null);
    
    const location = useLocation(); // Add this line
    
    // Add state for the JSON data
    const [colorPalette, setColorPalette] = useState(null);
    const [brandIcon, setBrandIcon] = useState(null);
    const [logoIcons, setLogoIcons] = useState(null);
    
    // Add state for detecting mobile screen
    const [isMobile, setIsMobile] = useState(false);
    
    // Load JSON files on component mount
    useEffect(() => {
        const loadJsonFiles = async () => {
            try {
                const colorPaletteModule = await import("/color-palette.json?url");
                const brandIconModule = await import("/brand.json?url");
                const logoIconsModule = await import("/original.json?url");
                
                const colorPaletteData = await fetch(colorPaletteModule.default).then(res => res.json());
                const brandIconData = await fetch(brandIconModule.default).then(res => res.json());
                const logoIconsData = await fetch(logoIconsModule.default).then(res => res.json());
                
                setColorPalette(colorPaletteData);
                setBrandIcon(brandIconData);
                setLogoIcons(logoIconsData);
            } catch (error) {
                console.error("Failed to load JSON files:", error);
            }
        };
        
        loadJsonFiles();
    }, []);
    
    // Extract the fetchAvailableBrands function outside useEffect
    const fetchAvailableBrands = async () => {
        try {
            setLoadingBrands(true);
                    const response = await fetch('https://app.postwand.io/api/brands', {
                method: 'GET',
                credentials: 'include',
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                if (response.status === 401) {
                    console.error("Authentication failed. Please log in again.");
                    // You might want to redirect to login page or show a login prompt
                    throw new Error(`Authentication error: ${errorData.error || "Session expired"}`);
                } else {
                    throw new Error(`Failed to fetch brands: ${response.status} - ${errorData.error || "Unknown error"}`);
                }
            }
            
            const data = await response.json();
            setAvailableBrands(data.brands || []);
        } catch (error) {
            console.error("Failed to fetch brands:", error);
        } finally {
            setLoadingBrands(false);
        }
    };

    // Use the function in useEffect when component mounts
    useEffect(() => {
        fetchAvailableBrands();
    }, []);
    
    // Add this effect to open dialog automatically when navigated from home
    useEffect(() => {
        if (location.state?.openDialog) {
            openDialog();
        }
    }, [location]);
    
    // Handle brand selection
    const handleBrandSelect = (brand) => {
        setSelectedBrand(brand.website_url);
        setSelectedBrandName(brand.name);
        setExtractedBrandData(null); // Clear any previous extracted data
        setExtractionComplete(true);
    };
    
    const openDialog = () => {
        setShowDialog(true);
        setTimeout(() => setDialogAnimation(true), 10);
    };
    
    const closeDialog = () => {
        setDialogAnimation(false);
        setTimeout(() => setShowDialog(false), 300);
    };
    
    const openConnectDialog = () => {
        setShowConnectDialog(true);
        setTimeout(() => setConnectDialogAnimation(true), 10);
    };
    
    const closeConnectDialog = () => {
        setConnectDialogAnimation(false);
        setTimeout(() => setShowConnectDialog(false), 300);
    };
    
    // Check if accounts are connected
    const hasFacebook = facebookData && (facebookData.pages?.length > 0);
    const hasInstagram = instagramData && (instagramData.accounts?.length > 0);
    const hasThreads = !!threadsData;
    
    // Handle successful authentication from FacebookAuth component
    const handleAuthSuccess = (platform, data) => {
        // You can handle the newly connected account data here
        // This data can be used to update the UI or state
        console.log(`${platform} connected:`, data);
        
        // Close the dialog after successful authentication
        closeConnectDialog();
        
        // Refresh the page to show newly connected accounts
        // Or you can update the state more elegantly if you prefer
        window.location.reload();
    };
    
    // Function to handle brand extraction
    const handleBrandExtraction = async () => {
        if (!websiteUrl.trim()) {
            setExtractionError("Please enter a valid website URL");
            return;
        }
        
        setIsLoading(true);
        setExtractionError(null);
        setLoadingStep("Starting brand extraction...");
        
        try {
            setLoadingStep("Extracting logos and images...");
            
            const response = await fetch('https://app.postwand.io/api/extract-brand', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', 
                body: JSON.stringify({ 
                    url: websiteUrl,
                }),
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                if (response.status === 401) {
                    // Handle authentication error
                    const errorMessage = errorData.error || "Authentication failed. Please log in again.";
                    throw new Error(`Authentication error: ${errorMessage}`);
                } else {
                    throw new Error(`Server responded with status: ${response.status} - ${errorData.error || 'Unknown error'}`);
                }
            }
            
            setLoadingStep("Analyzing brand colors...");
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            setLoadingStep("Extracting brand voice and information...");
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Parse the JSON response
            const data = await response.json();
            
            // Store the extracted brand data
            setExtractedBrandData(data);
            setSelectedBrand(websiteUrl);
            
            // Extract a clean brand name from the URL
            let cleanBrandName = websiteUrl;
            try {
                const urlObj = new URL(websiteUrl.startsWith('http') ? websiteUrl : 'https://' + websiteUrl);
                cleanBrandName = urlObj.hostname.replace('www.', '').split('.')[0];
            } catch (e) {
                // Fallback if URL parsing fails
                cleanBrandName = websiteUrl.replace(/^https?:\/\//, '').replace('www.', '').split('.')[0];
            }
            setSelectedBrandName(cleanBrandName.charAt(0).toUpperCase() + cleanBrandName.slice(1));
            
            // Set extraction complete to show the Brand component
            setExtractionComplete(true);
            closeDialog();
            
        } catch (error) {
            console.error("Brand extraction failed:", error);
            setExtractionError(`Failed to extract brand: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Update the handleGoBack function to reuse the fetchAvailableBrands function
    const handleGoBack = () => {
        setSelectedBrand(null);
        setSelectedBrandName(null);
        setExtractedBrandData(null);
        setExtractionComplete(false);
        
        // Refresh the brands list
        fetchAvailableBrands();
    };
    
    // Handle brand deletion
    const handleDeleteBrand = async (brandId) => {
        try {
            setLoadingBrands(true);
            const response = await fetch(`https://localhost:5001/api/brands/${brandId}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            
            if (!response.ok) {
                throw new Error(`Failed to delete brand: ${response.status}`);
            }
            
            // Remove the deleted brand from the available brands
            setAvailableBrands(prevBrands => prevBrands.filter(brand => brand.id !== brandId));
            setShowDeleteConfirm(false);
            setBrandToDelete(null);
        } catch (error) {
            console.error("Failed to delete brand:", error);
        } finally {
            setLoadingBrands(false);
        }
    };
    
    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => {
            setMenuOpenForBrand(null);
        };
        
        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);
    
    // Check if screen is mobile on mount and when window resizes
    useEffect(() => {
        const checkIfMobile = () => {
            setIsMobile(window.innerWidth < 768); // Common breakpoint for mobile
        };
        
        // Initial check
        checkIfMobile();
        
        // Add resize listener
        window.addEventListener('resize', checkIfMobile);
        
        // Clean up
        return () => window.removeEventListener('resize', checkIfMobile);
    }, []);
    
    return ( 
        <div className="w-full py-4 pr-2 mx-auto bg-primary min-h-screen overflow-x-hidden">
            <div className="h-28 flex flex-col p-4 mb-1 rounded-lg bg-gray-100/80 relative">
                <h1 className="text-3xl font-medium text-pink-500">
                    {extractionComplete ? <span className="text-black">{selectedBrandName}</span> : t('brands.brandIdentity')}
                </h1>
                
                <div className="absolute bottom-2 flex items-center justify-end w-full pr-10 gap-2 ">
                    {extractionComplete && (
                        <button 
                            onClick={handleGoBack}
                            className="flex items-center gap-1 bg-gray-200 text-gray-700 border shadow-md px-4 py-1.5 hover:bg-gray-300 rounded-lg font-medium mr-1"
                        >
                            <ArrowLeft size={20} className="inline-block" /> {t('common.back')}
                        </button>
                    )}
                    
                    {!isMobile && (
                        <button 
                            onClick={openDialog}
                            className="flex text-md items-center gap-1 border  px-4 py-1.5 rounded-lg brand-button"
                        >
                            <Plus size={20} className="inline-block" /> {t('brands.newBrandIdentity')}
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-[#FAFBFB] rounded-lg min-h-[80vh] h-auto">
                {extractionComplete ? (
                    <Brand brandName={selectedBrand} extractedData={extractedBrandData} />
                ) : (
                    <div className="flex flex-col gap-4 h-[70%] p-8 lg:p-10 xl:p-16">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center h-full">
                                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-pink-500 mb-4"></div>
                                <h2 className="text-xl font-medium text-gray-700">{loadingStep}</h2>
                                <p className="text-gray-500 mt-2">{t('brands.pleaseWaitWhileWeAnalyzeYourBrand')}</p>
                            </div>
                        ) : (
                            <>
                                {loadingBrands ? (
                                    <div>
                                        <div className="animate-pulse">
                                            <div className="h-6 bg-gray-200 rounded w-48 mb-4 mt-10"></div>
                                        </div>
                                        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 mt-2">
                                            {[...Array(3)].map((_, index) => (
                                                <div 
                                                    key={index}
                                                    className="flex flex-col items-center justify-center h-48 rounded-lg bg-white border shadow-md animate-pulse"
                                                >
                                                    <div className="w-full h-40 bg-gray-200 mb-2"></div>
                                                    <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
                                                </div>
                                            ))}
                                        </div>
                                        
                                        {/* Mobile Add New Brand Button */}
                                        {isMobile && (
                                            <div className="mt-6 flex justify-center">
                                                <div className="w-48 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                                            </div>
                                        )}
                                    </div>
                                ) : availableBrands.length > 0 ? (
                                    <>
                                        <h1 className="text-2xl font-medium text-gray-700">
                                            Brands Identities
                                        </h1>
                                        
                                        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 mt-2">
                                            {availableBrands.map((brand, index) => (
                                                <div 
                                                    key={index}
                                                    className="flex flex-col items-center justify-center h-48 rounded-lg bg-white border shadow-md cursor-pointer hover:shadow-lg transition-all duration-200 relative"
                                                >
                                                    <div 
                                                        className="absolute top-2 right-2 cursor-pointer z-10"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setMenuOpenForBrand(menuOpenForBrand === brand.id ? null : brand.id);
                                                        }}
                                                    >
                                                        <div className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-200">
                                                            <Ellipsis size={18} className="text-gray-500 font-bold" />
                                                        </div>
                                                        
                                                        {menuOpenForBrand === brand.id && (
                                                            <div className="p-1 absolute right-0 mt-1 w-26 bg-white rounded-md shadow-lg border overflow-hidden z-20">
                                                                <div 
                                                                    className="px-4 py-2 text-sm text-black hover:bg-gray-200 flex items-center rounded-md"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setBrandToDelete(brand);
                                                                        setShowDeleteConfirm(true);
                                                                        setMenuOpenForBrand(null);
                                                                    }}
                                                                >
                                                                    <Trash2 size={16} className="mr-2" />
                                                                    Delete
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    <div 
                                                        className="w-full h-full flex flex-col items-center justify-center"
                                                        onClick={() => handleBrandSelect(brand)}
                                                    >
                                                        {brand.logo_url ? (
                                                            <img 
                                                                src={brand.logo_url} 
                                                                alt={brand.name} 
                                                                className="w-full h-20 object-contain bg-gray-200 bg-white p-2" 
                                                            />
                                                        ) : (
                                                            <span className="w-full h-20 flex items-center justify-center text-2xl font-bold text-gray-400">
                                                                {brand.name || 'B'}
                                                            </span>
                                                        )}
                                                        <div className="w-full px-4">
                                                            <span className="text-lg font-medium text-gray-700 truncate max-w-[90%]">
                                                                {brand.name}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        
                                        {/* Mobile Add New Brand Button */}
                                        {isMobile && (
                                            <div className="mt-6 flex justify-center">
                                                <button 
                                                    onClick={openDialog}
                                                    className="flex text-md items-center gap-1 border  px-4 py-1.5 rounded-lg brand-button"
                                                >
                                                    <Plus size={20} className="inline-block" /> {t('brands.newBrandIdentity')}
                                                </button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <h1 className="text-2xl font-bold text-gray-700 mt-10">
                                            {t('brands.startNewBrandTitle')}
                                        </h1>
                                        <p className="text-gray-500">{t('brands.startNewBrandDescription')}</p>
                                        <button 
                                            onClick={openDialog}
                                            className="flex text-md items-center gap-1 border px-4 py-1.5 rounded-lg w-fit brand-button"
                                        >
                                            <Plus size={20} className="inline-block" /> {t('brands.newBrandIdentity')}
                                        </button>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Brand Style Dialog */}
            {showDialog && (
                <div className="fixed inset-0 bg-gray-400 bg-opacity-30 backdrop-blur-[3px] flex items-center justify-center z-50">
                    <div 
                        className={`bg-white rounded-lg w-[95%] max-w-[700px] h-[50vh] min-h-[400px] overflow-y-auto shadow-xl bg-[#FDFDFD] transition-all duration-200 ${
                            dialogAnimation ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
                        }`}
                    >
                        <div className=" p-6 flex justify-between items-center bg-[#FDFDFD] rounded-lg">
                            <h2 className="text-2xl font-medium text-gray-800">{t('brands.createContentBasedOnBrand')}</h2>
                            <button onClick={closeDialog} className="text-gray-500 hover:text-gray-700">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-8 space-y-6 bg-[#FDFDFD]">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center h-48">
                                    
                                    {loadingStep === "Extracting logos and images..." && (
                                        <Lottie 
                                            animationData={logoIcons} 
                                            loop={true}
                                            style={{ width: 100, height: 100 }}
                                            rendererSettings={{
                                                preserveAspectRatio: 'xMidYMid slice'
                                            }}
                                        />
                                    )}
                                    {loadingStep === "Analyzing brand colors..." && (
                                        <Lottie 
                                            animationData={colorPalette} 
                                            loop={true}
                                            style={{ width: 100, height: 100 }}
                                            rendererSettings={{
                                                preserveAspectRatio: 'xMidYMid slice'
                                            }}
                                        />
                                    )}
                                    {loadingStep === "Extracting brand voice and information..." && (
                                        <Lottie 
                                            animationData={brandIcon} 
                                            loop={true}
                                            style={{ width: 100, height: 100 }}
                                            rendererSettings={{
                                                preserveAspectRatio: 'xMidYMid slice'
                                            }}
                                        />
                                    )}
                                    <h2 className="text-xl font-medium text-gray-700">{loadingStep}</h2>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <h3 className="text-lg text-gray-700 mb-4">{t('brands.enterYourWebsite')}</h3>
                                    
                                    <div className="flex w-full items-center shadow-md border rounded-lg focus-within:ring-1 focus-within:ring-pink-300 focus-within:border-pink-300">
                                        <span className="pl-3 text-gray-400">
                                            <Globe size={18} />
                                        </span>
                                        <input 
                                            type="text" 
                                            placeholder={t('brands.websitePlaceholder')} 
                                            className="w-full p-4 outline-none rounded-lg text-sm"
                                            value={websiteUrl}
                                            onChange={(e) => setWebsiteUrl(e.target.value)}
                                        />
                                    </div>
                                    
                                    {extractionError && (
                                        <p className="text-red-500 text-sm mt-1">{extractionError}</p>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="p-6 w-full absolute bottom-0 flex justify-between space-x-3">
                            <button 
                                onClick={closeDialog}
                                className="bg-gray-200/50 px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-200"
                                disabled={isLoading}
                            >
                                {t('common.cancel')}
                            </button>
                            <button 
                                onClick={handleBrandExtraction}
                                disabled={isLoading} 
                                className="px-4 py-2  rounded-lg font-medium flex items-center justify-center brand-button"
                            >
                                {isLoading ? t('common.processing') : t('brands.createBrandStyle')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Connect Account Dialog */}
            {showConnectDialog && (
                <div className="fixed inset-0 bg-gray-400 bg-opacity-30 backdrop-blur-[3px] flex items-center justify-center z-50">
                    <div 
                        className={`bg-primary rounded-lg w-[95%] max-w-[80vw] h-[90vh] overflow-y-auto shadow-xl transition-all duration-200 ${
                            connectDialogAnimation ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
                        }`}
                    >
                        <div className="p-4 flex justify-between items-center sticky top-0 z-10 bg-primary">
                            <h2 className="text-xl font-medium text-gray-800">Connect Social Account</h2>
                            <button onClick={closeConnectDialog} className="text-gray-500 hover:text-gray-700">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-4 h-[70vh] bg-primary overflow-y-none">
                            {/* Integrate the FacebookAuth component */}
                            <FacebookAuth onAuth={handleAuthSuccess} />
                        </div>
                        
                        <div className="p-4 sticky bottom-0 bg-primary rounded-b-lg">
                            <div className="flex justify-start">
                                <button 
                                    onClick={closeConnectDialog}
                                    className="bg-gray-200 py-2 px-4 rounded-lg text-gray-600 hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            {showDeleteConfirm && brandToDelete && (
                <div className="fixed inset-0 bg-gray-400 bg-opacity-30 backdrop-blur-[3px] flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg w-[400px] shadow-xl p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Brand</h3>
                        <p className="text-gray-500 mb-4">
                            Are you sure you want to delete "{brandToDelete.name}"? This action cannot be undone.
                        </p>
                        
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeleteBrand(brandToDelete.id)}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default BrandStyle;