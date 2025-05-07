
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useEventFormValidation = ({ 
  eventTitle, 
  selectedEventType, 
  selectedRegion, 
  selectedBuilding, 
  selectedAmenity, 
  eventDate, 
  startHour, 
  startMinute, 
  startAmPm, 
  endHour, 
  endMinute, 
  endAmPm, 
  isRecurring, 
  startDate, 
  endDate, 
  selectedRecurringPattern,
  selectedDay,
  customPatternDescription = '', 
  hasConflict, 
  timeConflict 
}) => {
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});
  // Check if the selected recurring pattern is "Custom"
  const [isCustomPattern, setIsCustomPattern] = useState(false);
  // Check if the selected pattern requires day selection
  const [needsDaySelection, setNeedsDaySelection] = useState(false);
  
  // Update validation whenever form fields change
  useEffect(() => {
    const errors: Record<string, boolean> = {};
    
    // Basic validations
    if (!eventTitle?.trim()) errors.eventTitle = true;
    if (!selectedEventType) errors.eventType = true;
    if (!selectedRegion) errors.region = true;
    if (!selectedBuilding) errors.building = true;
    if (!selectedAmenity) errors.amenity = true;
    if (!eventDate) errors.eventDate = true;
    
    // Time validations
    if (startHour && startMinute && endHour && endMinute) {
      // Convert times to comparable format (e.g., 24-hour)
      const startTime = convertToMinutes(startHour, startMinute, startAmPm);
      const endTime = convertToMinutes(endHour, endMinute, endAmPm);
      
      if (startTime >= endTime) {
        errors.endTime = true;
      }
    }
    
    // Recurring event validations
    if (isRecurring) {
      if (!startDate) errors.recurringStartDate = true;
      if (!endDate) errors.recurringEndDate = true;
      if (!selectedRecurringPattern) errors.recurringPattern = true;
      
      // Validate day selection for patterns that need it (Weekly and Bi-weekly)
      if (needsDaySelection && !selectedDay) {
        errors.recurringDay = true;
      }
      
      // If custom pattern is selected, validate custom pattern description
      if (isCustomPattern && !customPatternDescription?.trim()) {
        errors.customPattern = true;
      }
    }
    
    setValidationErrors(errors);
  }, [
    eventTitle,
    selectedEventType,
    selectedRegion,
    selectedBuilding,
    selectedAmenity,
    eventDate,
    startHour,
    startMinute,
    startAmPm,
    endHour,
    endMinute,
    endAmPm,
    isRecurring,
    startDate,
    endDate,
    selectedRecurringPattern,
    selectedDay,
    customPatternDescription,
    isCustomPattern,
    needsDaySelection
  ]);
  
  // Update pattern type when selectedRecurringPattern changes
  useEffect(() => {
    const checkPatternType = async () => {
      if (selectedRecurringPattern) {
        try {
          const { data, error } = await supabase
            .from('recurring_patterns')
            .select('frequency')
            .eq('pattern_id', selectedRecurringPattern)
            .single();
          
          if (error) throw error;
          
          // Custom patterns require a description
          setIsCustomPattern(data.frequency === 'Custom');
          
          // Only these patterns need day selection
          setNeedsDaySelection(['Weekly', 'Bi-weekly'].includes(data.frequency));
        } catch (error) {
          console.error('Error checking pattern type:', error);
          setIsCustomPattern(false);
          setNeedsDaySelection(false);
        }
      } else {
        setIsCustomPattern(false);
        setNeedsDaySelection(false);
      }
    };
    
    checkPatternType();
  }, [selectedRecurringPattern]);
  
  const validateForm = () => {
    // Basic validations
    const errors: Record<string, boolean> = {};
    if (!eventTitle?.trim()) errors.eventTitle = true;
    if (!selectedEventType) errors.eventType = true;
    if (!selectedRegion) errors.region = true;
    if (!selectedBuilding) errors.building = true;
    if (!selectedAmenity) errors.amenity = true;
    if (!eventDate) errors.eventDate = true;
    
    // Recurring event validations
    if (isRecurring) {
      if (!startDate) errors.recurringStartDate = true;
      if (!endDate) errors.recurringEndDate = true;
      if (!selectedRecurringPattern) errors.recurringPattern = true;
      
      // Only validate day selection for Weekly/Bi-weekly patterns
      if (needsDaySelection && !selectedDay) {
        errors.recurringDay = true;
      }
      
      // If custom pattern is selected, validate custom pattern description
      if (isCustomPattern && !customPatternDescription?.trim()) {
        errors.customPattern = true;
      }
    }
    
    // Time validations (only if both start and end times are provided)
    if (startHour && startMinute && endHour && endMinute) {
      const startTime = convertToMinutes(startHour, startMinute, startAmPm);
      const endTime = convertToMinutes(endHour, endMinute, endAmPm);
      
      if (startTime >= endTime) {
        errors.endTime = true;
      }
    }
    
    // Set all validation errors
    setValidationErrors(errors);
    
    // Check if there are any errors or conflicts
    return Object.keys(errors).length === 0 && !hasConflict && !timeConflict;
  };
  
  return {
    validationErrors,
    validateForm,
    needsDaySelection,
    isCustomPattern
  };
};

// Helper function to convert time to minutes for comparison
const convertToMinutes = (hour: string, minute: string, ampm: string) => {
  let hours = parseInt(hour, 10);
  const minutes = parseInt(minute, 10);
  
  // Convert 12-hour format to 24-hour
  if (ampm.toUpperCase() === 'PM' && hours < 12) {
    hours += 12;
  } else if (ampm.toUpperCase() === 'AM' && hours === 12) {
    hours = 0;
  }
  
  return hours * 60 + minutes;
};
