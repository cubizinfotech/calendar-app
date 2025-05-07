
import React, { useEffect, useState, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface RecurringPattern {
  pattern_id: number;
  pattern_name: string;
  frequency: string;
  days: string[];
}

interface RecurringOptionsProps {
  startDate: Date | undefined;
  setStartDate: (date: Date | undefined) => void;
  endDate: Date | undefined;
  setEndDate: (date: Date | undefined) => void;
  selectedPattern: string;
  setSelectedPattern: (pattern: string) => void;
  eventDate: Date | undefined;
  selectedDay: string;
  setSelectedDay: (day: string) => void;
  validationErrors?: {
    startDate?: boolean;
    endDate?: boolean;
    pattern?: boolean;
    day?: boolean;
  };
}

const RecurringOptions = ({
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  selectedPattern,
  setSelectedPattern,
  eventDate,
  selectedDay,
  setSelectedDay,
  validationErrors = {}
}: RecurringOptionsProps) => {
  const [patterns, setPatterns] = useState<RecurringPattern[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [selectedPatternFrequency, setSelectedPatternFrequency] = useState<string>('');
  
  // Create today's date with time set to 00:00:00
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);
  
  // List of days of the week
  const daysOfWeek = [
    { value: "Sunday", label: "Sunday" },
    { value: "Monday", label: "Monday" },
    { value: "Tuesday", label: "Tuesday" },
    { value: "Wednesday", label: "Wednesday" },
    { value: "Thursday", label: "Thursday" },
    { value: "Friday", label: "Friday" },
    { value: "Saturday", label: "Saturday" }
  ];
  
  // Fetch recurring patterns from Supabase
  useEffect(() => {
    const fetchPatterns = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('recurring_patterns')
          .select('*')
          .order('pattern_name', { ascending: true });
        
        if (error) throw error;
        
        setPatterns(data || []);
        
        // Auto-select the first pattern if none is selected
        if (data && data.length > 0 && !selectedPattern) {
          setSelectedPattern(data[0].pattern_id.toString());
        }
      } catch (error) {
        console.error('Error fetching recurring patterns:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPatterns();
  }, [setSelectedPattern]);

  // Set the end date to be 3 months from start date by default when start date changes
  useEffect(() => {
    if(eventDate) {
      const defaultStartDate = new Date(eventDate);
      setStartDate(defaultStartDate);
    }
    if (startDate && !endDate) {
      const defaultEndDate = new Date(startDate);
      defaultEndDate.setMonth(defaultEndDate.getMonth() + 3);
      setEndDate(defaultEndDate);
    }
  }, [eventDate, startDate, endDate, setEndDate]);

  // Check if selected pattern needs day selection (only Weekly and Bi-weekly)
  useEffect(() => {
    if (selectedPattern) {
      const pattern = patterns.find(p => p.pattern_id.toString() === selectedPattern);
      if (pattern) {
        setSelectedPatternFrequency(pattern.frequency);
        // Only Weekly and Bi-weekly patterns need day selection
        setShowDayPicker(['Weekly', 'Bi-weekly'].includes(pattern.frequency));
        
        // Set default day based on event date if none selected
        if (['Weekly', 'Bi-weekly'].includes(pattern.frequency) && eventDate && !selectedDay) {
          const dayName = daysOfWeek[eventDate.getDay()].value;
          setSelectedDay(dayName);
        }
      }
    }
  }, [selectedPattern, patterns, eventDate, selectedDay, setSelectedDay]);

  return (
    <div className="space-y-4 pt-2">
      <Separator />
      <h3 className="text-lg font-medium">Recurring Options</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className={cn(
            validationErrors.startDate ? "text-destructive font-semibold" : ""
          )}>Start Date *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !startDate && "text-muted-foreground",
                  validationErrors.startDate && "border-destructive"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
                disabled={(date) => date < today || (eventDate && date < eventDate)}
              />
            </PopoverContent>
          </Popover>
          {validationErrors.startDate && (
            <p className="text-sm text-destructive">Start date is required for recurring events</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label className={cn(
            validationErrors.endDate ? "text-destructive font-semibold" : ""
          )}>End Date *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !endDate && "text-muted-foreground",
                  validationErrors.endDate && "border-destructive"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
                disabled={(date) => date < today || (startDate && date < startDate)}
              />
            </PopoverContent>
          </Popover>
          {validationErrors.endDate && (
            <p className="text-sm text-destructive">End date is required for recurring events</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pattern" className={cn(
          validationErrors.pattern ? "text-destructive font-semibold" : ""
        )}>Recurring Pattern *</Label>
        <Select 
          value={selectedPattern} 
          onValueChange={setSelectedPattern}
        >
          <SelectTrigger id="pattern" className={cn(
            validationErrors.pattern && "border-destructive"
          )}>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading patterns...</span>
              </div>
            ) : (
              <SelectValue placeholder="Select pattern" />
            )}
          </SelectTrigger>
          <SelectContent>
            {isLoading ? (
              <div className="flex items-center justify-center p-2">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span>Loading patterns...</span>
              </div>
            ) : patterns.length > 0 ? (
              patterns.map(pattern => (
                <SelectItem key={pattern.pattern_id} value={pattern.pattern_id.toString()}>
                  {pattern.pattern_name} ({pattern.frequency}: {pattern.days.join(', ')})
                </SelectItem>
              ))
            ) : (
              <SelectItem value="no-patterns" disabled>
                No patterns available. Please add some in the Admin page.
              </SelectItem>
            )}
          </SelectContent>
        </Select>
        {validationErrors.pattern && (
          <p className="text-sm text-destructive">Recurring pattern is required for recurring events</p>
        )}
      </div>

      {/* Day of week selector - only shown for Weekly and Bi-weekly patterns */}
      {showDayPicker && (
        <div className="space-y-2">
          <Label htmlFor="day-of-week" className={cn(
            validationErrors.day ? "text-destructive font-semibold" : ""
          )}>Day of Week *</Label>
          <Select 
            value={selectedDay} 
            onValueChange={setSelectedDay}
          >
            <SelectTrigger id="day-of-week" className={cn(
              validationErrors.day && "border-destructive"
            )}>
              <SelectValue placeholder="Select day of week" />
            </SelectTrigger>
            <SelectContent>
              {daysOfWeek.map(day => (
                <SelectItem key={day.value} value={day.value}>
                  {day.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {validationErrors.day && (
            <p className="text-sm text-destructive">Day of week is required for {selectedPatternFrequency.toLowerCase()} recurring events</p>
          )}
        </div>
      )}
    </div>
  );
};

export default RecurringOptions;
