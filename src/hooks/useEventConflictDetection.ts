import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { createFullDateFromParts } from '@/utils/calendarUtils';
import { toast } from 'sonner';

interface ConflictDetectionProps {
  selectedBuilding: string;
  selectedAmenity: string;
  eventDate: Date | undefined;
  startHour: string;
  startMinute: string;
  startAmPm: string;
  endHour: string;
  endMinute: string;
  endAmPm: string;
  eventsList: any[];
}

interface ConflictState {
  hasConflict: boolean;
  conflictingEvent: any | null;
  conflictDetails: string;
  timeConflict: boolean;
}

export const useEventConflictDetection = ({
  selectedBuilding,
  selectedAmenity,
  eventDate,
  startHour,
  startMinute,
  startAmPm,
  endHour,
  endMinute,
  endAmPm,
  eventsList
}: ConflictDetectionProps): ConflictState => {
  const [hasConflict, setHasConflict] = useState(false);
  const [conflictingEvent, setConflictingEvent] = useState<any | null>(null);
  const [conflictDetails, setConflictDetails] = useState('');
  const [timeConflict, setTimeConflict] = useState(false);

  // Check if end time is after start time
  useEffect(() => {
    if (startHour && endHour && startMinute && endMinute && startAmPm && endAmPm) {
      const getTimeInMinutes = (hour: string, minute: string, ampm: string) => {
        let h = parseInt(hour);
        if (ampm === 'PM' && h !== 12) h += 12;
        if (ampm === 'AM' && h === 12) h = 0;
        return h * 60 + parseInt(minute);
      };

      const startTime = getTimeInMinutes(startHour, startMinute, startAmPm);
      const endTime = getTimeInMinutes(endHour, endMinute, endAmPm);

      setTimeConflict(startTime >= endTime);
    }
  }, [startHour, startMinute, startAmPm, endHour, endMinute, endAmPm]);

  // Check for booking conflicts
  useEffect(() => {
    const checkForConflicts = () => {
      console.log('Checking for conflicts with inputs:', {
        building: selectedBuilding, 
        amenity: selectedAmenity, 
        date: eventDate, 
        startTime: `${startHour}:${startMinute} ${startAmPm}`,
        endTime: `${endHour}:${endMinute} ${endAmPm}`
      });

      if (!selectedBuilding || !selectedAmenity || !eventDate || 
          !startHour || !startMinute || !endHour || !endMinute) {
        console.log('Missing required fields for conflict check');
        setHasConflict(false);
        setConflictingEvent(null);
        setConflictDetails('');
        return;
      }

      const buildingId = parseInt(selectedBuilding);
      const amenityId = parseInt(selectedAmenity);
      
      const startDateTime = createFullDateFromParts(eventDate, startHour, startMinute, startAmPm);
      const endDateTime = createFullDateFromParts(eventDate, endHour, endMinute, endAmPm);
      
      if (!startDateTime || !endDateTime) {
        console.log('Invalid date/time combination');
        setHasConflict(false);
        setConflictingEvent(null);
        setConflictDetails('');
        return;
      }
      
      console.log('Checking conflicts with:', { 
        startDateTime: startDateTime.toISOString(), 
        endDateTime: endDateTime.toISOString(),
        eventsCount: eventsList.length 
      });
      
      // Check for conflicts with existing events
      const conflict = eventsList.find(event => {
        // Only check events in the same building and amenity
        if (event.buildingId !== buildingId || event.amenityId !== amenityId) {
          return false;
        }
        
        // Get event date/time
        const eventStartTime = new Date(event.startTime);
        const eventEndTime = new Date(event.endTime);
        
        // For weekly events, check if it's the same day of the week
        if (event.isRecurring && event.recurringPattern === 'Weekly') {
          // If the event day of week doesn't match the selected day, it's not a conflict
          const eventDayOfWeek = eventStartTime.getDay();
          const selectedDayOfWeek = eventDate ? eventDate.getDay() : -1;
          
          if (eventDayOfWeek !== selectedDayOfWeek) {
            return false;
          }
        }
        
        // Check if event overlaps
        const hasOverlap = (
          (startDateTime >= eventStartTime && startDateTime < eventEndTime) || // New event starts during existing event
          (endDateTime > eventStartTime && endDateTime <= eventEndTime) ||     // New event ends during existing event
          (startDateTime <= eventStartTime && endDateTime >= eventEndTime)     // New event completely spans existing event
        );
        
        if (hasOverlap) {
          console.log(`Conflict detected with event: "${event.title}"`);
        }
        
        return hasOverlap;
      });
      
      if (conflict) {
        setHasConflict(true);
        setConflictingEvent(conflict);
        
        const eventStart = format(new Date(conflict.startTime), 'h:mm a');
        const eventEnd = format(new Date(conflict.endTime), 'h:mm a');
        const conflictMsg = `Conflicts with "${conflict.title}" (${eventStart} - ${eventEnd})`;
        setConflictDetails(conflictMsg);
        
        console.log('Conflict set:', conflictMsg);
        toast.error(`Booking conflict detected: ${conflict.title} is already scheduled at this time`);
      } else {
        setHasConflict(false);
        setConflictingEvent(null);
        setConflictDetails('');
        console.log('No conflicts found');
      }
    };

    if (selectedBuilding && selectedAmenity && eventDate && 
        startHour && startMinute && startAmPm && 
        endHour && endMinute && endAmPm) {
      checkForConflicts();
    } else {
      // Reset conflict state if not all required fields are filled
      setHasConflict(false);
      setConflictingEvent(null);
      setConflictDetails('');
    }
  }, [selectedBuilding, selectedAmenity, eventDate, startHour, startMinute, startAmPm, endHour, endMinute, endAmPm, eventsList]);

  return {
    hasConflict,
    conflictingEvent,
    conflictDetails,
    timeConflict
  };
};
