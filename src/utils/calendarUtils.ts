import { format, formatISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

export const getMonthNames = () => [
  'January', 'February', 'March', 'April', 'May', 'June', 
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

export const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

// Constant for Toronto timezone
export const TORONTO_TIMEZONE = 'America/Toronto';

// Convert any date to Toronto timezone
export const toTorontoTime = (date: Date | string | null | undefined): Date => {
  try {
    // Handle null or undefined input
    if (!date) {
      console.warn("toTorontoTime called with null or undefined date");
      return new Date(); // Return current date as fallback
    }
    
    // Handle the input date
    const inputDate = typeof date === 'string' ? new Date(date) : date;
    
    // Check if the date is valid
    if (isNaN(inputDate.getTime())) {
      console.warn(`toTorontoTime: Invalid date: ${date}`);
      return new Date(); // Return current date as fallback
    }
    
    // Get the date in Toronto timezone's format
    const torontoTimeString = formatInTimeZone(inputDate, TORONTO_TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
    
    // Parse it back to a Date object
    return new Date(torontoTimeString);
  } catch (error) {
    console.error("Error converting to Toronto time:", error, "For date:", date);
    return new Date(); // Return current date as fallback
  }
};

export const formatUtcDatetimeToAmPm = (dateTimeInput) => {
  const date = new Date(dateTimeInput);

  const year = date.getUTCFullYear();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0'); // Months are 0-based
  const day = date.getUTCDate().toString().padStart(2, '0');

  const hoursUTC = date.getUTCHours();
  const minutesUTC = date.getUTCMinutes();

  const amPm = hoursUTC >= 12 ? 'PM' : 'AM';
  const formattedHours = (hoursUTC % 12 || 12).toString().padStart(2, '0');
  const formattedMinutes = minutesUTC.toString().padStart(2, '0');

  return `${year}-${month}-${day} ${formattedHours}:${formattedMinutes} ${amPm}`;
};

export const filterEvents = (events: any[], filters: any, buildings: any[]) => {
  // Add null checks to ensure events and buildings are arrays
  const safeEvents = Array.isArray(events) ? events : [];
  const safeBuildings = Array.isArray(buildings) ? buildings : [];
  
  console.log("filterEvents called with events:", safeEvents.length, 
              "filters:", filters, 
              "buildings:", safeBuildings.length);
  
  return safeEvents.filter(event => {
    try {
      // Filter by building
      if (filters.building !== 'all' && event.buildingId !== parseInt(filters.building)) {
        return false;
      }
      
      // Filter by amenity
      if (filters.amenity !== 'all' && event.amenityId !== parseInt(filters.amenity)) {
        return false;
      }
      
      // Filter by region
      if (filters.region !== 'all') {
        const building = safeBuildings.find(b => b.building_id === event.buildingId);
        if (!building || building.region_id !== parseInt(filters.region)) {
          return false;
        }
      }
      
      // Filter by event type (array of event type IDs)
      if (filters.eventType && Array.isArray(filters.eventType) && !filters.eventType.includes('all')) {
        // Convert eventTypeId to string to match filter values
        const eventTypeIdStr = event.eventTypeId?.toString();
        if (!eventTypeIdStr || !filters.eventType.includes(eventTypeIdStr)) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error("Error filtering event:", error, event);
      return false;
    }
  });
};

// Refactored version to use our Toronto time helper
export const checkTimeConflict = (
  buildingId: number,
  amenityId: number,
  startDate: Date,
  endDate: Date,
  existingEvents: any[]
) => {
  if (!buildingId || !amenityId || !startDate || !endDate) return false;
  
  console.log('Checking conflicts for:', { buildingId, amenityId, startDate, endDate });
  
  // Filter events by building and amenity
  const relevantEvents = existingEvents.filter(event => 
    event.buildingId === buildingId && 
    event.amenityId === amenityId
  );

  console.log('Relevant events for conflict check:', relevantEvents.length);
  
  const newStart = startDate.getTime();
  const newEnd = endDate.getTime();

  // Check if there's any overlap with existing events
  const conflictingEvent = relevantEvents.find(event => {
    const existingStart = new Date(formatUtcDatetimeToAmPm(event.startTime)).getTime();
    const existingEnd = new Date(formatUtcDatetimeToAmPm(event.endTime)).getTime();
    
    const hasConflict = (
      (newStart >= existingStart && newStart < existingEnd) || // New event starts during existing event
      (newEnd > existingStart && newEnd <= existingEnd) ||     // New event ends during existing event
      (newStart <= existingStart && newEnd >= existingEnd)     // New event completely encompasses existing event
    );
    
    if (hasConflict) {
      console.log('Conflict detected with event:', event);
    }
    
    return hasConflict;
  });
  
  return conflictingEvent ? conflictingEvent : false;
};

export const formatTimeForDisplay = (date: Date): string => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const createFullDateFromParts = (
  date: Date | undefined,
  hour: string,
  minute: string,
  ampm: string
): Date | null => {
  if (!date || !hour || !minute) return null;
  
  const result = new Date(date);
  let hourNum = parseInt(hour);
  
  // Convert 12-hour format to 24-hour format
  if (ampm === 'PM' && hourNum !== 12) hourNum += 12;
  if (ampm === 'AM' && hourNum === 12) hourNum = 0;
  
  result.setHours(hourNum, parseInt(minute), 0, 0);
  return result;
};

// LocalStorage key for events
const EVENTS_STORAGE_KEY = 'app_calendar_events';

// Modified to use localStorage for persistence
let globalEvents: any[] = [];

// Load events from localStorage on init
const loadEventsFromStorage = (): any[] => {
  try {
    const storedEvents = localStorage.getItem(EVENTS_STORAGE_KEY);
    if (storedEvents) {
      // Parse dates properly when loading from localStorage
      const events = JSON.parse(storedEvents);
      return events.map((event: any) => ({
        ...event,
        startTime: new Date(formatUtcDatetimeToAmPm(event.startTime)),
        endTime: new Date(formatUtcDatetimeToAmPm(event.endTime))
      }));
    }
  } catch (error) {
    console.error('Error loading events from localStorage:', error);
  }
  return [];
};

// Save events to localStorage
const saveEventsToStorage = (events: any[]) => {
  try {
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
  } catch (error) {
    console.error('Error saving events to localStorage:', error);
  }
};

// Initialize from localStorage
globalEvents = loadEventsFromStorage();

export const setGlobalEvents = (events: any[]) => {
  globalEvents = [...events];
  saveEventsToStorage(globalEvents);
};

export const getGlobalEvents = () => {
  return [...globalEvents];
};

export const addEventToGlobal = (event: any) => {
  // Make sure we're adding a properly formatted event with an ID
  const newEvent = {
    ...event,
    id: event.id || Date.now() // Use existing ID or create one
  };
  globalEvents.push(newEvent);
  saveEventsToStorage(globalEvents);
  return newEvent;
};

export const removeEventFromGlobal = (eventId: number) => {
  const index = globalEvents.findIndex(e => e.id === eventId);
  if (index !== -1) {
    globalEvents.splice(index, 1);
    saveEventsToStorage(globalEvents);
    return true;
  }
  return false;
};

export const updateEventInGlobal = (updatedEvent: any) => {
  const index = globalEvents.findIndex(e => e.id === updatedEvent.id);
  if (index !== -1) {
    globalEvents[index] = updatedEvent;
    saveEventsToStorage(globalEvents);
    return true;
  }
  return false;
};

// Add a function to generate recurring event instances
export const expandRecurringEvents = (events: any[], year: number, month: number): any[] => {
  // Start with all non-recurring events
  const expandedEvents = [];
  
  // Get the first and last day of the specified month
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  
  // Debug info
  console.log(`Expanding recurring events for ${year}-${month+1}`);
  console.log(`First day: ${firstDayOfMonth.toISOString()}, Last day: ${lastDayOfMonth.toISOString()}`);
  console.log(`Total events: ${events.length}, Recurring events: ${events.filter(e => e.isRecurring).length}`);
  
  // Process recurring events
  events.filter(event => event.isRecurring).forEach(recurringEvent => {
    console.log(`Processing recurring event: ${recurringEvent.title} (${recurringEvent.id})`);
    console.log(`  Pattern: ${recurringEvent?.recurringPatternData?.patternName || ''}`);
    console.log(`  Start date: ${recurringEvent.recurringStartDate}`);
    console.log(`  End date: ${recurringEvent.recurringEndDate}`);
    
    // Skip if missing required fields
    if (!recurringEvent.recurringStartDate || !recurringEvent.recurringEndDate) {
      console.log(`  Skipping: Missing date range`);
      return;
    }
    
    // Convert dates to Date objects - using our Toronto timezone helper
    const recurringStartDate = new Date(formatUtcDate(recurringEvent.recurringStartDate));
    recurringStartDate.setDate(recurringStartDate.getDate() + 1);
    const recurringEndDate = new Date(formatUtcDate(recurringEvent.recurringEndDate));
    
    // Skip if the event's recurring date range doesn't overlap with the target month
    if (recurringEndDate < firstDayOfMonth || recurringStartDate > lastDayOfMonth) {
      console.log(`  Skipping: Date range outside current month`);
      return;
    }
    
    const frequency = recurringEvent.recurringPattern;
    
    // Get pattern data - handle both formats
    let days = [];
    
    if (recurringEvent.recurringPatternData && recurringEvent.recurringPatternData.days) {
      // Format 1: Pattern data from the database
      days = recurringEvent.recurringPatternData.days;
    } else {
      // Default: If no day information, use all days
      days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    }
    
    console.log(`  Days: ${days.join(', ')}`);
    
    // Generate event instances based on frequency
    switch (frequency) {
      case 'Daily':
        generateDailyEvents(
          recurringEvent, 
          recurringStartDate, 
          recurringEndDate, 
          firstDayOfMonth, 
          lastDayOfMonth,
          days,
          expandedEvents
        );
        break;
        
      case 'Weekly':
        generateWeeklyEvents(
          recurringEvent, 
          recurringStartDate, 
          recurringEndDate, 
          firstDayOfMonth, 
          lastDayOfMonth,
          days,
          expandedEvents
        );
        break;
        
      case 'Bi-weekly':
      case 'Bi-Weekly':
      case 'bi-weekly':
        generateBiweeklyEvents(
          recurringEvent, 
          recurringStartDate, 
          recurringEndDate, 
          firstDayOfMonth, 
          lastDayOfMonth,
          days,
          expandedEvents
        );
        break;
        
      case 'Monthly':
        generateMonthlyEvents(
          recurringEvent, 
          recurringStartDate, 
          recurringEndDate, 
          firstDayOfMonth, 
          lastDayOfMonth,
          days,
          expandedEvents
        );
        break;
        
      case 'Quarterly':
        generateQuarterlyEvents(
          recurringEvent, 
          recurringStartDate, 
          recurringEndDate, 
          firstDayOfMonth, 
          lastDayOfMonth,
          days,
          expandedEvents
        );
        break;
        
      default:
        console.log(`  Unsupported frequency: ${frequency}, defaulting to Weekly`);
        generateWeeklyEvents(
          recurringEvent, 
          recurringStartDate, 
          recurringEndDate, 
          firstDayOfMonth, 
          lastDayOfMonth,
          days,
          expandedEvents
        );
    }
  });
  
  console.log(`Generated ${expandedEvents.length} recurring instances`);
  return expandedEvents;
};

// Day name to number mapping (0 = Sunday, 1 = Monday, etc.)
const dayNameToNumber: Record<string, number> = {
  'Sunday': 0,
  'Monday': 1,
  'Tuesday': 2,
  'Wednesday': 3,
  'Thursday': 4,
  'Friday': 5,
  'Saturday': 6
};

// Helper to check if a day name is in the specified days array
const isDayIncluded = (date: Date, days: string[]): boolean => {
  if (!days || days.length === 0) return true; // If no days specified, include all
  
  const dayName = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 
    'Thursday', 'Friday', 'Saturday'
  ][date.getDay()];
  
  return days.includes(dayName);
};

// Helper to create a new instance of a recurring event
const createEventInstance = (
  baseEvent: any, 
  date: Date
): any => {
  // Create a new Date object for start and end time
  const startTime = new Date(formatUtcDatetimeToAmPm(baseEvent.startTime));
  const endTime = new Date(formatUtcDatetimeToAmPm(baseEvent.endTime));

  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-based
  const day = date.getDate().toString().padStart(2, '0');

  const hoursS = startTime.getHours().toString().padStart(2, '0');
  const minutesS = startTime.getMinutes().toString().padStart(2, '0');

  const hoursE = endTime.getHours().toString().padStart(2, '0');
  const minutesE = endTime.getMinutes().toString().padStart(2, '0');

  const dateFormat = `${year}-${month}-${day}`;
  const startTimeFormat = `${year}-${month}-${day}T${hoursS}:${minutesS}:00+00:00`;
  const endTimeFormat = `${year}-${month}-${day}T${hoursE}:${minutesE}:00+00:00`;
  
  const instanceDate = new Date(dateFormat);
  
  // Get the base event ID (might be a string like "123-2023-01-01" or a number)
  const eventId = typeof baseEvent.id === 'string' ? 
    parseInt(baseEvent.id.toString().split('-')[0]) : 
    baseEvent.id;
  
  return {
    ...baseEvent,
    id: `${eventId}-${dateFormat}`, // Create a unique ID with the base event ID
    startTime: startTimeFormat,
    endTime: endTimeFormat,
    date: dateFormat,
    isRecurringInstance: true, // Flag to identify this as a recurring instance
    recurringParentId: eventId  // Store the parent event ID for reference
  };
};

// Generate daily event occurrences
const generateDailyEvents = (
  event: any,
  startDate: Date,
  endDate: Date,
  monthStart: Date,
  monthEnd: Date,
  days: string[],
  result: any[]
) => {
  // Start from the later of startDate or monthStart
  const start = new Date(Math.max(startDate.getTime(), monthStart.getTime()));
  // End at the earlier of endDate or monthEnd
  const end = new Date(Math.min(endDate.getTime(), monthEnd.getTime()));
  
  // Iterate through each day in the range
  const currentDate = new Date(start);
  while (currentDate <= end) {
    // Check if this day of the week is included
    if (isDayIncluded(currentDate, days)) {
      const instance = createEventInstance(event, currentDate);
      result.push(instance);
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
};

// Generate weekly event occurrences
const generateWeeklyEvents = (
  event: any,
  startDate: Date,
  endDate: Date,
  monthStart: Date,
  monthEnd: Date,
  days: string[],
  result: any[]
) => {
  // Start from the later of startDate or monthStart
  const start = new Date(Math.max(startDate.getTime(), monthStart.getTime()));
  // End at the earlier of endDate or monthEnd
  const end = new Date(Math.min(endDate.getTime(), monthEnd.getTime()));
  
  // For weekly events, we should only create events on the same day of the week as the start date
  // If days array is provided, use it. Otherwise, use the day of the original start date
  const dayOfWeek = new Date(event.startTime).getDay();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // If days array is empty or not specified, use the day of week from the original event
  const daysToUse = (days && days.length > 0) ? days : [dayNames[dayOfWeek]];
  
  console.log(`Weekly event: Using days ${daysToUse.join(', ')} for event "${event.title}"`);
  
  // For each day name in the days array
  daysToUse.forEach(day => {
    const dayNumber = dayNameToNumber[day];
    if (dayNumber === undefined) return;
    
    // Find the first occurrence of this day on or after start date
    const firstOccurrence = new Date(start);
    const startDayOfWeek = firstOccurrence.getDay();
    const daysToAdd = (dayNumber - startDayOfWeek + 7) % 7;
    firstOccurrence.setDate(firstOccurrence.getDate() + daysToAdd);
    
    // Generate weekly occurrences
    const currentDate = new Date(firstOccurrence);
    while (currentDate <= end) {
      const instance = createEventInstance(event, currentDate);
      result.push(instance);
      
      // Move to next week
      currentDate.setDate(currentDate.getDate() + 7);
    }
  });
};

// Generate bi-weekly event occurrences
const generateBiweeklyEvents = (
  event: any,
  startDate: Date,
  endDate: Date,
  monthStart: Date,
  monthEnd: Date,
  days: string[],
  result: any[]
) => {
  // Similar to weekly but with 14-day interval
  // Start from the later of startDate or monthStart
  const start = new Date(Math.max(startDate.getTime(), monthStart.getTime()));
  // End at the earlier of endDate or monthEnd
  const end = new Date(Math.min(endDate.getTime(), monthEnd.getTime()));
  
  // For each day name in the days array
  days.forEach(day => {
    const dayNumber = dayNameToNumber[day];
    if (dayNumber === undefined) return;
    
    // Find the first occurrence of this day on or after start date
    const firstOccurrence = new Date(start);
    const startDayOfWeek = firstOccurrence.getDay();
    const daysToAdd = (dayNumber - startDayOfWeek + 7) % 7;
    firstOccurrence.setDate(firstOccurrence.getDate() + daysToAdd);
    
    // Generate bi-weekly occurrences
    const currentDate = new Date(firstOccurrence);
    while (currentDate <= end) {
      const instance = createEventInstance(event, currentDate);
      result.push(instance);
      
      // Move to next bi-week (14 days)
      currentDate.setDate(currentDate.getDate() + 14);
    }
  });
};

// Generate monthly event occurrences
const generateMonthlyEvents = (
  event: any,
  startDate: Date,
  endDate: Date,
  monthStart: Date,
  monthEnd: Date,
  days: string[],
  result: any[]
) => {
  // Start from the later of startDate or monthStart
  const start = new Date(Math.max(startDate.getTime(), monthStart.getTime()));
  // End at the earlier of endDate or monthEnd
  const end = new Date(Math.min(endDate.getTime(), monthEnd.getTime()));
  
  // For each day name in the days array
  days.forEach(day => {
    const dayNumber = dayNameToNumber[day];
    if (dayNumber === undefined) return;
    
    // Find all monthly occurrences in the date range
    // Most monthly patterns refer to "First Monday", "Second Tuesday", etc.
    // So we'll find the nth occurrence of the given day in each month
    
    // Get the occurrence number from the start date (1st, 2nd, 3rd, 4th)
    const occurrence = Math.ceil(startDate.getDate() / 7);
    
    // Start with the month of the start date
    const currentDate = new Date(start);
    currentDate.setDate(1); // Move to first day of month
    
    while (currentDate <= end) {
      // Find the specified occurrence of the day in this month
      let found = false;
      let dayCount = 0;
      let testDate = new Date(currentDate);
      
      while (testDate.getMonth() === currentDate.getMonth()) {
        if (testDate.getDay() === dayNumber) {
          dayCount++;
          
          // If this is the nth occurrence we're looking for
          if (dayCount === occurrence) {
            // Check if the date is within our range
            if (testDate >= start && testDate <= end) {
              const instance = createEventInstance(event, testDate);
              result.push(instance);
            }
            found = true;
            break;
          }
        }
        
        testDate.setDate(testDate.getDate() + 1);
      }
      
      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
  });
};

// Generate quarterly event occurrences
const generateQuarterlyEvents = (
  event: any,
  startDate: Date,
  endDate: Date,
  monthStart: Date,
  monthEnd: Date,
  days: string[],
  result: any[]
) => {
  // Similar to monthly but with 3-month interval
  // Start from the later of startDate or monthStart
  const start = new Date(Math.max(startDate.getTime(), monthStart.getTime()));
  // End at the earlier of endDate or monthEnd
  const end = new Date(Math.min(endDate.getTime(), monthEnd.getTime()));
  
  // For each day name in the days array
  days.forEach(day => {
    const dayNumber = dayNameToNumber[day];
    if (dayNumber === undefined) return;
    
    // Get the occurrence number from the start date (1st, 2nd, 3rd, 4th)
    const occurrence = Math.ceil(startDate.getDate() / 7);
    
    // Start with the quarter of the start date
    const currentDate = new Date(start);
    currentDate.setDate(1); // Move to first day of month
    
    // Calculate the starting month of the quarter
    const quarterStartMonth = Math.floor(currentDate.getMonth() / 3) * 3;
    currentDate.setMonth(quarterStartMonth);
    
    while (currentDate <= end) {
      // Find the specified occurrence of the day in this quarter's first month
      let found = false;
      let dayCount = 0;
      let testDate = new Date(currentDate);
      
      while (testDate.getMonth() === currentDate.getMonth()) {
        if (testDate.getDay() === dayNumber) {
          dayCount++;
          
          // If this is the nth occurrence we're looking for
          if (dayCount === occurrence) {
            // Check if the date is within our range
            if (testDate >= start && testDate <= end) {
              const instance = createEventInstance(event, testDate);
              result.push(instance);
            }
            found = true;
            break;
          }
        }
        
        testDate.setDate(testDate.getDate() + 1);
      }
      
      // Move to next quarter (3 months)
      currentDate.setMonth(currentDate.getMonth() + 3);
    }
  });
};

export const toUtcFixedDateString = (date) => {
  const yyyy = date.getFullYear();
  const MM = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${yyyy}-${MM}-${dd}`;
};

export const toUtcFixedDatetimeString = (date) => {
  const yyyy = date.getFullYear();
  const MM = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${yyyy}-${MM}-${dd}T${hh}:${mm}:${ss}+00:00`;
};

export const formatUtcDate = (dateTimeInput) => {
  const date = new Date(dateTimeInput);

  const day = date.getUTCDate().toString().padStart(2, '0');
  const month = date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }); // e.g., "May"
  const year = date.getUTCFullYear();

  return `${day} ${month} ${year}`;
};

export const formatUtcTimeToAmPm = (dateTimeInput) => {
  const date = new Date(dateTimeInput);

  const hoursUTC = date.getUTCHours();
  const minutesUTC = date.getUTCMinutes();

  const amPm = hoursUTC >= 12 ? 'PM' : 'AM';
  const formattedHours = hoursUTC % 12 || 12; // Convert 0 to 12 for 12-hour format
  const formattedMinutes = minutesUTC.toString().padStart(2, '0');

  return `${formattedHours}:${formattedMinutes} ${amPm}`;
};

export const formatTimeToAmPm = (dateTimeInput) => {
  const date = new Date(dateTimeInput);

  const hoursUTC = date.getHours();
  const minutesUTC = date.getMinutes();

  const amPm = hoursUTC >= 12 ? 'PM' : 'AM';
  const formattedHours = hoursUTC % 12 || 12; // Convert 0 to 12 for 12-hour format
  const formattedMinutes = minutesUTC.toString().padStart(2, '0');

  return `${formattedHours}:${formattedMinutes} ${amPm}`;
};

export const formatUtcTime = (dateTimeInput) => {
  const date = new Date(dateTimeInput);

  const hoursUTC = date.getUTCHours();
  const minutesUTC = date.getUTCMinutes();

  return `${hoursUTC}:${minutesUTC}`;
};
