"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Edit, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import PublisherForm from "@/components/PublisherForm";

interface Province {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  createdAt: string;
}

interface Publisher {
  id: string;
  name: string;
  website?: string;
  province_id: string;
  province_name?: string;
  createdAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminPublishersPage() {
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingPublisher, setEditingPublisher] = useState<Publisher | null>(
    null,
  );
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const fetchProvinces = async () => {
    try {
      const response = await fetch("/api/admin/provinces?limit=1000");
      if (response.ok) {
        const data = await response.json();
        setProvinces(data.provinces);
      }
    } catch (error) {
      console.error("Error fetching provinces:", error);
    }
  };

  const fetchPublishers = async (search = "", page = 1) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
      });
      if (search) params.set("search", search);

      const response = await fetch(`/api/admin/publishers?${params}`);
      if (response.ok) {
        const data = await response.json();
        console.log(
          `[DEBUG] Frontend - Received publishers:`,
          data.publishers.map((p: any) => ({ id: p.id, name: p.name })),
        );
        console.log(
          `[DEBUG] Frontend - Publishers count: ${data.publishers.length}`,
        );
        setPublishers(data.publishers);
        setPagination(data.pagination);
      } else {
        toast.error("Failed to fetch publishers");
      }
    } catch (error) {
      console.error("Error fetching publishers:", error);
      toast.error("Error loading publishers");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePublisher = async (prevState: any, formData: FormData) => {
    try {
      const response = await fetch("/api/admin/publishers", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Publisher created successfully");
        setIsCreateDialogOpen(false);
        fetchPublishers(searchTerm);
        return result;
      } else {
        toast.error(result.error || "Failed to create publisher");
        return { error: result.error };
      }
    } catch (error) {
      console.error("Error creating publisher:", error);
      toast.error("Error creating publisher");
      return { error: "An unexpected error occurred" };
    }
  };

  const handleUpdatePublisher = async (prevState: any, formData: FormData) => {
    if (!editingPublisher) return { error: "No publisher selected" };

    try {
      const response = await fetch(
        `/api/admin/publishers/${editingPublisher.id}`,
        {
          method: "PUT",
          body: formData,
        },
      );

      const result = await response.json();

      if (response.ok) {
        toast.success("Publisher updated successfully");
        setIsEditDialogOpen(false);
        setEditingPublisher(null);
        fetchPublishers(searchTerm);
        return result;
      } else {
        toast.error(result.error || "Failed to update publisher");
        return { error: result.error };
      }
    } catch (error) {
      console.error("Error updating publisher:", error);
      toast.error("Error updating publisher");
      return { error: "An unexpected error occurred" };
    }
  };

  const handleDeletePublisher = async (publisher: Publisher) => {
    try {
      const response = await fetch(`/api/admin/publishers/${publisher.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Publisher deleted successfully");
        fetchPublishers(searchTerm);
      } else {
        const result = await response.json();
        toast.error(result.error || "Failed to delete publisher");
      }
    } catch (error) {
      console.error("Error deleting publisher:", error);
      toast.error("Error deleting publisher");
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    fetchPublishers(value);
  };

  useEffect(() => {
    fetchProvinces();
    fetchPublishers();
  }, []);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Publisher Management</h1>
          <p className="text-muted-foreground">
            Manage publishers for the Tender Hub system
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Publisher
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create Publisher</DialogTitle>
              <DialogDescription>
                Add a new publisher to the system.
              </DialogDescription>
            </DialogHeader>
            <PublisherForm
              provinces={provinces.map((p) => ({
                ...p,
                createdAt: new Date(p.createdAt),
                description: p.description || null,
              }))}
              action={handleCreatePublisher}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Publishers</CardTitle>
          <CardDescription>
            A list of all publishers in the system.
          </CardDescription>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search publishers..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading publishers...</div>
            </div>
          ) : publishers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="text-muted-foreground mb-4">
                No publishers found
              </div>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add First Publisher
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead>Province</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {publishers.map((publisher) => (
                  <TableRow key={publisher.id}>
                    <TableCell className="font-medium">
                      {publisher.name}
                    </TableCell>
                    <TableCell>
                      {publisher.website ? (
                        <a
                          href={publisher.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                        >
                          {publisher.website}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">
                          No website
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {publisher.province_name || "Unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(publisher.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Dialog
                          open={
                            isEditDialogOpen &&
                            editingPublisher?.id === publisher.id
                          }
                          onOpenChange={(open) => {
                            setIsEditDialogOpen(open);
                            if (!open) setEditingPublisher(null);
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingPublisher(publisher)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>Edit Publisher</DialogTitle>
                              <DialogDescription>
                                Update publisher information.
                              </DialogDescription>
                            </DialogHeader>
                            <PublisherForm
                              publisher={
                                editingPublisher
                                  ? {
                                      ...editingPublisher,
                                      createdAt: new Date(
                                        editingPublisher.createdAt,
                                      ),
                                      website: editingPublisher.website || null,
                                    }
                                  : undefined
                              }
                              provinces={provinces.map((p) => ({
                                ...p,
                                createdAt: new Date(p.createdAt),
                                description: p.description || null,
                              }))}
                              action={handleUpdatePublisher}
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
                                Delete Publisher
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "
                                {publisher.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeletePublisher(publisher)}
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
                of {pagination.total} publishers
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    fetchPublishers(searchTerm, pagination.page - 1)
                  }
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    fetchPublishers(searchTerm, pagination.page + 1)
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
  );
}
