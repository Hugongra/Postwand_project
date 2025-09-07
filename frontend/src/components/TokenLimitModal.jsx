import React, { useState, useEffect } from 'react';
import { Check, X, Circle, Rocket, Building, LogOut } from 'lucide-react';



import { useNavigate } from 'react-router-dom';
import InstagramIcon from '/SM_icons/instagram.svg';
import TiktokIcon from '/SM_icons/tiktok.svg';
import FacebookIcon from '/SM_icons/facebook.svg';
import LinkedinIcon from '/SM_icons/linkedin.svg';
import XIcon from '/SM_icons/x.svg';
import YoutubeIcon from '/SM_icons/youtube.svg';
import WordpressIcon from '/SM_icons/wordpress.svg';
const TokenLimitModal = ({ isOpen, onClose, isTrialExpired = true, onLogout }) => {
  const [isThreeMonths, setIsThreeMonths] = useState(true);
  const navigate = useNavigate();
  
  // Add console log to track when the modal is opened or closed
  useEffect(() => {
    console.log("TokenLimitModal isOpen:", isOpen);
  }, [isOpen]);
  
  // Calculate monthly and annual prices
  const prices = {
    creator: {
      monthly: 17,  
      threeMonths: 14   
    },
    pro: {
      monthly: 34,
      threeMonths: 27    
    },
    business: {
      monthly: 68, 
      threeMonths: 55   
    }
  };

  if (!isOpen) return null;
  
  console.log("TokenLimitModal is rendering");

  const handleUpgrade = () => {
    navigate('/checkout');
 
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full h-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 h-full flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              {isTrialExpired ? "Your Free Trial Has Expired" : "Monthly Token Limit Reached"}
            </h2>
            <div className="flex items-center">
              {!isTrialExpired && (
                <button 
                  onClick={onClose} 
                  className="text-gray-500 hover:text-gray-700 mr-2"
                >
                  <X size={20} />
                </button>
              )}
              <button 
                onClick={handleLogout}
                className="flex items-center text-gray-500 hover:text-black border border-gray-300 rounded-lg px-3 py-2"
              >
                <LogOut size={18} className="mr-1" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </div>
          
          <div className="flex justify-between items-center mb-6">
            <p className="text-md text-gray-700">
              {isTrialExpired 
                ? "Subscribe to one of our plans to continue using Postwand."
                : "You've reached your monthly token usage limit. Upgrade your plan to continue using AI features."
              }
            </p>
            
            {/* Toggle Switch */}
            <div className="flex items-center">
              <div className="relative w-12 h-6 flex-shrink-0">
                <div 
                  className={`absolute inset-0 rounded-full transition-colors duration-300 ease-in-out ${isThreeMonths ? 'bg-pink-500' : 'bg-gray-300'}`}
                ></div>
                <div 
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${isThreeMonths ? 'translate-x-6' : 'translate-x-0'}`}
                ></div>
                <div 
                  className="absolute inset-0 cursor-pointer z-10"
                  onClick={() => setIsThreeMonths(!isThreeMonths)}
                ></div>
              </div>
              <div className="ml-3 flex-shrink-0">
                <span className="text-gray-700 text-xs font-medium">
                  {isThreeMonths ? 'Billed every 3 months' : 'Billed monthly'}
                </span>
              </div>
              <div className="relative flex-shrink-0">
                <span 
                  className={`ml-2 bg-pink-100 text-pink-500 px-2 py-1 text-xs font-semibold rounded-lg transition-opacity duration-300 ${isThreeMonths ? 'opacity-100' : 'opacity-0'}`}
                >
                  20% off
                </span>
              </div>
            </div>
          </div>
          
          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full flex-grow">
            {/* Creator Plan */}
            <div className="border shadow-lg rounded-lg p-4 flex flex-col bg-white h-full">
              <div className="mb-3">
               
                <h2 className="text-xl font-semibold">Creator</h2>
                <p className="text-gray-600 text-xs">For content creators</p>
              </div>
              
              <h3 className="text-3xl font-bold mb-3">${isThreeMonths ? prices.creator.threeMonths : prices.creator.monthly} <span className="text-gray-500 text-sm font-normal">/month</span></h3>
              <div className="mb-3">
                
  
              </div>
              <div className="flex flex-col space-y-3 flex-grow">
                <div className="flex items-start">
                  <Check className="text-pink-500 mr-1.5 mt-0.5 flex-shrink-0" size={14} />
                  <span className="text-xs">1 account per social media <br></br>
                    <img src={FacebookIcon} alt="Facebook" className='inline-block ml-1 w-3 h-3' />
                    <img src={LinkedinIcon} alt="Linkedin" className='inline-block ml-1 w-3 h-3'  />
                    <img src={InstagramIcon} alt="Instagram" className='inline-block ml-1 w-3 h-3' />
                  </span>
                </div>
                <div className="flex items-start">
                  <Check className="text-pink-500 mr-1.5 mt-0.5 flex-shrink-0" size={14} />
                  <span className="text-xs">Unlimited scheduled posts</span>
                </div>
                <div className="flex items-start">
                  <Check className="text-pink-500 mr-1.5 mt-0.5 flex-shrink-0" size={14} />
                  <span className="text-xs">100 image generations</span>
                </div>
                <div className="flex items-start">
                  <Check className="text-pink-500 mr-1.5 mt-0.5 flex-shrink-0" size={14} />
                  <span className="text-xs">100k AI-words</span>
                </div>
              
                <div className="flex items-start">
                  <Check className="text-pink-500 mr-1.5 mt-0.5 flex-shrink-0" size={14} />
                  <span className="text-xs">Content calendar</span>
                </div>
                <div className="flex items-start">
                  <Check className="text-pink-500 mr-1.5 mt-0.5 flex-shrink-0" size={14} />
                  <span className="text-xs">Direct posting to social media platforms</span>
                </div>
                <div className="flex items-start">
                  <Check className="text-pink-500 mr-1.5 mt-0.5 flex-shrink-0" size={14} />
                  <span className="text-xs">Photo editing tools</span>
                </div>
                <div className="flex items-start">
                  <Check className="text-pink-500 mr-1.5 mt-0.5 flex-shrink-0" size={14} />
                  <span className="text-xs">Ai Studio for creating posts</span>
                </div>
              </div>
              <button 
                  onClick={handleUpgrade}
                  className="w-full font-semibold text-black border border-gray-300 rounded-lg p-2 mt-2 text-[15px] transition hover:bg-pink-500 hover:text-white">
                    Subscribe   
                </button>
        
            </div>
            
            {/* Pro Plan */}
            <div className="border-2 border-pink-500 rounded-lg p-4 flex flex-col shadow-lg bg-white relative z-10 h-full">
              <div className="mb-3">
                
                <h2 className="text-xl font-semibold">Manager</h2>
                <p className="text-gray-600 text-xs">For content managers</p>
              </div>
              
              <h3 className="text-3xl font-bold mb-3">${isThreeMonths ? prices.pro.threeMonths : prices.pro.monthly} <span className="text-gray-500 text-sm font-normal">/month</span></h3>
              <div className="mb-3">
          
              </div>
              <div className="flex flex-col space-y-3 flex-grow">
                <div className="flex items-start">
                  <Check className="text-pink-500 mr-1.5 mt-0.5 flex-shrink-0" size={14} />
                  <span className="text-xs">Unlimited accounts per social media <br></br> 
                    <img src={FacebookIcon} alt="Facebook" className='inline-block ml-1 w-3 h-3' />
                    <img src={LinkedinIcon} alt="Linkedin" className='inline-block ml-1 w-3 h-3' />
                    <img src={InstagramIcon} alt="Instagram" className='inline-block ml-1 w-3 h-3' />
                  </span>
                </div>
                <div className="flex items-start">
                  <Check className="text-pink-500 mr-1.5 mt-0.5 flex-shrink-0" size={14} />
                  <span className="text-xs">Unlimited scheduled posts</span>
                </div>
                <div className="flex items-start">
                  <Check className="text-pink-500 mr-1.5 mt-0.5 flex-shrink-0" size={14} />
                  <span className="text-xs">200 image generations</span>
                </div>
                <div className="flex items-start">
                  <Check className="text-pink-500 mr-1.5 mt-0.5 flex-shrink-0" size={14} />
                  <span className="text-xs">Unlimited AI-words</span>
                </div>
            
                <div className="flex items-start">
                  <Check className="text-pink-500 mr-1.5 mt-0.5 flex-shrink-0" size={14} />
                  <span className="text-xs">Content calendar</span>
                </div>
                <div className="flex items-start">
                  <Check className="text-pink-500 mr-1.5 mt-0.5 flex-shrink-0" size={14} />
                  <span className="text-xs">Direct posting to social media platforms</span>
                </div>
                <div className="flex items-start">
                  <Check className="text-pink-500 mr-1.5 mt-0.5 flex-shrink-0" size={14} />
                  <span className="text-xs">Photo editing tools</span>
                </div>
                <div className="flex items-start">
                  <Check className="text-pink-500 mr-1.5 mt-0.5 flex-shrink-0" size={14} />
                  <span className="text-xs">Ai Studio for creating posts</span>
                </div>
              </div>
              <button 
                  onClick={handleUpgrade}
                  className="w-full font-semibold text-black border border-gray-300 rounded-lg p-2 mt-2 text-[15px] transition hover:bg-pink-500 hover:text-white">
                  Subscribe   
                </button>
           
            </div>
            
            {/* Enterprise Plan */}
            <div className="border shadow-lg rounded-lg p-4 flex flex-col bg-white h-full">
              <div className="mb-3">
               
                <h2 className="text-xl font-semibold">Business</h2>
                <p className="text-gray-600 text-xs">For teams and agencies</p>
              </div>
              
              <h3 className="text-3xl font-bold mb-3">${isThreeMonths ? prices.business.threeMonths : prices.business.monthly} <span className="text-gray-500 text-sm font-normal">/month</span></h3>
              <div className="mb-3">
                
             
              </div>
              <div className="flex flex-col space-y-3 flex-grow">
                <div className="flex items-start">
                  <Check className="text-pink-500 mr-1.5 mt-0.5 flex-shrink-0" size={14} />
                  <span className="text-xs">Unlimited accounts per social media <br></br> 
                    <img src={FacebookIcon} alt="Facebook" className='inline-block ml-1 w-3 h-3' />  
                    <img src={LinkedinIcon} alt="Linkedin" className='inline-block ml-1 w-3 h-3' />
                    <img src={InstagramIcon} alt="Instagram" className='inline-block ml-1 w-3 h-3' />
                  </span>
                </div>
                <div className="flex items-start">
                  <Check className="text-pink-500 mr-1.5 mt-0.5 flex-shrink-0" size={14} />
                  <span className="text-xs">Unlimited scheduled posts</span>
                </div>
                <div className="flex items-start">
                  <Check className="text-pink-500 mr-1.5 mt-0.5 flex-shrink-0" size={14} />
                  <span className="text-xs">400 image generations</span>
                </div>
                <div className="flex items-start">
                  <Check className="text-pink-500 mr-1.5 mt-0.5 flex-shrink-0" size={14} />
                  <span className="text-xs">Unlimited AI-words</span>
                </div>
                <div className="flex items-start">
                  <Check className="text-pink-500 mr-1.5 mt-0.5 flex-shrink-0" size={14} />
                  <span className="text-xs">Unlimited guest editors</span>
                </div>
             
                <div className="flex items-start">
                  <Check className="text-pink-500 mr-1.5 mt-0.5 flex-shrink-0" size={14} />
                  <span className="text-xs">Content calendar</span>
                </div>
                <div className="flex items-start">
                  <Check className="text-pink-500 mr-1.5 mt-0.5 flex-shrink-0" size={14} />
                  <span className="text-xs">Direct posting to social media platforms</span>
                </div>
                <div className="flex items-start">
                  <Check className="text-pink-500 mr-1.5 mt-0.5 flex-shrink-0" size={14} />
                  <span className="text-xs">Photo editing tools</span>
                </div>
                <div className="flex items-start">
                  <Check className="text-pink-500 mr-1.5 mt-0.5 flex-shrink-0" size={14} />
                  <span className="text-xs">Ai Studio for creating posts</span>
                </div>
              </div>
              <button 
                  onClick={handleUpgrade}
                  className="w-full font-semibold text-black border border-gray-300 rounded-lg p-2 mt-2 text-[15px] transition hover:bg-pink-500 hover:text-white">
                  Subscribe   
                </button>              
           
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenLimitModal; 