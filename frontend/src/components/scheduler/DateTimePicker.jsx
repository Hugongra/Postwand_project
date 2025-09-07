import React, { useState, useEffect, useRef } from "react";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import { format } from "date-fns";
import { Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const DateTimePicker = ({ 
  dateTime,
  setDateTime, 
  setScheduleNow,
  primaryColor = "#3b82f6", // blue-500
  secondaryColor = "#93c5fd", // blue-300
  textColor = "#1e293b", // slate-800
  padding = 4, // p-4
  borderRadius = "rounded-md",
  hoverColor = "bg-slate-100",
  selectedBgColor = "bg-blue-500",
  selectedTextColor = "text-white",
  autoOpenPicker = false,
  onConfirm = null, // New prop for callback when date is confirmed
  onClose = null // New prop for callback when picker is closed
}) => {
  const { t } = useTranslation();
  const [publishNow, setPublishNow] = useState(true);
  
  // State from my implementation
  const [showCalendar, setShowCalendar] = useState(autoOpenPicker);
  const [showTimePicker, setShowTimePicker] = useState(autoOpenPicker);
  const [selectedDate, setSelectedDate] = useState(dateTime || new Date());
  const [currentMonth, setCurrentMonth] = useState((dateTime || new Date()).getMonth());
  const [currentYear, setCurrentYear] = useState((dateTime || new Date()).getFullYear());
  const [selectedHour, setSelectedHour] = useState(formatTime(dateTime || new Date()));
  // Add separate state for hours and minutes
  const [selectedHourValue, setSelectedHourValue] = useState((dateTime || new Date()).getHours() % 12 || 12);
  const [selectedMinuteValue, setSelectedMinuteValue] = useState((dateTime || new Date()).getMinutes());
  const [selectedAmPm, setSelectedAmPm] = useState((dateTime || new Date()).getHours() >= 12 ? 'PM' : 'AM');
  
  // Get today's date at midnight for comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Refs for click-outside detection
  const timePickerRef = useRef(null);
  const calendarRef = useRef(null);
  const containerRef = useRef(null);

  // Update internal state when prop changes
  useEffect(() => {
    if (dateTime) {
      setSelectedDate(dateTime);
      setCurrentMonth(dateTime.getMonth());
      setCurrentYear(dateTime.getFullYear());
      setSelectedHour(formatTime(dateTime));
      // Update the separate hour and minute states
      setSelectedHourValue(dateTime.getHours() % 12 || 12);
      setSelectedMinuteValue(dateTime.getMinutes());
      setSelectedAmPm(dateTime.getHours() >= 12 ? 'PM' : 'AM');
    }
  }, [dateTime]);

  // Format time to HH:MM AM/PM format
  function formatTime(date) {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minutesStr} ${ampm}`;
  }

  // Parse string time back to Date object
  function parseTime(timeString, date) {
    const [time, period] = timeString.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    const newDate = new Date(date);
    newDate.setHours(hours);
    newDate.setMinutes(minutes);
    return newDate;
  }

  // Generate days for the current month view
  function getDaysInMonth(month, year) {
    const date = new Date(year, month, 1);
    const days = [];
    
    // Find the first day of the month
    const firstDayIndex = date.getDay();
    
    // Add empty placeholders for days from previous month
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({
        day: null,
        month: null,
        year: null,
        currentMonth: false,
        isEmpty: true
      });
    }
    
    // Add days of current month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        month,
        year,
        currentMonth: true,
        isEmpty: false
      });
    }
    
    // Add empty placeholders for days from next month to complete the calendar grid
    const totalDaysNeeded = Math.ceil((firstDayIndex + daysInMonth) / 7) * 7;
    const remainingDays = totalDaysNeeded - days.length;
    
    for (let i = 0; i < remainingDays; i++) {
      days.push({
        day: null,
        month: null,
        year: null,
        currentMonth: false,
        isEmpty: true
      });
    }
    
    return days;
  }

  // Generate hours (1-12)
  function generateHourOptions() {
    return Array.from({ length: 12 }, (_, i) => i + 1);
  }

  // Generate minutes (0-59)
  function generateMinuteOptions() {
    return Array.from({ length: 60 }, (_, i) => i);
  }

  // Select hour, minute, or AM/PM
  function selectHour(hour) {
    setSelectedHourValue(hour);
    updateDateTime(hour, selectedMinuteValue, selectedAmPm);
  }

  function selectMinute(minute) {
    setSelectedMinuteValue(minute);
    updateDateTime(selectedHourValue, minute, selectedAmPm);
  }

  function selectAmPm(ampm) {
    setSelectedAmPm(ampm);
    updateDateTime(selectedHourValue, selectedMinuteValue, ampm);
  }

  // Update the date time with new hour/minute/ampm values
  function updateDateTime(hour, minute, ampm) {
    let hours = hour;
    if (ampm === 'PM' && hours !== 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    
    const newDate = new Date(selectedDate);
    newDate.setHours(hours);
    newDate.setMinutes(minute);
    
    setSelectedDate(newDate);
    setSelectedHour(formatTime(newDate));
    setDateTime(newDate);
  }

  // Navigate to previous month
  function prevMonth() {
    setCurrentMonth(currentMonth - 1);
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    }
  }

  // Navigate to next month
  function nextMonth() {
    setCurrentMonth(currentMonth + 1);
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    }
  }

  // Select a day
  function selectDay(day, month, year) {
    const newDate = new Date(selectedDate);
    newDate.setDate(day);
    newDate.setMonth(month);
    newDate.setFullYear(year);
    
    // Validate the date is not in the past
    const compareDate = new Date(year, month, day);
    compareDate.setHours(0, 0, 0, 0);
    
    if (compareDate < today) {
      return; // Don't allow selection of past dates
    }
    
    setSelectedDate(newDate);
    setDateTime(newDate);
    setShowCalendar(false);
  }

  // Format date for display
  function formatDate(date) {
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
  }

  // Check if a date is before today (for disabling past dates)
  const isDateInvalid = (itemDate) => {
    const compareDate = new Date(itemDate.year, itemDate.month, itemDate.day);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate < today;
  };

  // Handle clicks outside the components to close them
  useEffect(() => {
    function handleClickOutside(event) {
      if (timePickerRef.current && !timePickerRef.current.contains(event.target) && 
          !event.target.closest('[data-time-toggle]')) {
        setShowTimePicker(false);
      }
      
      if (calendarRef.current && !calendarRef.current.contains(event.target) && 
          !event.target.closest('[data-calendar-toggle]')) {
        setShowCalendar(false);
      }
      
      // If both calendar and time picker are closed and we're in auto-open mode,
      // call the onClose callback
      if (autoOpenPicker && !showCalendar && !showTimePicker && 
          !timePickerRef.current?.contains(event.target) && 
          !calendarRef.current?.contains(event.target) &&
          !event.target.closest('[data-time-toggle]') &&
          !event.target.closest('[data-calendar-toggle]')) {
        handleClose();
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [autoOpenPicker, showCalendar, showTimePicker]);

  // Scroll to selected values when time picker opens
  useEffect(() => {
    if (showTimePicker && timePickerRef.current) {
      const hourEl = timePickerRef.current.querySelector('[data-hour-selected="true"]');
      const minuteEl = timePickerRef.current.querySelector('[data-minute-selected="true"]');
      
      if (hourEl) {
        hourEl.scrollIntoView({ block: 'center', behavior: 'auto' });
      }
      
      if (minuteEl) {
        minuteEl.scrollIntoView({ block: 'center', behavior: 'auto' });
      }
    }
  }, [showTimePicker]);

  // Days of the week headers
  const daysOfWeek = [
    t('dates.daysShort.sun'),
    t('dates.daysShort.mon'),
    t('dates.daysShort.tue'),
    t('dates.daysShort.wed'),
    t('dates.daysShort.thu'),
    t('dates.daysShort.fri'),
    t('dates.daysShort.sat')
  ];
  const months = [
    t('dates.months.january'),
    t('dates.months.february'),
    t('dates.months.march'),
    t('dates.months.april'),
    t('dates.months.may'),
    t('dates.months.june'),
    t('dates.months.july'),
    t('dates.months.august'),
    t('dates.months.september'),
    t('dates.months.october'),
    t('dates.months.november'),
    t('dates.months.december')
  ];
  
  // Get days for the current month view
  const days = getDaysInMonth(currentMonth, currentYear);
  const hourOptions = generateHourOptions();
  const minuteOptions = generateMinuteOptions();

  // Style with dynamic color props
  const styles = {
    container: `relative font-sans ${borderRadius}`,
    
    calendarHeader: `flex justify-between items-center mb-2 p-2 text-lg ${borderRadius}`,
    dayHeader: `grid grid-cols-7 gap-1 mb-4 text-center text-md font-medium text-gray-600`,
    daysGrid: `grid grid-cols-7 gap-6`,
    dayCell: `h-8 w-8 flex items-center justify-center text-md text-gray-500 rounded-full cursor-pointer hover:bg-gray-200`,
    selectedDay: `bg-blue-500 text-white hover:opacity-90`,
    otherMonthDay: 'text-gray-400',
    disabledDay: 'text-gray-300 cursor-not-allowed hover:bg-transparent',
    navigation: `p-1 rounded-full hover:${hoverColor} cursor-pointer`,
    dropdown: `absolute z-10 bg-white rounded-xl p-${padding} max-h-100 overflow-y-auto w-full bottom-full mb-1`,
    timeItem: `py-1 px-2 cursor-pointer hover:${hoverColor} ${borderRadius}`,
    selectedTime: `${selectedBgColor} ${selectedTextColor}`,
  
    scheduleInfo: 'text-sm text-gray-600 pb-4 rounded-md',
    // New styles for modal
    overlay: 'fixed inset-0 bg-gray-400 bg-opacity-30 backdrop-blur-[3px] flex items-center justify-center z-50',
    modal: 'relative bg-white rounded-xl p-6 shadow-xl max-w-md w-full h-[90vh]',
    timePickerContainer: 'mt-4 border-t pt-4 max-h-48 overflow-y-auto',
  };

  // Update to handle the confirm button click
  const handleConfirm = () => {
    setShowCalendar(false);
    setShowTimePicker(false);
    
    // Call the onConfirm callback if provided
    if (onConfirm && typeof onConfirm === 'function') {
      onConfirm(selectedDate);
    }
  };
  
  // Add a function to handle closing the picker
  const handleClose = () => {
    setShowCalendar(false);
    setShowTimePicker(false);
    
    // Call the onClose callback if provided
    if (onClose && typeof onClose === 'function') {
      onClose();
    }
  };

  return (
    <div ref={containerRef} className="w-full">
      {/* Schedule Now or Later Buttons - Only show if not auto-opened */}
      {!autoOpenPicker && (
        <div className="flex justify-center md:justify-start items-center space-x-4 mt-5 mb-5">
          <button
            type="button"
            className={`cursor-pointer w-32 py-2 rounded-md text-sm ${publishNow ? 'bg-white border border-purple-200 text-purple-500 shadow-purple-100 shadow-sm'
                              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
            onClick={() => {
              setDateTime(new Date());
              setScheduleNow(true);
              setPublishNow(true);
            }}
          >
            {t('social.publishNow')}
          </button>
          <button
            type="button"
            className={`cursor-pointer w-32 py-2 rounded-md text-sm ${publishNow ? 
              'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              : 'bg-white border border-purple-200 text-purple-500 shadow-purple-100 shadow-sm'}`}
            onClick={() => {
              setScheduleNow(false);
              setPublishNow(false);
              setShowCalendar(true);
              setShowTimePicker(true);
            }}
          >
            {t('social.schedule')}
          </button>
        </div>
      )}
      
      {/* Calendar and Time Modal */}
      {(showCalendar || showTimePicker) && (
        <div className={styles.overlay}>
          <div id="date-time-modal" className={styles.modal} >
           
            
            {/* Calendar Section */}
            <div className={styles.calendarHeader}>
              <ChevronLeft 
                size={28}
                className={styles.navigation}
                onClick={prevMonth}
                style={{ color: primaryColor }}
              />
              <span className="font-medium">{months[currentMonth]} {currentYear}</span>
              <ChevronRight 
                size={28}
                className={styles.navigation} 
                onClick={nextMonth}
                style={{ color: primaryColor }}
              />
            </div>
            
            <div className={styles.dayHeader}>
              {daysOfWeek.map(day => (
                <div key={day}>{day}</div>
              ))}
            </div>
            
            <div className={styles.daysGrid}>
              {days.map((item, index) => {
                if (item.isEmpty) {
                  return <div key={index} className={`${styles.dayCell} invisible`}></div>;
                }
                
                const isSelected = 
                  selectedDate.getDate() === item.day && 
                  selectedDate.getMonth() === item.month && 
                  selectedDate.getFullYear() === item.year;
                
                const isPastDate = isDateInvalid(item);
                
                return (
                  <div 
                    key={index}
                    className={`
                      ${styles.dayCell} 
                      ${isSelected ? styles.selectedDay : ''} 
                      ${isPastDate ? styles.disabledDay : ''}
                    `}
                    onClick={() => !isPastDate && selectDay(item.day, item.month, item.year)}
                    style={{ color: isSelected ? selectedTextColor : undefined }}
                  >
                    {item.day}
                  </div>
                );
              })}
            </div>
            
            {/* Time Picker Section */}
            <div className={styles.timePickerContainer}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{t('dates.time')}</span>
                <span className="text-sm text-gray-500">{selectedHour}</span>
              </div>
              
              <div className="flex items-center justify-between gap-2">
                {/* Hour Input */}
                <div className="flex-1">
                  <div className="text-center text-sm text-gray-500 mb-1">{t('dates.hour')}</div>
                  <div className="relative flex items-center">
                    <button
                      type="button"
                      className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-l-md"
                      onClick={() => {
                        const newValue = selectedHourValue <= 1 ? 12 : selectedHourValue - 1;
                        setSelectedHourValue(newValue);
                        selectHour(newValue);
                      }}
                    >
                      <span className="text-xl">−</span>
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={selectedHourValue}
                      onChange={(e) => {
                        const value = e.target.value === '' ? '' : parseInt(e.target.value);
                        if (e.target.value === '' || (value >= 1 && value <= 12)) {
                          setSelectedHourValue(value);
                          if (value !== '' && !isNaN(value)) {
                            selectHour(value);
                          }
                        }
                      }}
                      onBlur={() => {
                        if (selectedHourValue === '' || isNaN(selectedHourValue)) {
                          setSelectedHourValue(1);
                          selectHour(1);
                        }
                      }}
                      className="w-full p-2 border rounded-md text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      className="absolute right-0 top-0 bottom-0 w-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-r-md border-l"
                      onClick={() => {
                        const newValue = selectedHourValue >= 12 ? 1 : selectedHourValue + 1;
                        setSelectedHourValue(newValue);
                        selectHour(newValue);
                      }}
                    >
                      <span className="text-xl">+</span>
                    </button>
                  </div>
                </div>
                
                {/* Minute Input */}
                <div className="flex-1">
                  <div className="text-center text-sm text-gray-500 mb-1">{t('dates.minute')}</div>
                  <div className="relative flex items-center">
                    <button
                      type="button"
                      className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-l-md border-r"
                      onClick={() => {
                        const newValue = selectedMinuteValue <= 0 ? 59 : selectedMinuteValue - 1;
                        setSelectedMinuteValue(newValue);
                        selectMinute(newValue);
                      }}
                    >
                      <span className="text-xl">−</span>
                    </button>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={selectedMinuteValue}
                      onChange={(e) => {
                        const value = e.target.value === '' ? '' : parseInt(e.target.value);
                        if (e.target.value === '' || (value >= 0 && value <= 59)) {
                          setSelectedMinuteValue(value);
                          if (value !== '' && !isNaN(value)) {
                            selectMinute(value);
                          }
                        }
                      }}
                      onBlur={() => {
                        if (selectedMinuteValue === '' || isNaN(selectedMinuteValue)) {
                          setSelectedMinuteValue(0);
                          selectMinute(0);
                        }
                      }}
                      className="w-full p-2 border rounded-md text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      className="absolute right-0 top-0 bottom-0 w-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-r-md border-l"
                      onClick={() => {
                        const newValue = selectedMinuteValue >= 59 ? 0 : selectedMinuteValue + 1;
                        setSelectedMinuteValue(newValue);
                        selectMinute(newValue);
                      }}
                    >
                      <span className="text-xl">+</span>
                    </button>
                  </div>
                </div>
                
                {/* AM/PM Toggle */}
                <div className="w-24">
                  <div className="text-center text-sm text-gray-500 mb-1 invisible">AM/PM</div>
                  <div className="flex border overflow-hidden rounded-md">
                    <button
                      type="button"
                      className={`flex-1 py-2 text-center rounded-none rounded-l-md ${
                        selectedAmPm === 'AM' 
                          ? `border border-blue-500 bg-blue-100` 
                          : 'hover:bg-gray-100' 
                      }`}
                      onClick={() => selectAmPm('AM')}
                    
                   
                    >
                      AM
                    </button>
                    <button
                      type="button"
                      className={`flex-1 py-2 text-center rounded-none rounded-r-md ${
                        selectedAmPm === 'PM' 
                          ? `border border-blue-500 bg-blue-100` 
                          : 'hover:bg-gray-100'
                      }`}
                      onClick={() => selectAmPm('PM')}
                    
                    >
                      PM
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Confirm and Cancel Buttons */}
            <div className="absolute bottom-4 right-4 flex justify-end space-x-2">
              <button
                className="px-4 py-1.5 bg-gray-200 text-gray-700 rounded-md"
                onClick={handleClose}
              >
                {t('common.cancel')}
              </button>
              <button
                className="px-4 py-1.5 bg-blue-500 text-white rounded-md"
                onClick={handleConfirm}
              >
                {t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Schedule Info Message */}
      {!publishNow && dateTime && !autoOpenPicker && (
        <div className={styles.scheduleInfo} >
          {t('social.willBePublishedOn')}{" "}         
          <span className="font-medium text-gray-800 ">
            {format(dateTime, "EEEE, MMMM d, yyyy 'at' h:mm a")}
          </span>
        </div>
      )}
      
      
      
    </div>
  );
};

export default DateTimePicker;