import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { PlusCircle, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

type Building = Tables<'buildings'> & {
  regions: Tables<'regions'>;
};

const BuildingsTab = () => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [regions, setRegions] = useState<Tables<'regions'>[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    regionId: '',
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // Form validation
  const isFormValid = formData.name.trim() !== '' && formData.regionId !== '';

  // Fetch buildings and regions data
  const fetchData = async () => {
    setIsLoading(true);
    
    try {
      // Fetch regions
      const { data: regionsData, error: regionsError } = await supabase
        .from('regions')
        .select('*');
      
      if (regionsError) throw regionsError;
      setRegions(regionsData || []);
      
      // First, get the count of all buildings
      const { count, error: countError } = await supabase
        .from('buildings')
        .select('*', { count: 'exact', head: true });
      
      if (countError) throw countError;
      
      // Calculate total pages
      const total = count || 0;
      setTotalPages(Math.max(1, Math.ceil(total / itemsPerPage)));
      
      // Fetch buildings with region join, with pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      
      const { data: buildingsData, error: buildingsError } = await supabase
        .from('buildings')
        .select(`
          building_id,
          building_name,
          region_id,
          regions (
            region_id,
            region_name
          )
        `)
        .order('building_id')
        .range(from, to);
        
      if (buildingsError) throw buildingsError;
      setBuildings(buildingsData as Building[] || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch buildings data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage]); // Re-fetch when page changes

  const resetForm = () => {
    setFormData({
      name: '',
      regionId: '',
    });
  };

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!isFormValid) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('buildings')
        .insert([
          { 
            building_name: formData.name, 
            region_id: parseInt(formData.regionId) 
          }
        ])
        .select();
        
      if (error) throw error;
      
      toast.success('Building added successfully!');
      setIsAddDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error adding building:', error);
      toast.error('Failed to add building');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedBuilding) return;
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('buildings')
        .update({ 
          building_name: formData.name, 
          region_id: parseInt(formData.regionId) 
        })
        .eq('building_id', selectedBuilding.building_id);
        
      if (error) throw error;
      
      toast.success('Building updated successfully!');
      setIsEditDialogOpen(false);
      setSelectedBuilding(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error updating building:', error);
      toast.error('Failed to update building');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedBuilding) return;
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('buildings')
        .delete()
        .eq('building_id', selectedBuilding.building_id);
        
      if (error) throw error;
      
      toast.success('Building deleted successfully!');
      setIsDeleteDialogOpen(false);
      setSelectedBuilding(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting building:', error);
      toast.error('Failed to delete building');
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (building: Building) => {
    setSelectedBuilding(building);
    setFormData({
      name: building.building_name,
      regionId: building.region_id.toString(),
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (building: Building) => {
    setSelectedBuilding(building);
    setIsDeleteDialogOpen(true);
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
        <h2 className="text-lg font-medium">Buildings</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Building
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Building</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Building Name</Label>
                <Input 
                  id="name" 
                  placeholder="Enter building name" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="region">Region</Label>
                <Select 
                  value={formData.regionId} 
                  onValueChange={(value) => setFormData({ ...formData, regionId: value })}
                  required
                >
                  <SelectTrigger id="region">
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((region) => (
                      <SelectItem key={region.region_id} value={region.region_id.toString()}>
                        {region.region_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isLoading || !isFormValid}>
                  {isLoading ? 'Adding...' : 'Add Building'}
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
              <TableHead>Region</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10">
                  Loading buildings...
                </TableCell>
              </TableRow>
            ) : buildings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10">
                  No buildings found.
                </TableCell>
              </TableRow>
            ) : (
              buildings.map((building) => (
                <TableRow key={building.building_id}>
                  <TableCell>{building.building_id}</TableCell>
                  <TableCell>{building.building_name}</TableCell>
                  <TableCell>{building.regions?.region_name}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => openEditDialog(building)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => openDeleteDialog(building)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => handlePageChange(currentPage - 1)}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
            
            {renderPaginationItems()}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => handlePageChange(currentPage + 1)}
                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
      
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) setSelectedBuilding(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Building</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Building Name</Label>
              <Input 
                id="edit-name" 
                value={formData.name} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-region">Region</Label>
              <Select 
                value={formData.regionId} 
                onValueChange={(value) => setFormData({ ...formData, regionId: value })}
                required
              >
                <SelectTrigger id="edit-region">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((region) => (
                    <SelectItem key={region.region_id} value={region.region_id.toString()}>
                      {region.region_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isLoading || !isFormValid}>
                {isLoading ? 'Updating...' : 'Update Building'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={(open) => {
        setIsDeleteDialogOpen(open);
        if (!open) setSelectedBuilding(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Building</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete <strong>{selectedBuilding?.building_name}</strong>?</p>
            <p className="text-sm text-muted-foreground mt-2">This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BuildingsTab;
