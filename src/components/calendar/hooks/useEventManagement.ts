import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CalendarEvent } from '../types/CalendarTypes';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { formatUtcDate } from '@/utils/calendarUtils';

export const useEventManagement = (events: CalendarEvent[], setEvents: (events: CalendarEvent[]) => void, fetchEvents?: () => Promise<void>) => {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventDetails, setShowEventDetails] = useState<boolean>(false);
  const [showEventEdit, setShowEventEdit] = useState<boolean>(false);
  const [deleteInProgress, setDeleteInProgress] = useState<boolean>(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<boolean>(false);
  const [currentDeleteType, setCurrentDeleteType] = useState<'single' | 'series' | undefined>(undefined);
  const [editInProgress, setEditInProgress] = useState<boolean>(false);
  const [showEditConfirmation, setShowEditConfirmation] = useState<boolean>(false);
  const [currentEditType, setCurrentEditType] = useState<'single' | 'series' | undefined>(undefined);
  const [editedEvent, setEditedEvent] = useState<CalendarEvent | null>(null);
  
  // Function to refresh events from the database
  const refreshEvents = useCallback(async () => {
    if (fetchEvents) {
      await fetchEvents();
    }
  }, [fetchEvents]);
  
  // Handle event click
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventDetails(true);
  };
  
  // Handle edit click from detail dialog
  const handleEditClick = (event: CalendarEvent) => {
    // Use the enriched event passed from the detail dialog
    console.log("handleEditClick received event:", event);
    if (event) {
      setSelectedEvent(event);
    }
    setShowEventDetails(false);
    setShowEventEdit(true);
  };
  
  // Handle close detail dialog
  const handleCloseDetails = () => {
    // Only clear the selected event if we're not about to edit it
    if (!showEventEdit) {
      setSelectedEvent(null);
    }
    setShowEventDetails(false);
  };
  
  // Handle close edit form
  const handleCloseEdit = () => {
    setSelectedEvent(null);
    setShowEventEdit(false);
    setEditedEvent(null);
  };
  
  // Show edit confirmation dialog for recurring events
  const confirmEventEdit = (updatedEvent: CalendarEvent) => {
    setEditedEvent(updatedEvent);
    
    if (updatedEvent.isRecurring) {
      setShowEditConfirmation(true);
    } else {
      executeEventEdit(updatedEvent);
    }
  };
  
  // Execute the actual event edit after confirmation
  const executeEventEdit = async (eventToEdit: CalendarEvent | null = null, editType: 'single' | 'series' | null = null) => {
    const eventToUpdate = eventToEdit || editedEvent;
    if (!eventToUpdate) return;
    
    try {
      setEditInProgress(true);
      
      const eventId = parseInt(eventToUpdate.id.toString().split('-')[0]);
      
      if (eventToUpdate.isRecurring && (editType === 'single' || currentEditType === 'single')) {
        // Handle single occurrence edit of a recurring event
        // Create an exception in modified_events table
        const startTime = new Date(eventToUpdate.startTime);
        const dateStr = format(startTime, 'yyyy-MM-dd');
        
        console.log('Editing single occurrence of recurring event:', {
          eventId,
          dateStr,
          eventToUpdate
        });
        
        // Insert into modified_events table
        const { error } = await supabase
          .from('modified_events')
          .upsert({
            event_id: eventId,
            modified_date: dateStr,
            building_id: parseInt(eventToUpdate.buildingId.toString()),
            amenity_id: parseInt(eventToUpdate.amenityId.toString()),
            event_title: eventToUpdate.title,
            start_time: eventToUpdate.startTime,
            end_time: eventToUpdate.endTime,
            event_type_id: parseInt(eventToUpdate.eventTypeId.toString()),
            notes: eventToUpdate.notes,
            cost: typeof eventToUpdate.cost === 'string' ? parseFloat(eventToUpdate.cost) : eventToUpdate.cost,
            contact_phone: eventToUpdate.contactPhone,
            contact_email: eventToUpdate.contactEmail
          });
        
        if (error) throw error;
        
        // Refresh events from database instead of manually updating state
        await refreshEvents();
        toast.success('Event occurrence updated successfully');
      } else {
        // Handle entire series edit or non-recurring event edit
        console.log('Editing entire series or non-recurring event:', {
          eventId,
          isRecurring: eventToUpdate.isRecurring
        });

        // Deleted modified_events table.
        const { error: modifiedEventsError } = await supabase
          .from('modified_events')
          .delete()
          .eq('event_id', eventId);
        
        if (modifiedEventsError) throw modifiedEventsError;
        
        // Update the event in the database
        const { error } = await supabase
          .from('events')
          .update({
            event_title: eventToUpdate.title,
            event_type_id: parseInt(eventToUpdate.eventTypeId.toString()),
            building_id: parseInt(eventToUpdate.buildingId.toString()),
            amenity_id: parseInt(eventToUpdate.amenityId.toString()),
            start_time: eventToUpdate.startTime,
            end_time: eventToUpdate.endTime,
            notes: eventToUpdate.notes,
            cost: typeof eventToUpdate.cost === 'string' ? parseFloat(eventToUpdate.cost) : eventToUpdate.cost,
            contact_phone: eventToUpdate.contactPhone,
            contact_email: eventToUpdate.contactEmail
          })
          .eq('event_id', eventId);
        
        if (error) throw error;
        
        // Refresh events from database instead of manually updating state
        await refreshEvents();
        toast.success(eventToUpdate.isRecurring ? 'Entire event series updated' : 'Event updated successfully');
      }
      
      // Close all dialogs
      setShowEventEdit(false);
      setShowEditConfirmation(false);
      setSelectedEvent(null);
      setEditedEvent(null);
      setCurrentEditType(undefined);
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Failed to update event. Please try again.');
    } finally {
      setEditInProgress(false);
    }
  };
  
  // Show delete confirmation dialog
  const confirmEventDelete = async (deleteType?: 'single' | 'series') => {
    if (!selectedEvent) return;

    setCurrentDeleteType(deleteType);
    setShowDeleteConfirmation(true);
    executeEventDelete(deleteType);
  };
  
  // Execute the actual deletion after confirmation
  const executeEventDelete = async (type = null) => {
    if (!selectedEvent) return;
    
    try {
      setDeleteInProgress(true);
      
      if (selectedEvent.isRecurring) {
        const ids = selectedEvent.id.toString().split('-');
        const startTime = new Date(formatUtcDate(selectedEvent.startTime));
  
        const year = startTime.getFullYear();
        const month = String(startTime.getMonth() + 1).padStart(2, '0'); // Months are 0-based
        const day = String(startTime.getDate()).padStart(2, '0');
  
        const id = ids[0];
        const date = `${year}-${month}-${day}`;

        if (currentDeleteType === 'series' || type === 'series') {
          // Delete the entire recurring series from the database
          console.log('Deleting entire recurring series, event ID:', selectedEvent.id);
          const { error } = await supabase
            .from('events')
            .delete()
            .eq('event_id', Number(id));
          
          if (error) throw error;

          // Refresh events from database instead of manually updating state
          await refreshEvents();
          toast.success('Event series deleted successfully');
        } else if (currentDeleteType === 'single' || type === 'single') {
          // Get the current instance date
          console.log('Deleting single occurrence of recurring event:', selectedEvent);

          // Insert into deleted_events table
          const { error } = await supabase
            .from('deleted_events')
            .insert({
              event_id: Number(id),
              excluded_date: date
            });
          
          if (error) throw error;

          // Refresh events from database instead of manually updating state
          await refreshEvents();
          toast.success('Event occurrence deleted successfully');
        } else {
          console.error("Something went wrong while deleting recurring events.");
          return;
        }
      } else {
        // Delete non-recurring event
        console.log('Deleting non-recurring event, event ID:', selectedEvent.id);
        const { error } = await supabase
          .from('events')
          .delete()
          .eq('event_id', Number(selectedEvent.id));
        
        if (error) throw error;
        
        // Refresh events from database instead of manually updating state
        await refreshEvents();
        toast.success('Event deleted successfully');
      }
      
      // Close all dialogs
      setShowEventDetails(false);
      setShowDeleteConfirmation(false);
      setSelectedEvent(null);
      setCurrentDeleteType(undefined);
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event. Please try again.');
    } finally {
      setDeleteInProgress(false);
    }
  };
  
  // Handle event save from edit form
  const handleEventSave = (updatedEvent: CalendarEvent) => {
    console.log('Saving updated event:', updatedEvent);
    confirmEventEdit(updatedEvent);
  };
  
  return {
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
    setShowDeleteConfirmation,
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
  };
};
