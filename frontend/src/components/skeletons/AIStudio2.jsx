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
        <div className="w-full py-4 pr-2 mx-auto bg-[#F8F5FA] min-h-screen overflow-x-hidden">
        <div className="h-28 flex flex-col p-4 mb-1 rounded-lg bg-[#F8F9FA] relative">
                <h1 className="text-3xl font-medium text-pink-500">
                   AI Studio
                </h1>
                <p className="text-gray-500 text-md mt-1">Create your post with AI studio</p>
                
                
            </div>
        
        <div className="relative flex flex-col justify-center items-center w-[90%] h-full mx-auto">
            
        
            
                <div className="md:col-span-3 rounded-lg p-6 flex flex-col w-[80%] mx-auto">
            
                  
            
                    <div className="flex">
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[60vh] w-full">
                        {/* Type option 1 */}
                        <div className="bg-gray-200/50 rounded-lg p-5 hover:bg-gray-200/60 transition-all duration-200 flex flex-col relative cursor-pointer w-full">
                            <div>
                                <h3 className="text-lg font-medium text-gray-800">Generate Images</h3>
                                <p className="text-sm text-gray-600 mt-1">Create regular posts</p>
                            </div>
                        </div>
                        
                        {/* Type option 2 */}
                        <div className="bg-gray-200/50 rounded-lg p-5 hover:bg-gray-200/60 transition-all duration-200 flex flex-col relative cursor-pointer w-full">
                            <div>
                                <h3 className="text-lg font-medium text-gray-800">Generate Captions</h3>
                                <p className="text-sm text-gray-600 mt-1">Create engaging stories</p>
                            </div>
                        </div>
                        
                        {/* Type option 3 */}
                        <div className="bg-gray-200/50 rounded-lg p-5 hover:bg-gray-200/60 transition-all duration-200 flex flex-col relative cursor-pointer w-full">
                            <div>
                                <h3 className="text-lg font-medium text-gray-800">Generate Post</h3>
                                <p className="text-sm text-gray-600 mt-1">Create short video content</p>
                            </div>
                        </div>
                    </div>
                    </div>
                </div>
           
        </div>
        </div>
    );
};

export default AIStudio2;
