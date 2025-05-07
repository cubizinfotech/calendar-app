
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

// Import the ConflictData interface from the eventFormSubmission module
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
}

interface ConflictAlertProps {
  conflictData: ConflictData;
  onCancel: () => void;
  onSkipConflicts: () => void;
}

const ConflictAlert = ({ conflictData, onCancel, onSkipConflicts }: ConflictAlertProps) => {
  const { isRecurring, buildingName, conflicts } = conflictData;
  
  return (
    <Alert variant="destructive" className="bg-red-50 border-red-300 mb-6">
      <AlertTriangle className="h-5 w-5 text-red-500" />
      <AlertTitle className="text-red-600 text-lg font-semibold mb-2">
        Scheduling Conflict Detected
      </AlertTitle>
      <AlertDescription className="text-red-700">
        <p className="mb-2">
          The following date(s) conflict with existing events in <strong>{buildingName}</strong>. 
          Please adjust the date/time or building.
        </p>
        
        <div className="bg-red-100 p-3 rounded-md mb-4 max-h-60 overflow-y-auto">
          {conflicts.map((conflict, index) => (
            <div key={index} className="mb-3">
              <h4 className="font-medium mb-1">Conflict on: {conflict.date}</h4>
              <ul className="list-disc pl-5">
                {conflict.events.map((event, eventIndex) => (
                  <li key={eventIndex} className="mb-1">
                    {event.title} ({event.time})
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="flex gap-3 mt-4 justify-end">
          <Button 
            variant="outline" 
            onClick={onCancel}
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            Cancel
          </Button>
          
          {isRecurring && (
            <Button 
              variant="outline" 
              onClick={onSkipConflicts}
              className="border-amber-300 text-amber-700 hover:bg-amber-100"
            >
              Skip Conflicting Dates
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default ConflictAlert; 
