
import React from 'react';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { toast } from 'sonner';

interface PrintButtonProps {
  onClick: () => void;
  className?: string;
}

const PrintButton = ({ onClick, className = '' }: PrintButtonProps) => {
  const handlePrint = () => {
    toast.info("Preparing calendar for printing...");
    // Short delay to allow toast to display before print dialog
    setTimeout(() => {
      onClick();
    }, 300);
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      className={`flex items-center gap-2 ${className}`} 
      onClick={handlePrint}
    >
      <Printer className="h-4 w-4" />
      <span>Print</span>
    </Button>
  );
};

export default PrintButton;
