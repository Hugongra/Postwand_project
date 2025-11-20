const BrandInput = ({ label, value, onChange, readOnly, type = "text", className = "" }) => {
    return (
        <div className="flex items-center">
            <label className="mb-1 text-xs w-20 text-gray-700">{label}</label>
            <input
                className={`px-2 py-1.5 text-gray-700 border rounded-lg flex-1 shadow-sm focus:border-pink-300 text-sm ${className}`}
                type={type}
                value={value}
                onChange={onChange}
                readOnly={readOnly}
            />
        </div>
    );
};

export default BrandInput;

