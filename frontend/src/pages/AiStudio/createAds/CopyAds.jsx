import { useEffect, useState } from 'react';
import AdDialog from './AdDialog';

const CopyAds = ({ type }) => {
    const [openDialog, setOpenDialog] = useState(false);
    const [generatedAdUrl, setGeneratedAdUrl] = useState(null);

    useEffect(() => {
        setOpenDialog(true);
    }, [type]);

    const closeDialog = () => {
        setOpenDialog(false);
    };

    return (
        <>
            {openDialog && <AdDialog closeDialog={closeDialog} onAdGenerated={setGeneratedAdUrl} />}
            {!openDialog && generatedAdUrl && (
                <div className="w-full h-full flex items-center justify-center p-8">
                    <div className="max-w-lg w-full">
                        <img 
                            src={generatedAdUrl} 
                            alt="Generated Ad" 
                            className="w-full h-auto rounded-lg shadow-lg"
                        />
                    </div>
                </div>
            )}
        </>
    );
};

export default CopyAds;