import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';

const DeletionStatus = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [requestData, setRequestData] = useState(null);
  
  const confirmationCode = searchParams.get('code');
  
  useEffect(() => {
    const checkStatus = async () => {
      if (!confirmationCode) {
        setError('No confirmation code provided');
        setStatus('error');
        return;
      }
      
      try {
        const response = await axios.get(`/api/auth/deletion-status?code=${confirmationCode}`);
        setRequestData(response.data);
        setStatus('success');
      } catch (err) {
        console.error('Error checking deletion status:', err);
        setError(err.response?.data?.error || 'Failed to check deletion status');
        setStatus('error');
      }
    };
    
    checkStatus();
  }, [confirmationCode]);
  
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-6">Data Deletion Request Status</h1>
      
      {status === 'loading' && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-blue-700">Loading deletion request status...</p>
        </div>
      )}
      
      {status === 'error' && (
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-red-700">Error: {error}</p>
        </div>
      )}
      
      {status === 'success' && requestData && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Deletion Request</h2>
            <p className="text-gray-600">Confirmation Code: {confirmationCode}</p>
          </div>
          
          <div className="mb-4">
            <h3 className="font-medium mb-1">Status</h3>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
              requestData.status === 'completed' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {requestData.status === 'completed' ? 'Completed' : 'Pending'}
            </div>
          </div>
          
          <div className="mb-4">
            <h3 className="font-medium mb-1">Requested At</h3>
            <p className="text-gray-600">
              {new Date(requestData.requested_at).toLocaleString()}
            </p>
          </div>
          
          {requestData.completed_at && (
            <div className="mb-4">
              <h3 className="font-medium mb-1">Completed At</h3>
              <p className="text-gray-600">
                {new Date(requestData.completed_at).toLocaleString()}
              </p>
            </div>
          )}
          
          <div className="mt-6 border-t pt-4">
            <p className="text-gray-700">
              {requestData.status === 'completed' 
                ? 'Your data has been deleted from our systems as requested.' 
                : 'Your data deletion request is being processed. This may take up to 48 hours to complete.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeletionStatus; 