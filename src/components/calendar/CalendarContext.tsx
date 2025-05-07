import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { expandRecurringEvents, formatUtcDate } from '@/utils/calendarUtils';
import { useCalendarData } from './hooks/useCalendarData';
import { useCalendarNavigation } from './hooks/useCalendarNavigation';
import { useEventManagement } from './hooks/useEventManagement';
import { format } from 'date-fns';
import { 
  CalendarContextProps, 
  CalendarProviderProps, 
  CalendarFilters,
  CalendarEvent
} from './types/CalendarTypes';

// Create the context
const CalendarContext = createContext<CalendarContextProps | undefined>(undefined);

// Create a provider component
export const CalendarContextProvider: React.FC<CalendarProviderProps> = ({ 
  children, 
  initialEvents = [], 
  isLoading: initialLoadingState = false 
}) => {
  // Get calendar data
  const { 
    isLoading: dataLoading, 
    events, 
    buildings, 
    amenities, 
    regions, 
    eventTypes, 
    modifiedEvents,
    deletedEvents,
    setEvents,
    fetchEvents
  } = useCalendarData(initialEvents);
  
  // Get calendar navigation
  const {
    activeMonth,
    activeYear,
    activeView,
    setActiveMonth,
    setActiveYear,
    setActiveView,
    goToPreviousMonth,
    goToNextMonth,
    goToToday
  } = useCalendarNavigation();
  
  // Get event management
  const {
    selectedEvent,
    showEventDetails,
    showEventEdit,
    deleteInProgress,
    showDeleteConfirmation,
    editInProgress,
    showEditConfirmation,
    setShowEditConfirmation,
    currentEditType,
    setCurrentEditType,
    setSelectedEvent,
    setShowEventDetails,
    setShowEventEdit,
    handleEventClick,
    handleEditClick,
    handleCloseDetails,
    handleCloseEdit,
    handleEventSave,
    confirmEventDelete,
    executeEventDelete,
    confirmEventEdit,
    executeEventEdit,
    refreshEvents
  } = useEventManagement(events, setEvents, fetchEvents);
  
  // Filter states
  const [filters, setFilters] = useState<CalendarFilters>({
    region: 'all',
    building: 'all',
    amenity: 'all',
    eventType: ['all'],
  });
  
  // Manage loading state
  const [isLoading, setIsLoading] = useState<boolean>(initialLoadingState);
  
  // Update loading state when initialLoadingState changes
  useEffect(() => {
    setIsLoading(initialLoadingState || dataLoading);
  }, [initialLoadingState, dataLoading]);
  
  // Get all events for the current month (including recurring instances)
  // and apply modifications and deletions
  const allMonthEvents = useMemo(() => {
    const safeEvents = events || [];
    console.log("CalendarContext: Creating all month events with modifications");
    
    // Expand recurring events
    const expandedEvents = expandRecurringEvents(safeEvents, activeYear, activeMonth);
    
    // Filter out deleted events and apply modifications
    const processedEvents = [...safeEvents, ...expandedEvents].filter(event => {
      if (!event.isRecurring) return true; // Non-recurring events always show unless deleted

      // For recurring events, check if this instance is deleted
      const eventDate = format(new Date(formatUtcDate(event.startTime)), 'yyyy-MM-dd');
      const eventId = typeof event.id === 'string' ? 
        parseInt(event.id.toString().split('-')[0]) : 
        event.id;
      
      const key = `${eventId}-${eventDate}`;
      
      // Skip if this event occurrence is in the deleted set
      if (deletedEvents.has(key)) {
        return false;
      }
      
      return true;
    }).map(event => {
      // Apply modifications if they exist
      const eventDate = format(new Date(formatUtcDate(event.startTime)), 'yyyy-MM-dd');
      const eventId = typeof event.id === 'string' ? 
        parseInt(event.id.toString().split('-')[0]) : 
        event.id;
      
      const key = `${eventId}-${eventDate}`;
      
      // If we have a modification for this event instance, use it
      if (modifiedEvents.has(key)) {
        const modifiedEvent = event;
        const updatedEventDetail = modifiedEvents.get(key) as CalendarEvent;

        modifiedEvent.title = updatedEventDetail.title;
        modifiedEvent.buildingId = updatedEventDetail.buildingId;
        modifiedEvent.amenityId = updatedEventDetail.amenityId;
        modifiedEvent.startTime = updatedEventDetail.startTime;
        modifiedEvent.endTime = updatedEventDetail.endTime;
        modifiedEvent.eventTypeId = updatedEventDetail.eventTypeId;
        modifiedEvent.notes = updatedEventDetail.notes;
        modifiedEvent.cost = updatedEventDetail.cost;

        return modifiedEvent;
      }
      
      // Otherwise return the original event
      return event;
    });
    
    console.log("CalendarContext: Events expanded:", safeEvents.length, "to", expandedEvents.length, "and processed to", processedEvents.length);
    return processedEvents;
  }, [events, activeYear, activeMonth, modifiedEvents, deletedEvents]);
  
  // Provide context value
  const contextValue: CalendarContextProps = {
    activeMonth,
    activeYear,
    filters,
    events,
    buildings,
    amenities,
    regions,
    eventTypes,
    allMonthEvents,
    isLoading,
    activeView,
    setActiveMonth,
    setActiveYear,
    setActiveView,
    setFilters,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    handleEventClick,
    selectedEvent,
    setSelectedEvent,
    showEventDetails,
    setShowEventDetails,
    showEventEdit,
    setShowEventEdit,
    handleCloseDetails,
    handleEditClick,
    handleCloseEdit,
    handleEventSave,
    handleEventDelete: confirmEventDelete,
    deleteInProgress,
    showDeleteConfirmation,
    // Edit-related properties
    editInProgress,
    showEditConfirmation,
    setShowEditConfirmation,
    currentEditType,
    setCurrentEditType,
    executeEventEdit,
    refreshEvents,
    fetchEvents
  };
  
  return (
    <CalendarContext.Provider value={contextValue}>
      {children}
    </CalendarContext.Provider>
  );
};

// Create a hook for using the context
export const useCalendarContext = () => {
  const context = useContext(CalendarContext);
  if (context === undefined) {
    throw new Error('useCalendarContext must be used within a CalendarContextProvider');
  }
  return context;
};
