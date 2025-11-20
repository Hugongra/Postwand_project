import CalendarMenu from "../CalendarMenu";
import CalendarPost from "../CalendarPost";

const WeekView = ({date, posts = [], activeView, setCurrentDate, selectedPlatform, setSelectedPlatform}) => {
    const getWeekDates = () => {
        const dates = [];
        const currentDate = new Date(date);
        const currentDay = currentDate.getDay();
        currentDate.setDate(currentDate.getDate() - currentDay);
        for (let i = 0; i < 7; i++) {
            dates.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return dates;
    };

    const weekDates = getWeekDates();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const header = date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
    });
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
                {dayNames.map((day, index) => (
                    <div key={day} 
                    className={`bg-white mb-0.5 text-center font-medium text-sm p-2 
                        ${isToday(weekDates[index]) ? 'text-second-accent-color' : ''}`
                    }
                    >
                        {day} {weekDates[index].getDate()}
                    </div>
                ))}
                {weekDates.map((day, index) => (
                    <div 
                        key={index}
                        className="mr-0.5 p-1 pt-8 min-h-[70vh] hover:bg-gray-50 bg-white"
                    >
                        {getPostsForDate(day).map(post => (
                            <CalendarPost key={post.id} post={post} />
                        ))}
                    </div>
                ))}
            </div>
        </>
    )
}

export default WeekView;