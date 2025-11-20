import React, { useState, useEffect } from 'react';
import { Check, X, Circle, Rocket, Building, LogOut } from 'lucide-react';
import { API_BASE_URL } from '@services/api/config_url.js';

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
  
  // Define pricing plans with their benefits
  const plans = [
    {
      id: 'CREATOR',
      name: 'Creator',
      description: 'For content creators',
      prices: {
        monthly: 17,
        threeMonths: 14
      },
      highlighted: false,
      benefits: [
        { 
          text: '1 account per social media',
          icons: [FacebookIcon, LinkedinIcon, InstagramIcon]
        },
        { text: 'Unlimited scheduled posts' },
        { text: '100 image generations' },
        { text: '100k AI-words' },
        { text: 'Content calendar' },
        { text: 'Direct posting to social media platforms' },
        { text: 'Photo editing tools' },
        { text: 'Ai Studio for creating posts' }
      ]
    },
    {
      id: 'MANAGER',
      name: 'Manager',
      description: 'For content managers',
      prices: {
        monthly: 34,
        threeMonths: 27
      },
      highlighted: true,
      benefits: [
        { 
          text: 'Unlimited accounts per social media',
          icons: [FacebookIcon, LinkedinIcon, InstagramIcon]
        },
        { text: 'Unlimited scheduled posts' },
        { text: '200 image generations' },
        { text: 'Unlimited AI-words' },
        { text: 'Content calendar' },
        { text: 'Direct posting to social media platforms' },
        { text: 'Photo editing tools' },
        { text: 'Ai Studio for creating posts' }
      ]
    },
    {
      id: 'BUSINESS',
      name: 'Business',
      description: 'For teams and agencies',
      prices: {
        monthly: 68,
        threeMonths: 55
      },
      highlighted: false,
      benefits: [
        { 
          text: 'Unlimited accounts per social media',
          icons: [FacebookIcon, LinkedinIcon, InstagramIcon]
        },
        { text: 'Unlimited scheduled posts' },
        { text: '400 image generations' },
        { text: 'Unlimited AI-words' },
        { text: 'Unlimited guest editors' },
        { text: 'Content calendar' },
        { text: 'Direct posting to social media platforms' },
        { text: 'Photo editing tools' },
        { text: 'Ai Studio for creating posts' }
      ]
    }
  ];

  if (!isOpen) return null;
  
  console.log("TokenLimitModal is rendering");

  const handleUpgrade = (planType) => {
    const interval = isThreeMonths ? '3_months' : 'monthly';
    
    // Redirect to the checkout session endpoint
    window.location.href = `${API_BASE_URL}/api/create-checkout-session?plan=${planType}&interval=${interval}`;
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
            {plans.map((plan) => (
              <div 
                key={plan.id}
                className={`${
                  plan.highlighted 
                    ? 'border-2 border-pink-500' 
                    : 'border'
                } shadow-lg rounded-lg p-4 flex flex-col bg-white ${
                  plan.highlighted ? 'relative z-10' : ''
                } h-full`}
              >
                <div className="mb-3">
                  <h2 className="text-xl font-semibold">{plan.name}</h2>
                  <p className="text-gray-600 text-xs">{plan.description}</p>
                </div>
                
                <h3 className="text-3xl font-bold mb-3">
                  ${isThreeMonths ? plan.prices.threeMonths : plan.prices.monthly}{' '}
                  <span className="text-gray-500 text-sm font-normal">/month</span>
                </h3>
                
                <div className="flex flex-col space-y-3 flex-grow">
                  {plan.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start">
                      <Check className="text-pink-500 mr-1.5 mt-0.5 flex-shrink-0" size={14} />
                      <span className="text-xs">
                        {benefit.text}
                        {benefit.icons && (
                          <>
                            <br />
                            {benefit.icons.map((icon, iconIndex) => (
                              <img 
                                key={iconIndex}
                                src={icon} 
                                alt={`Social media icon ${iconIndex}`} 
                                className='inline-block ml-1 w-3 h-3' 
                              />
                            ))}
                          </>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
                
                <button 
                  onClick={() => handleUpgrade(plan.id)}
                  className="w-full font-semibold text-black border border-gray-300 rounded-lg p-2 mt-2 text-[15px] transition hover:bg-pink-500 hover:text-white"
                >
                  Subscribe   
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenLimitModal; 