
const NotificationCard = ({ status}) => {
    return (

    <div 
      className={`fixed bottom-4 right-4 z-50 bg-white shadow-md rounded-lg transition-all duration-300 transform ${
        status ? "translate-x-0" : "translate-x-full"
      }`}
      style={{ minWidth: '300px' }} 
    >
      <div className="flex items-center p-3">
        {status.type === 'error' ? (
          <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center mr-2">
            <span className="text-red-600 text-md font-bold">!</span>
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mr-2">
            <span className="text-green-600 text-md">✓</span>
          </div>
        )}
        <span className={`text-md ${status.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
          {status.message}
        </span>
      </div>
      <div 
        className={`h-1 ${status.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`} 
      />
    </div>
  )
}
  

export default NotificationCard;