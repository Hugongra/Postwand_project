import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useTranslation } from 'react-i18next'


const Timepicker = ({postData, setPostData}) => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false)
    const [date, setDate] = useState(undefined)
    const [timeFormat, setTimeFormat] = useState('12h')
    const [time, setTime] = useState('12:00')
    const [period, setPeriod] = useState('AM')

    const restrictTime = (e) => {
        const value = e.target.value;
        const [hours, minutes, seconds] = value.split(':');
        let hour = parseInt(hours);
        
       
        if (hour === 0) hour = 12;
        if (hour > 12) hour = hour % 12 || 12;
        
        const formattedTime = `${hour.toString().padStart(2, '0')}:${minutes}:${seconds || '00'}`;
        setTime(formattedTime);
    }

    return (
       <>
         <div className="flex justify-center md:justify-start items-center space-x-4 mt-5 mb-5">
          <button
            type="button"
            className={`cursor-pointer w-32 py-2 rounded-lg text-sm ${postData.scheduleNow ? 'bg-white border border-purple-200 text-purple-500 shadow-purple-100 shadow-sm'
                              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
          onClick={() => setPostData(prev => ({ ...prev, scheduleNow: true }))}
          >
            {t('social.publishNow')}
          </button>
          <button
            type="button"
            className={`cursor-pointer w-32 py-2 rounded-lg text-sm ${postData.scheduleNow ? 
              'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              : 'bg-white border border-purple-200 text-purple-500 shadow-purple-100 shadow-sm'}`}
            onClick={() => {    
                setPostData(prev => ({ ...prev, scheduleNow: false }))
                setOpen(true)
            }}
          
          >
            {t('social.schedule')}
          </button>
        </div>
      
       {open && createPortal(
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-gray-400 bg-opacity-30 backdrop-blur-[3px] flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-[30vw] h-[85vh] overflow-y-auto shadow-xl transition-all duration-200" >
            <div className="flex justify-end items-center">
                <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-700 p-4">
                    <X size={14} />
                </button>
            </div>
        <div className='flex justify-center'>
                <Calendar
                  mode='single'
                  selected={date}
                  disabled={(date) => date < new Date().setHours(0, 0, 0, 0)}
                  initialFocus
                  onSelect={date => {
                    setDate(date)
                  }}
                />
            </div>
          <div className='p-6'>
            <Tabs value={timeFormat} onValueChange={setTimeFormat}>
              <TabsList >
                <TabsTrigger value="12h">12-hour</TabsTrigger>
                <TabsTrigger value="24h">24-hour</TabsTrigger>
              </TabsList>
              
              <TabsContent value="12h">
                <div className="flex gap-2 ">
                  <Input
                    type='time'
                    step='1'
                    className='bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none'
                    value={time}

                    onChange={e => {
                      setTime(e.target.value)
                      setPostData(prev => ({ ...prev, scheduledTime: e.target.value }))
                    }}
                  
                  />
                  <div className="flex text-sm ">
                    <button
                      onClick={() => setPeriod('AM')}
                      className={`p-2 rounded-lg  ${period === 'AM' ? 'bg-blue-500 text-white' : 'bg-white'}`}
                    >
                      AM
                    </button>
                    <button
                      onClick={() => setPeriod('PM')}
                      className={`p-2 rounded-lg  ${period === 'PM' ? 'bg-blue-500 text-white' : 'bg-white'}`}
                    >
                      PM
                    </button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="24h">
                <Input
                  type='time'
                  step='1'
                  className='mt-2 bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none'
                  value={time}
                  onChange={e => {
                    setTime(e.target.value)
                    setPostData(prev => ({ ...prev, scheduledTime: e.target.value }))
                  }}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
        </div>,
        document.body
       )}
       </>
    )
}

export default Timepicker