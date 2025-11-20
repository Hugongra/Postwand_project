import CalendarPost from "../CalendarPost";
import CalendarMenu from "../CalendarMenu";

const MonthView = ({date, posts = [], activeView, setCurrentDate, selectedPlatform, setSelectedPlatform}) => {

    const getMonthDates = () => {
        const dates = [];
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        const totalDays = lastDay.getDate();
        
        for (let i = 0; i < firstDay.getDay(); i++) dates.push(null);
        for (let day = 1; day <= totalDays; day++) dates.push(new Date(date.getFullYear(), date.getMonth(), day));
        
        const remainingCells = 7 - (dates.length % 7);
        if (remainingCells < 7) for (let i = 0; i < remainingCells; i++) dates.push(null);
        return dates;
    };
    
    const monthDates = getMonthDates();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const header = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const isToday = (dayDate) => dayDate.toDateString() === date.toDateString();
    
    const getPostsForDate = (dayDate) => {
        if (!dayDate) return [];
        const filteredPosts = posts.filter(post => {
            const dateField = post.scheduled_time || post.created_at;
            if (!dateField) return false;
            const postDate = new Date(dateField);
            return postDate.toDateString() === dayDate.toDateString();
        });
        return filteredPosts;
    };  
    
    return (
        <>
            <CalendarMenu 
                header={header}
                activeView={activeView}
                currentDate={date}
                setCurrentDate={setCurrentDate}
                selectedPlatform={selectedPlatform}
                setSelectedPlatform={setSelectedPlatform}
            />
      
         
            <div className="grid grid-cols-7">
                {dayNames.map((day) => (
                    <div key={day} className="bg-white mb-0.5 text-center font-medium text-sm text-black p-2">
                        {day}
                    </div>
                ))}
            </div>
            
            <div className="grid grid-cols-7 auto-rows-fr">
                {monthDates.map((dayDate, index) => (
                    <div 
                        key={index}
                        className={`mr-0.5 mb-0.5 p-1 min-h-[120px] bg-white ${
                            dayDate ? 'hover:bg-gray-50' : 'bg-gray-100'
                        }`}
                    >
                    {dayDate && (
                        <>     
                        <div className="flex items-center text-bold text-sm text-black">
                          <span className={`m-1
                            ${
                              isToday(dayDate) ? 'flex items-center justify-center bg-second-accent-color rounded-full p-1 w-5 h-5 text-white' : ''
                            }`}>
                            {dayDate.getDate()}
                          </span>
                        </div>

                        {getPostsForDate(dayDate).map(post => (
                            <CalendarPost key={post.id} post={post} />
                        ))}
                        </>
                    )}
                  </div>
                ))}
            </div>
        </>
    )
}

export default MonthView;