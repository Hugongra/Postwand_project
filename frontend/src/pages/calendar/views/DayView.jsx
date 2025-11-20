import CalendarMenu from "../CalendarMenu";
import CalendarPost from "../CalendarPost";

const DayView = ({date, posts = [], activeView, setCurrentDate, selectedPlatform, setSelectedPlatform}) => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const header = date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
    });

    const getPostsForHour = (hour) => {
        return posts.filter(post => {
            const dateField = post.scheduled_time || post.created_at;
            if (!dateField) return false;
            
            const postDate = new Date(dateField);
            return postDate.toDateString() === date.toDateString() && 
                   postDate.getHours() === hour;
        });
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
          
            <div className="rounded-lg overflow-hidden">
                {hours.map((hour) => (
                    <div 
                        key={hour}
                        className=" p-3 min-h-[60px] hover:bg-gray-50 bg-white"
                    >
                        <span className="text-bold text-sm text-black">
                            {hour.toString().padStart(2, '0')}:00
                        </span>
                        {getPostsForHour(hour).map(post => (
                            <CalendarPost key={post.id} post={post} />
                        ))}
                    </div>
                ))}
            </div>
        </>
    )
}

export default DayView;