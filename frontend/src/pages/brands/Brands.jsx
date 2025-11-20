import { Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom"; 
import { useTranslation } from 'react-i18next';
import * as api from '@services/api/api';    
import BrandDialog from "./BrandDialog";
import BrandBox from "./BrandBox";
import Header from "@components/header";
const BrandStyle = () => {
    const { t } = useTranslation();
    const location = useLocation();
    
    const [showDialog, setShowDialog] = useState(false);
    const [dialogAnimation, setDialogAnimation] = useState(false);

    const [availableBrands, setAvailableBrands] = useState([]);
    const [loadingBrands, setLoadingBrands] = useState(true);
    
    const fetchAvailableBrands = async () => {
        setLoadingBrands(true); 
        const response = await api.GetBrands();
        
        if (!response.ok) {
          throw new Error(`Failed to fetch brands: ${response.status}`);
        }
        setAvailableBrands(response.data.brands || []);
        
        console.log(response.data.brands);
        setLoadingBrands(false);
    };

    useEffect(() => {
        fetchAvailableBrands();
    }, []);
    
    useEffect(() => {
        if (location.state?.openDialog) openDialog();
    }, [location]);
    
    const openDialog = () => {
        setShowDialog(true);
        setTimeout(() => setDialogAnimation(true), 10);
    };
    
    const closeDialog = () => {
        setDialogAnimation(false);
        setTimeout(() => setShowDialog(false), 300);
    };

    return ( 
        <div className="w-full py-2 pr-2 mx-auto bg-primary min-h-screen overflow-x-hidden">
            <Header 
                title={t('brands.brandIdentity')}
                onClick={openDialog}
                button={t('brands.newBrandIdentity')}
            />
                
            

            <div className=" rounded-lg min-h-[80vh] h-auto">
                <div className="flex flex-col gap-4 h-[70%] p-4 lg:p-8 xl:p-8">
                    {loadingBrands ? (
                         <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 mt-2">
                            {Array.from({ length: 2 }).map((_, index) => (
                                <div key={index} className="w-full h-48 rounded-lg bg-gray-200/80 animate-pulse"></div>
                            ))}
                        </div>
                    ) : availableBrands.length === 0 ? (
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
                    ) : (
                        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 mt-2">
                            {availableBrands.map((brand) => ( 
                                <BrandBox 
                                    key={brand.id}
                                    brand={brand}
                                    onBrandDeleted={fetchAvailableBrands}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {showDialog && (
                <BrandDialog 
                    dialogAnimation={dialogAnimation}
                    closeDialog={closeDialog}
                    onBrandCreated={fetchAvailableBrands}
                />
            )}
        </div>
    )
}

export default BrandStyle;