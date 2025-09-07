import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { useTranslation } from 'react-i18next';

const AiStudio = ({ setPostContent, brands }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Check if we're on the main AI Studio page
  const isMainPage = location.pathname === '/ai-studio';
  
  return (
    <div className="w-full min-h-screen bg-primary">
     
      
      <Outlet />
      
  </div>
  );
};

export default AiStudio;