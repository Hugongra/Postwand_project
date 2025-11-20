import { useState, useEffect } from "react";
import { X, Search, ChevronRight} from "lucide-react";
import Lottie from "lottie-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import * as api from '@services/api/api';


const BrandDialog = ({ dialogAnimation, closeDialog, onBrandCreated, isOnboarding = false, extractionRef, setLoading: setParentLoading }) => {
    const { t } = useTranslation();

    const [websiteUrl, setWebsiteUrl] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [extractionError, setExtractionError] = useState(null);
    const [loadingStep, setLoadingStep] = useState("");
    const [currentStepKey, setCurrentStepKey] = useState("");

    const [colorPalette, setColorPalette] = useState(null);
    const [brandIcon, setBrandIcon] = useState(null);
    const [logoIcons, setLogoIcons] = useState(null);

    const navigate = useNavigate();
    
    
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
    }  , []);

    const handleBrandExtraction = async () => {
        if (!websiteUrl.trim()) {
            setExtractionError("Please enter a valid website URL");
            return;
        }
        
        try {
            setIsLoading(true);
            if (setParentLoading) setParentLoading(true);
            setExtractionError(null);
            setLoadingStep("Starting brand extraction...");
            
            const response = await api.ExtractBrand(websiteUrl, (progressData) => {
                console.log('Progress update:', progressData);
                // Handle real-time progress updates
                if (progressData.step === 'images') {
                    setCurrentStepKey('images');
                    setLoadingStep("Extracting logos and images...");
                } else if (progressData.step === 'colors') {
                    setCurrentStepKey('colors');
                    setLoadingStep("Analyzing brand colors...");
                } else if (progressData.step === 'info') {
                    setCurrentStepKey('info');
                    setLoadingStep("Extracting brand voice and information...");
                } else if (progressData.step === 'complete') {
                    setCurrentStepKey('complete');
                    setLoadingStep("Finalizing brand profile...");
                }
            });
            
            if (!response.ok) {
                const errorData = response.data;
                setExtractionError(errorData.error || 'Brand extraction failed. Please try again.');
                setIsLoading(false);
                if (setParentLoading) setParentLoading(false);
                return;
            }

            // Pass the brand data to the parent
            if (onBrandCreated) {
                onBrandCreated(response.data);
            }

            // In onboarding mode, don't navigate or close - let parent handle it
            if (!isOnboarding) {
                // Navigate to brand detail page if ID exists, otherwise go to brands list
                if (response.data && response.data.id) {
                    navigate(`/brands/${response.data.id}`);
                } else {
                    navigate('/brands');
                }
                closeDialog();
            } else {
                // In onboarding mode, keep loading state until parent transitions
                // The parent will handle the transition to the brand review page
            }
        } catch (error) {
            console.error("Brand extraction error:", error);
            setExtractionError(error?.data?.error || 'An unexpected error occurred. Please try again.');
            setIsLoading(false);
            if (setParentLoading) setParentLoading(false);
        }
    };
    
    // Expose handleBrandExtraction to parent via ref in onboarding mode
    useEffect(() => {
        if (isOnboarding && extractionRef) {
            extractionRef.current = handleBrandExtraction;
        }
    }, [websiteUrl, isOnboarding, extractionRef]);
    return (
        <>
        <div className={`fixed inset-0 ${isOnboarding ? 'bg-white' : 'bg-gray-400'} bg-opacity-30 backdrop-blur-[3px] flex items-center justify-center z-50`}>
        <div 
            className={`${isOnboarding ? 'bg-primary' : 'bg-white'} p-6 space-y-6 rounded-lg w-[95%] max-w-[600px] h-[45vh] min-h-[350px] transition-all duration-200 ${
                dialogAnimation ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
            }`}
        >
             {!isLoading && (
            <div className="flex justify-between items-center bg-[#FDFDFD] rounded-lg">
                <h2 className="text-xl font-medium text-gray-800">
             {isOnboarding ? 'Let\'s set up your brand' : t('brands.createContentBasedOnBrand')}
                </h2>
                {!isOnboarding && (
                    <button onClick={closeDialog} className="text-gray-500 hover:text-gray-700">
                        <X size={20} />
                    </button>
                )}
            </div>
            )}
            <div >
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-48">
                        {(() => {
                            const animations = {
                                'images': logoIcons,
                                'colors': colorPalette,
                                'info': brandIcon
                            };
                            const animation = animations[currentStepKey];
                            
                            return animation && (
                                <Lottie 
                                    animationData={animation} 
                                    loop={true}
                                    style={{ width: 100, height: 100 }}
                                    rendererSettings={{ preserveAspectRatio: 'xMidYMid slice' }}
                                />
                            );
                        })()}
                        <h2 className="text-xl font-medium text-gray-700 mt-4">{loadingStep}</h2>
                        <p className="text-sm text-gray-500 mt-2">This may take a minutes...</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <h3 className="text-sm text-gray-500 mb-2">{t('brands.enterYourWebsite')}</h3>
                        
                        <div className="bg-white flex w-full items-center shadow-sm border rounded-xl focus-within:ring-1 focus-within:ring-pink-100">
                            <span className="pl-3 text-gray-400">
                                <Search size={18} />
                            </span>
                            <input 
                                type="text" 
                                placeholder={t('brands.websitePlaceholder')} 
                                className="w-full p-3 outline-none rounded-xl text-sm"
                                value={websiteUrl}
                                onChange={(e) => setWebsiteUrl(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        handleBrandExtraction();
                                    }
                                }}
                            />
                        </div>
                        
                        {extractionError && (
                            <p className="text-red-500 text-sm mt-1">{extractionError}</p>
                        )}
                    </div>
                )}
            </div>
            {!isOnboarding && (
                <div className="p-5 w-full absolute bottom-0 left-0 flex justify-between">
                    <button 
                        onClick={closeDialog}
                        className="bg-gray-200/50 px-3 py-1.5 border text-sm rounded-lg text-gray-600 hover:bg-gray-200"
                        disabled={isLoading}
                    >
                        {t('common.cancel')}
                    </button>
                    <button 
                        onClick={handleBrandExtraction}
                        disabled={isLoading} 
                        className="px-3 py-1.5 rounded-lg text-sm font-medium flex items-center justify-center brand-button"
                    >
                        {isLoading ? t('common.processing') : t('brands.createBrandStyle')}
                    </button>
                </div>
            )}
            
        </div>
    </div>
    </>
    );
};

export default BrandDialog;