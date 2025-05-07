import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toUtcFixedDateString, toUtcFixedDatetimeString, createFullDateFromParts, formatTimeToAmPm, formatUtcDate, formatUtcDatetimeToAmPm } from '@/utils/calendarUtils';
import { NavigateFunction } from 'react-router-dom';

interface EventFormSubmissionProps {
  formState: any;
  recurringPatterns: any[];
  setIsLoading: (isLoading: boolean) => void;
  navigate: NavigateFunction;
  onConflictDetected?: (conflictData: ConflictData) => void;
}

interface ConflictData {
  isRecurring: boolean;
  buildingName: string;
  conflicts: {
    date: string;
    events: {
      title: string;
      time: string;
    }[];
  }[];
  eventData: any;
  skipConflicts?: () => Promise<boolean>;
}

export const submitEventForm = async ({
  formState,
  recurringPatterns,
  setIsLoading,
  navigate,
  onConflictDetected
}: EventFormSubmissionProps) => {
  const {
    eventTitle,
    selectedEventType,
    selectedBuilding,
    selectedAmenity,
    eventDate,
    startHour,
    startMinute,
    startAmPm,
    endHour,
    endMinute,
    endAmPm,
    notes,
    cost,
    contactPhone,
    contactEmail,
    attachment,
    isRecurring,
    startDate,
    endDate,
    selectedRecurringPattern,
  } = formState;

  if (!eventDate || !startHour || !startMinute || !endHour || !endMinute) {
    toast.error('Please fill in all required fields');
    return;
  }

  const startDateTime = createFullDateFromParts(
    eventDate, 
    startHour, 
    startMinute, 
    startAmPm
  );
  const endDateTime = createFullDateFromParts(
    eventDate, 
    endHour, 
    endMinute, 
    endAmPm
  );
  
  if (!startDateTime || !endDateTime) {
    toast.error('Invalid date or time');
    return;
  }
  
  setIsLoading(true);
  
  try {
    let attachmentUrl = null;
    
    // Upload attachment if one is provided
    if (attachment) {
      const timestamp = new Date().getTime();
      const fileExt = attachment.name.split('.').pop();
      const fileName = `${timestamp}-${eventTitle.replace(/\s+/g, '-').toLowerCase()}${fileExt ? '.' + fileExt : ''}`;
      const filePath = `${fileName}`;
      
      // Upload the file to Supabase storage
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('event-attachments')
        .upload(filePath, attachment);
      
      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        toast.error('Failed to upload attachment. Please try again.');
        throw uploadError;
      }
      
      // Get the public URL
      const { data } = supabase.storage.from('event-attachments').getPublicUrl(filePath);
      attachmentUrl = data.publicUrl;
      
      console.log('File uploaded successfully, URL:', attachmentUrl);
    }

    // Prepare data for Supabase insert
    const eventData = {
      event_title: formState.eventTitle,
      event_type_id: parseInt(formState.selectedEventType),
      building_id: parseInt(formState.selectedBuilding),
      amenity_id: parseInt(formState.selectedAmenity),
      start_time: toUtcFixedDatetimeString(startDateTime),
      end_time: toUtcFixedDatetimeString(endDateTime),
      one_time_date: toUtcFixedDateString(formState.eventDate),
      notes: formState.notes,
      cost: parseFloat(formState.cost) || 0,
      is_recurring: formState.isRecurring,
      recurring_pattern_id: formState.isRecurring && formState.selectedRecurringPattern 
        ? parseInt(formState.selectedRecurringPattern) 
        : null,
      recurring_start_date: formState.isRecurring && formState.startDate 
        ? toUtcFixedDateString(formState.startDate) 
        : null,
      recurring_end_date: formState.isRecurring && formState.endDate 
        ? toUtcFixedDateString(formState.endDate) 
        : null,
      contact_phone: formState.contactPhone,
      contact_email: formState.contactEmail,
      attachment_url: attachmentUrl
    };

    // Get building name for conflict notification
    const { data: buildingData, error: buildingError } = await supabase
      .from('buildings')
      .select('building_name')
      .eq('building_id', eventData.building_id)
      .single();
    
    const buildingName = buildingError ? 'Selected Building' : buildingData?.building_name;

    // Improved time format extraction for conflict detection
    const startDateCon = new Date(formatUtcDatetimeToAmPm(eventData.start_time));
    const hourStartCon = startDateCon.getHours();
    const minStartCon = startDateCon.getMinutes();
    
    const endDateCon = new Date(formatUtcDatetimeToAmPm(eventData.end_time));
    const hourEndCon = endDateCon.getHours();
    const minEndCon = endDateCon.getMinutes();

    const pad2 = n => n.toString().padStart(2, '0');

    console.log(
      `Start time: ${hourStartCon}:${pad2(minStartCon)}:00`,
      `End time:   ${hourEndCon}:${pad2(minEndCon)}:00`
    );
    
    // Enhanced conflict detection for recurring events
    if (eventData.is_recurring && formState.startDate && formState.endDate) {
      let allConflicts = [];

      try {
        // Use the comprehensive conflict detection function
        const conflictingDates = await findAllConflictingDates(eventData);
        
        if (conflictingDates.length > 0) {
          // Format the conflicting dates for display
          const formattedConflicts = [];
          
          // Group conflicts by date for better display
          for (const dateStr of conflictingDates) {
            console.log('Processing conflict date:', dateStr);
            const displayDate = formatUtcDate(dateStr);
            console.log('Formatted display date:', displayDate);
            
            // Get the specific conflicting events for this date
            const { data: conflictEvents } = await supabase.rpc('find_conflicting_events', {
        b_id: eventData.building_id,
        a_id: eventData.amenity_id,
              target_date: dateStr,
        s_time: `${hourStartCon}:${minStartCon}:00`,
        e_time: `${hourEndCon}:${minEndCon}:00`,
      });
      
            if (conflictEvents && conflictEvents.length > 0) {
              formattedConflicts.push({
          date: displayDate,
                events: conflictEvents.map(event => {
            const start = formatTimeToAmPm(event.start_time);
            const end = formatTimeToAmPm(event.end_time);
            return {
              id: event.event_id,
              title: event.event_title,
              time: `${start} - ${end}`
            };
          })
        });
      }
          }
          
          console.log('Formatted conflicts for display:', formattedConflicts);
          allConflicts = formattedConflicts;
        }
      } catch (error) {
        console.error('Error detecting conflicts:', error);
        toast.error('Error checking for scheduling conflicts.');
        setIsLoading(false);
        return false;
      }
      
      // If we found conflicts and have a conflict handler
      if (allConflicts.length > 0 && onConflictDetected) {
        const conflictData = {
          isRecurring: true,
          buildingName,
          conflicts: allConflicts,
          eventData
        };
        
        // Extract the conflicting dates to skip them
        const conflictDates = allConflicts.map(conflict => {
          // Convert display date back to UTC format for database
          if (!conflict.date) {
            console.error('Missing date in conflict data:', conflict);
            return null;
          }
          
          // Handle different date formats (MM/DD/YYYY or YYYY-MM-DD)
          let formattedDate;
          if (conflict.date.includes('/')) {
            const dateParts = conflict.date.split('/');
            if (dateParts.length !== 3) {
              console.error('Invalid date format:', conflict.date);
              return null;
            }
            // Ensure we have valid parts before calling padStart
            const year = dateParts[2] || '';
            const month = dateParts[0] ? dateParts[0].padStart(2, '0') : '01';
            const day = dateParts[1] ? dateParts[1].padStart(2, '0') : '01';
            formattedDate = `${year}-${month}-${day}`;
          } else {
            // Assume it's already in YYYY-MM-DD format
            formattedDate = conflict.date;
          }
          
          return formattedDate;
        }).filter(Boolean); // Remove any null values
        
        // Ask user if they want to proceed with scheduling by skipping conflicts
        onConflictDetected({
          ...conflictData,
          // Add skipConflicts function to allow direct creation with skipped dates
          skipConflicts: async () => {
            setIsLoading(true);
            const result = await createEventSkippingConflicts(eventData, conflictDates);
            setIsLoading(false);
            if (result) navigate('/calendar');
            return !!result; // Ensure we return a boolean
          }
        });
        
        setIsLoading(false);
        return false;
      } else if (allConflicts.length > 0) {
        // Default behavior if no conflict handler - skip conflicts automatically
        const conflictDates = allConflicts.map(conflict => {
          // Convert display date back to UTC format for database
          if (!conflict.date) {
            console.error('Missing date in conflict data:', conflict);
            return null;
          }
          
          // Handle different date formats (MM/DD/YYYY or YYYY-MM-DD)
          let formattedDate;
          if (conflict.date.includes('/')) {
            const dateParts = conflict.date.split('/');
            if (dateParts.length !== 3) {
              console.error('Invalid date format:', conflict.date);
              return null;
            }
            // Ensure we have valid parts before calling padStart
            const year = dateParts[2] || '';
            const month = dateParts[0] ? dateParts[0].padStart(2, '0') : '01';
            const day = dateParts[1] ? dateParts[1].padStart(2, '0') : '01';
            formattedDate = `${year}-${month}-${day}`;
          } else {
            // Assume it's already in YYYY-MM-DD format
            formattedDate = conflict.date;
          }
          
          return formattedDate;
        }).filter(Boolean); // Remove any null values
        
        // Automatically skip conflicting dates
        const result = await createEventSkippingConflicts(eventData, conflictDates);
        if (result) {
          navigate('/calendar');
        }
        setIsLoading(false);
        return !!result;
      }
    } else {
      // Non-recurring event conflict detection - using the enhanced SQL function
      const { data: existingEvent, error: eventQueryError } = await supabase.rpc('find_conflicting_events', {
        b_id: eventData.building_id,
        a_id: eventData.amenity_id,
        target_date: eventData.one_time_date,
        s_time: `${hourStartCon}:${minStartCon}:00`,
        e_time: `${hourEndCon}:${minEndCon}:00`,
      });
      
      if (eventQueryError) {
        console.error('Error querying event:', eventQueryError);
        throw eventQueryError;
      }
      
      console.log("Conflicts detected for non-recurring event:", existingEvent);

      // Enhanced conflict reporting
      if (existingEvent && existingEvent.length > 0 && onConflictDetected) {
        const formattedDate = formatUtcDate(formState.eventDate);
        
        const conflicts = [{
          date: formattedDate,
          events: existingEvent.map(event => {
            const start = formatTimeToAmPm(event.start_time);
            const end = formatTimeToAmPm(event.end_time);
            return {
              id: event.event_id,
              title: event.event_title,
              time: `${start} - ${end}`
            };
          })
        }];
        
        const conflictData = {
          isRecurring: false,
          buildingName,
          conflicts,
          eventData
        };
        
        onConflictDetected(conflictData);
        setIsLoading(false);
        return false;
      } else if (existingEvent && existingEvent.length > 0) {
        // Default behavior if no conflict handler
        console.log(`An event already exists with the same building, amenity, time range, and date.`);
        toast.info('A scheduling conflict was detected. An event already exists at this time and location.');
        setIsLoading(false);
        return false;
      }
    }

    // No conflicts, proceed with creating the event
    const { data, error } = await supabase
      .from('events')
      .insert(eventData)
      .select();
    
    if (error) throw error;
    
    console.log("Created new event:", data);
    toast.success('Event created successfully!');
    navigate('/calendar');
    return true;
  } catch (error) {
    console.error("Error creating event:", error);
    toast.error('Failed to create event. Please try again.');
    return false;
  } finally {
    setIsLoading(false);
  }
};

// Enhanced function to create event while skipping conflicting dates
export const createEventSkippingConflicts = async (eventData: any, conflictDates: string[]) => {
  try {
    // Log the input parameters to help debugging
    console.log('Creating event with skipped conflicts. Event data:', eventData);
    console.log('Conflict dates to skip:', conflictDates);
    
    // For non-recurring events, we shouldn't be here
    if (!eventData.is_recurring) {
      throw new Error("Cannot skip conflicts for non-recurring events");
    }
    
    // First, let's create the main recurring event
    const { data, error } = await supabase
      .from('events')
      .insert(eventData)
      .select();
    
    if (error) {
      console.error('Error creating main event:', error);
      throw error;
    }
    
    console.log('Created main recurring event:', data[0]);

    // Ensure conflictDates are all in the correct format
    const formattedConflictDates = conflictDates.filter(date => date && typeof date === 'string')
      .map(dateStr => {
        // Ensure the date is in YYYY-MM-DD format
        if (dateStr.includes('/')) {
          try {
            const parts = dateStr.split('/');
            if (parts.length === 3) {
              const year = parts[2];
              const month = parts[0].padStart(2, '0');
              const day = parts[1].padStart(2, '0');
              return `${year}-${month}-${day}`;
            }
          } catch (e) {
            console.error('Error formatting date:', dateStr, e);
          }
        }
        return dateStr; // Return as-is if no conversion needed or if conversion failed
      });
    
    console.log('Formatted conflict dates:', formattedConflictDates);

    // Now handle the exceptions - for each conflicting date
    if (formattedConflictDates.length > 0) {
      console.log('Skipping conflicting dates:', formattedConflictDates);
      
      // Create exceptions in deleted_events table for each conflicting date
      const exceptions = formattedConflictDates.map(dateStr => ({
        event_id: data[0].event_id,
        excluded_date: dateStr
      }));
      
      // Insert all exceptions at once
      const { error: exceptionsError } = await supabase
        .from('deleted_events')
        .insert(exceptions);
      
      if (exceptionsError) {
        console.error('Error creating exceptions:', exceptionsError);
        // We won't throw here as the main event was created successfully
      }
    }
    
    // Generate all created dates (those not conflicting)
    const startDate = new Date(eventData.recurring_start_date);
    const endDate = new Date(eventData.recurring_end_date);
    
    // Get the pattern information to generate all dates
    const { data: patternData } = await supabase
      .from('recurring_patterns')
      .select('*')
      .eq('pattern_id', eventData.recurring_pattern_id)
      .single();
    
    // Import the date generation function
    const { generateRecurringDates } = await import('./generateRecurringDates');
    
    // Generate all possible dates for this recurring event - use days[0] instead of pattern_day
    const allDates = generateRecurringDates(
      startDate, 
      endDate, 
      patternData?.frequency || 'Weekly',
      patternData?.days?.[0] || null
    );
    
    // Convert all dates to strings in the same format as conflictDates
    const allDateStrings = allDates.map(date => format(date, 'yyyy-MM-dd'));
    
    // Filter out the conflicting dates
    const createdDates = allDateStrings.filter(date => !formattedConflictDates.includes(date));
    
    // Prepare result object
    const result = {
      event_id: data[0].event_id,
      is_recurring: true,
      skipped_dates: formattedConflictDates.map(dateStr => new Date(dateStr)),
      created_dates: createdDates.map(dateStr => new Date(dateStr))
    };
    
    console.log('Event creation result:', result);
    
    toast.success(`Event created successfully, skipping ${formattedConflictDates.length} conflicting date(s)`);
    return true;
  } catch (error) {
    console.error("Error creating event with skipped conflicts:", error);
    toast.error('Failed to create event. Please try again.');
    return false;
  }
};

// Comprehensive function to find all conflicting dates for a recurring event
export const findAllConflictingDates = async (eventData: any) => {
  try {
    console.log('Starting conflict detection for event data:', eventData);
    
    // Get building id and amenity id
    const buildingId = eventData.building_id;
    const amenityId = eventData.amenity_id;
    
    // Get time information
    const startTime = eventData.start_time.split('T')[1].substring(0, 8); // Extract HH:MM:SS
    const endTime = eventData.end_time.split('T')[1].substring(0, 8);     // Extract HH:MM:SS
    console.log('Checking for time conflicts between:', startTime, 'and', endTime);
    
    // Get date range
    const startDate = eventData.recurring_start_date;
    const endDate = eventData.recurring_end_date;
    console.log('Date range:', startDate, 'to', endDate);
    
    // Get pattern information
    const { data: patternData, error: patternError } = await supabase
      .from('recurring_patterns')
      .select('*')
      .eq('pattern_id', eventData.recurring_pattern_id)
      .single();
    
    if (patternError) {
      console.error('Error fetching pattern data:', patternError);
      throw patternError;
    }
    
    console.log('Pattern data:', patternData);
    
    if (!patternData) {
      throw new Error('Pattern not found');
  }
  
    // Generate all candidate dates based on pattern
    const { generateRecurringDates } = await import('./generateRecurringDates');
    console.log('Generating candidate dates with pattern:', patternData.frequency, 'and first day:', patternData.days?.[0]);
    
    const candidateDates = generateRecurringDates(
      new Date(startDate),
      new Date(endDate),
      patternData.frequency,
      patternData.days?.[0] || null
    );
    
    console.log('Generated candidate dates:', candidateDates.length);
    
    // Format dates for database queries
    const formattedDates = candidateDates.map(date => format(date, 'yyyy-MM-dd'));
    console.log('Formatted candidate dates:', formattedDates);
    
    // Get all one-time events that might conflict
    console.log('Fetching one-time events...');
    const { data: oneTimeConflicts, error: oneTimeError } = await supabase
      .from('events')
      .select('*')
      .eq('building_id', buildingId)
      .eq('amenity_id', amenityId)
      .eq('is_recurring', false)
      .gte('one_time_date', startDate)
      .lte('one_time_date', endDate);
    
    if (oneTimeError) {
      console.error('Error fetching one-time events:', oneTimeError);
      throw oneTimeError;
    }
    
    console.log('Found one-time events:', oneTimeConflicts?.length || 0);

    // Get all recurring events that might conflict
    console.log('Fetching recurring events...');
    const { data: recurringEvents, error: recurringError } = await supabase
      .from('events')
      .select('*, recurring_patterns(*)')
      .eq('building_id', buildingId)
      .eq('amenity_id', amenityId)
      .eq('is_recurring', true)
      .or(`recurring_start_date.lte.${endDate},recurring_end_date.gte.${startDate}`);
    
    if (recurringError) {
      console.error('Error fetching recurring events:', recurringError);
      throw recurringError;
    }
    
    console.log('Found recurring events:', recurringEvents?.length || 0);
    
    // Track all conflicting dates
    const conflictingDates = [];
    
    // Check one-time events for conflicts
    console.log('Checking one-time events for conflicts...');
    for (const oneTimeEvent of oneTimeConflicts || []) {
      // Check if times overlap
      const oneTimeStart = oneTimeEvent.start_time.split('T')[1].substring(0, 8);
      const oneTimeEnd = oneTimeEvent.end_time.split('T')[1].substring(0, 8);
      
      console.log('Checking one-time event:', oneTimeEvent.event_title, 'on', oneTimeEvent.one_time_date);
      console.log('Time range:', oneTimeStart, 'to', oneTimeEnd);
      
      if (!(endTime <= oneTimeStart || startTime >= oneTimeEnd)) {
        // Times overlap, add this date to conflicts
        console.log('Time conflict detected with one-time event');
        conflictingDates.push(oneTimeEvent.one_time_date);
      }
    }
    
    // Check recurring events for conflicts
    console.log('Checking recurring events for conflicts...');
    for (const recurringEvent of recurringEvents || []) {
      console.log('Checking recurring event:', recurringEvent.event_title);
      
      // Get all dates for this recurring event
      const recEventStart = new Date(recurringEvent.recurring_start_date);
      const recEventEnd = new Date(recurringEvent.recurring_end_date);
      const pattern = recurringEvent.recurring_patterns;
      
      console.log('Recurring event date range:', recurringEvent.recurring_start_date, 'to', recurringEvent.recurring_end_date);
      console.log('Pattern:', pattern);
  
      // Generate all dates for this recurring event
      console.log('Generating dates for recurring event with pattern:', pattern.frequency, 'and first day:', pattern.days?.[0]);
      const recurringDates = generateRecurringDates(
        recEventStart,
        recEventEnd,
        pattern.frequency,
        pattern.days?.[0] || null
      );
      
      console.log('Generated dates for recurring event:', recurringDates.length);
  
      // Get excluded dates for this recurring event
      const { data: excludedDates } = await supabase
        .from('deleted_events')
        .select('excluded_date')
        .eq('event_id', recurringEvent.event_id);
      
      const excludedDateStrings = (excludedDates || []).map(d => d.excluded_date);
      console.log('Excluded dates for recurring event:', excludedDateStrings);
      
      // Format dates for comparison
      const formattedRecurringDates = recurringDates
        .map(date => format(date, 'yyyy-MM-dd'))
        .filter(date => !excludedDateStrings.includes(date)); // Remove excluded dates
      
      console.log('Formatted dates after excluding cancelled instances:', formattedRecurringDates.length);
      
      // Get time information for this recurring event
      const recEventStartTime = recurringEvent.start_time.split('T')[1].substring(0, 8);
      const recEventEndTime = recurringEvent.end_time.split('T')[1].substring(0, 8);
      console.log('Recurring event time range:', recEventStartTime, 'to', recEventEndTime);
      
      // Check for time overlap
      if (!(endTime <= recEventStartTime || startTime >= recEventEndTime)) {
        console.log('Time overlap detected with recurring event');
        // Times overlap, check dates
        // Add any dates that appear in both sets to conflicts
        for (const date of formattedDates) {
          if (formattedRecurringDates.includes(date)) {
            console.log('Date conflict found:', date);
            conflictingDates.push(date);
    }
        }
      }
    }
    
    // Return unique dates
    const uniqueConflicts = [...new Set(conflictingDates)];
    console.log('Final conflicting dates:', uniqueConflicts);
    return uniqueConflicts;
  } catch (error) {
    console.error('Error finding conflicting dates:', error);
    throw error;
  }
};
