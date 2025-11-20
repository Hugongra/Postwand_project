import CalendarMenu from "../CalendarMenu";

const YearView = ({date, posts = [], activeView, setCurrentDate, selectedPlatform, setSelectedPlatform}) => {
    const getYearDates = () => {
        const year = date.getFullYear();
        const months = [];
        
        for (let month = 0; month < 12; month++) {
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            const monthDates = [];
            
            for (let i = 0; i < firstDay.getDay(); i++) monthDates.push(null);
            for (let day = 1; day <= lastDay.getDate(); day++) monthDates.push(new Date(year, month, day));
            
            const remainingCells = 7 - (monthDates.length % 7);
            if (remainingCells < 7) for (let i = 0; i < remainingCells; i++) monthDates.push(null);  
            months.push({ month, dates: monthDates });
        }
        return months;
    };

    const hasPostOnDate = (dayDate) => {
        if (!dayDate) return false;
        return posts.some(post => {
            const dateField = post.scheduled_time || post.created_at;
            if (!dateField) return false;
            
            const postDate = new Date(dateField);
            return postDate.toDateString() === dayDate.toDateString();
        });
    };

    const yearData = getYearDates();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const header = date.getFullYear();
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
     
            
            <div className="grid grid-cols-3 gap-1">
                {yearData.map(({ month, dates }) => (
                    <div key={month} className=" rounded-lg p-3 bg-white">
                        <h3 className="text-center font-medium text-sm text-black">
                            {monthNames[month]}
                        </h3>
                        <div className="grid grid-cols-7 gap-1">
                            {dayNames.map((day, index) => (
                                <div key={index} className="text-center text-xs font-medium text-black">
                                    {day}
                                </div>
                            ))}
                            {dates.map((dayDate, index) => (
                                
                                <div 
                                    key={index}
                                    className={`text-center text-xs p-1 ${
                                        dayDate ? 'hover:bg-gray-100 rounded' : ''
                                    } ${
                                        dayDate && hasPostOnDate(dayDate) ? 'bg-blue-100 text-blue-800 font-bold' : ''
                                    }`}
                                >
                                    {dayDate ? dayDate.getDate() : ''}
                                </div>
                        
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </>
    )
}

export default YearView;