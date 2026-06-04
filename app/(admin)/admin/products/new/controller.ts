import apiClient from "@/lib/api/client";

export interface SpecEntry {
  key: string;
  value: string;
}

export interface ProductFormValues {
  name: string;
  sku: string;
  category: string;
  shortDescription: string;
  description: string;
  price: number | "";
  discountPrice: number | "";
  stock: number | "";
  lowStockThreshold: number | "";
  trackStock: boolean;
  allowNegativeStock: boolean;
  status: "draft" | "active" | "archived";
  tags: string;
  isFeatured: boolean;
  isSponsored: boolean;
  specifications: SpecEntry[];
  weight: number | "";
  dimensionLength: number | "";
  dimensionWidth: number | "";
  dimensionHeight: number | "";
  dimensionUnit: "cm" | "in";
  metaTitle: string;
  metaDescription: string;
}

export const DEFAULTS: ProductFormValues = {
  name: "",
  sku: "",
  category: "",
  shortDescription: "",
  description: "",
  price: "",
  discountPrice: "",
  stock: 0,
  lowStockThreshold: 5,
  trackStock: true,
  allowNegativeStock: false,
  status: "draft",
  tags: "",
  isFeatured: false,
  isSponsored: false,
  specifications: [],
  weight: "",
  dimensionLength: "",
  dimensionWidth: "",
  dimensionHeight: "",
  dimensionUnit: "cm",
  metaTitle: "",
  metaDescription: "",
};

export const onSubmit = async (data: ProductFormValues, images: any[]) => {
  // Build specifications Map payload
  const specificationsPayload: Record<string, string> = {};
  data.specifications.forEach(({ key, value }) => {
    if (key.trim()) specificationsPayload[key.trim()] = value;
  });

  // Build dimensions only if at least one field is filled
  const hasDimensions =
    data.dimensionLength !== "" ||
    data.dimensionWidth !== "" ||
    data.dimensionHeight !== "";

  try {
    const sku = data.sku || (await generateSKU());
    await apiClient.post("/admin/products", {
      name: data.name,
      sku,
      category: data.category,
      shortDescription: data.shortDescription,
      description: data.description,
      price: Number(data.price),
      discountPrice:
        data.discountPrice === "" ? undefined : Number(data.discountPrice),
      stock: Number(data.stock),
      lowStockThreshold: Number(data.lowStockThreshold),
      trackStock: data.trackStock,
      allowNegativeStock: data.allowNegativeStock,
      status: data.status,
      isFeatured: data.isFeatured,
      isSponsored: data.isSponsored,
      tags: data.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      images,
      specifications:
        Object.keys(specificationsPayload).length > 0
          ? specificationsPayload
          : undefined,
      weight: data.weight === "" ? undefined : Number(data.weight),
      dimensions: hasDimensions
        ? {
            length:
              data.dimensionLength === ""
                ? undefined
                : Number(data.dimensionLength),
            width:
              data.dimensionWidth === ""
                ? undefined
                : Number(data.dimensionWidth),
            height:
              data.dimensionHeight === ""
                ? undefined
                : Number(data.dimensionHeight),
            unit: data.dimensionUnit,
          }
        : undefined,
      seoMeta:
        data.metaTitle || data.metaDescription
          ? {
              metaTitle: data.metaTitle || undefined,
              metaDescription: data.metaDescription || undefined,
            }
          : undefined,
    });
  } catch (error: any) {
    throw error;
  }
};

export const generateSKU = async () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const generateRandom = () => {
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }
    return result;
  };
  let result = generateRandom();
  let isFound = true;
  while (isFound) {
    const res = await apiClient.get(`/admin/products?sku=${result}`);
    const { data } = res.data;
    if (data.length > 0) {
      result = generateRandom();
    } else {
      isFound = false;
    }
  }
  return result;
};
