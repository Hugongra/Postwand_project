import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import BrandProfile from './BrandProfile';
import Products from './Products';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import * as api from '@services/api/api';

const Brand = () => {
    const { brandId } = useParams();
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('brand');
    const [brandData, setBrandData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [, forceUpdate] = useState({});
    const componentRef = useRef(null);

    useEffect(() => {
        fetchBrandData();
    }, [brandId]);

    // Force re-render to check hasUnsavedChanges
    useEffect(() => {
        const interval = setInterval(() => forceUpdate({}), 100);
        return () => clearInterval(interval);
    }, []);

    const fetchBrandData = async () => {
        try {
            setLoading(true);
            const response = await api.GetBrand(brandId);
            if (response.ok) {
                setBrandData(response.data.brand);
            }
        } catch (error) {
            console.error('Error fetching brand:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveChanges = async () => {
        setSaving(true);
        if (activeTab === 'brand') {
            await componentRef.current?.saveBrand();
        } else {
            await componentRef.current?.saveProduct();
        }
        setSaving(false);
    };

    const handleProductsUpdate = (updatedProducts) => {
        setBrandData(prev => ({
            ...prev,
            products: updatedProducts
        }));
    };

    return (
        <div className='bg-primary w-full pt-2 pr-2 mx-auto min-h-screen overflow-x-hidden'>
            <div className="h-28 bg-gray-100/80 flex flex-col p-4 mb-2 rounded-lg relative">
                <h1 className="text-3xl font-medium text-black">{brandData?.name}</h1>

                <div className="absolute bottom-2 flex items-center justify-between w-full pr-10">
                    {/* Tabs on the left */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                        <TabsList>
                            <TabsTrigger value="brand">Brand</TabsTrigger>
                            <TabsTrigger value="products">Products</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    {/* Buttons on the right */}
                    <div className="flex items-center gap-2">
                        {componentRef.current?.hasUnsavedChanges && (
                            <button
                                onClick={handleSaveChanges}
                                disabled={saving}
                                className="text-sm flex items-center gap-1 bg-pink-500 text-white border shadow-md px-3 py-1.5 hover:bg-pink-600 rounded-lg font-medium disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        )}
                        
                        <button
                            onClick={() => navigate('/brands')}
                            className="text-sm flex items-center gap-1 bg-gray-200 text-gray-700 border shadow-md px-3 py-1.5 hover:bg-gray-300 rounded-lg font-medium"
                        >
                            <ArrowLeft size={20} className="inline-block" /> Back
                        </button>
                    </div>
                </div>
            </div>

            {/* Tab Content */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500">Loading...</p>
                </div>
            ) : (
                <div className="w-[80%] mx-auto">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsContent value="brand" className="mt-0">
                        {activeTab === 'brand' && (
                            <BrandProfile
                                ref={componentRef}
                                brandId={brandId}
                                brandData={brandData}
                            />
                        )}
                    </TabsContent>
                    <TabsContent value="products" className="mt-0">
                        {activeTab === 'products' && (
                            <Products 
                                ref={componentRef}
                                brandId={brandId} 
                                products={brandData?.products || []} 
                                onProductsUpdate={handleProductsUpdate}
                            />
                        )}
                    </TabsContent>
                </Tabs>
                </div>
            )}
        </div>
    )
}

export default Brand;
