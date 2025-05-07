import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { PlusCircle, Pencil, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface RecurringPattern {
  pattern_id: number;
  pattern_name: string;
  frequency: string;
  days: string[];
  created_at?: string;
}

const RecurringPatternsTab = () => {
  const [patterns, setPatterns] = useState<RecurringPattern[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPattern, setSelectedPattern] = useState<RecurringPattern | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    frequency: '',
    days: [] as string[]
  });

  // Fetch patterns from Supabase
  const fetchPatterns = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('recurring_patterns')
        .select('*')
        .order('pattern_name', { ascending: true });
      
      if (error) throw error;
      
      setPatterns(data || []);
    } catch (error) {
      console.error('Error fetching recurring patterns:', error);
      toast.error('Failed to load recurring patterns');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatterns();
  }, []);

  const handleDayToggle = (day: string) => {
    if (formData.days.includes(day)) {
      setFormData(prev => ({
        ...prev,
        days: prev.days.filter(d => d !== day)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        days: [...prev.days, day]
      }));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      frequency: '',
      days: []
    });
  };

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!formData.name || !formData.frequency || formData.days.length === 0) {
      toast.error('Please fill all required fields');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('recurring_patterns')
        .insert({
          pattern_name: formData.name,
          frequency: formData.frequency,
          days: formData.days
        });
      
      if (error) throw error;
      
      toast.success('Pattern added successfully!');
      setIsAddDialogOpen(false);
      resetForm();
      fetchPatterns();
    } catch (error) {
      console.error('Error adding recurring pattern:', error);
      toast.error('Failed to add pattern');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!selectedPattern) return;
    
    if (!formData.name || !formData.frequency || formData.days.length === 0) {
      toast.error('Please fill all required fields');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('recurring_patterns')
        .update({
          pattern_name: formData.name,
          frequency: formData.frequency,
          days: formData.days
        })
        .eq('pattern_id', selectedPattern.pattern_id);
      
      if (error) throw error;
      
      toast.success('Pattern updated successfully!');
      setIsEditDialogOpen(false);
      setSelectedPattern(null);
      resetForm();
      fetchPatterns();
    } catch (error) {
      console.error('Error updating recurring pattern:', error);
      toast.error('Failed to update pattern');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPattern) return;
    
    setIsLoading(true);
    
    try {
      // Check if the pattern is being used by any events
      const { data: events, error: checkError } = await supabase
        .from('events')
        .select('event_id')
        .eq('recurring_pattern_id', selectedPattern.pattern_id)
        .limit(1);
      
      if (checkError) throw checkError;
      
      if (events && events.length > 0) {
        toast.error('Cannot delete pattern: It is being used by existing events');
        setIsDeleteDialogOpen(false);
        return;
      }
      
      const { error } = await supabase
        .from('recurring_patterns')
        .delete()
        .eq('pattern_id', selectedPattern.pattern_id);
      
      if (error) throw error;
      
      toast.success('Pattern deleted successfully!');
      setIsDeleteDialogOpen(false);
      setSelectedPattern(null);
      fetchPatterns();
    } catch (error) {
      console.error('Error deleting recurring pattern:', error);
      toast.error('Failed to delete pattern');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Recurring Patterns</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Pattern
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Recurring Pattern</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Pattern Name</Label>
                <Input 
                  id="name" 
                  placeholder="Enter pattern name" 
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Select 
                  value={formData.frequency}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value }))}
                  required
                >
                  <SelectTrigger id="frequency">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Daily">Daily</SelectItem>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                    <SelectItem value="Bi-weekly">Bi-weekly</SelectItem>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Quarterly">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Days</Label>
                <div className="grid grid-cols-2 gap-2">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                    <div key={day} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`day-${day.toLowerCase()}`} 
                        checked={formData.days.includes(day)}
                        onCheckedChange={() => handleDayToggle(day)}
                      />
                      <Label htmlFor={`day-${day.toLowerCase()}`}>{day}</Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : 'Add Pattern'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md overflow-x-auto">
        {isLoading && patterns.length === 0 ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Loading patterns...</span>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Days</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patterns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                    No recurring patterns found. Add one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                patterns.map((pattern) => (
                  <TableRow key={pattern.pattern_id}>
                    <TableCell>{pattern.pattern_name}</TableCell>
                    <TableCell>{pattern.frequency}</TableCell>
                    <TableCell>{pattern.days.join(', ')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog open={isEditDialogOpen && selectedPattern?.pattern_id === pattern.pattern_id} 
                          onOpenChange={(open) => {
                            setIsEditDialogOpen(open);
                            if (!open) setSelectedPattern(null);
                          }}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={() => {
                                setSelectedPattern(pattern);
                                setFormData({
                                  name: pattern.pattern_name,
                                  frequency: pattern.frequency,
                                  days: pattern.days
                                });
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Pattern</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleEdit} className="space-y-4 pt-4">
                              <div className="space-y-2">
                                <Label htmlFor="edit-name">Pattern Name</Label>
                                <Input 
                                  id="edit-name" 
                                  value={formData.name}
                                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                  required 
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="edit-frequency">Frequency</Label>
                                <Select 
                                  value={formData.frequency} 
                                  onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value }))}
                                  required
                                >
                                  <SelectTrigger id="edit-frequency">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Daily">Daily</SelectItem>
                                    <SelectItem value="Weekly">Weekly</SelectItem>
                                    <SelectItem value="Bi-weekly">Bi-weekly</SelectItem>
                                    <SelectItem value="Monthly">Monthly</SelectItem>
                                    <SelectItem value="Quarterly">Quarterly</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="space-y-2">
                                <Label>Days</Label>
                                <div className="grid grid-cols-2 gap-2">
                                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                                    <div key={day} className="flex items-center space-x-2">
                                      <Checkbox 
                                        id={`edit-day-${day.toLowerCase()}`} 
                                        checked={formData.days.includes(day)}
                                        onCheckedChange={() => handleDayToggle(day)}
                                      />
                                      <Label htmlFor={`edit-day-${day.toLowerCase()}`}>{day}</Label>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              <DialogFooter>
                                <Button type="submit" disabled={isLoading}>
                                  {isLoading ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Updating...
                                    </>
                                  ) : 'Update Pattern'}
                                </Button>
                              </DialogFooter>
                            </form>
                          </DialogContent>
                        </Dialog>

                        <Dialog open={isDeleteDialogOpen && selectedPattern?.pattern_id === pattern.pattern_id} 
                          onOpenChange={(open) => {
                            setIsDeleteDialogOpen(open);
                            if (!open) setSelectedPattern(null);
                          }}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              onClick={() => setSelectedPattern(pattern)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Delete Pattern</DialogTitle>
                            </DialogHeader>
                            <div className="py-4">
                              <p>Are you sure you want to delete <strong>{selectedPattern?.pattern_name}</strong>?</p>
                              <p className="text-sm text-muted-foreground mt-2">This action cannot be undone.</p>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isLoading}>
                                Cancel
                              </Button>
                              <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
                                {isLoading ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                  </>
                                ) : 'Delete'}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default RecurringPatternsTab;
