/* Server-only helper to load store settings directly from the database.
   Use this from server components to avoid forcing client components to fetch. */

import dbConnect from "@/lib/db/connect";
import StoreSettings from "@/lib/db/models/StoreSettings";
import type { IStoreSettings } from "@/lib/types";
import { cache } from "react";

export const getStoreSettings = cache(async (): Promise<IStoreSettings> => {
  await dbConnect();
  let settings = await StoreSettings.findOne();
  if (!settings) {
    settings = await StoreSettings.create({
      storeName: "My Store",
      currency: "NGN",
      currencySymbol: "₦",
      deliveryZones: [],
    });
  }

  // Serialize mongoose document to plain JS object suitable for sending to client
  const plain = JSON.parse(JSON.stringify(settings));
  return plain as IStoreSettings;
});

export default getStoreSettings;
