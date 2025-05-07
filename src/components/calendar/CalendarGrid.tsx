
import React from 'react';
import { getDaysInMonth, getFirstDayOfMonth, filterEvents, toTorontoTime, TORONTO_TIMEZONE, formatUtcDate } from '@/utils/calendarUtils';
import { Repeat } from 'lucide-react';

interface CalendarGridProps {
  year: number;
  month: number;
  filters: {
    region: string;
    building: string;
    amenity: string;
    eventType: string[];
  };
  events: any[];
  eventTypes: any[];
  buildings: any[];
  onEventClick: (event: any) => void;
}

// Fallback colors for event types when colorCode is not available
const FALLBACK_COLORS = [
  "bg-blue-100 text-blue-800",
  "bg-green-100 text-green-800",
  "bg-yellow-100 text-yellow-800",
  "bg-red-100 text-red-800",
  "bg-purple-100 text-purple-800",
  "bg-pink-100 text-pink-800",
  "bg-indigo-100 text-indigo-800",
  "bg-gray-100 text-gray-800",
];

const CalendarGrid: React.FC<CalendarGridProps> = ({ year, month, filters, events = [], eventTypes = [], buildings = [], onEventClick }) => {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  console.log("CalendarGrid: Rendering with", events?.length || 0, "events for", year, month+1);
  
  // Determine if today's date is in the displayed month
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const isCurrentMonth = month === currentMonth && year === currentYear;
  
  // Get events filtered by building and region
  // Add null checks to make sure events and buildings are arrays
  const safeEvents = Array.isArray(events) ? events : [];
  const safeBuildings = Array.isArray(buildings) ? buildings : [];
  const filteredEvents = filterEvents(safeEvents, filters, safeBuildings);
  
  console.log("CalendarGrid: Filtered events:", filteredEvents?.length || 0);
  
  // Get event type color based on ID
  const getEventTypeColor = (eventTypeId: number) => {
    // Make sure eventTypes is an array
    const safeEventTypes = Array.isArray(eventTypes) ? eventTypes : [];
    const eventType = safeEventTypes.find(type => type?.id === eventTypeId);
    return eventType?.colorCode || FALLBACK_COLORS[eventTypeId % FALLBACK_COLORS.length];
  };

  const renderDays = () => {
    const days = [];
    
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 border bg-gray-50"></div>);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      // Additional null check here
      const dayEvents = (filteredEvents || []).filter(event => {
        try {
          if (!event) {
            return false;
          }
          // Skip events with missing date data
          if (!event.oneTimeDate && !event.startTime) {
            return false;
          }

          // First check oneTimeDate for non-recurring events
          if (!event.isRecurring && event.oneTimeDate) {
            const eventDate = new Date(formatUtcDate(event.oneTimeDate));
            const belongsToDay = eventDate.getDate() === day && 
                               eventDate.getMonth() === month && 
                               eventDate.getFullYear() === year;
            return belongsToDay;
          }
          
          // For recurring events
          if (event.isRecurring) {
            if (event.recurringPattern) {
              // Here you would implement recurring event logic based on pattern
              const eventDate = new Date(formatUtcDate(event.startTime));
              return eventDate.getDate() === day && 
                    eventDate.getMonth() === month && 
                    eventDate.getFullYear() === year;
            }
          }
          
          // Fallback to startTime
          if (event.startTime) {
            const eventDate = new Date(formatUtcDate(event.startTime));
            const belongsToDay = eventDate.getDate() === day && 
                                eventDate.getMonth() === month && 
                                eventDate.getFullYear() === year;
            return belongsToDay;
          }
          
          return false;
        } catch (error) {
          console.error("Error processing event date:", error, event);
          return false;
        }
      });
      
      // Determine if this day is the current day
      const isToday = isCurrentMonth && day === currentDay;
      
      days.push(
        <div 
          key={day} 
          className="min-h-24 border p-1 relative"
        >
          <div className="font-medium text-sm mb-1">
            <span className={`flex items-center justify-center ${isToday ? 'bg-blue-500 text-white rounded-full w-6 h-6' : ''}`}>
              {day}
            </span>
          </div>
          <div className="space-y-1">
            {(dayEvents || []).map(event => {
              // Additional null checks for event data
              if (!event || !event.id) return null;

              // if(event && event.isRecurring && !event.recurringParentId) return null;
              
              const eventTypeId = event.eventTypeId || 0;
              const eventTypeColor = getEventTypeColor(eventTypeId);
              
              return (
                <div 
                  key={event.id} 
                  className={`text-xs px-1 py-0.5 rounded truncate cursor-pointer ${eventTypeColor} flex items-center gap-1`}
                  onClick={() => onEventClick(event)}
                >
                  {event.isRecurring && <Repeat className="h-3 w-3 shrink-0" />}
                  <span className="truncate">{event.title}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    
    return days;
  };

  return (
    <div className="grid grid-cols-7 gap-px">
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
        <div key={day} className="text-center py-2 font-medium text-sm">
          {day}
        </div>
      ))}
      {renderDays()}
    </div>
  );
};

export default CalendarGrid;
