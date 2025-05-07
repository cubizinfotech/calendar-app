import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { PlusCircle, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

interface Building {
  building_id: number;
  building_name: string;
}

interface Amenity {
  amenity_id: number;
  amenity_name: string;
}

interface BuildingAmenity {
  id: number;
  building_id: number;
  amenity_id: number;
  floor: string;
  building_name?: string;
  amenity_name?: string;
}

const BuildingAmenitiesTab = () => {
  const [buildingAmenities, setBuildingAmenities] = useState<BuildingAmenity[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<BuildingAmenity | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<string>('all');
  const [selectedAmenity, setSelectedAmenity] = useState<string>('all');
  const [formData, setFormData] = useState({
    buildingId: '',
    amenityId: '',
    floor: ''
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;

  // Form validation
  const isFormValid = formData.buildingId !== '' && formData.amenityId !== '' && formData.floor.trim() !== '';

  // Fetch buildings, amenities, and building amenities data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch buildings
      const { data: buildingsData, error: buildingsError } = await supabase
        .from('buildings')
        .select('building_id, building_name');
      
      if (buildingsError) throw buildingsError;
      setBuildings(buildingsData || []);
      
      // Fetch amenities
      const { data: amenitiesData, error: amenitiesError } = await supabase
        .from('amenities')
        .select('amenity_id, amenity_name');
      
      if (amenitiesError) throw amenitiesError;
      setAmenities(amenitiesData || []);
      
      // Fetch building amenities with pagination
      let query = supabase
        .from('building_amenities')
        .select(`
          *,
          buildings!building_amenities_building_id_fkey(building_name),
          amenities!building_amenities_amenity_id_fkey(amenity_name)
        `, { count: 'exact' });
      
      if (selectedBuilding !== 'all') {
        query = query.eq('building_id', parseInt(selectedBuilding));
      }

      if (selectedAmenity !== 'all') {
        query = query.eq('amenity_id', parseInt(selectedAmenity));
      }
      
      const { data, error, count } = await query
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);
      
      if (error) throw error;
      
      if (count !== null) {
        setTotalCount(count);
        setTotalPages(Math.ceil(count / itemsPerPage));
      }
      
      const formattedData = data.map(item => ({
        id: item.amenity_id, // Using amenity_id as unique identifier for the row
        building_id: item.building_id,
        amenity_id: item.amenity_id,
        floor: item.floor || '',
        building_name: item.buildings?.building_name,
        amenity_name: item.amenities?.amenity_name
      }));
      
      setBuildingAmenities(formattedData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, selectedBuilding, selectedAmenity]);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!isFormValid) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('building_amenities')
        .insert({
          building_id: parseInt(formData.buildingId),
          amenity_id: parseInt(formData.amenityId),
          floor: formData.floor
        });
      
      if (error) throw error;
      
      toast.success('Building amenity added successfully!');
      setFormData({ buildingId: '', amenityId: '', floor: '' });
      setIsAddDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error adding building amenity:', error);
      toast.error('Failed to add building amenity');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('building_amenities')
        .delete()
        .eq('building_id', selectedItem.building_id)
        .eq('amenity_id', selectedItem.amenity_id);
      
      if (error) throw error;
      
      toast.success('Building amenity removed successfully!');
      setIsDeleteDialogOpen(false);
      setSelectedItem(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting building amenity:', error);
      toast.error('Failed to remove building amenity');
    } finally {
      setIsLoading(false);
    }
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-medium">Building Amenities</h2>
        </div>
        
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <div className="flex flex-col sm:flex-row gap-3">
          <Select 
            value={selectedBuilding} 
            onValueChange={(value) => {
              setSelectedBuilding(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by Building" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Buildings</SelectItem>
              {buildings.map((building) => (
                <SelectItem key={building.building_id} value={building.building_id.toString()}>
                  {building.building_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

            <Select 
              value={selectedAmenity} 
              onValueChange={(value) => {
                setSelectedAmenity(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by Amenity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Amenities</SelectItem>
                {amenities.map((amenity) => (
                  <SelectItem key={amenity.amenity_id} value={amenity.amenity_id.toString()}>
                    {amenity.amenity_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Building Amenity
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Building Amenity</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="building">Building</Label>
                  <Select 
                    value={formData.buildingId} 
                    onValueChange={(value) => setFormData({ ...formData, buildingId: value })}
                    required
                  >
                    <SelectTrigger id="building">
                      <SelectValue placeholder="Select building" />
                    </SelectTrigger>
                    <SelectContent>
                      {buildings.map((building) => (
                        <SelectItem key={building.building_id} value={building.building_id.toString()}>
                          {building.building_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="amenity">Amenity</Label>
                  <Select 
                    value={formData.amenityId} 
                    onValueChange={(value) => setFormData({ ...formData, amenityId: value })}
                    required
                  >
                    <SelectTrigger id="amenity">
                      <SelectValue placeholder="Select amenity" />
                    </SelectTrigger>
                    <SelectContent>
                      {amenities.map((amenity) => (
                        <SelectItem key={amenity.amenity_id} value={amenity.amenity_id.toString()}>
                          {amenity.amenity_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="floor">Floor</Label>
                  <Input 
                    id="floor" 
                    type="text" 
                    placeholder="Enter floor number" 
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                    required 
                  />
                </div>
                
                <DialogFooter>
                  <Button type="submit" disabled={isLoading || !isFormValid}>
                    {isLoading ? 'Adding...' : 'Add'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

        <div className="border rounded-md overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Building</TableHead>
                <TableHead>Amenity</TableHead>
                <TableHead>Floor</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10">
                  Loading building amenities...
                </TableCell>
              </TableRow>
            ) : buildingAmenities.length > 0 ? (
                buildingAmenities.map((item) => (
                  <TableRow key={`${item.building_id}-${item.amenity_id}`}>
                    <TableCell>{item.building_name}</TableCell>
                    <TableCell>{item.amenity_name}</TableCell>
                    <TableCell>{item.floor}</TableCell>
                    <TableCell className="text-right">
                      <Dialog 
                        open={isDeleteDialogOpen && selectedItem?.id === item.id} 
                        onOpenChange={(open) => {
                          setIsDeleteDialogOpen(open);
                          if (!open) setSelectedItem(null);
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => setSelectedItem(item)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Remove Building Amenity</DialogTitle>
                          </DialogHeader>
                          <div className="py-4">
                            <p>
                              Are you sure you want to remove <strong>{item.amenity_name}</strong> from <strong>{item.building_name}</strong>?
                            </p>
                            <p className="text-sm text-muted-foreground mt-2">
                              This action cannot be undone.
                            </p>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
                              {isLoading ? 'Removing...' : 'Remove'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                <TableCell colSpan={4} className="text-center">
                    No building amenities found
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

export default BuildingAmenitiesTab;
