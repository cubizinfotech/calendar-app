
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

// Define the component props interface
interface CalendarActionsProps {
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  currentMonth: number;
  currentYear: number;
}

const CalendarActions: React.FC<CalendarActionsProps> = ({
  onPrevMonth,
  onNextMonth,
  onToday,
  currentMonth,
  currentYear
}) => {
  // Array of month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  return (
    <div className="flex items-center gap-2">
      <span className="text-lg font-medium">{monthNames[currentMonth]} {currentYear}</span>
      
      <div className="flex items-center">
        <Button 
          variant="outline" 
          size="icon"
          onClick={onPrevMonth}
          className="rounded-r-none border-r-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          onClick={onToday}
        >
          <CalendarDays className="h-4 w-4 mr-2" />
          Today
        </Button>
        
        <Button 
          variant="outline" 
          size="icon"
          onClick={onNextMonth}
          className="rounded-l-none border-l-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default CalendarActions;
