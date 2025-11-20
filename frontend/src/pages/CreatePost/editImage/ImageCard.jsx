
const ImageCard = ({ image, index, selectedImage, setSelectedImage }) => {
    return (
        <div 
        className={`w-full mb-20 rounded-lg shadow-sm overflow-hidden cursor-pointer
            ${index === 0 ? 'mt-[15vh]' : ''}
            ${selectedImage === image ? 'ring-2 ring-blue-500' : ''}`}
        onClick={() => setSelectedImage(image)}
        >
            <img 
                src={image} 
                alt={`Generated image ${index + 1}`}
                className="w-full h-auto  object-cover bg-gray-200"
                style={{ display: 'none' }}
                onLoad={(e) => (e.target.style.display = 'block')}
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
            />
        </div>
    )
};

export default ImageCard;