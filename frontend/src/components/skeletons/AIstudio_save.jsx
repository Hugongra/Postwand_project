import { FaInstagram, FaFacebook, FaTiktok, FaLinkedin, FaTwitter, FaYoutube, FaWordpressSimple } from 'react-icons/fa';
import { FaChevronRight } from "react-icons/fa6";
import { SiThreads } from 'react-icons/si';
import { useState } from 'react';

const StepIndicator = ({ currentStep = 1, steps = ["Select Platform", "Select Type", "Review", "Publish"] }) => {
    return (
      <div className="absolute top-0 left-0 right-0 z-10 py-10">
        <div className="w-full max-w-3xl mx-auto">
          <div className="flex items-center justify-center">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                {/* Step section with number and label */}
                <div className="flex flex-row items-center relative">
                 
                  
                  {/* Step circle */}
                  <div className={`w-5   h-5 flex items-center justify-center rounded-full z-10 text-xs font-bold
                    ${index + 1 === currentStep ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-700'}`}>
                    {index + 1}
                  </div>
                  
                  {/* Step label */}
                  <span className={`text-sm ml-2 font-medium 
                    ${index + 1 === currentStep ? 'text-gray-800' :  'text-gray-500'}`}>
                    {step}
                  </span>
                </div>
                
                {/* Chevron between steps */}
                {index < steps.length - 1 && (
                  <FaChevronRight size={12} className="mx-2 text-gray-400" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

const AIStudio2 = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedPlatform, setSelectedPlatform] = useState(null);

    const handlePlatformSelection = (platform) => {
        setSelectedPlatform(platform);
        setCurrentStep(2);
    };

    return (
        <div className="relative flex flex-col justify-center items-center w-[90%] h-full mx-auto pt-20">
            <StepIndicator currentStep={currentStep} />
            
            {currentStep === 1 && (
                <div className="md:col-span-2 rounded-lg p-6 flex flex-col">
                    <h2 className="text-3xl font-bold text-gray-700 mb-8">Select one platform to generate content</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-grow">
                        {/* Row 1 */}
                        <div 
                            className="bg-gray-200 rounded-lg p-5 hover:bg-gray-200/60 transition-all duration-200 flex flex-col relative aspect-square h-60 cursor-pointer"
                            onClick={() => handlePlatformSelection('instagram')}
                        >
                            <div>
                                <h3 className="text-lg font-medium text-gray-800">Instagram</h3>
                                <p className="text-sm text-gray-600 mt-1">Create posts, stories and reels</p>
                            </div>
                            <div className="absolute bottom-5 right-5">
                                <FaInstagram size={35} style={{ color: '#E1306C' }} />
                            </div>
                        </div>
                        
                        <div 
                            className="bg-gray-200 rounded-lg p-5 hover:bg-gray-200/60 transition-all duration-200 flex flex-col relative aspect-square h-60 cursor-pointer"
                            onClick={() => handlePlatformSelection('facebook')}
                        >
                            <div>
                                <h3 className="text-lg font-medium text-gray-800">Facebook</h3>
                                <p className="text-sm text-gray-600 mt-1">Create posts, stories and reels</p>
                            </div>
                            <div className="absolute bottom-5 right-5">
                                <FaFacebook size={35} style={{ color: '#1877F2' }} />
                            </div>
                        </div>
                        
                        <div 
                            className="bg-gray-200 rounded-lg p-5 hover:bg-gray-200/60 transition-all duration-200 flex flex-col relative aspect-square h-60 cursor-pointer"
                            onClick={() => handlePlatformSelection('tiktok')}
                        >
                            <div>
                                <h3 className="text-lg font-medium text-gray-800">TikTok</h3>
                                <p className="text-sm text-gray-600 mt-1">Create video scripts and post them</p>
                            </div>
                            <div className="absolute bottom-5 right-5">
                                <FaTiktok size={35} style={{ color: '#000000' }} />
                            </div>
                        </div>
                        
                        {/* YouTube */}
                        <div 
                            className="bg-gray-200 rounded-lg p-5 hover:bg-gray-200/60 transition-all duration-200 flex flex-col relative aspect-square h-60 cursor-pointer"
                            onClick={() => handlePlatformSelection('youtube')}
                        >
                            <div>
                                <h3 className="text-lg font-medium text-gray-800">YouTube</h3>
                                <p className="text-sm text-gray-600 mt-1">Create video scripts and post them</p>
                            </div>
                            <div className="absolute bottom-5 right-5">
                                <FaYoutube size={35} style={{ color: '#FF0000' }} />
                            </div>
                        </div>
                        
                        {/* Row 2 */}
                        <div 
                            className="bg-gray-200 rounded-lg p-5 hover:bg-gray-200/60 transition-all duration-200 flex flex-col relative aspect-square h-60 cursor-pointer"
                            onClick={() => handlePlatformSelection('threads')}
                        >
                            <div>
                                <h3 className="text-lg font-medium text-gray-800">Threads</h3>
                                <p className="text-sm text-gray-600 mt-1">Create posts</p>
                            </div>
                            <div className="absolute bottom-5 right-5">
                                <SiThreads size={35} style={{ color: '#000000' }} />
                            </div>
                        </div>
                        
                        {/* linkedin */}  
                        <div 
                            className="bg-gray-200 rounded-lg p-5 hover:bg-gray-200/60 transition-all duration-200 flex flex-col relative aspect-square h-60 cursor-pointer"
                            onClick={() => handlePlatformSelection('linkedin')}
                        >
                            <div>
                                <h3 className="text-lg  font-medium text-gray-800">LinkedIn</h3>
                                <p className="text-sm text-gray-600 mt-1">Create posts</p>
                            </div>
                            <div className="absolute bottom-5 right-5">
                                <FaLinkedin size={35} style={{ color: '#0077B5' }} />
                            </div>
                        </div>
                        
                        {/* twitter */}
                        <div 
                            className="bg-gray-200 rounded-lg p-5 hover:bg-gray-200/60 transition-all duration-200 flex flex-col relative aspect-square h-60 cursor-pointer"
                            onClick={() => handlePlatformSelection('twitter')}
                        >
                            <div>
                                <h3 className="text-lg  font-medium text-gray-800">Twitter</h3>
                                <p className="text-sm text-gray-600 mt-1">Create posts</p>
                            </div>
                            <div className="absolute bottom-5 right-5">
                                <FaTwitter size={35} style={{ color: '#1DA1F2' }} />
                            </div>
                        </div>

                        {/* Blog */}
                        <div 
                            className="bg-gray-200 rounded-lg p-5 hover:bg-gray-200/60 transition-all duration-200 flex flex-col relative aspect-square h-60 cursor-pointer"
                            onClick={() => handlePlatformSelection('blog')}
                        >
                            <div>
                                <h3 className="text-lg font-medium text-gray-800">Blog</h3>
                                <p className="text-sm text-gray-600 mt-1">Create posts</p>
                            </div>
                            <div className="absolute bottom-5 right-5">
                                <FaWordpressSimple size={35} style={{ color: '#21759B' }} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {currentStep === 2 && (
                <div className="md:col-span-3 rounded-lg p-6 flex flex-col w-full max-w-5xl mx-auto">
            
                    {/* Content for step 2 will go here */}
                    <div className="flex justify-end">
                        <button 
                            onClick={() => setCurrentStep(1)} 
                            className="px-4 py-2 text-gray-700 mr-4"
                        >
                            Back
                        </button>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6 h-[60vh] w-full">
                        {/* Type option 1 */}
                        <div className="bg-gray-200 rounded-lg p-5 hover:bg-gray-200/60 transition-all duration-200 flex flex-col relative cursor-pointer w-full">
                            <div>
                                <h3 className="text-lg font-medium text-gray-800">Post</h3>
                                <p className="text-sm text-gray-600 mt-1">Create regular posts</p>
                            </div>
                        </div>
                        
                        {/* Type option 2 */}
                        <div className="bg-gray-200 rounded-lg p-5 hover:bg-gray-200/60 transition-all duration-200 flex flex-col relative cursor-pointer w-full">
                            <div>
                                <h3 className="text-lg font-medium text-gray-800">Story</h3>
                                <p className="text-sm text-gray-600 mt-1">Create engaging stories</p>
                            </div>
                        </div>
                        
                        {/* Type option 3 */}
                        <div className="bg-gray-200 rounded-lg p-5 hover:bg-gray-200/60 transition-all duration-200 flex flex-col relative cursor-pointer w-full">
                            <div>
                                <h3 className="text-lg font-medium text-gray-800">Reel</h3>
                                <p className="text-sm text-gray-600 mt-1">Create short video content</p>
                            </div>
                        </div>
                    </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AIStudio2;
