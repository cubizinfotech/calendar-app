import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

const AmenitiesTab = () => {
  const [amenitiesList, setAmenitiesList] = useState<Array<{id: number, name: string, count: number}>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedAmenity, setSelectedAmenity] = useState<{id: number, name: string, count: number} | null>(null);
  const [openDialogId, setOpenDialogId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '' });
  const [editFormData, setEditFormData] = useState({ name: '' });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;

  // Form validation
  const isFormValid = formData.name.trim() !== '';
  const isEditFormValid = editFormData.name.trim() !== '';

  // Fetch amenities data from Supabase
  const fetchAmenities = async () => {
    setIsLoading(true);
    try {
      // First, get all amenities
      const { data: amenitiesData, error: amenitiesError, count } = await supabase
        .from('amenities')
        .select('*', { count: 'exact' })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

      if (amenitiesError) {
        throw amenitiesError;
      }

      if (count !== null) {
        setTotalCount(count);
        setTotalPages(Math.ceil(count / itemsPerPage));
      }
      
      // Create a map to store amenity counts
      const countMap = new Map();
      
      // Fetch the counts using a separate query
      if (amenitiesData && amenitiesData.length > 0) {
        const amenityIds = amenitiesData.map(a => a.amenity_id);
        
        // Get count of building_amenities for each amenity_id
        for (const amenityId of amenityIds) {
          const { count: amenityCount, error: countError } = await supabase
            .from('building_amenities')
            .select('*', { count: 'exact', head: true })
            .eq('amenity_id', amenityId);
            
          if (countError) {
            console.error(`Error fetching count for amenity ${amenityId}:`, countError);
          } else {
            countMap.set(amenityId, amenityCount || 0);
          }
        }
      }

      // Combine the data
      const formattedData = amenitiesData.map(item => ({
        id: item.amenity_id,
        name: item.amenity_name,
        count: countMap.get(item.amenity_id) || 0, // Default to 0 if no count found
      }));
      
      setAmenitiesList(formattedData);
    } catch (error) {
      console.error('Error fetching amenities:', error);
      toast.error('Failed to load amenities');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAmenities();
  }, [currentPage]);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isFormValid) {
      toast.error('Please enter an amenity name');
      return;
    }
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('amenities')
        .insert([{ amenity_name: formData.name }])
        .select();

      if (error) {
        throw error;
      }

      toast.success('Amenity added successfully!');
      setFormData({ name: '' });
      setIsAddDialogOpen(false);
      fetchAmenities();
    } catch (error) {
      console.error('Error adding amenity:', error);
      toast.error('Failed to add amenity');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedAmenity || !isEditFormValid) {
      toast.error('Please enter an amenity name');
      return;
    }
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('amenities')
        .update({ amenity_name: editFormData.name })
        .eq('amenity_id', selectedAmenity.id);

      if (error) {
        throw error;
      }

      toast.success('Amenity updated successfully!');
      setOpenDialogId(null);
      setSelectedAmenity(null);
      fetchAmenities();
    } catch (error) {
      console.error('Error updating amenity:', error);
      toast.error('Failed to update amenity');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAmenity) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('amenities')
        .delete()
        .eq('amenity_id', selectedAmenity.id);

      if (error) {
        throw error;
      }

      toast.success('Amenity deleted successfully!');
      setOpenDialogId(null);
      setSelectedAmenity(null);
      fetchAmenities();
    } catch (error) {
      console.error('Error deleting amenity:', error);
      toast.error('Failed to delete amenity');
    } finally {
      setIsLoading(false);
    }
  };

  const openDialog = (type: string, amenity: typeof amenitiesList[0] | null = null) => {
    setSelectedAmenity(amenity);
    
    if (type === 'edit' && amenity) {
      setEditFormData({ name: amenity.name });
    }
    
    setOpenDialogId(type + (amenity?.id || ''));
  };

  const closeDialog = () => {
    setOpenDialogId(null);
    setSelectedAmenity(null);
    setEditFormData({ name: '' });
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const renderPaginationItems = () => {
    const items = [];
    
    // Always show first page
    items.push(
      <PaginationItem key="first">
        <PaginationLink 
          isActive={currentPage === 1}
          onClick={() => handlePageChange(1)}
        >
          1
        </PaginationLink>
      </PaginationItem>
    );

    // If we're not in the first few pages, add an ellipsis
    if (currentPage > 3) {
      items.push(
        <PaginationItem key="ellipsis-start">
          <PaginationLink>...</PaginationLink>
        </PaginationItem>
      );
    }

    // Show the current page and one page before and after (if they exist)
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (i === 1 || i === totalPages) continue; // Skip first and last, they're always shown
      
      items.push(
        <PaginationItem key={i}>
          <PaginationLink 
            isActive={currentPage === i}
            onClick={() => handlePageChange(i)}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // If we're not in the last few pages, add an ellipsis
    if (currentPage < totalPages - 2) {
      items.push(
        <PaginationItem key="ellipsis-end">
          <PaginationLink>...</PaginationLink>
        </PaginationItem>
      );
    }

    // Always show last page if it's different from the first page
    if (totalPages > 1) {
      items.push(
        <PaginationItem key="last">
          <PaginationLink 
            isActive={currentPage === totalPages}
            onClick={() => handlePageChange(totalPages)}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium">Amenities</h2>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Amenity
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Amenity</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Amenity Name</Label>
                <Input 
                  id="name" 
                  name="name" 
                  placeholder="Enter amenity name" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required 
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isLoading || !isFormValid}>
                  {isLoading ? 'Adding...' : 'Add Amenity'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

        <div className="border rounded-md overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Usage Count</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10">
                  Loading amenities...
                </TableCell>
              </TableRow>
            ) : amenitiesList.length > 0 ? (
                amenitiesList.map((amenity) => (
                  <TableRow key={amenity.id}>
                    <TableCell>{amenity.id}</TableCell>
                    <TableCell>{amenity.name}</TableCell>
                    <TableCell>{amenity.count}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog 
                          open={openDialogId === `edit${amenity.id}`} 
                          onOpenChange={(open) => {
                            if (open) {
                              openDialog('edit', amenity);
                            } else {
                              closeDialog();
                            }
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={() => openDialog('edit', amenity)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Amenity</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleEdit} className="space-y-4 pt-4">
                              <div className="space-y-2">
                                <Label htmlFor="edit-name">Amenity Name</Label>
                                <Input 
                                  id="edit-name" 
                                  name="edit-name"
                                  value={editFormData.name}
                                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                  required 
                                />
                              </div>
                              <DialogFooter>
                                <Button type="submit" disabled={isLoading || !isEditFormValid}>
                                  {isLoading ? 'Updating...' : 'Update Amenity'}
                                </Button>
                              </DialogFooter>
                            </form>
                          </DialogContent>
                        </Dialog>

                        <Dialog 
                          open={openDialogId === `delete${amenity.id}`} 
                          onOpenChange={(open) => {
                            if (open) {
                              openDialog('delete', amenity);
                            } else {
                              closeDialog();
                            }
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              onClick={() => openDialog('delete', amenity)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Delete Amenity</DialogTitle>
                            </DialogHeader>
                            <div className="py-4">
                              <p>Are you sure you want to delete <strong>{selectedAmenity?.name}</strong>?</p>
                              <p className="text-sm text-muted-foreground mt-2">This action cannot be undone.</p>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={closeDialog}>
                                Cancel
                              </Button>
                              <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
                                {isLoading ? 'Deleting...' : 'Delete'}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">
                    No amenities found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => handlePageChange(currentPage - 1)} 
                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            
            {renderPaginationItems()}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => handlePageChange(currentPage + 1)} 
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default AmenitiesTab;
