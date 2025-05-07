import React from 'react';
import CalendarHeader from '@/components/calendar/CalendarHeader';
import CalendarGrid from '@/components/calendar/CalendarGrid';
import EventsList from '@/components/calendar/EventsList';
import EventDetailsDialog from '@/components/calendar/EventDetailsDialog';
import EventEditForm from '@/components/calendar/EventEditForm';
import CalendarActions from '@/components/calendar/CalendarActions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCalendarContext } from './CalendarContext';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';

const CalendarView: React.FC = () => {
  const {
    activeMonth,
    activeYear, 
    filters,
    buildings,
    amenities,
    regions,
    eventTypes,
    allMonthEvents,
    isLoading,
    activeView,
    setFilters,
    setActiveView,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    handleEventClick,
    selectedEvent,
    showEventDetails,
    showEventEdit,
    handleCloseDetails,
    handleEditClick,
    handleCloseEdit,
    handleEventSave,
    handleEventDelete,
    deleteInProgress,
    showDeleteConfirmation,
    // Edit-related properties
    editInProgress,
    showEditConfirmation,
    setShowEditConfirmation,
    currentEditType,
    setCurrentEditType,
    executeEventEdit
  } = useCalendarContext();
  
  // Handler for canceling the edit confirmation
  const handleCancelEditConfirmation = () => {
    if (setShowEditConfirmation) {
      setShowEditConfirmation(false);
    }
    if (setCurrentEditType) {
      setCurrentEditType(undefined);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <CalendarActions 
          onPrevMonth={goToPreviousMonth}
          onNextMonth={goToNextMonth}
          onToday={goToToday}
          currentMonth={activeMonth}
          currentYear={activeYear}
        />
      </div>
      
      <CalendarHeader 
        filters={filters} 
        onFilterChange={setFilters} 
        activeView={activeView}
        onViewChange={setActiveView}
        buildings={buildings || []}
        regions={regions || []}
        amenities={amenities || []}
        eventTypes={eventTypes || []}
      />
      
      <div className="bg-white border rounded-lg shadow p-4">
        <Tabs value={activeView} onValueChange={setActiveView}>
          <TabsList className="mb-4">
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>
          
          <TabsContent value="calendar" className="pt-2">
            {isLoading ? (
              <div className="text-center py-10">Loading calendar data...</div>
            ) : (
              <div className="space-y-6">
                <CalendarGrid 
                  year={activeYear} 
                  month={activeMonth} 
                  filters={filters}
                  events={allMonthEvents || []}
                  eventTypes={eventTypes || []}
                  buildings={buildings || []}
                  onEventClick={handleEventClick}
                />
                
                {/* Events table below the grid */}
                <div className="mt-8 border-t pt-4">
                  <EventsList 
                    year={activeYear}
                    month={activeMonth}
                    filters={filters}
                    events={allMonthEvents || []}
                    buildings={buildings || []}
                    amenities={amenities || []}
                    eventTypes={eventTypes || []}
                    regions={regions || []}
                    onEventClick={handleEventClick}
                    showBelow={true}
                  />
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="list">
            {isLoading ? (
              <div className="text-center py-10">Loading events data...</div>
            ) : (
              <EventsList 
                year={activeYear}
                month={activeMonth}
                filters={filters}
                events={allMonthEvents || []}
                buildings={buildings || []}
                amenities={amenities || []}
                eventTypes={eventTypes || []}
                regions={regions || []}
                onEventClick={handleEventClick}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Event Detail Dialog */}
      {showEventDetails && selectedEvent && (
        <EventDetailsDialog
          event={selectedEvent}
          onClose={handleCloseDetails}
          onEdit={handleEditClick}
          onDelete={handleEventDelete}
          buildingsList={buildings || []}
          amenitiesList={amenities || []}
          eventTypesList={eventTypes || []}
          isLoading={deleteInProgress}
        />
      )}
      
      {/* Event Edit Form */}
      {showEventEdit && selectedEvent && (
        <EventEditForm
          event={selectedEvent}
          onCancel={handleCloseEdit}
          onSave={handleEventSave}
          onDelete={() => selectedEvent && handleEventDelete()}
          buildings={buildings || []}
          regions={regions || []}
          amenities={amenities || []}
          eventTypes={eventTypes || []}
        />
      )}
      
      {/* Edit Confirmation Dialog for Recurring Events - Using AlertDialog for compatibility */}
      <AlertDialog 
        open={showEditConfirmation} 
        onOpenChange={(open) => {
          if (!open) {
            // Reset all states in a specific order
            if (setShowEditConfirmation) {
              setShowEditConfirmation(false);
            }
            if (setCurrentEditType) {
              setCurrentEditType(undefined);
            }
            // Force a re-render to ensure cleanup
            setTimeout(() => {
              // Remove any lingering pointer-events styles
              document.body.style.pointerEvents = '';
              // Reset any other related states
              if (editInProgress) {
                // Additional cleanup if needed
              }
            }, 0);
          }
        }}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Recurring Event</AlertDialogTitle>
            <AlertDialogDescription>
              Would you like to edit just this occurrence or the entire series?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:justify-end sm:space-x-2">
            <Button 
              variant="outline" 
              onClick={handleCancelEditConfirmation} 
              disabled={editInProgress}
              className="sm:order-first"
            >
              Cancel
            </Button>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <Button
                variant="outline"
                onClick={() => {
                  if (setCurrentEditType && executeEventEdit) {
                    setCurrentEditType('single');
                    executeEventEdit(null, 'single');
                  }
                }}
                disabled={editInProgress}
              >
                This Event Only
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (setCurrentEditType && executeEventEdit) {
                    setCurrentEditType('series');
                    executeEventEdit(null, 'series');
                  }
                }}
                disabled={editInProgress}
              >
                Entire Series
              </Button>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CalendarView;
