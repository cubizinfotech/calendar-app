
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface EventTitleAndTypeProps {
  eventTitle: string;
  setEventTitle: (title: string) => void;
  selectedEventType: string;
  setSelectedEventType: (typeId: string) => void;
  eventTypes: any[];
  validationErrors?: {
    eventTitle?: boolean;
    eventType?: boolean;
  };
}

const EventTitleAndType = ({
  eventTitle,
  setEventTitle,
  selectedEventType,
  setSelectedEventType,
  eventTypes,
  validationErrors = {}
}: EventTitleAndTypeProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="event-title" className={cn(
          validationErrors.eventTitle ? "text-destructive font-semibold" : ""
        )}>
          Event Title *
        </Label>
        <Input
          id="event-title"
          value={eventTitle}
          onChange={(e) => setEventTitle(e.target.value)}
          placeholder="Enter event title"
          className={cn(
            validationErrors.eventTitle ? "border-destructive" : ""
          )}
        />
        {validationErrors.eventTitle && (
          <p className="text-sm text-destructive">Event title is required</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="event-type" className={cn(
          validationErrors.eventType ? "text-destructive font-semibold" : ""
        )}>
          Event Type *
        </Label>
        <Select
          value={selectedEventType}
          onValueChange={setSelectedEventType}
        >
          <SelectTrigger id="event-type" className={cn(
            validationErrors.eventType ? "border-destructive" : ""
          )}>
            <SelectValue placeholder="Select event type" />
          </SelectTrigger>
          <SelectContent>
            {eventTypes.map((type) => (
              <SelectItem key={type.id} value={type.id.toString()}>
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full ${type.colorCode} mr-2`}></div>
                  {type.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {validationErrors.eventType && (
          <p className="text-sm text-destructive">Event type is required</p>
        )}
      </div>
    </div>
  );
};

export default EventTitleAndType;
