import React, { useState } from 'react';
import { Check, Circle, Rocket, Building } from 'lucide-react';
import { Sparkle} from 'lucide-react';
import { Gem } from 'lucide-react';
import { AiFillTikTok } from "react-icons/ai";
import { FaFacebook } from "react-icons/fa";
import { FaInstagram } from "react-icons/fa";
const PricingTiers = () => {
  const [isThreeMonths, setIsThreeMonths] = useState(true);
  
  // Calculate monthly and annual prices
  const prices = {
    creator: {
      monthly: 19,  // Base price
      threeMonths: 15    // With 20% discount
    },
    pro: {
      monthly: 37,  // Base price
      threeMonths: 29    // With 20% discount
    },
    business: {
          monthly: 67, // Base price
          threeMonths: 54    // With 20% discount
    }
  };
  
  return (
    <div className="flex flex-col items-center max-w-5xl mx-auto p-6">
      <h1 className="text-4xl font-bold text-center mb-2">A simple plan for every one</h1>
      
      <div className="flex items-center mb-16 mt-4">
  {/* Toggle Switch Container */}
  <div className="relative w-14 h-7 flex-shrink-0">
    {/* Background Track */}
    <div 
      className={`absolute inset-0 rounded-full transition-colors duration-300 ease-in-out ${isThreeMonths ? 'bg-pink-500' : 'bg-gray-300'}`}
    ></div>
    
    {/* Toggle Button */}
    <div 
      className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${isThreeMonths ? 'translate-x-7' : 'translate-x-0'}`}
      onClick={() => setIsThreeMonths(!isThreeMonths)}
    ></div>
    
    {/* Clickable Area (covers the whole toggle) */}
    <div 
      className="absolute inset-0 cursor-pointer z-10"
      onClick={() => setIsThreeMonths(!isThreeMonths)}
    ></div>
  </div>
  
  {/* Label - Fixed width to prevent movement */}
  <div className="ml-3 w-44 flex-shrink-0">
    <span className="text-gray-700 text-md font-medium">{isThreeMonths ? 'Billed every 3 months' : 'Billed monthly'}</span>
  </div>
  
  {/* Discount Badge - Absolute positioning */}
  <div className="relative flex-shrink-0">
    <span 
      className={`ml-2 bg-pink-100 text-pink-500 px-3 py-2 text-lg font-semibold rounded-lg transition-opacity duration-300 ${isThreeMonths ? 'opacity-100' : 'opacity-0'}`}
    >
      20% off
    </span>
  </div>
</div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        {/* Lite Plan */}
        <div className="border shadow-lg rounded-lg p-6 flex flex-col bg-white">
          <div className="mb-4">
            <div className="border w-8 h-8 flex items-center justify-center rounded-full mb-2">
              <Sparkle className='text-pink-500' size={18} />
            </div>
            <h2 className="text-3xl font-semibold">Creator</h2>
            <p className="text-gray-600 text-sm">For content creators</p>
          </div>
          
          <h3 className="text-5xl font-bold mb-6">${isThreeMonths ? prices.creator.threeMonths : prices.creator.monthly} <span className="text-gray-500 text-lg font-normal">/month</span></h3>
          <div className="mb-6">
            
            <button className="w-full border border-gray-300 rounded-full py-2 mt-4 transition hover:bg-pink-500 hover:text-white">
              Start 7-day free trail    
            </button>
            <p className="text-xs text-center text-gray-500 mt-2">No card required</p>
          </div>
          <div className="flex flex-col space-y-3 flex-grow">
          <div className="flex items-start">
              <Check className="text-pink-500 mr-2 mt-1 flex-shrink-0" size={18} />
              <span>1 account per social media <br></br>
                <FaFacebook className='text-gray-500 inline-block ml-1' size={18} />
              <AiFillTikTok className='text-gray-500 inline-block ml-1' size={18} />
              <FaInstagram className='text-gray-500 inline-block ml-1' size={18} />
              </span>
            </div>
          <div className="flex items-start">
                <Check className="text-pink-500 mr-2 mt-1 flex-shrink-0" size={18} />
              <span>Unlimited scheduled posts</span>
            </div>
            <div className="flex items-start">
              <Check className="text-pink-500 mr-2 mt-1 flex-shrink-0" size={18} />
              <span>100 image generations</span>
            </div>
            <div className="flex items-start">
              <Check className="text-pink-500 mr-2 mt-1 flex-shrink-0" size={18} />
              <span>100k AI-words</span>
            </div>
          
            <div className="flex items-start">
              <Check className="text-pink-500 mr-2 mt-1 flex-shrink-0" size={18} />
              <span>Content calendar</span>
            </div>
            <div className="flex items-start">
              <Check className="text-pink-500 mr-2 mt-1 flex-shrink-0" size={18} />
              <span>Direct posting to social media platforms</span>
            </div>
            <div className="flex items-start">
              <Check className="text-pink-500 mr-2 mt-1 flex-shrink-0" size={18} />
              <span>Photo editing tools</span>
            </div>
            <div className="flex items-start">
              <Check className="text-pink-500 mr-2 mt-1 flex-shrink-0" size={18} />
              <span>Ai Studio for creating posts</span>
            </div>
            
          </div>
          
         
          
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 font-medium">To get the same value, you'd need:</p>
            <ul className="text-sm text-gray-600 mt-1">
              <li>Canva Pro 20$</li>
              <li>ChatGPT Plus $20</li>
              <li>Hootsuite Professional $99</li>
            </ul>
          </div>
        </div>
        
        {/* Pro Plan - Made taller and more prominent */}
        <div className="border-2 border-pink-500 rounded-lg p-6 flex flex-col transform md:-translate-y-4 md:scale-105 shadow-xl bg-white relative z-10">
          <div className="mb-4">
            <div className='flex items-center justify-between'>
              <div className="border w-8 h-8 flex items-center justify-center rounded-full mb-2">
                <Gem className='text-pink-500' size={18} />
              </div>
              <h1 className='text-pink-500 text-lg font-normal ml-2 border border-pink-500 rounded-full px-6 py-1'>Popular</h1>
            </div>
              <h2 className="text-3xl font-semibold">Manager</h2>
            <p className="text-gray-600 text-sm">For content managers</p>
          </div>
          
          <h3 className="text-5xl font-bold mb-6">${isThreeMonths ? prices.pro.threeMonths : prices.pro.monthly} <span className="text-gray-500 text-lg font-normal">/month</span></h3>
          <div className="mb-6">
            
            <button className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full py-2 mt-4 hover:scale-105 transition">
              Start 7-day free trail
            </button>
            <p className="text-xs text-center text-gray-500 mt-2">No card required</p>
          </div>
          <div className="flex flex-col space-y-3 flex-grow">
            <div className="flex items-start">
                    <Check className="text-pink-500 mr-2 mt-1 flex-shrink-0" size={18} />
              <span>Unlimited accounts per social media
                <FaFacebook className='text-gray-500 inline-block ml-1' size={18} />
              <AiFillTikTok className='text-gray-500 inline-block ml-1' size={18} />
              <FaInstagram className='text-gray-500 inline-block ml-1' size={18} />
              </span>
            </div>
            <div className="flex items-start">
                <Check className="text-pink-500 mr-2 mt-1 flex-shrink-0" size={18} />
              <span>Unlimited scheduled posts</span>
            </div>
            <div className="flex items-start">
              <Check className="text-pink-500 mr-2 mt-1 flex-shrink-0" size={18} />
              <span>200 image generations</span>
            </div>
            <div className="flex items-start">
                <Check className="text-pink-500 mr-2 mt-1 flex-shrink-0" size={18} />
              <span>Unlimited AI-words</span>
            </div>
        
            <div className="flex items-start">
              <Check className="text-pink-500 mr-2 mt-1 flex-shrink-0" size={18} />
              <span>Content calendar</span>
            </div>
            <div className="flex items-start">
              <Check className="text-pink-500 mr-2 mt-1 flex-shrink-0" size={18} />
              <span>Direct posting to social media platforms</span>
            </div>
            <div className="flex items-start">
              <Check className="text-pink-500 mr-2 mt-1 flex-shrink-0" size={18} />
              <span>Photo editing tools</span>
            </div>
            <div className="flex items-start">
              <Check className="text-pink-500 mr-2 mt-1 flex-shrink-0" size={18} />
              <span>Ai Studio for creating posts</span>
            </div>
            
          </div>
          
        
          
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 font-medium">To get the same value, you'd need:</p>
            <ul className="text-sm text-gray-600 mt-1">
              <li>Canva Pro 20$</li>
              <li>ChatGPT Plus $20</li>
              <li>Hootsuite Professional $99</li>
            </ul>
          </div>
        </div>
        
        {/* Enterprise Plan */}
        <div className="border shadow-lg rounded-lg p-6 flex flex-col bg-white">
          <div className="mb-4">
            <div className="border w-8 h-8 flex items-center justify-center rounded-full mb-2">
              <Building className='text-pink-500' size={18} />
            </div>
            <h2 className="text-3xl font-semibold">Business</h2>
            <p className="text-gray-600 text-sm">For teams and agencies</p>
          </div>
          
            <h3 className="text-5xl font-bold mb-6">${isThreeMonths ? prices.business.threeMonths : prices.business.monthly} <span className="text-gray-500 text-lg font-normal">/month</span></h3>
            <div className="mb-6">
            
            <button className="w-full border border-gray-300 rounded-full py-2 mt-4 transition hover:bg-pink-500 hover:text-white">
                Start 7-day free trail
              </button>
              <p className="text-xs text-center text-gray-500 mt-2">No card required</p>
            </div>
          <div className="flex flex-col space-y-3 flex-grow">
            <div className="flex items-start">
              <Check className="text-pink-500 mr-2 mt-1 flex-shrink-0" size={18} />
              <span>Unlimited accounts per social media
                  <FaFacebook className='text-gray-500 inline-block ml-1' size={18} />  
              <AiFillTikTok className='text-gray-500 inline-block ml-1' size={18} />
              <FaInstagram className='text-gray-500 inline-block ml-1' size={18} />
              </span>
            </div>
            <div className="flex items-start">
              <Check className="text-pink-500 mr-2 mt-1 flex-shrink-0" size={18} />
              <span>Unlimited scheduled posts</span>
            </div>
            <div className="flex items-start">
              <Check className="text-pink-500 mr-2 mt-1 flex-shrink-0" size={18} />
              <span>400 image generations</span>
            </div>
            <div className="flex items-start">
              <Check className="text-pink-500 mr-2 mt-1 flex-shrink-0" size={18} />
              <span>Unlimited AI-words</span>
            </div>
            <div className="flex items-start">
              <Check className="text-pink-500 mr-2 mt-1 flex-shrink-0" size={18} />
              <span>Unlimited guest editors</span>
            </div>
         
            <div className="flex items-start">
              <Check className="text-pink-500 mr-2 mt-1 flex-shrink-0" size={18} />
              <span>Content calendar</span>
            </div>
            <div className="flex items-start">
              <Check className="text-pink-500 mr-2 mt-1 flex-shrink-0" size={18} />
              <span>Direct posting to social media platforms</span>
            </div>
            <div className="flex items-start">
              <Check className="text-pink-500 mr-2 mt-1 flex-shrink-0" size={18} />
              <span>Photo editing tools</span>
            </div>
            <div className="flex items-start">
              <Check className="text-pink-500 mr-2 mt-1 flex-shrink-0" size={18} />
              <span>Ai Studio for creating posts</span>
            </div>
          </div>
          
          
          
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 font-medium">To get the same value, you'd need:</p>
            <ul className="text-sm text-gray-600 mt-1">
              <li>Canva Pro 20$</li>
              <li>ChatGPT Plus $20</li>
              <li>Hootsuite Professional $99</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    
  );
};

export default PricingTiers;