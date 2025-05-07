
import { useState } from 'react';

export const useCalendarNavigation = () => {
  const [activeMonth, setActiveMonth] = useState<number>(new Date().getMonth());
  const [activeYear, setActiveYear] = useState<number>(new Date().getFullYear());
  const [activeView, setActiveView] = useState<string>('calendar');
  
  // Handle month/year changes
  const goToPreviousMonth = () => {
    if (activeMonth === 0) {
      setActiveMonth(11);
      setActiveYear(activeYear - 1);
    } else {
      setActiveMonth(activeMonth - 1);
    }
  };
  
  const goToNextMonth = () => {
    if (activeMonth === 11) {
      setActiveMonth(0);
      setActiveYear(activeYear + 1);
    } else {
      setActiveMonth(activeMonth + 1);
    }
  };
  
  const goToToday = () => {
    const today = new Date();
    setActiveMonth(today.getMonth());
    setActiveYear(today.getFullYear());
  };
  
  return {
    activeMonth,
    activeYear,
    activeView,
    setActiveMonth,
    setActiveYear,
    setActiveView,
    goToPreviousMonth,
    goToNextMonth,
    goToToday
  };
};
