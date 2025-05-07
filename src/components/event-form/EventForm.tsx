
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

import EventFormLayout from './components/EventFormLayout';
import BookedEventsTable from './components/BookedEventsTable';
import ConflictAlert from './components/ConflictAlert';
import { useEventFormState } from './hooks/useEventFormState';
import { useEventConflictDetection } from '@/hooks/useEventConflictDetection';
import { useEventDataFetching } from './hooks/useEventDataFetching';
import { useEventFormValidation } from './hooks/useEventFormValidation';
import { submitEventForm, createEventSkippingConflicts } from './utils/eventFormSubmission';

const EventFormContainer = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [conflictData, setConflictData] = useState<any>(null);
  
  // Use our custom hooks for form state and data fetching
  const formState = useEventFormState();
  const {
    events: eventsList,
    buildings,
    amenities,
    regions,
    eventTypes,
    recurringPatterns,
    filteredBuildings,
    filteredAmenities,
    filteredEventsList,
    isLoadingAmenities,
  } = useEventDataFetching(
    formState.selectedRegion,
    formState.selectedBuilding,
    formState.selectedAmenity,
    formState.eventDate
  );

  // Use our conflict detection hook
  const {
    hasConflict,
    conflictingEvent,
    conflictDetails,
    timeConflict
  } = useEventConflictDetection({
    selectedBuilding: formState.selectedBuilding,
    selectedAmenity: formState.selectedAmenity,
    eventDate: formState.eventDate,
    startHour: formState.startHour,
    startMinute: formState.startMinute,
    startAmPm: formState.startAmPm,
    endHour: formState.endHour,
    endMinute: formState.endMinute,
    endAmPm: formState.endAmPm,
    eventsList
  });

  // Use our validation hook
  const { validationErrors, validateForm, needsDaySelection } = useEventFormValidation({
    eventTitle: formState.eventTitle,
    selectedEventType: formState.selectedEventType,
    selectedRegion: formState.selectedRegion,
    selectedBuilding: formState.selectedBuilding,
    selectedAmenity: formState.selectedAmenity,
    eventDate: formState.eventDate,
    startHour: formState.startHour,
    startMinute: formState.startMinute,
    startAmPm: formState.startAmPm,
    endHour: formState.endHour,
    endMinute: formState.endMinute,
    endAmPm: formState.endAmPm,
    isRecurring: formState.isRecurring,
    startDate: formState.startDate,
    endDate: formState.endDate,
    selectedRecurringPattern: formState.selectedRecurringPattern,
    selectedDay: formState.selectedDay,
    hasConflict,
    timeConflict
  });

  // Enhanced conflict handling
  const handleCancelConflict = () => {
    setConflictData(null);
  };

  // Enhanced skip conflicts feature
  const handleSkipConflicts = async () => {
    if (conflictData) {
      setIsLoading(true);
      try {
        // Extract dates from conflict data for skipping
        const datesToSkip = conflictData.conflicts.map((c: any) => c.date);
        
        // Use the enhanced createEventSkippingConflicts function
        const success = await createEventSkippingConflicts(conflictData.eventData, datesToSkip);
        
        if (success) {
          navigate('/calendar');
        }
      } catch (error) {
        console.error("Error skipping conflicting dates:", error);
      } finally {
        setConflictData(null);
        setIsLoading(false);
      }
    }
  };

  // Enhanced conflict detection callback
  const handleConflictDetected = (data: any) => {
    console.log("Conflict detected:", data);
    setConflictData(data);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate the form before submission
    if (!validateForm()) {
      return;
    }
    
    // Enhanced submission with better conflict handling
    await submitEventForm({
      formState,
      recurringPatterns,
      setIsLoading,
      navigate,
      onConflictDetected: handleConflictDetected
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">New Event</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
        </CardHeader>
        <CardContent>
          {conflictData && (
            <ConflictAlert 
              conflictData={conflictData} 
              onCancel={handleCancelConflict}
              onSkipConflicts={handleSkipConflicts}
            />
          )}
          
          {hasConflict && !conflictData && (
            <Alert variant="destructive" className="mb-6 border-2 border-destructive">
              <AlertCircle className="h-5 w-5" />
              <AlertTitle className="text-lg font-bold">Booking Conflict Detected</AlertTitle>
              <AlertDescription className="text-base">
                {conflictDetails}
                <div className="mt-2">
                  Please select a different time, date, or amenity to resolve this conflict.
                </div>
              </AlertDescription>
            </Alert>
          )}

          <EventFormLayout
            formState={formState}
            validationErrors={validationErrors}
            hasConflict={hasConflict}
            timeConflict={timeConflict}
            isLoading={isLoading}
            isLoadingAmenities={isLoadingAmenities}
            eventTypes={eventTypes}
            regions={regions}
            filteredBuildings={filteredBuildings}
            filteredAmenities={filteredAmenities}
            handleSubmit={handleSubmit}
            navigate={navigate}
            needsDaySelection={needsDaySelection}
          />
        </CardContent>
      </Card>

      {/* Events Table for Selected Building and Date */}
      {formState.selectedBuilding && formState.eventDate && (
        <BookedEventsTable
          events={filteredEventsList}
          eventDate={formState.eventDate}
          selectedBuilding={formState.selectedBuilding}
          selectedAmenity={formState.selectedAmenity}
          buildings={buildings}
          amenities={amenities}
          eventTypes={eventTypes}
        />
      )}
    </div>
  );
};

export default EventFormContainer;
