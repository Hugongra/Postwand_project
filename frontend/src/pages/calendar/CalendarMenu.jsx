import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CalendarMenu = ({ header, activeView, currentDate, setCurrentDate, selectedPlatform, setSelectedPlatform }) => {
  const { t } = useTranslation();

  const changeDate = (increment) => {
    const newDate = new Date(currentDate);
    switch (activeView) {
      case 'day':
        newDate.setDate(newDate.getDate() + increment);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (increment * 7));
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + increment);
        break;
      case 'year':
        newDate.setFullYear(newDate.getFullYear() + increment);
        break;
    }
    setCurrentDate(newDate);
  };

  const platforms = ['facebook', 'instagram', 'threads', 'linkedin', 'youtube', 'tiktok'];

  const getPlatformIcon = (platform) => {
    const icons = {
      facebook: '/SM_icons/facebook.svg',
      instagram: '/SM_icons/instagram.svg',
      threads: '/SM_icons/threads.svg',
      tiktok: '/SM_icons/tiktok.svg',
      youtube: '/SM_icons/youtube.svg',
      linkedin: '/SM_icons/linkedin.svg',
    };
    return icons[platform?.toLowerCase()] || null;
  };

  return (
    <div className="h-28 flex flex-col px-4 mb-1 rounded-lg bg-gray-100/80 relative">
      <div className="flex items-center mt-4">
          <h2 className="text-xl font-bold">
            {header}
          </h2>
      </div>
    <div className="flex justify-end mt-4">
    <div className="flex items-center justify-between gap-3">
      <div>
       <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
          <SelectTrigger className="w-[140px] bg-white">
            <SelectValue placeholder="Platform" />
          </SelectTrigger>
          <SelectContent className="bg-white w-[140px]">
            <SelectItem value="all">All Platforms</SelectItem>
            {platforms.map((platform) => (
              <SelectItem key={platform} value={platform}>
                <span className="flex items-center">
                  <img src={getPlatformIcon(platform)} alt={getPlatformIcon(platform)} className="w-3.5 h-3.5 mr-2" />
                  <span className="capitalize">{platform}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
      <TabsList>
        <TabsTrigger value="day">Day</TabsTrigger>
        <TabsTrigger value="week">Week</TabsTrigger>
        <TabsTrigger value="month">Month</TabsTrigger>
        <TabsTrigger value="year">Year</TabsTrigger>
      </TabsList>
      </div>
      <div className="flex items-center">   
       
        <Button variant="outline" size="icon" onClick={() => changeDate(-1)}>
          <ChevronLeft className="h-5 w-5 text-second-accent-color" />
        </Button>
        <Button 
          className="text-second-accent-color h-10 ml-1 mr-1" 
          variant="outline" 
          onClick={() => setCurrentDate(new Date())}
        >
          {t('dates.today')}
        </Button>
        <Button variant="outline" size="icon" onClick={() => changeDate(1)}>
          <ChevronRight className="h-5 w-5 text-second-accent-color" />
        </Button>
      </div>
    </div>
    </div>
    </div>
  );
};

export default CalendarMenu;

