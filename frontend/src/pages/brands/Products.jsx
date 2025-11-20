import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Plus } from 'lucide-react';
import { LuImagePlus } from "react-icons/lu";
import * as api from '@services/api/api';
const InputField = ({label, value, onChange, name}) => {
    const textareaRef = useRef(null);

    const adjustHeight = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    };
    
    useEffect(() => { adjustHeight(); }, [value]);
    
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
            />
        </div>
    );
};

const Products = forwardRef(({ brandId: propBrandId, isOnboarding = false, products: initialProducts = [], onProductsUpdate }, ref) => {
    const { brandId: paramBrandId } = useParams();
    const brandId = propBrandId || paramBrandId;
    const navigate = useNavigate();
    const [products, setProducts] = useState(initialProducts);
    const [selectedProduct, setSelectedProduct] = useState(1);
    const [selectedProductIndex, setSelectedProductIndex] = useState(null);
    const [editedProduct, setEditedProduct] = useState({});
    const [loading, setLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setProducts(initialProducts);
    }, [initialProducts]);

    const handleProductClick = (product, index) => {
        setSelectedProduct(product);
        setSelectedProductIndex(index);
        setEditedProduct({
            name: product.name || "",
            price: product.price || "",
            description: product.description || "",
            product_link: product.product_link || ""
        });
        setHasUnsavedChanges(false);
    };

    const handleAddNewProduct = () => {
        setSelectedProduct(null);
        setSelectedProductIndex(-1);
        setEditedProduct({
            name: "",
            price: "",
            description: "",
            product_link: ""
        });
        setHasUnsavedChanges(false);
    };

    const handleChange = (e) => {
        setEditedProduct({...editedProduct, [e.target.name]: e.target.value});
        setHasUnsavedChanges(true);
    };

    const handleDeleteClick = (index, e) => {
        e.stopPropagation();
        setProductToDelete(index);
        setShowDeleteConfirm(true);
    };

    const handleDeleteProduct = async () => {
        if (productToDelete === null) return;
        
        setIsDeleting(true);
        const updatedProducts = products.filter((_, i) => i !== productToDelete);
        const response = await api.UpdateBrand(brandId, { products: updatedProducts });
        
        if (response.ok) {
            setProducts(updatedProducts);
            onProductsUpdate?.(updatedProducts);
            if (selectedProductIndex === productToDelete) {
                setSelectedProduct(null);
                setSelectedProductIndex(null);
                setEditedProduct({});
            }
        } 
        setIsDeleting(false);
        setShowDeleteConfirm(false);
        setProductToDelete(null);
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            setShowDeleteConfirm(false);
        }
    };

    const handleSaveProduct = async () => {
            setSaving(true);
            let updatedProducts;
            
            if (selectedProductIndex === -1) {
                const newProduct = {
                    ...editedProduct,
                    images: selectedProduct?.images || []
                };
                updatedProducts = [...products, newProduct];
            } else {
                updatedProducts = [...products];
                updatedProducts[selectedProductIndex] = {
                    ...selectedProduct,
                    ...editedProduct
                };
            }
            
            const response = await api.UpdateBrand(brandId, { products: updatedProducts });
            
            if (response.ok) {
                setProducts(updatedProducts);
                onProductsUpdate?.(updatedProducts);
                setHasUnsavedChanges(false);
                if (selectedProductIndex === -1) {
                    setSelectedProduct(updatedProducts[updatedProducts.length - 1]);
                    setSelectedProductIndex(updatedProducts.length - 1);
                } else {
                    setSelectedProduct(updatedProducts[selectedProductIndex]);
                }
            }
            setSaving(false);
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setHasUnsavedChanges(true);
                if (selectedProductIndex === -1) {
                    const currentImages = selectedProduct?.images || [];
                    const updatedImages = [...currentImages, reader.result];
                    const tempProduct = {
                        ...editedProduct,
                        images: updatedImages
                    };
                    setSelectedProduct(tempProduct);
                } else {
                    const updatedImages = [...(selectedProduct.images || [])];
                    updatedImages.push(reader.result);
                    
                    const updatedProduct = {
                        ...selectedProduct,
                        images: updatedImages
                    };
                    
                    const updatedProducts = [...products];
                    updatedProducts[selectedProductIndex] = updatedProduct;
                    setProducts(updatedProducts);
                    setSelectedProduct(updatedProduct);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    // Expose saveProduct method and hasUnsavedChanges to parent via ref
    useImperativeHandle(ref, () => ({
        saveProduct: handleSaveProduct,
        hasUnsavedChanges
    }));

    return (
        <div className='bg-primary w-full min-w-[800px] mx-auto'>
            <div className="flex gap-4 h-[calc(100vh-140px)]">
                <div className="w-1/2 bg-white rounded-xl  overflow-y-auto hide-scrollbar">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-gray-500">Loading products...</p>
                        </div>
                    ) : (
                        <div className="">
                            {/* Fixed first row - Add Product Manually */}
                            <div
                                onClick={handleAddNewProduct}
                                className={`m-2 rounded-xl group flex items-center gap-3 p-2 cursor-pointer hover:bg-gray-50 transition-colors ${
                                    selectedProductIndex === -1 ? 'bg-gray-100' : ''
                                }`}
                            >
                                <div className="w-12 h-12 flex items-center justify-center">
                                    <LuImagePlus size={24} className="text-gray-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm text-gray-900">
                                        Add product manually
                                    </h3>
                                </div>
                            </div>

                            {/* Existing products */}
                            {products.length === 0 ? (
                                <div className="flex items-center justify-center h-32">
                                    <p className="text-gray-500 text-sm">No products yet</p>
                                </div>
                            ) : (
                                products.map((product, index) => (
                                    <div
                                        key={index}
                                        onClick={() => handleProductClick(product, index)}
                                        className={`m-2 rounded-xl group flex items-center gap-3 p-2 cursor-pointer hover:bg-gray-50 transition-colors ${
                                            selectedProductIndex === index ? 'bg-gray-100' : ''
                                        }`}
                                    >
                                        {product.images && product.images.length > 0 ? (
                                            <img
                                                src={product.images[0]}
                                                alt={product.name}
                                                className="w-12 h-12 object-cover rounded-lg bg-gray-200"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                                <span className="text-gray-400 text-xs">No image</span>
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm text-gray-900 truncate">
                                                {product.name}
                                            </h3>
                                        </div>
                                        <button
                                            onClick={(e) => handleDeleteClick(index, e)}
                                            className="p-2 text-gray-400 hover:text-red-400 transition-all opacity-0 invisible group-hover:opacity-100 group-hover:visible"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Right side - Product Details */}
                <div className="flex-1 hide-scrollbar overflow-y-auto rounded-xl" >
                    {selectedProduct || selectedProductIndex === -1 ? (
                        <div >
                           
                         
                            {/* Product Images */}
                            <div className="grid grid-cols-4 gap-2 mb-4">
                                {/* BIG IMAGE: 2×2 SQUARE BLOCK */}
                                <div className="col-span-2 row-span-2 aspect-square">
                                    {selectedProduct?.images && selectedProduct.images[0] ? (
                                        <img
                                            src={selectedProduct.images[0]}
                                            alt={selectedProduct.name}
                                            className="w-full h-full object-cover rounded-xl bg-gray-200"
                                        />
                                    ) : (
                                        <label className="w-full h-full bg-gray-100 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="hidden"
                                            />
                                            <LuImagePlus size={32} className="text-gray-400 mb-2" />
                                            <span className="text-xs text-gray-500">Add main image</span>
                                        </label>
                                    )}
                                </div>
                        
                                {/* SMALL IMAGES: Always show all 4 slots */}
                                {[1, 2, 3, 4].map((idx) => {
                                    const images = selectedProduct?.images || [];
                                    const imageExists = images[idx];
                                    const isLastEmptySlot = idx === 4 && images.length < 5;
                                    
                                    return (
                                        <div key={idx} className="aspect-square">
                                            {imageExists ? (
                                                <img
                                                    src={images[idx]}
                                                    alt={`${selectedProduct?.name} ${idx}`}
                                                    className="w-full h-full object-cover rounded-xl bg-gray-200"
                                                />
                                            ) : isLastEmptySlot ? (
                                                <label className="w-full h-full bg-gray-100 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleImageUpload}
                                                        className="hidden"
                                                    />
                                                    <LuImagePlus size={18} className="text-gray-400 mb-1" />
                                                </label>
                                            ) : (
                                                <div className="w-full h-full bg-gray-100 rounded-xl"></div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            {/* Product Info */}
                            <div className="space-y-2">
                                <InputField 
                                    label="Product title" 
                                    name="name" 
                                    value={editedProduct.name || ""} 
                                    onChange={handleChange} 
                                    placeholder="Enter the title for new product"
                                />

                                <div>
                                    <label className="block text-xs text-gray-700 mb-1">Price</label>
                                    <input
                                        type="number"
                                        name="price"
                                        value={editedProduct.price || ""}
                                        onChange={handleChange}
                                        step="0.01"
                                        className="border rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:border-gray-300"
                                    />
                                </div>

                                <InputField 
                                    label="Description" 
                                    name="description" 
                                    value={editedProduct.description || ""} 
                                    onChange={handleChange} 
                                    placeholder="Enter the description for new product"
                                />

                                <div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-gray-500">Select a product to view details</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            {showDeleteConfirm && productToDelete !== null && (
                <div 
                    className="fixed inset-0 bg-gray-400 bg-opacity-30 backdrop-blur-[3px] flex items-center justify-center z-50"
                    onClick={handleBackdropClick}
                >
                    <div className="bg-white rounded-lg w-[400px] shadow-xl p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Product</h3>
                        <p className="text-gray-500 mb-4">
                            Are you sure you want to delete "{products[productToDelete]?.name}"? This action cannot be undone.
                        </p>
                        
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                disabled={isDeleting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteProduct}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

export default Products;

