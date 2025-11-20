import { useState } from "react";
import { IoCloudUploadOutline } from "react-icons/io5";
import { PlusIcon, X } from "lucide-react";

const UploaderAd = ({ maxImages = 3, images: externalImages, onImagesChange }) => {
  // Use external state if provided, otherwise use internal state
  const [internalImages, setInternalImages] = useState([undefined, undefined, undefined]);

  const isControlled = externalImages !== undefined && onImagesChange !== undefined;
  const images = isControlled ? externalImages : internalImages;
  const setImages = isControlled ? onImagesChange : setInternalImages;

  const handleImageChange = (e, slotIndex) => {
    const file = e.target.files[0];
    if (!file) return;

    const newImages = [...images];
    newImages[slotIndex] = file;

    // shift images to remove undefined gaps
    const compacted = newImages.filter(Boolean);
    while (compacted.length < maxImages) compacted.push(undefined);

    setImages(compacted);

    e.target.value = "";
  };

  const removeImage = (slotIndex) => {
    const newImages = [...images];
    newImages.splice(slotIndex, 1); // remove the image at slotIndex
    newImages.push(undefined); // maintain 3 slots
    setImages(newImages);
  };

  const getPreviewUrl = (img) =>
    img instanceof File ? URL.createObjectURL(img) : img;

  return (
    <div className="w-full h-full flex flex-col gap-4 rounded-lg">
      {/* Row 1 */}
      <div className={`relative bg-gray-100 rounded-lg overflow-hidden ${images[0] ? 'flex-[2]' : 'flex-1'}`}>
      {images[0] ? (
          <>
            <img
              src={getPreviewUrl(images[0])}
              alt="Slot 0"
              className="object-cover w-full h-full rounded-lg shadow-md"
            />
            <button
              className="absolute top-2 right-2 text-red-500"
              onClick={() => removeImage(0)}
            >
              <X size={16} />
            </button>
          </>
        ) : (
          <label className="flex items-center justify-center w-full h-full cursor-pointer">
            <IoCloudUploadOutline className="w-6 h-6 text-gray-500 " />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageChange(e, 0)}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Row 2 */}
      {images[0] && (
      <div className="grid grid-cols-2 gap-4 flex-1">
        {[1, 2].map((slotIndex) => (
          <div
            key={slotIndex}
            className="relative bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden"
          >
            {images[slotIndex] ? (
              <>
                <img
                  src={getPreviewUrl(images[slotIndex])}
                  alt={`Slot ${slotIndex}`}
                  className="object-cover w-full h-full rounded-lg shadow-md"
                />
                <button
                  className="absolute top-2 right-2 text-red-500"
                  onClick={() => removeImage(slotIndex)}
                >
                  <X size={14} />
                </button>
              </>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-gray-200">
                <PlusIcon className="w-6 h-6 text-gray-500" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, slotIndex)}
                  className="hidden"
                />
              </label>
            )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UploaderAd;
