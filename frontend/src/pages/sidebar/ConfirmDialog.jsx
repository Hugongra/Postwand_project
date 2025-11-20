import React from "react";
import { useTranslation } from 'react-i18next';

// Confirm Dialog Component
export const ConfirmDialog = ({ isOpen, onClose, onConfirm }) => {
  const { t } = useTranslation();
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 shadow-xl ">
        <h3 className="text-md font-normal mb-4">{t('social.createNewPost')}</h3>
        <p className="text-gray-600 mb-6 text-md">
          {t('social.createNewPostMessage')}
        </p>
        <div className="flex justify-end space-x-3 text-md">
          <button 
            onClick={onClose} 
            className="px-5 py-2 text-gray-700 rounded-lg bg-gray-100/80 hover:bg-gray-100"
          >
            {t('common.cancel')}
          </button>
          <button 
            onClick={onConfirm} 
            className="px-5 py-2 bg-accent text-white rounded-lg"
          >
            {t('common.create')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;

