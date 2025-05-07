
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Pencil, Printer, Trash2, Loader2 } from 'lucide-react';
import { formatUtcDate, formatUtcTimeToAmPm } from '@/utils/calendarUtils';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

export interface EventDetailsDialogProps {
  event: any;
  isOpen?: boolean;
  isLoading?: boolean;
  onClose: () => void;
  onEdit: (event: any) => void;
  onDelete: (deleteType?: 'single' | 'series') => void;
  buildingsList: any[];
  amenitiesList: any[];
  eventTypesList: any[];
}

const EventDetailsDialog = ({ 
  event, 
  isOpen = true, 
  isLoading = false, 
  onClose, 
  onEdit, 
  onDelete,
  buildingsList = [],
  amenitiesList = [],
  eventTypesList = []
}: EventDetailsDialogProps) => {
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteType, setDeleteType] = useState<'single' | 'series' | undefined>(undefined);
  const [deletingEvent, setDeletingEvent] = useState(false);

  // Find building, amenity, and event type names based on their IDs
  const buildingName = buildingsList.find(b => b.building_id === event?.buildingId || b.id === event?.buildingId)?.building_name || buildingsList.find(b => b.id === event?.buildingId)?.name || '';
  const amenityName = amenitiesList.find(a => a.amenity_id === event?.amenityId || a.id === event?.amenityId)?.amenity_name || amenitiesList.find(a => a.id === event?.amenityId)?.name || '';
  const eventType = eventTypesList.find(t => t.id === event?.eventTypeId || t.event_type_id === event?.eventTypeId);
  const eventTypeName = eventType?.name || eventType?.event_type_name || '';

  // Add these to the event object for display
  const enrichedEvent = {
    ...event,
    buildingName,
    amenityName,
    eventTypeName,
    contactPhone: event?.contactPhone,
    contactEmail: event?.contactEmail,
    cost: event?.cost,
    notes: event?.notes,
    attachmentUrl: event?.attachmentUrl
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const content = `
        <html>
          <head>
            <title>Event Details - ${enrichedEvent?.title}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #333; }
              .detail { margin: 10px 0; }
              .label { font-weight: bold; }
            </style>
          </head>
          <body>
            <h1>${enrichedEvent?.title}</h1>
            <div class="detail"><span class="label">Building:</span> ${enrichedEvent?.buildingName || ''}</div>
            <div class="detail"><span class="label">Amenity:</span> ${enrichedEvent?.amenityName || ''}</div>
            <div class="detail"><span class="label">Event Type:</span> ${enrichedEvent?.eventTypeName || ''}</div>
            <div class="detail"><span class="label">Start Time:</span> ${formatUtcTimeToAmPm(enrichedEvent?.startTime)}</div>
            <div class="detail"><span class="label">End Time:</span> ${formatUtcTimeToAmPm(enrichedEvent?.endTime)}</div>
            <div class="detail"><span class="label">Notes:</span> ${enrichedEvent?.notes || 'N/A'}</div>
            ${enrichedEvent?.cost ? `<div class="detail"><span class="label">Cost:</span> $${enrichedEvent.cost}</div>` : ''}
            ${enrichedEvent?.contactPhone ? `<div class="detail"><span class="label">Contact Phone:</span> ${enrichedEvent.contactPhone}</div>` : ''}
            ${enrichedEvent?.contactEmail ? `<div class="detail"><span class="label">Contact Email:</span> ${enrichedEvent.contactEmail}</div>` : ''}
          </body>
        </html>
      `;
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (enrichedEvent?.isRecurring) {
      setShowDeleteAlert(true);
    } else {
      setDeleteType(undefined);
      setShowDeleteConfirmation(true);
    }
  };

  const executeDelete = async () => {
    setDeletingEvent(true);
    try {
      await onDelete(deleteType);
      setShowDeleteAlert(false);
      setShowDeleteConfirmation(false);
      // Ensure we close the main dialog too
      onClose();
    } finally {
      setDeletingEvent(false);
    }
  };

  const handleEdit = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Editing event:", enrichedEvent);
    await onEdit(enrichedEvent);
  };

  const handleCloseModal = () => {
    // Make sure we're not in the middle of an operation
    if (!isLoading && !deletingEvent) {
      // Clean up all dialog states
      setShowDeleteAlert(false);
      setShowDeleteConfirmation(false);
      onClose();
    }
  };

  // Clean handler for delete alert dialog
  const handleCloseDeleteAlert = () => {
    setShowDeleteAlert(false);
    setDeleteType(undefined);
  };
  
  // Clean handler for delete confirmation dialog
  const handleCloseDeleteConfirmation = () => {
    setShowDeleteConfirmation(false);
    setDeleteType(undefined);
  };

  if (!isOpen) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          {/* Improved header with proper close button */}
          <div className="flex justify-between items-center p-6 border-b">
            <DialogTitle className="text-xl">{enrichedEvent?.title}</DialogTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={handlePrint} disabled={isLoading || deletingEvent} title="Print">
                <Printer className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleEdit} disabled={isLoading || deletingEvent} title="Edit">
                <Pencil className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                className="text-destructive hover:bg-destructive/10"
                onClick={handleDeleteClick}
                disabled={isLoading || deletingEvent}
                title="Delete"
              >
                {(isLoading || deletingEvent) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </Button>
              &nbsp;&nbsp;&nbsp;&nbsp;
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-500">Building</label>
                <p className="font-medium">{enrichedEvent?.buildingName}</p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-500">Amenity</label>
                <p className="font-medium">{enrichedEvent?.amenityName}</p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-500">Event Type</label>
                <p className="font-medium">{enrichedEvent?.eventTypeName}</p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-500">Date & Time</label>
                <p className="font-medium">
                  {formatUtcDate(enrichedEvent?.startTime)}
                  <br />
                  {formatUtcTimeToAmPm(enrichedEvent?.startTime)} - {formatUtcTimeToAmPm(enrichedEvent?.endTime)}
                </p>
              </div>
              {enrichedEvent?.cost !== undefined && enrichedEvent?.cost !== null && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500">Cost</label>
                  <p className="font-medium">${enrichedEvent?.cost || 0}</p>
                </div>
              )}
              {enrichedEvent?.contactPhone && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500">Contact Phone</label>
                  <p className="font-medium">{enrichedEvent?.contactPhone}</p>
                </div>
              )}
              {enrichedEvent?.contactEmail && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500">Contact Email</label>
                  <p className="font-medium">{enrichedEvent?.contactEmail}</p>
                </div>
              )}
            </div>

            {enrichedEvent?.notes && (
              <div className="space-y-1 border-t pt-4">
                <label className="text-sm font-medium text-gray-500">Notes</label>
                <p className="font-medium">{enrichedEvent?.notes}</p>
              </div>
            )}

            {enrichedEvent?.isRecurring && (
              <div className="flex items-center border-t pt-4">
                <span className="text-sm text-blue-600 font-medium flex items-center">
                  <span className="mr-2 text-lg">⟳</span> This is a recurring event
                </span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog for Recurring Events */}
      <AlertDialog open={showDeleteAlert} onOpenChange={handleCloseDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recurring Event</AlertDialogTitle>
            <AlertDialogDescription>
              Would you like to delete just this occurrence or the entire series?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button 
              variant="outline" 
              onClick={handleCloseDeleteAlert} 
              disabled={isLoading || deletingEvent}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteType('single');
                setShowDeleteAlert(false);
                setShowDeleteConfirmation(true);
              }}
              disabled={isLoading || deletingEvent}
            >
              This Event Only
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setDeleteType('series');
                setShowDeleteAlert(false);
                setShowDeleteConfirmation(true);
              }}
              disabled={isLoading || deletingEvent}
            >
              Entire Series
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={showDeleteConfirmation}
        onOpenChange={handleCloseDeleteConfirmation}
        title="Confirm Delete"
        description={deleteType === 'series' 
          ? "Are you sure you want to delete the entire series? This action cannot be undone."
          : deleteType === 'single'
            ? "Are you sure you want to delete this occurrence? This action cannot be undone."
            : "Are you sure you want to delete this event? This action cannot be undone."
        }
        confirmLabel="Delete"
        onConfirm={executeDelete}
        isLoading={deletingEvent}
        variant="destructive"
      />
    </>
  );
};

export default EventDetailsDialog;
