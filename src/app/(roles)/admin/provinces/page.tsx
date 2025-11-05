"use client";

import { Edit, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import ProvinceForm from "@/components/ProvinceForm";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Province {
  id: string;
  name: string;
  code: string;
  description?: string;
  createdAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminProvincesPage() {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingProvince, setEditingProvince] = useState<Province | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchProvinces = async (search = "", page = 1) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
      });
      if (search && search.trim()) params.set("search", search);

      const response = await fetch(`/api/admin/provinces?${params}`);
      if (response.ok) {
        const data = await response.json();
        setProvinces(data.provinces);
        setPagination(data.pagination);
      } else {
        toast.error("Failed to fetch provinces");
      }
    } catch (error) {
      console.error("Error fetching provinces:", error);
      toast.error("Error loading provinces");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProvince = async (_prevState: any, formData: FormData) => {
    try {
      const response = await fetch("/api/admin/provinces", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Province created successfully");
        setIsCreateDialogOpen(false);
        fetchProvinces(searchTerm);
        return result;
      } else {
        toast.error(result.error || "Failed to create province");
        return { error: result.error };
      }
    } catch (error) {
      console.error("Error creating province:", error);
      toast.error("Error creating province");
      return { error: "An unexpected error occurred" };
    }
  };

  const handleUpdateProvince = async (_prevState: any, formData: FormData) => {
    if (!editingProvince) return { error: "No province selected" };

    try {
      const response = await fetch(
        `/api/admin/provinces/${editingProvince.id}`,
        {
          method: "PUT",
          body: formData,
        },
      );

      const result = await response.json();

      if (response.ok) {
        toast.success("Province updated successfully");
        setIsEditDialogOpen(false);
        setEditingProvince(null);
        fetchProvinces(searchTerm);
        return result;
      } else {
        toast.error(result.error || "Failed to update province");
        return { error: result.error };
      }
    } catch (error) {
      console.error("Error updating province:", error);
      toast.error("Error updating province");
      return { error: "An unexpected error occurred" };
    }
  };

  const handleDeleteProvince = async (province: Province) => {
    try {
      const response = await fetch(`/api/admin/provinces/${province.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Province deleted successfully");
        fetchProvinces(searchTerm);
      } else {
        const result = await response.json();
        toast.error(result.error || "Failed to delete province");
      }
    } catch (error) {
      console.error("Error deleting province:", error);
      toast.error("Error deleting province");
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    const debounceTimeout = setTimeout(() => {
      fetchProvinces(value);
    }, 300);
    return () => clearTimeout(debounceTimeout);
  };

  useEffect(() => {
    fetchProvinces();
  }, [fetchProvinces]);

  return (
    <div className="flex-1">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold">Province Management</h1>
          <p className="text-muted-foreground">
            Manage provinces for the Tender Hub system
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pagination && (
            <p className="text-sm text-muted-foreground">
              Showing {provinces.length} of {pagination.total} provinces
            </p>
          )}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Province
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create Province</DialogTitle>
                <DialogDescription>
                  Add a new province to the system.
                </DialogDescription>
              </DialogHeader>
            <ProvinceForm action={handleCreateProvince} />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-background">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Provinces</CardTitle>
              <CardDescription>
                A list of all provinces in the system
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search provinces..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8 w-full"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-sm text-muted-foreground animate-pulse">
                Loading provinces...
              </div>
            </div>
          ) : provinces.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-sm text-muted-foreground mb-4">
                {searchTerm ? "No provinces found matching your search" : "No provinces have been added yet"}
              </div>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                {searchTerm ? "Create New Province" : "Add First Province"}
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Name</TableHead>
                  <TableHead className="w-[100px]">Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[120px]">Created</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {provinces.map((province) => (
                  <TableRow key={province.id}>
                    <TableCell className="font-medium">
                      {province.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{province.code}</Badge>
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      {province.description || "No description"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(province.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Dialog
                          open={
                            isEditDialogOpen &&
                            editingProvince?.id === province.id
                          }
                          onOpenChange={(open) => {
                            setIsEditDialogOpen(open);
                            if (!open) setEditingProvince(null);
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingProvince(province)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>Edit Province</DialogTitle>
                              <DialogDescription>
                                Update province information.
                              </DialogDescription>
                            </DialogHeader>
                            <ProvinceForm
                              province={
                                editingProvince
                                  ? {
                                      ...editingProvince,
                                      createdAt: new Date(
                                        editingProvince.createdAt,
                                      ),
                                      description:
                                        editingProvince.description || null,
                                    }
                                  : undefined
                              }
                              action={handleUpdateProvince}
                            />
                          </DialogContent>
                        </Dialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Province
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{province.name}
                                "? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteProvince(province)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <div className="text-sm text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                of {pagination.total} provinces
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    fetchProvinces(searchTerm, pagination.page - 1)
                  }
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    fetchProvinces(searchTerm, pagination.page + 1)
                  }
                  disabled={pagination.page === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </div>
  );
}
