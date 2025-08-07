import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUnitOfMeasureSchema, type InsertUnitOfMeasure, type UnitOfMeasure } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Edit, Trash2, Ruler } from "lucide-react";
import { z } from "zod";

const enhancedUnitSchema = insertUnitOfMeasureSchema.extend({
  isActive: z.boolean().default(true),
});

type EnhancedInsertUnit = z.infer<typeof enhancedUnitSchema>;

export function UnitsOfMeasureManager() {
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<UnitOfMeasure | null>(null);

  const { data: units, isLoading: unitsLoading } = useQuery<UnitOfMeasure[]>({
    queryKey: ["/api/admin/units-of-measure"],
  });

  const form = useForm<EnhancedInsertUnit>({
    resolver: zodResolver(enhancedUnitSchema),
    defaultValues: {
      name: "",
      abbreviation: "",
      isActive: true,
    },
  });

  const createUnitMutation = useMutation({
    mutationFn: async (unitData: InsertUnitOfMeasure) => {
      const res = await apiRequest("/api/admin/units-of-measure", "POST", unitData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/units-of-measure"] });
      queryClient.invalidateQueries({ queryKey: ["/api/units-of-measure"] });
      setIsAddOpen(false);
      setEditingUnit(null);
      form.reset();
      toast({
        title: "Success",
        description: "Unit of measure created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create unit of measure",
        variant: "destructive",
      });
    },
  });

  const updateUnitMutation = useMutation({
    mutationFn: async ({ id, unitData }: { id: string; unitData: Partial<InsertUnitOfMeasure> }) => {
      const res = await apiRequest(`/api/admin/units-of-measure/${id}`, "PUT", unitData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/units-of-measure"] });
      queryClient.invalidateQueries({ queryKey: ["/api/units-of-measure"] });
      setEditingUnit(null);
      form.reset();
      toast({
        title: "Success",
        description: "Unit of measure updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update unit of measure",
        variant: "destructive",
      });
    },
  });

  const deleteUnitMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/admin/units-of-measure/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/units-of-measure"] });
      queryClient.invalidateQueries({ queryKey: ["/api/units-of-measure"] });
      toast({
        title: "Success",
        description: "Unit of measure deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete unit of measure",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: EnhancedInsertUnit) => {
    if (editingUnit) {
      updateUnitMutation.mutate({ id: editingUnit.id, unitData: data });
    } else {
      createUnitMutation.mutate(data);
    }
  };

  const startEdit = (unit: UnitOfMeasure) => {
    setEditingUnit(unit);
    form.reset({
      name: unit.name,
      abbreviation: unit.abbreviation,
      isActive: unit.isActive ?? true,
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this unit of measure?")) {
      deleteUnitMutation.mutate(id);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Ruler className="w-5 h-5" />
              Units of Measure
            </CardTitle>
            <CardDescription>
              Manage units of measure for products (kg, pieces, liters, etc.)
            </CardDescription>
          </div>
          <Dialog open={isAddOpen || !!editingUnit} onOpenChange={(open) => {
            if (!open) {
              setIsAddOpen(false);
              setEditingUnit(null);
              form.reset();
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsAddOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Unit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingUnit ? "Edit Unit of Measure" : "Add New Unit of Measure"}
                </DialogTitle>
                <DialogDescription>
                  {editingUnit ? "Update the unit of measure details" : "Create a new unit of measure for products"}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., kilogram, piece, liter" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="abbreviation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Abbreviation</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., kg, pc, L" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox 
                            checked={field.value} 
                            onCheckedChange={field.onChange} 
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Active</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Active units are available for selection in product forms
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsAddOpen(false);
                        setEditingUnit(null);
                        form.reset();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createUnitMutation.isPending || updateUnitMutation.isPending}
                    >
                      {createUnitMutation.isPending || updateUnitMutation.isPending
                        ? "Saving..."
                        : editingUnit
                        ? "Update Unit"
                        : "Create Unit"
                      }
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {unitsLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : units && units.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Abbreviation</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {units.map((unit) => (
                <TableRow key={unit.id}>
                  <TableCell className="font-medium">{unit.name}</TableCell>
                  <TableCell>{unit.abbreviation}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      unit.isActive 
                        ? "bg-green-100 text-green-800" 
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {unit.isActive ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(unit)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(unit.id)}
                        disabled={deleteUnitMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No units of measure found. Create your first unit to get started.
          </div>
        )}
      </CardContent>
    </Card>
  );
}