
import { format } from 'date-fns';

// Helper function to generate dates based on recurrence pattern
export const generateRecurringDates = (startDate, endDate, frequency, selectedDay = null) => {
  const dates = [];
  let currentDate = new Date(startDate);
  
  // For weekly events, we get the day of week from the event date or use the selected day
  const dayMap = {
    'Sunday': 0,
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6
  };
  
  // For weekly/bi-weekly recurrences, determine the target day of week
  const targetDayOfWeek = selectedDay ? dayMap[selectedDay] : currentDate.getDay();
  
  // If we're starting on a different day than our target day (for weekly/bi-weekly events)
  // we need to advance to the first occurrence of our target day
  if (['Weekly', 'Bi-weekly'].includes(frequency) && currentDate.getDay() !== targetDayOfWeek) {
    // Calculate days to add to reach the target day
    let daysToAdd = targetDayOfWeek - currentDate.getDay();
    if (daysToAdd <= 0) daysToAdd += 7; // If target day is before or same as current day, go to next week
    
    // Advance to the first occurrence
    const firstOccurrence = new Date(currentDate);
    firstOccurrence.setDate(firstOccurrence.getDate() + daysToAdd);
    
    // If this first occurrence is within our date range, add it
    if (firstOccurrence <= new Date(endDate)) {
      currentDate = new Date(firstOccurrence);
    } else {
      // No valid dates in range
      return dates;
    }
  }
  
  while (currentDate <= new Date(endDate)) {
    // For weekly/bi-weekly events, only include dates that match the target day of week
    if (!['Weekly', 'Bi-weekly'].includes(frequency) || currentDate.getDay() === targetDayOfWeek) {
      dates.push(new Date(currentDate));
    }
    
    // Move to next date based on frequency
    switch (frequency) {
      case 'Weekly':
        currentDate.setDate(currentDate.getDate() + 7);
        break;
      case 'Bi-weekly':
        currentDate.setDate(currentDate.getDate() + 14);
        break;
      case 'Monthly':
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
      case 'Quarterly':
        currentDate.setMonth(currentDate.getMonth() + 3);
        break;
      case 'Yearly':
        currentDate.setFullYear(currentDate.getFullYear() + 1);
        break;
      case 'Custom':
        // For custom, we'll just use weekly as fallback
        currentDate.setDate(currentDate.getDate() + 7);
        break;
      default:
        currentDate.setDate(currentDate.getDate() + 1);
    }
  }
  
  return dates;
};
