import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-6 flex items-center">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-purple-700 hover:text-purple-900 transition-colors mr-4"
        >
          <ArrowLeft size={20} className="mr-1" />
          Back
        </button>
        <h1 className="text-3xl font-bold text-purple-900">PRIVACY POLICY</h1>
      </div>
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <p className="mb-4 text-gray-600 italic">Last updated April 01, 2025</p>
        
        <p className="mb-6">
          This Privacy Notice for POSTWAND LLC ("we," "us," or "our"), describes how and why we might access, collect, store, use, and/or share ("process") your personal information when you use our services ("Services"), including when you:
        </p>
        
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li>Download and use our Facebook application (postwand), or any other application of ours that links to this Privacy Notice</li>
          <li>Engage with us in other related ways, including any sales, marketing, or events</li>
        </ul>
        
        <p className="mb-6 font-medium">
          Questions or concerns? Reading this Privacy Notice will help you understand your privacy rights and choices. If you still have any questions or concerns, please contact us at <a href="mailto:albert@postwand.io" className="text-purple-600 hover:underline">albert@postwand.io</a>.
        </p>
        
        <div className="bg-purple-50 p-4 rounded-md mb-8">
          <h2 className="text-xl font-bold mb-4 text-purple-800">SUMMARY OF KEY POINTS</h2>
          <ul className="space-y-3">
            <li><strong>What personal information do we process?</strong> We collect personal information you provide to us, such as names, email addresses, passwords, payment information, and job titles.</li>
            <li><strong>Do we process any sensitive personal information?</strong> We do not process sensitive personal information.</li>
            <li><strong>Do we collect any information from third parties?</strong> We do not collect any information from third parties.</li>
            <li><strong>How do we process your information?</strong> We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law.</li>
            <li><strong>When and with whom do we share your personal information?</strong> We may share information in specific situations and with specific third parties.</li>
            <li><strong>How do we keep your information safe?</strong> We have organizational and technical processes to protect your personal information.</li>
            <li><strong>What are your rights?</strong> Depending on your location, you may have certain rights regarding your personal information.</li>
            <li><strong>How do you exercise your rights?</strong> The easiest way is by submitting a data subject access request or by contacting us.</li>
          </ul>
        </div>
        
        <h2 className="text-xl font-bold mt-8 mb-4 text-purple-800">TABLE OF CONTENTS</h2>
        <ol className="list-decimal pl-6 mb-8 space-y-1">
          <li>WHAT INFORMATION DO WE COLLECT?</li>
          <li>HOW DO WE PROCESS YOUR INFORMATION?</li>
          <li>WHAT LEGAL BASES DO WE RELY ON TO PROCESS YOUR PERSONAL INFORMATION?</li>
          <li>WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</li>
          <li>DO WE USE COOKIES AND OTHER TRACKING TECHNOLOGIES?</li>
          <li>DO WE OFFER ARTIFICIAL INTELLIGENCE-BASED PRODUCTS?</li>
          <li>HOW DO WE HANDLE YOUR SOCIAL LOGINS?</li>
          <li>HOW LONG DO WE KEEP YOUR INFORMATION?</li>
          <li>HOW DO WE KEEP YOUR INFORMATION SAFE?</li>
          <li>DO WE COLLECT INFORMATION FROM MINORS?</li>
          <li>WHAT ARE YOUR PRIVACY RIGHTS?</li>
          <li>CONTROLS FOR DO-NOT-TRACK FEATURES</li>
          <li>DO UNITED STATES RESIDENTS HAVE SPECIFIC PRIVACY RIGHTS?</li>
          <li>DO WE MAKE UPDATES TO THIS NOTICE?</li>
          <li>HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</li>
          <li>HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?</li>
        </ol>
        
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-bold mb-3 text-purple-800">1. WHAT INFORMATION DO WE COLLECT?</h2>
            <p className="mb-3 font-medium">Personal information you disclose to us</p>
            <p className="mb-3">We collect personal information that you voluntarily provide to us when you register on the Services, express an interest in obtaining information about us or our products and Services, when you participate in activities on the Services, or otherwise when you contact us.</p>
            
            <p className="mb-2 font-medium">Personal Information Provided by You:</p>
            <p className="mb-3">The personal information we collect may include:</p>
            <ul className="list-disc pl-6 mb-3 space-y-1">
              <li>Names</li>
              <li>Email addresses</li>
              <li>Passwords</li>
              <li>Debit/credit card numbers</li>
              <li>Job titles</li>
            </ul>
            
            <p className="mb-3"><strong>Payment Data.</strong> We may collect data necessary to process your payment if you choose to make purchases. All payment data is handled and stored by Stripe.</p>
            
            <p className="mb-3"><strong>Social Media Login Data.</strong> We may provide you with the option to register with us using your existing social media account details, like your Facebook or X logins.</p>
            
            <p className="mb-3"><strong>Application Data.</strong> If you use our application(s), we may collect:</p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>Geolocation Information</li>
              <li>Push Notifications</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-bold mb-3 text-purple-800">2. HOW DO WE PROCESS YOUR INFORMATION?</h2>
            <p className="mb-3">We process your personal information for a variety of reasons, including:</p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>To facilitate account creation and authentication</li>
              <li>To deliver and facilitate delivery of services to the user</li>
              <li>To send administrative information to you</li>
              <li>To enable user-to-user communications</li>
              <li>To save or protect an individual's vital interest</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-bold mb-3 text-purple-800">3. WHAT LEGAL BASES DO WE RELY ON TO PROCESS YOUR PERSONAL INFORMATION?</h2>
            <p className="mb-3">We may rely on the following legal bases to process your personal information:</p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>Consent</li>
              <li>Performance of a Contract</li>
              <li>Legal Obligations</li>
              <li>Vital Interests</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-bold mb-3 text-purple-800">4. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</h2>
            <p className="mb-3">We may share information in specific situations, such as:</p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>Business Transfers</li>
              <li>When we use Google Maps Platform APIs</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-bold mb-3 text-purple-800">5. DO WE USE COOKIES AND OTHER TRACKING TECHNOLOGIES?</h2>
            <p className="mb-4">We may use cookies and similar tracking technologies to gather information when you interact with our Services.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-bold mb-3 text-purple-800">6. DO WE OFFER ARTIFICIAL INTELLIGENCE-BASED PRODUCTS?</h2>
            <p className="mb-4">We offer products, features, or tools powered by artificial intelligence, machine learning, or similar technologies.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-bold mb-3 text-purple-800">7. HOW DO WE HANDLE YOUR SOCIAL LOGINS?</h2>
            <p className="mb-4">If you choose to register or log in to our Services using a social media account, we may have access to certain information about you.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-bold mb-3 text-purple-800">8. HOW LONG DO WE KEEP YOUR INFORMATION?</h2>
            <p className="mb-4">We will only keep your personal information for as long as it is necessary for the purposes set out in this Privacy Notice.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-bold mb-3 text-purple-800">9. HOW DO WE KEEP YOUR INFORMATION SAFE?</h2>
            <p className="mb-4">We have implemented appropriate and reasonable technical and organizational security measures designed to protect the security of any personal information we process.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-bold mb-3 text-purple-800">10. DO WE COLLECT INFORMATION FROM MINORS?</h2>
            <p className="mb-4">We do not knowingly collect data from or market to children under 18 years of age.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-bold mb-3 text-purple-800">11. WHAT ARE YOUR PRIVACY RIGHTS?</h2>
            <p className="mb-4">Depending on where you are located geographically, you may have certain rights regarding your personal information.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-bold mb-3 text-purple-800">12. CONTROLS FOR DO-NOT-TRACK FEATURES</h2>
            <p className="mb-4">We do not currently respond to DNT browser signals or any other mechanism that automatically communicates your choice not to be tracked online.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-bold mb-3 text-purple-800">13. DO UNITED STATES RESIDENTS HAVE SPECIFIC PRIVACY RIGHTS?</h2>
            <p className="mb-4">If you are a resident of certain US states, you may have additional privacy rights.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-bold mb-3 text-purple-800">14. DO WE MAKE UPDATES TO THIS NOTICE?</h2>
            <p className="mb-4">Yes, we will update this notice as necessary to stay compliant with relevant laws.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-bold mb-3 text-purple-800">15. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</h2>
            <p className="mb-3">If you have questions or comments about this notice, you may email us at <a href="mailto:albert@postwand.io" className="text-purple-600 hover:underline">albert@postwand.io</a> or contact us by post at:</p>
            <div className="mb-4 pl-4 border-l-2 border-purple-200">
              <p>POSTWAND LLC</p>
              <p>32 N GOULD ST</p>
              <p>SHERIDAN, WYOMING, 82801</p>
              <p>UNITED STATES</p>
            </div>
          </section>
          
          <section>
            <h2 className="text-xl font-bold mb-3 text-purple-800">16. HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?</h2>
            <p className="mb-4">Based on the applicable laws of your country or state of residence in the US, you may have the right to request access to, update, or delete your personal information. To request to review, update, or delete your personal information, please fill out and submit a data subject access request.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3 text-purple-800">17. DELETION OF META RELATED DATA?</h2>
            <p className="mb-4">The user will be able to delete their meta related data by going to the profiñe and clicking on the "DELELTE MY DATA" button</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;