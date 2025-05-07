
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

const ExportSection = () => {
  const handleExport = () => {
    toast.success('Data exported successfully!');
  };

  return (
    <div>
      <h2 className="text-lg font-medium mb-4">Export Data</h2>
      
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <RadioGroup defaultValue="all" className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all">All Data</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="events" id="export-events" />
                <Label htmlFor="export-events">Events Only</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="config" id="config" />
                <Label htmlFor="config">Configuration Only</Label>
              </div>
            </RadioGroup>

            <div className="flex justify-end">
              <Button onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export to Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExportSection;
