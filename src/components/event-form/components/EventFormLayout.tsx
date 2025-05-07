
import React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { BanIcon, Loader2 } from 'lucide-react';
import { NavigateFunction } from 'react-router-dom';

import EventTitleAndType from './EventTitleAndType';
import LocationSelector from './LocationSelector';
import DateTimePicker from './DateTimePicker';
import RecurringOptions from './RecurringOptions';
import AdditionalDetails from './AdditionalDetails';

interface EventFormProps {
  formState: any;
  validationErrors: Record<string, boolean>;
  hasConflict: boolean;
  timeConflict: boolean;
  isLoading: boolean;
  isLoadingAmenities: boolean;
  eventTypes: any[];
  regions: any[];
  filteredBuildings: any[];
  filteredAmenities: any[];
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  navigate: NavigateFunction;
  needsDaySelection?: boolean;
}

const EventFormLayout: React.FC<EventFormProps> = ({
  formState,
  validationErrors,
  hasConflict,
  timeConflict,
  isLoading,
  isLoadingAmenities,
  eventTypes,
  regions,
  filteredBuildings,
  filteredAmenities,
  handleSubmit,
  navigate,
  needsDaySelection
}) => {
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <EventTitleAndType
        eventTitle={formState.eventTitle}
        setEventTitle={formState.setEventTitle}
        selectedEventType={formState.selectedEventType}
        setSelectedEventType={formState.setSelectedEventType}
        eventTypes={eventTypes}
        validationErrors={{
          eventTitle: validationErrors.eventTitle,
          eventType: validationErrors.eventType
        }}
      />

      <LocationSelector
        selectedRegion={formState.selectedRegion}
        setSelectedRegion={formState.setSelectedRegion}
        selectedBuilding={formState.selectedBuilding}
        setSelectedBuilding={formState.setSelectedBuilding}
        selectedAmenity={formState.selectedAmenity}
        setSelectedAmenity={formState.setSelectedAmenity}
        filteredBuildings={filteredBuildings}
        filteredAmenities={filteredAmenities}
        hasConflict={hasConflict}
        regions={regions}
        isLoadingAmenities={isLoadingAmenities}
        validationErrors={{
          region: validationErrors.region,
          building: validationErrors.building,
          amenity: validationErrors.amenity
        }}
      />

      <DateTimePicker
        eventDate={formState.eventDate}
        setEventDate={formState.setEventDate}
        startHour={formState.startHour}
        setStartHour={formState.setStartHour}
        startMinute={formState.startMinute}
        setStartMinute={formState.setStartMinute}
        startAmPm={formState.startAmPm}
        setStartAmPm={formState.setStartAmPm}
        endHour={formState.endHour}
        setEndHour={formState.setEndHour}
        endMinute={formState.endMinute}
        setEndMinute={formState.setEndMinute}
        endAmPm={formState.endAmPm}
        setEndAmPm={formState.setEndAmPm}
        hasConflict={hasConflict}
        timeConflict={timeConflict}
        validationErrors={{
          eventDate: validationErrors.eventDate,
          startTime: validationErrors.startTime,
          endTime: validationErrors.endTime
        }}
      />

      <div className="flex items-center space-x-2">
        <Switch 
          id="recurring" 
          checked={formState.isRecurring} 
          onCheckedChange={formState.setIsRecurring} 
        />
        <Label htmlFor="recurring">Recurring Event</Label>
      </div>

      {formState.isRecurring && (
        <RecurringOptions
          startDate={formState.startDate}
          setStartDate={formState.setStartDate}
          endDate={formState.endDate}
          setEndDate={formState.setEndDate}
          selectedPattern={formState.selectedRecurringPattern}
          setSelectedPattern={formState.setSelectedRecurringPattern}
          eventDate={formState.eventDate}
          selectedDay={formState.selectedDay}
          setSelectedDay={formState.setSelectedDay}
          validationErrors={{
            startDate: validationErrors.recurringStartDate,
            endDate: validationErrors.recurringEndDate,
            pattern: validationErrors.recurringPattern,
            day: validationErrors.recurringDay
          }}
        />
      )}

      <AdditionalDetails
        notes={formState.notes}
        setNotes={formState.setNotes}
        cost={formState.cost}
        setCost={formState.setCost}
        contactPhone={formState.contactPhone}
        setContactPhone={formState.setContactPhone}
        contactEmail={formState.contactEmail}
        setContactEmail={formState.setContactEmail}
        attachment={formState.attachment}
        setAttachment={formState.setAttachment}
      />

      <div className="flex justify-end gap-4">
        <Button variant="outline" type="button" onClick={() => navigate('/calendar')}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={timeConflict || hasConflict || isLoading}
          className={hasConflict || timeConflict || isLoading ? "bg-muted text-muted-foreground cursor-not-allowed" : ""}
        >
          {isLoading ? (
            <span className="flex items-center">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating Event...
            </span>
          ) : hasConflict ? (
            <span className="flex items-center">
              <BanIcon className="h-4 w-4 mr-2" />
              Cannot Create (Conflict)
            </span>
          ) : (
            "Create Event"
          )}
        </Button>
      </div>
    </form>
  );
};

export default EventFormLayout;
