import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import * as api from '@services/api/api';

import DayView from "./views/DayView"; 
import WeekView from "./views/WeekView";
import MonthView from "./views/MonthView";
import YearView from "./views/YearView";

const Calendar2 = () => {
 
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState([]);
  const [activeView, setActiveView] = useState("week");
  const [selectedPlatform, setSelectedPlatform] = useState("all");

  const fetchPosts = async () => {

      const response = await api.GetPosts();
      if (!response.ok) throw new Error('Failed to fetch posts');
      setPosts(response.data.posts);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handlePostReschedule = async (post, newDate) => {
    if (!post || !post.id) {
      console.error('Error rescheduling: post is invalid', post);return;
    }
    if (!newDate || !(newDate instanceof Date)) {
      console.error('Error rescheduling: invalid date', newDate);return;
    }

    const originalDate = new Date(post.scheduled_time);      
    const newDateCopy = new Date(newDate.getTime());
    const updatedDate = new Date(newDateCopy.setHours(
      originalDate.getHours(),
      originalDate.getMinutes(),
      originalDate.getSeconds()
    ));
  
    setPosts(prevPosts => prevPosts.map(p => {
      if (p.id === post.id) {
        return { ...p, scheduled_time: updatedDate.toISOString() };
      }
      return p;
    }));
    const response = await api.ReschedulePost(post.id, updatedDate.toISOString());
    if (!response.ok) {
      throw new Error(`Failed to update post schedule: ${response.status} ${errorText}`);
    }
   
  };

  const handlePostDelete = async (post) => {
    if (!post || !post.id) {
      console.error('Error deleting: post is invalid', post);return;
    }

    setPosts(prevPosts => prevPosts.filter(p => p.id !== post.id));
    
    const response = await api.DeletePost(post.id);
    if (!response.ok) {
      const errorText = await response.text();throw new Error(`Failed to delete: ${response.status} ${errorText}`);
    }
      fetchPosts();
  };

  const filteredPosts = selectedPlatform === "all" 
    ? posts 
    : posts.filter(post => post.platform?.toLowerCase() === selectedPlatform);

  const commonProps = {
    date: currentDate,
    posts: filteredPosts,
    activeView,
    setCurrentDate,
    selectedPlatform,
    setSelectedPlatform
  };

    return (
        <div className=" pr-2 bg-primary">      
        <Tabs value={activeView} onValueChange={setActiveView}>
        <TabsContent value="day" >
            <DayView {...commonProps} />     
        </TabsContent>
        <TabsContent value="week">
            <WeekView {...commonProps} />     
        </TabsContent>
        <TabsContent value="month">
            <MonthView {...commonProps} />     
        </TabsContent>
        <TabsContent value="year">
            <YearView {...commonProps} />     
        </TabsContent>
        </Tabs>
        </div>
    );
}

export default Calendar2;