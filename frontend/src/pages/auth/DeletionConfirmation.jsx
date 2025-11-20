import React from 'react';
import { useSearchParams } from 'react-router-dom';

const DeletionConfirmation = () => {
  const [searchParams] = useSearchParams();
  const confirmationCode = searchParams.get('code') || "Unknown";
  
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-6">Data Deletion Complete</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Your Data Has Been Deleted</h2>
          <p className="text-gray-600">Confirmation Code: {confirmationCode}</p>
        </div>
        
        <div className="mt-6 border-t pt-4">
          <p className="text-gray-700">
            Your Meta-related data has been deleted from our systems as requested. 
            If you have any questions or concerns, please contact our support team.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DeletionConfirmation; 