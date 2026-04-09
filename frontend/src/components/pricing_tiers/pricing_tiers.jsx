import { Check, Sparkle, Gem, Building } from 'lucide-react';
import { AiFillTikTok } from "react-icons/ai";
import { FaFacebook, FaInstagram } from "react-icons/fa";

const API_BASE = import.meta.env.DEV ? '' : 'https://app.postwand.io';

const handleSubscribe = (plan) => {
  window.location.href = `${API_BASE}/api/create-checkout-session?plan=${plan}`;
};

const PricingTiers = () => {
  return (
    <div className="flex flex-col items-center max-w-5xl mx-auto p-6">
      <h1 className="text-4xl font-bold text-center mb-2">A simple plan for every one</h1>
      <p className="text-gray-500 mb-12">Monthly billing. Cancel anytime.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        {/* Creator */}
        <div className="border shadow-lg rounded-lg p-6 flex flex-col bg-white">
          <div className="mb-4">
            <div className="border w-8 h-8 flex items-center justify-center rounded-full mb-2">
              <Sparkle className="text-pink-500" size={18} />
            </div>
            <h2 className="text-3xl font-semibold">Creator</h2>
            <p className="text-gray-600 text-sm">For content creators</p>
          </div>

          <h3 className="text-5xl font-bold mb-6">
            $19 <span className="text-gray-500 text-lg font-normal">/month</span>
          </h3>
          <div className="mb-6">
            <button
              onClick={() => handleSubscribe('CREATOR')}
              className="w-full border border-gray-300 rounded-full py-2 mt-4 transition hover:bg-pink-500 hover:text-white"
            >
              Get started
            </button>
          </div>
          <div className="flex flex-col space-y-3 flex-grow">
            <Feature>1 account per social media
              <FaFacebook className="text-gray-500 inline-block ml-1" size={18} />
              <AiFillTikTok className="text-gray-500 inline-block ml-1" size={18} />
              <FaInstagram className="text-gray-500 inline-block ml-1" size={18} />
            </Feature>
            <Feature>Unlimited scheduled posts</Feature>
            <Feature>100 image generations</Feature>
            <Feature>100k AI-words</Feature>
            <Feature>Content calendar</Feature>
            <Feature>Direct posting to social media</Feature>
            <Feature>Photo editing tools</Feature>
            <Feature>AI Studio for creating posts</Feature>
          </div>
          <ComparisonBox />
        </div>

        {/* Manager (Popular) */}
        <div className="border-2 border-pink-500 rounded-lg p-6 flex flex-col transform md:-translate-y-4 md:scale-105 shadow-xl bg-white relative z-10">
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div className="border w-8 h-8 flex items-center justify-center rounded-full mb-2">
                <Gem className="text-pink-500" size={18} />
              </div>
              <span className="text-pink-500 text-lg font-normal border border-pink-500 rounded-full px-6 py-1">Popular</span>
            </div>
            <h2 className="text-3xl font-semibold">Manager</h2>
            <p className="text-gray-600 text-sm">For content managers</p>
          </div>

          <h3 className="text-5xl font-bold mb-6">
            $37 <span className="text-gray-500 text-lg font-normal">/month</span>
          </h3>
          <div className="mb-6">
            <button
              onClick={() => handleSubscribe('MANAGER')}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full py-2 mt-4 hover:scale-105 transition"
            >
              Get started
            </button>
          </div>
          <div className="flex flex-col space-y-3 flex-grow">
            <Feature>Unlimited accounts per social media
              <FaFacebook className="text-gray-500 inline-block ml-1" size={18} />
              <AiFillTikTok className="text-gray-500 inline-block ml-1" size={18} />
              <FaInstagram className="text-gray-500 inline-block ml-1" size={18} />
            </Feature>
            <Feature>Unlimited scheduled posts</Feature>
            <Feature>200 image generations</Feature>
            <Feature>Unlimited AI-words</Feature>
            <Feature>Content calendar</Feature>
            <Feature>Direct posting to social media</Feature>
            <Feature>Photo editing tools</Feature>
            <Feature>AI Studio for creating posts</Feature>
          </div>
          <ComparisonBox />
        </div>

        {/* Business */}
        <div className="border shadow-lg rounded-lg p-6 flex flex-col bg-white">
          <div className="mb-4">
            <div className="border w-8 h-8 flex items-center justify-center rounded-full mb-2">
              <Building className="text-pink-500" size={18} />
            </div>
            <h2 className="text-3xl font-semibold">Business</h2>
            <p className="text-gray-600 text-sm">For teams and agencies</p>
          </div>

          <h3 className="text-5xl font-bold mb-6">
            $67 <span className="text-gray-500 text-lg font-normal">/month</span>
          </h3>
          <div className="mb-6">
            <button
              onClick={() => handleSubscribe('BUSINESS')}
              className="w-full border border-gray-300 rounded-full py-2 mt-4 transition hover:bg-pink-500 hover:text-white"
            >
              Get started
            </button>
          </div>
          <div className="flex flex-col space-y-3 flex-grow">
            <Feature>Unlimited accounts per social media
              <FaFacebook className="text-gray-500 inline-block ml-1" size={18} />
              <AiFillTikTok className="text-gray-500 inline-block ml-1" size={18} />
              <FaInstagram className="text-gray-500 inline-block ml-1" size={18} />
            </Feature>
            <Feature>Unlimited scheduled posts</Feature>
            <Feature>400 image generations</Feature>
            <Feature>Unlimited AI-words</Feature>
            <Feature>Unlimited guest editors</Feature>
            <Feature>Content calendar</Feature>
            <Feature>Direct posting to social media</Feature>
            <Feature>Photo editing tools</Feature>
            <Feature>AI Studio for creating posts</Feature>
          </div>
          <ComparisonBox />
        </div>
      </div>
    </div>
  );
};

function Feature({ children }) {
  return (
    <div className="flex items-start">
      <Check className="text-pink-500 mr-2 mt-1 flex-shrink-0" size={18} />
      <span>{children}</span>
    </div>
  );
}

function ComparisonBox() {
  return (
    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
      <p className="text-sm text-gray-600 font-medium">To get the same value, you'd need:</p>
      <ul className="text-sm text-gray-600 mt-1">
        <li>Canva Pro $20</li>
        <li>ChatGPT Plus $20</li>
        <li>Hootsuite Professional $99</li>
      </ul>
    </div>
  );
}

export default PricingTiers;
