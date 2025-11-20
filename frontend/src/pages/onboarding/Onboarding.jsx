import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import BrandDialog from '../brands/BrandDialog';
import BrandProfile from '../brands/BrandProfile';
import Products from '../brands/Products';
import * as api from '@services/api/api';

const Onboarding = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [step, setStep] = useState(() => {
        const stepParam = searchParams.get('step');
        return stepParam ? parseInt(stepParam, 10) : 0;
    });
    const [businessType, setBusinessType] = useState('');
    const [dialogAnimation, setDialogAnimation] = useState(true);
    const [extractedBrandId, setExtractedBrandId] = useState(null);
    const [brandData, setBrandData] = useState(null);
    const [loading, setLoading] = useState(false);
    const brandExtRef = useRef(null);
    const componentRef = useRef(null);

    // Update URL when step changes
    useEffect(() => {
        setSearchParams({ step: step.toString() }, { replace: false });
    }, [step, setSearchParams]);

    // Handle browser back/forward buttons
    useEffect(() => {
        const handlePopState = () => {
            const stepParam = searchParams.get('step');
            if (stepParam) {
                setStep(parseInt(stepParam, 10));
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [searchParams]);

    useEffect(() => {
        if (extractedBrandId && step >= 2) {
            fetchBrandData();
        }
    }, [extractedBrandId, step]);

    const fetchBrandData = async () => {
        const response = await api.GetBrand(extractedBrandId);
        if (response.ok) {setBrandData(response.data.brand);}

    };
    const handleBrandCreated = (brandData) => {
        if (brandData && brandData.id) {
            setStep(2);
            setExtractedBrandId(brandData.id);
            setLoading(false);
        }
    };

  
    const handleContinueClick = async () => {
        if (step === 0) {
            if (businessType) {
                if (businessType === 'content_manager') {
                    navigate('/home');
                    return;
                }
                setStep(1);
            }
        } else if (step === 1) {
            if (brandExtRef.current) {brandExtRef.current(); }
        } else if (step === 2) {
            setLoading(true);
            const saveSuccess = await componentRef.current?.saveBrand();
            setLoading(false);
            if (saveSuccess) { setStep(3);}
        } else if (step === 3) {
            setLoading(true);
            await componentRef.current?.saveProduct();
            setLoading(false);
            navigate('/home');
        }
    };

   
    return (
        <div className="min-h-screen bg-primary">
            {step === 0 ? (
                <div className="flex items-center justify-center min-h-screen ">
                    <div className="p-6 space-y-4 rounded-lg w-[95%] max-w-[600px] h-[45vh] min-h-[350px]">
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">Welcome to Postwand!</h2>
                        <p className="text-gray-600 mb-6">Let's get started by understanding your business type.</p>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-2">
                                    What type of business are you?
                                </label>
                                <Select value={businessType} onValueChange={setBusinessType}>
                                    <SelectTrigger className="w-full bg-white">
                                        <SelectValue placeholder="Select your business type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ecommerce">E-commerce</SelectItem>
                                        <SelectItem value="software_startup">Software Startup</SelectItem>
                                        <SelectItem value="content_manager">Content Manager</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </div>
            ) : step === 1 ? (
                <div className="flex items-center justify-center min-h-screen">
                    <BrandDialog
                        dialogAnimation={dialogAnimation}
                        closeDialog={() => {}}
                        onBrandCreated={handleBrandCreated}
                        isOnboarding={true}
                        extractionRef={brandExtRef}
                        setLoading={setLoading}
                    />
                </div>
            ) : step === 2 ? (
                <div className='bg-white max-w-[800px] mx-auto py-4 pr-2 min-h-screen overflow-x-hidden'>
                    <div className="flex justify-between items-start pb-4 gap-4 px-4">
                        <div className="flex-1">
                            <p className="text-gray-700 text-sm w-[80%]">
                                We extracted your brand information! Please review it in case there is something you'd like to adjust before continuing.
                            </p>
                        </div>
                    </div>
                    {brandData ? (
                        <BrandProfile 
                            ref={componentRef}
                            brandId={extractedBrandId}
                            brandData={brandData}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-64">
                            <p className="text-gray-500">Loading...</p>
                        </div>
                    )}
                </div>
            ) : step === 3 ? (
                <div className="max-w-[800px] mx-auto">
                    <div className="p-4">
                        <p className="text-gray-700 text-sm">
                            We extracted your products! You can review and edit them, or add new products manually.
                        </p>
                    </div>
                    {brandData ? (
                        <Products 
                            ref={componentRef}
                            brandId={extractedBrandId} 
                            isOnboarding={true} 
                            products={brandData.products || []} 
                        />
                    ) : (
                        <div className="flex items-center justify-center h-64">
                            <p className="text-gray-500">Loading...</p>
                        </div>
                    )}
                </div>
            ) : null}

            {/* Back Button */}
            {step > 0 && (
                <button 
                    onClick={() => setStep(step - 1)}
                    className="fixed bottom-16 left-16 px-4 py-2 rounded-xl text-sm font-medium flex items-center justify-center bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-lg z-[60]"
                    disabled={loading}
                >
                    <ChevronLeft className="mr-1" size={18} /> Back
                </button>
            )}

            {/* Continue Button */}
            <button 
                onClick={handleContinueClick}
                className={`fixed bottom-16 right-16 px-4 py-2 rounded-xl text-sm font-medium flex items-center justify-center ${
                    loading || (step === 0 && !businessType) 
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                        : 'brand-button'
                } shadow-lg z-[60]`}
                disabled={loading || (step === 0 && !businessType)}
            >
                {loading ? 'Processing...' : 'Continue'} {!loading && <ChevronRight className="ml-1" size={18} />}
            </button>
        </div>
    );
};

export default Onboarding;

