
import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface AdditionalDetailsProps {
  notes: string;
  setNotes: (notes: string) => void;
  cost: string;
  setCost: (cost: string) => void;
  contactPhone: string;
  setContactPhone: (phone: string) => void;
  contactEmail: string;
  setContactEmail: (email: string) => void;
  attachment?: File | null;
  setAttachment: (file: File | null) => void;
}

const AdditionalDetails = ({
  notes,
  setNotes,
  cost,
  setCost,
  contactPhone,
  setContactPhone,
  contactEmail,
  setContactEmail,
  attachment,
  setAttachment
}: AdditionalDetailsProps) => {
  const [attachmentName, setAttachmentName] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size exceeds 5MB limit.');
        return;
      }
      
      setAttachment(file);
      setAttachmentName(file.name);
      toast.success(`File "${file.name}" selected`);
    } else {
      setAttachment(null);
      setAttachmentName('');
    }
  };

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea 
          id="notes" 
          placeholder="Enter any additional notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cost">Cost</Label>
          <Input 
            id="cost" 
            type="number" 
            placeholder="0.00"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact-phone">Contact Phone</Label>
          <Input 
            id="contact-phone" 
            placeholder="(555) 123-4567"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact-email">Contact Email</Label>
          <Input 
            id="contact-email" 
            type="email" 
            placeholder="email@example.com"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="attachment">Attachment</Label>
        <Input 
          id="attachment" 
          type="file" 
          onChange={handleAttachmentChange}
          disabled={isUploading}
          className="cursor-pointer"
        />
        {isUploading && (
          <div className="flex items-center text-sm text-amber-600">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Uploading file...
          </div>
        )}
        {attachmentName && !isUploading && (
          <p className="text-sm text-muted-foreground">
            Selected file: {attachmentName}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Max file size: 5MB
        </p>
      </div>
    </>
  );
};

export default AdditionalDetails;
