"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import apiClient from "@/lib/api/client";
import { toast } from "react-hot-toast";
import {
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  ChevronDown,
  Check,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils/helpers";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AttributePair {
  id: string;
  key: string;
  value: string;
}

interface VariantFormData {
  attributePairs: AttributePair[];
  price: string;
  stock: number;
  sku: string;
}

interface VariantNode {
  _id: string;
  attributes: Record<string, string>;
  price?: number;
  stock: number;
  sku?: string;
  level: number;
  parentVariantId?: string;
  children?: VariantNode[];
}

interface NestedVariantManagerProps {
  productId: string;
}

// ─── Creatable Select ─────────────────────────────────────────────────────────

interface CreatableSelectProps {
  value: string;
  onChange: (val: string) => void;
  suggestions: string[];
  placeholder?: string;
  usedKeys?: string[];
}

const DEFAULT_ATTRIBUTE_SUGGESTIONS = [
  "size",
  "color",
  "material",
  "weight",
  "style",
  "finish",
  "length",
  "width",
  "height",
  "pattern",
  "flavor",
  "scent",
];

function CreatableSelect({
  value,
  onChange,
  suggestions,
  placeholder = "Select or type…",
  usedKeys = [],
}: CreatableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const filtered = suggestions.filter(
    (s) =>
      s.toLowerCase().includes(query.toLowerCase()) &&
      !usedKeys.includes(s) &&
      s !== value,
  );

  const showCreate =
    query.trim() !== "" &&
    !suggestions.some((s) => s.toLowerCase() === query.toLowerCase()) &&
    !usedKeys.includes(query.trim().toLowerCase());

  const handleSelect = (val: string) => {
    onChange(val.toLowerCase());
    setQuery(val.toLowerCase());
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    onChange(e.target.value.toLowerCase());
    setOpen(true);
  };

  return (
    <div ref={ref} className="relative">
      <div
        className={cn(
          "flex items-center w-full px-3 py-2.5 rounded-lg border bg-input-bg text-foreground transition-all duration-200 outline-none",
          "border-border focus-within:border-primary-500 focus-within:ring-4 focus-within:ring-ring",
        )}
      >
        <input
          className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          style={{ outline: "none" }}
        />
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </div>

      {open && (filtered.length > 0 || showCreate) && (
        <div className="absolute max-h-[10em] overflow-y-scroll z-50 mt-1 w-full rounded-lg border border-border bg-background text-foreground shadow-lg overflow-hidden">
          {filtered.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleSelect(s)}
              className="flex items-center w-full px-3 py-2 text-sm hover:bg-surface-secondary transition-colors text-left gap-2"
            >
              {value === s && (
                <Check className="h-3 w-3 text-primary-500 shrink-0" />
              )}
              <span
                className={value === s ? "text-primary-500 font-medium" : ""}
              >
                {s}
              </span>
            </button>
          ))}
          {showCreate && (
            <button
              type="button"
              onClick={() => handleSelect(query.trim())}
              className="flex items-center w-full px-3 py-2 text-sm hover:bg-surface-secondary transition-colors text-left gap-2 border-t border-border"
            >
              <Plus className="h-3.5 w-3.5 text-primary-500 shrink-0" />
              <span>
                Create{" "}
                <span className="font-semibold text-primary-500">
                  "{query.trim()}"
                </span>
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Attribute Pairs Editor ───────────────────────────────────────────────────

interface AttributePairsEditorProps {
  pairs: AttributePair[];
  onChange: (pairs: AttributePair[]) => void;
  knownKeys: string[];
  disabledKeys?: string[];
}

function AttributePairsEditor({
  pairs,
  onChange,
  knownKeys,
  disabledKeys = [],
}: AttributePairsEditorProps) {
  const usedKeys = pairs.map((p) => p.key).filter(Boolean);

  const updatePair = (id: string, field: "key" | "value", val: string) => {
    onChange(pairs.map((p) => (p.id === id ? { ...p, [field]: val } : p)));
  };

  const removePair = (id: string) => {
    onChange(pairs.filter((p) => p.id !== id));
  };

  const addPair = () => {
    onChange([...pairs, { id: crypto.randomUUID(), key: "", value: "" }]);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Attributes
        </span>
        <button
          type="button"
          onClick={addPair}
          className="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-600 font-medium transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add attribute
        </button>
      </div>

      {pairs.length === 0 && (
        <p className="text-xs text-muted-foreground italic py-2">
          No attributes yet. Click "Add attribute" to start.
        </p>
      )}

      <div className="space-y-2">
        {pairs.map((pair) => (
          <div key={pair.id} className="flex items-start gap-2">
            <div className="flex-1">
              <CreatableSelect
                value={pair.key}
                onChange={(val) => updatePair(pair.id, "key", val)}
                suggestions={[
                  ...new Set([...DEFAULT_ATTRIBUTE_SUGGESTIONS, ...knownKeys]),
                ]}
                placeholder="e.g. size"
                usedKeys={usedKeys
                  .filter((k) => k !== pair.key)
                  .concat(disabledKeys)}
              />
            </div>

            <span className="text-muted-foreground text-sm mt-2.5">:</span>

            <div className="flex-1">
              <input
                className={cn(
                  "w-full px-3 py-2.5 rounded-lg border bg-input-bg text-foreground text-sm placeholder:text-muted transition-all duration-200 outline-none",
                  "border-border focus:border-primary-500 focus:ring-4 focus:ring-ring",
                )}
                placeholder={`e.g. ${pair.key === "size" ? "XL" : pair.key === "color" ? "Red" : "value"}`}
                value={pair.value}
                onChange={(e) => updatePair(pair.id, "value", e.target.value)}
              />
            </div>

            <button
              type="button"
              onClick={() => removePair(pair.id)}
              className="mt-2 p-1.5 rounded-md text-muted-foreground hover:text-error-500 hover:bg-error-50 transition-colors shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Variant Form Card ────────────────────────────────────────────────────────

interface VariantFormCardProps {
  title: string;
  data: VariantFormData;
  onChange: (data: VariantFormData) => void;
  onSave: () => void;
  onCancel: () => void;
  saveLabel?: string;
  knownAttributeKeys: string[];
  disabledAttributeKeys?: string[];
  highlight?: boolean;
}

function VariantFormCard({
  title,
  data,
  onChange,
  onSave,
  onCancel,
  saveLabel = "Save",
  knownAttributeKeys,
  disabledAttributeKeys = [],
  highlight = false,
}: VariantFormCardProps) {
  return (
    <Card className={cn("p-5", highlight && "border-primary-500 border-2")}>
      <div className="space-y-5">
        <h3 className="font-semibold text-sm">{title}</h3>

        <AttributePairsEditor
          pairs={data.attributePairs}
          onChange={(pairs) => onChange({ ...data, attributePairs: pairs })}
          knownKeys={knownAttributeKeys}
          disabledKeys={disabledAttributeKeys}
        />

        <div className="grid gap-4 sm:grid-cols-3 pt-1 border-t border-border">
          <Input
            label="Price Override"
            isMoney
            value={data.price}
            onChange={(e) => onChange({ ...data, price: e.target.value })}
            placeholder="Leave blank for base price"
          />
          <Input
            label="Stock"
            type="number"
            value={String(data.stock)}
            onChange={(e) =>
              onChange({ ...data, stock: Number(e.target.value) })
            }
          />
          <Input
            label="SKU"
            value={data.sku}
            onChange={(e) => onChange({ ...data, sku: e.target.value })}
            placeholder="Optional"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={onSave}
            leftIcon={<Save className="h-4 w-4" />}
          >
            {saveLabel}
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pairsToAttributes(pairs: AttributePair[]): Record<string, string> {
  return Object.fromEntries(
    pairs
      .filter((p) => p.key.trim() !== "")
      .map((p) => [p.key.trim(), p.value.trim()]),
  );
}

function attributesToPairs(attrs: Record<string, string>): AttributePair[] {
  return Object.entries(attrs).map(([key, value]) => ({
    id: crypto.randomUUID(),
    key,
    value,
  }));
}

function emptyFormData(): VariantFormData {
  return {
    attributePairs: [{ id: crypto.randomUUID(), key: "", value: "" }],
    price: "",
    stock: 0,
    sku: "",
  };
}

// ─── Build Variant Tree ───────────────────────────────────────────────────────

function buildVariantTree(
  variants: any[],
  parentId: string | null = null,
): VariantNode[] {
  return variants
    .filter(
      (v) =>
        (parentId === null && !v.parentVariantId) ||
        (parentId !== null && v.parentVariantId === parentId),
    )
    .map((v) => ({
      ...v,
      children: buildVariantTree(variants, v._id),
    }));
}

// ─── Variant Row Component ────────────────────────────────────────────────────

interface VariantRowProps {
  variant: VariantNode;
  allVariants: VariantNode[];
  knownAttributeKeys: string[];
  parentAttributeKeys: string[];
  onEdit: (variant: VariantNode) => void;
  onDelete: (variantId: string, hasChildren: boolean) => void;
  onAddChild: (parentVariantId: string, parentAttributeKeys: string[]) => void;
  editingId: string | null;
  editData: VariantFormData | null;
  onEditChange: (data: VariantFormData) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
}

function VariantRowComponent({
  variant,
  allVariants,
  knownAttributeKeys,
  parentAttributeKeys,
  onEdit,
  onDelete,
  onAddChild,
  editingId,
  editData,
  onEditChange,
  onSaveEdit,
  onCancelEdit,
}: VariantRowProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = (variant.children || []).length > 0;
  const indent = (variant.level || 0) * 4;

  if (editingId === variant._id && editData) {
    return (
      <div style={{ marginLeft: `${indent}rem` }}>
        <VariantFormCard
          title={`Edit ${Object.entries(variant.attributes || {})
            .map(([k, v]) => `${k}: ${v}`)
            .join(", ")}`}
          data={editData}
          onChange={onEditChange}
          onSave={onSaveEdit}
          onCancel={onCancelEdit}
          saveLabel="Save Changes"
          knownAttributeKeys={knownAttributeKeys}
          disabledAttributeKeys={parentAttributeKeys}
        />
      </div>
    );
  }

  return (
    <div>
      <Card className="p-4 mb-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {hasChildren && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="p-1 hover:bg-surface-secondary rounded transition-colors shrink-0"
              >
                <ChevronRight
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    expanded && "rotate-90",
                  )}
                />
              </button>
            )}
            {!hasChildren && <div className="w-6" />}

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                {Object.entries(variant.attributes || {}).map(
                  ([k, val]: any) => (
                    <span
                      key={k}
                      className="text-[10px] font-bold uppercase tracking-wider bg-surface-secondary px-2 py-0.5 rounded border border-border"
                    >
                      {k}: {val}
                    </span>
                  ),
                )}
              </div>
              <div className="text-sm space-x-4">
                <span className="font-bold text-primary-500">
                  {variant.price != null
                    ? `₦${Number(variant.price).toLocaleString()}`
                    : "(Base Price)"}
                </span>
                <span className="text-muted-foreground">
                  Stock: {variant.stock}
                </span>
                {variant.sku && (
                  <span className="text-muted-foreground text-xs font-mono">
                    SKU: {variant.sku}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onEdit(variant)}
              iconOnly
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            {!hasChildren && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  onAddChild(variant._id, Object.keys(variant.attributes || {}))
                }
                className="text-primary-500 hover:bg-primary-50"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onDelete(variant._id, hasChildren)}
              iconOnly
              className="text-error-500 hover:bg-error-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {expanded && hasChildren && (
        <div>
          {(variant.children || []).map((child) => (
            <VariantRowComponent
              key={child._id}
              variant={child}
              allVariants={allVariants}
              knownAttributeKeys={knownAttributeKeys}
              parentAttributeKeys={Object.keys(variant.attributes || {})}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              editingId={editingId}
              editData={editData}
              onEditChange={onEditChange}
              onSaveEdit={onSaveEdit}
              onCancelEdit={onCancelEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const NestedVariantManager: React.FC<NestedVariantManagerProps> = ({
  productId,
}) => {
  const [allVariants, setAllVariants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<VariantFormData | null>(null);
  const [newVariant, setNewVariant] = useState<VariantFormData | null>(null);
  const [newVariantParentId, setNewVariantParentId] = useState<string | null>(
    null,
  );
  const [newVariantParentKeys, setNewVariantParentKeys] = useState<string[]>(
    [],
  );

  useEffect(() => {
    loadVariants();
  }, [productId]);

  const loadVariants = async () => {
    try {
      const response = await apiClient.get(
        `/admin/products/${productId}/variants`,
      );
      setAllVariants(response.data.data);
    } catch {
      toast.error("Failed to load variants");
    } finally {
      setIsLoading(false);
    }
  };

  const knownAttributeKeys = Array.from(
    new Set(allVariants.flatMap((v) => Object.keys(v.attributes ?? {}))),
  );

  const variantTree = buildVariantTree(allVariants);

  const handleAddRootVariant = () => {
    setNewVariantParentId(null);
    setNewVariantParentKeys([]);
    setNewVariant(emptyFormData());
  };

  const handleAddChildVariant = (parentId: string, parentKeys: string[]) => {
    setNewVariantParentId(parentId);
    setNewVariantParentKeys(parentKeys);
    setNewVariant(emptyFormData());
  };

  const handleSaveNew = async () => {
    if (!newVariant) return;
    try {
      const attributes = pairsToAttributes(newVariant.attributePairs);
      if (Object.keys(attributes).length === 0) {
        toast.error("Add at least one attribute");
        return;
      }

      // Validate that child variants use different attribute keys
      if (newVariantParentId && newVariantParentKeys.length > 0) {
        const newKeys = Object.keys(attributes);
        const overlap = newKeys.filter((k) => newVariantParentKeys.includes(k));
        if (overlap.length > 0) {
          toast.error(
            `Cannot reuse parent attribute keys: ${overlap.join(", ")}`,
          );
          return;
        }
      }

      await apiClient.post(`/admin/products/${productId}/variants`, {
        attributes,
        price: newVariant.price === "" ? undefined : Number(newVariant.price),
        stock: newVariant.stock,
        sku: newVariant.sku,
        parentVariantId: newVariantParentId,
      });

      toast.success(
        newVariantParentId ? "Sub-variant created" : "Variant created",
      );
      setNewVariant(null);
      setNewVariantParentId(null);
      setNewVariantParentKeys([]);
      loadVariants();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to create variant");
    }
  };

  const handleEdit = (variant: VariantNode) => {
    setEditingId(variant._id);
    setEditData({
      attributePairs: attributesToPairs(variant.attributes ?? {}),
      price: variant.price != null ? String(variant.price) : "",
      stock: variant.stock ?? 0,
      sku: variant.sku ?? "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editData || !editingId) return;
    try {
      const attributes = pairsToAttributes(editData.attributePairs);
      if (Object.keys(attributes).length === 0) {
        toast.error("Add at least one attribute");
        return;
      }

      await apiClient.put(`/admin/products/${productId}/variants`, {
        _id: editingId,
        attributes,
        price: editData.price === "" ? undefined : Number(editData.price),
        stock: editData.stock,
        sku: editData.sku,
      });

      toast.success("Variant updated");
      setEditingId(null);
      setEditData(null);
      loadVariants();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update variant");
    }
  };

  const handleDelete = async (variantId: string, hasChildren: boolean) => {
    const message = hasChildren
      ? "This variant has sub-variants. Delete this and all sub-variants?"
      : "Delete this variant?";

    if (!confirm(message)) return;

    try {
      await apiClient.delete(`/admin/products/${productId}/variants`, {
        params: { id: variantId, cascade: hasChildren },
      });
      toast.success("Variant deleted");
      loadVariants();
    } catch {
      toast.error("Failed to delete variant");
    }
  };

  if (isLoading) return <div>Loading variants...</div>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Product Variants</h2>
        <Button
          onClick={handleAddRootVariant}
          size="sm"
          leftIcon={<Plus className="h-4 w-4" />}
          disabled={!!newVariant}
        >
          Add Root Variant
        </Button>
      </div>

      {/* New variant form */}
      {newVariant && (
        <VariantFormCard
          title={newVariantParentId ? "New Sub-Variant" : "New Root Variant"}
          data={newVariant}
          onChange={setNewVariant}
          onSave={handleSaveNew}
          onCancel={() => {
            setNewVariant(null);
            setNewVariantParentId(null);
            setNewVariantParentKeys([]);
          }}
          saveLabel="Create"
          knownAttributeKeys={knownAttributeKeys}
          disabledAttributeKeys={newVariantParentKeys}
          highlight
        />
      )}

      {/* Variant tree */}
      <div className="space-y-2">
        {variantTree.length === 0 && !newVariant && (
          <p className="text-sm text-muted-foreground italic">
            No variants created for this product yet.
          </p>
        )}

        {variantTree.map((variant) => (
          <VariantRowComponent
            key={variant._id}
            variant={variant}
            allVariants={allVariants}
            knownAttributeKeys={knownAttributeKeys}
            parentAttributeKeys={[]}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAddChild={handleAddChildVariant}
            editingId={editingId}
            editData={editData}
            onEditChange={setEditData}
            onSaveEdit={handleSaveEdit}
            onCancelEdit={() => {
              setEditingId(null);
              setEditData(null);
            }}
          />
        ))}
      </div>
    </div>
  );
};
