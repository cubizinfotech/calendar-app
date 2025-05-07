
import React, { useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface DateTimePickerProps {
  eventDate: Date | undefined;
  setEventDate: (date: Date | undefined) => void;
  startHour: string;
  setStartHour: (hour: string) => void;
  startMinute: string;
  setStartMinute: (minute: string) => void;
  startAmPm: string;
  setStartAmPm: (ampm: string) => void;
  endHour: string;
  setEndHour: (hour: string) => void;
  endMinute: string;
  setEndMinute: (minute: string) => void;
  endAmPm: string;
  setEndAmPm: (ampm: string) => void;
  hasConflict: boolean;
  timeConflict: boolean;
  recurringStartDate?: Date;
  isRecurring?: boolean;
  validationErrors?: Record<string, boolean>;
}

const DateTimePicker = ({
  eventDate,
  setEventDate,
  startHour,
  setStartHour,
  startMinute,
  setStartMinute,
  startAmPm,
  setStartAmPm,
  endHour,
  setEndHour,
  endMinute,
  setEndMinute,
  endAmPm,
  setEndAmPm,
  hasConflict,
  timeConflict,
  recurringStartDate,
  isRecurring,
  validationErrors = {}
}: DateTimePickerProps) => {
  const generateTimeOptions = () => {
    const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
    const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
    return { hours, minutes };
  };

  const { hours, minutes } = generateTimeOptions();
  
  // Create today's date with time set to 00:00:00
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);
  
  // Check if selected date is today
  const isToday = useMemo(() => {
    if (!eventDate) return false;
    const now = new Date();
    return eventDate.getDate() === now.getDate() &&
           eventDate.getMonth() === now.getMonth() &&
           eventDate.getFullYear() === now.getFullYear();
  }, [eventDate]);
  
  // If today is selected, validate the time isn't in the past
  const validateTimeNotInPast = () => {
    if (!isToday) return true;
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    let selectedHour = parseInt(startHour);
    if (startAmPm === 'PM' && selectedHour !== 12) selectedHour += 12;
    if (startAmPm === 'AM' && selectedHour === 12) selectedHour = 0;
    
    // If hour is less than current hour, it's in the past
    if (selectedHour < currentHour) return false;
    
    // If same hour, check minutes
    if (selectedHour === currentHour && parseInt(startMinute) <= currentMinute) return false;
    
    return true;
  };
  
  const isPastTime = isToday && startHour && startMinute && !validateTimeNotInPast();

  // Validate recurring start date is equal to or greater than event date
  const hasRecurringDateConflict = useMemo(() => {
    if (!isRecurring || !recurringStartDate || !eventDate) return false;
    
    // Compare dates without time
    const eventDateOnly = new Date(eventDate);
    eventDateOnly.setHours(0, 0, 0, 0);
    
    const recurringDateOnly = new Date(recurringStartDate);
    recurringDateOnly.setHours(0, 0, 0, 0);
    
    return recurringDateOnly < eventDateOnly;
  }, [isRecurring, recurringStartDate, eventDate]);

  return (
    <>
      <div className="space-y-2">
        <Label className={validationErrors.eventDate ? "text-destructive font-semibold" : ""}>
          Event Date *
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !eventDate && "text-muted-foreground",
                (hasConflict || hasRecurringDateConflict || validationErrors.eventDate) && "border-destructive"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {eventDate ? format(eventDate, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={eventDate}
              onSelect={setEventDate}
              initialFocus
              disabled={(date) => date < today}
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
        {validationErrors.eventDate && (
          <p className="text-sm text-destructive">Event date is required</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div>
          <Label className={cn(
            "block mb-2",
            validationErrors.startTime ? "text-destructive font-semibold" : ""
          )}>
            Start Time *
          </Label>
          <div className="flex gap-2">
            <Select 
              value={startHour} 
              onValueChange={setStartHour} 
              required
            >
              <SelectTrigger className={cn(
                "w-full",
                validationErrors.startTime && "border-destructive"
              )}>
                <SelectValue placeholder="Hour" />
              </SelectTrigger>
              <SelectContent>
                {hours.map((hour) => (
                  <SelectItem key={`start-hour-${hour}`} value={hour}>
                    {hour}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select 
              value={startMinute} 
              onValueChange={setStartMinute} 
              required
            >
              <SelectTrigger className={cn(
                "w-full",
                validationErrors.startTime && "border-destructive"
              )}>
                <SelectValue placeholder="Min" />
              </SelectTrigger>
              <SelectContent>
                {minutes.map((minute) => (
                  <SelectItem key={`start-min-${minute}`} value={minute}>
                    {minute}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select 
              value={startAmPm} 
              onValueChange={setStartAmPm} 
              required
            >
              <SelectTrigger className={cn(
                "w-full",
                validationErrors.startTime && "border-destructive"
              )}>
                <SelectValue placeholder="AM/PM" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AM">AM</SelectItem>
                <SelectItem value="PM">PM</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {validationErrors.startTime && (
            <p className="text-sm text-destructive mt-1">Start time is required</p>
          )}
        </div>

        <div>
          <Label className={cn(
            "block mb-2",
            validationErrors.endTime ? "text-destructive font-semibold" : ""
          )}>
            End Time *
          </Label>
          <div className="flex gap-2">
            <Select 
              value={endHour} 
              onValueChange={setEndHour} 
              required
            >
              <SelectTrigger className={cn(
                "w-full",
                validationErrors.endTime && "border-destructive"
              )}>
                <SelectValue placeholder="Hour" />
              </SelectTrigger>
              <SelectContent>
                {hours.map((hour) => (
                  <SelectItem key={`end-hour-${hour}`} value={hour}>
                    {hour}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select 
              value={endMinute} 
              onValueChange={setEndMinute} 
              required
            >
              <SelectTrigger className={cn(
                "w-full",
                validationErrors.endTime && "border-destructive"
              )}>
                <SelectValue placeholder="Min" />
              </SelectTrigger>
              <SelectContent>
                {minutes.map((minute) => (
                  <SelectItem key={`end-min-${minute}`} value={minute}>
                    {minute}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select 
              value={endAmPm} 
              onValueChange={setEndAmPm} 
              required
            >
              <SelectTrigger className={cn(
                "w-full",
                validationErrors.endTime && "border-destructive"
              )}>
                <SelectValue placeholder="AM/PM" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AM">AM</SelectItem>
                <SelectItem value="PM">PM</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {validationErrors.endTime && (
            <p className="text-sm text-destructive mt-1">End time is required</p>
          )}
        </div>
      </div>

      {(timeConflict || isPastTime || hasRecurringDateConflict) && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {timeConflict 
              ? "End time must be after start time" 
              : isPastTime 
                ? "Start time cannot be in the past" 
                : "Recurring start date must be equal to or after event date"}
          </AlertDescription>
        </Alert>
      )}
    </>
  );
};

export default DateTimePicker;
