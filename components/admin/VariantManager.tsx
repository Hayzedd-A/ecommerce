"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import apiClient from "@/lib/api/client";
import { toast } from "react-hot-toast";
import { Plus, Trash2, Edit2, Save, X } from "lucide-react";

interface VariantManagerProps {
  productId: string;
}

export const VariantManager: React.FC<VariantManagerProps> = ({ productId }) => {
  const [variants, setVariants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null); // variantId
  const [newVariant, setNewVariant] = useState<any | null>(null);

  useEffect(() => {
    loadVariants();
  }, [productId]);

  const loadVariants = async () => {
    try {
      const response = await apiClient.get(`/admin/products/${productId}/variants`);
      setVariants(response.data.data);
    } catch (error: any) {
      toast.error("Failed to load variants");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddVariant = () => {
    setNewVariant({
      attributes: { size: "", color: "" },
      price: "",
      stock: 0,
      sku: "",
    });
  };

  const handleSaveNew = async () => {
    try {
      // Filter out empty attributes
      const filteredAttributes = Object.fromEntries(
        Object.entries(newVariant.attributes).filter(([_, v]) => v !== "")
      );

      await apiClient.post(`/admin/products/${productId}/variants`, {
        ...newVariant,
        attributes: filteredAttributes,
      });
      toast.success("Variant created");
      setNewVariant(null);
      loadVariants();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to create variant");
    }
  };

  const handleUpdate = async (variant: any) => {
    try {
      await apiClient.put(`/admin/products/${productId}/variants`, variant);
      toast.success("Variant updated");
      setIsEditing(null);
      loadVariants();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update variant");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this variant?")) return;
    try {
      await apiClient.delete(`/admin/products/${productId}/variants`, {
        params: { id },
      });
      toast.success("Variant deleted");
      loadVariants();
    } catch (error: any) {
      toast.error("Failed to delete variant");
    }
  };

  const updateAttribute = (obj: any, setObj: any, key: string, value: string) => {
    setObj({
      ...obj,
      attributes: {
        ...obj.attributes,
        [key]: value,
      },
    });
  };

  const addAttributeField = (obj: any, setObj: any) => {
    const key = prompt("Enter attribute name (e.g. size, color, material)");
    if (key) {
      setObj({
        ...obj,
        attributes: {
          ...obj.attributes,
          [key.toLowerCase()]: "",
        },
      });
    }
  };

  if (isLoading) return <div>Loading variants...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Product Variants</h2>
        <Button onClick={handleAddVariant} size="sm" leftIcon={<Plus className="h-4 w-4" />}>
          Add Variant
        </Button>
      </div>

      {newVariant && (
        <Card className="p-4 border-primary-500 border-2">
          <div className="grid gap-4">
            <h3 className="font-semibold">New Variant</h3>
            <div className="grid gap-4 lg:grid-cols-3">
              {Object.keys(newVariant.attributes).map((key) => (
                <Input
                  key={key}
                  label={key.charAt(0).toUpperCase() + key.slice(1)}
                  value={newVariant.attributes[key]}
                  onChange={(e) => updateAttribute(newVariant, setNewVariant, key, e.target.value)}
                />
              ))}
              <div className="flex items-end pb-1">
                 <Button variant="secondary" size="sm" onClick={() => addAttributeField(newVariant, setNewVariant)}>+ Add Attribute</Button>
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <Input
                label="Price Override"
                type="number"
                value={newVariant.price}
                onChange={(e) => setNewVariant({ ...newVariant, price: e.target.value })}
              />
              <Input
                label="Stock"
                type="number"
                value={newVariant.stock}
                onChange={(e) => setNewVariant({ ...newVariant, stock: Number(e.target.value) })}
              />
              <Input
                label="SKU"
                value={newVariant.sku}
                onChange={(e) => setNewVariant({ ...newVariant, sku: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setNewVariant(null)}>Cancel</Button>
              <Button size="sm" onClick={handleSaveNew}>Create</Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-4">
        {variants.length === 0 && !newVariant && (
          <p className="text-sm text-muted-foreground italic">No variants created for this product yet.</p>
        )}
        {variants.map((v) => (
          <Card key={v._id} className="p-4">
            {isEditing === v._id ? (
              <div className="grid gap-4">
                <div className="grid gap-4 lg:grid-cols-3">
                  {Object.keys(v.attributes).map((key) => (
                    <Input
                      key={key}
                      label={key}
                      value={v.attributes[key]}
                      onChange={(e) => {
                         const updatedVariants = [...variants];
                         const idx = updatedVariants.findIndex(varnt => varnt._id === v._id);
                         updatedVariants[idx].attributes[key] = e.target.value;
                         setVariants(updatedVariants);
                      }}
                    />
                  ))}
                </div>
                <div className="grid gap-4 lg:grid-cols-3">
                  <Input
                    label="Price"
                    type="number"
                    value={v.price || ""}
                    onChange={(e) => {
                        const updatedVariants = [...variants];
                        const idx = updatedVariants.findIndex(varnt => varnt._id === v._id);
                        updatedVariants[idx].price = e.target.value === "" ? undefined : Number(e.target.value);
                        setVariants(updatedVariants);
                    }}
                  />
                  <Input
                    label="Stock"
                    type="number"
                    value={v.stock}
                    onChange={(e) => {
                        const updatedVariants = [...variants];
                        const idx = updatedVariants.findIndex(varnt => varnt._id === v._id);
                        updatedVariants[idx].stock = Number(e.target.value);
                        setVariants(updatedVariants);
                    }}
                  />
                   <Input
                    label="SKU"
                    value={v.sku || ""}
                    onChange={(e) => {
                        const updatedVariants = [...variants];
                        const idx = updatedVariants.findIndex(varnt => varnt._id === v._id);
                        updatedVariants[idx].sku = e.target.value;
                        setVariants(updatedVariants);
                    }}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setIsEditing(null)} leftIcon={<X className="h-4 w-4" />}>Cancel</Button>
                  <Button size="sm" onClick={() => handleUpdate(v)} leftIcon={<Save className="h-4 w-4" />}>Save</Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex gap-2 mb-1">
                    {Object.entries(v.attributes).map(([k, val]: any) => (
                      <span key={k} className="text-[10px] font-bold uppercase tracking-wider bg-surface-secondary px-2 py-0.5 rounded border border-border">
                        {k}: {val}
                      </span>
                    ))}
                  </div>
                  <div className="text-sm space-x-4">
                    <span className="font-bold text-primary-500">{v.price ? `₦${v.price.toLocaleString()}` : "(Using Base Price)"}</span>
                    <span className="text-muted-foreground">Stock: {v.stock}</span>
                    {v.sku && <span className="text-muted-foreground text-xs font-mono">SKU: {v.sku}</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setIsEditing(v._id)} iconOnly><Edit2 className="h-4 w-4" /></Button>
                  <Button variant="secondary" size="sm" onClick={() => handleDelete(v._id)} iconOnly className="text-error-500 hover:bg-error-50"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};
