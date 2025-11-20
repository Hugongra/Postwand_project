import { useState, useEffect, useRef } from "react";
import { Ellipsis, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import * as api from '@services/api/api';

const BrandBox = ({ brand, onBrandDeleted }) => {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const menuRef = useRef(null);

    const handleBrandSelect = () => {
        navigate(`/brands/${brand.id}`);
    };

    const toggleMenu = (e) => {
        e.stopPropagation();
        setMenuOpen(!menuOpen);
    };

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        setShowDeleteConfirm(true);
        setMenuOpen(false);
    };

    const handleDeleteBrand = async () => {
        const response = await api.DeleteBrand(brand.id);
        if (!response.ok) throw new Error(`Failed to delete brand: ${response.status}`);
        setShowDeleteConfirm(false);
        onBrandDeleted();
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
        };

        if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
        
    }, [menuOpen]);

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) setShowDeleteConfirm(false);
    };  

    const brandName = brand.name.toUpperCase() || brand.domain.toUpperCase();

    return (
        <>
            <div 
                className="flex flex-col items-center justify-center h-48 rounded-lg bg-white  shadow-md cursor-pointer  relative"
            >
                <div 
                    ref={menuRef}
                    className="absolute top-2 right-2 cursor-pointer z-10"
                    onClick={toggleMenu}
                >
                    <div className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200">
                        <Ellipsis size={18} className="text-gray-500 font-bold" />
                    </div>
                    
                    {menuOpen && (
                        <div className="p-1 absolute right-0 mt-1 w-26 bg-white rounded-lg shadow-lg border overflow-hidden z-20">
                            <div 
                                className="px-4 py-2 text-sm text-black hover:bg-gray-200 flex items-center rounded-lg"
                                onClick={handleDeleteClick}
                            >
                                <Trash2 size={16} className="mr-2" />
                                Delete
                            </div>
                        </div>
                    )}
                </div>
                
                <div 
                    className="w-full h-full flex flex-col items-center justify-center"
                    onClick={handleBrandSelect}
                >
                    {brand.logo_url !== null ? (
                        <img 
                            src={brand.logo_url} 
                            alt={brand.domain || brand.name} 
                            className="w-full h-20 object-contain bg-white p-2" 
                        />
                    ) : (
                        <span className="w-full h-20 flex items-center justify-center text-2xl font-bold text-gray-400">
                            {brand.name}
                        </span>
                    )}
                    <div className="w-full px-4">
                        <span className="text-lg font-medium text-gray-700 truncate max-w-[90%]">
                            {brand.name}
                        </span>
                    </div>
                </div>
            </div>

            {showDeleteConfirm && (
                <div 
                    className="fixed inset-0 bg-gray-400 bg-opacity-30 backdrop-blur-[3px] flex items-center justify-center z-50"
                    onClick={handleBackdropClick}
                >
                    <div className="bg-white rounded-lg w-[400px] shadow-xl p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Brand</h3>
                        <p className="text-gray-500 mb-4">
                            Are you sure you want to delete the brand "{brandName}"? This action cannot be undone.
                        </p>
                        
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteBrand}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default BrandBox;