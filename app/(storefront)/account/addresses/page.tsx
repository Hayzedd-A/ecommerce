"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { MapPin, Plus, Trash2, Edit2 } from "lucide-react";
import { toast } from "react-hot-toast";

// Mock data for now, since API route is not fully defined
const initialAddresses = [
  {
    _id: "1",
    fullName: "John Doe",
    street: "123 Main St",
    city: "Lagos",
    state: "Lagos",
    phone: "08012345678",
    isDefault: true,
  }
];

export default function AddressesPage() {
  const [addresses, setAddresses] = useState(initialAddresses);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Addresses</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your shipping addresses
          </p>
        </div>
        <Button variant="primary" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add New
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-xl">
          <div className="h-16 w-16 bg-surface-secondary rounded-full flex items-center justify-center mx-auto mb-4 text-muted">
            <MapPin className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-bold text-foreground">No addresses saved</h2>
          <p className="text-muted-foreground mt-1">
            Add an address for faster checkout.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <div key={address._id} className="border border-border rounded-xl p-4 relative">
              {address.isDefault && (
                <span className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-2 py-1 rounded">
                  Default
                </span>
              )}
              <h3 className="font-bold text-foreground">{address.fullName}</h3>
              <p className="text-sm text-muted-foreground mt-2">{address.street}</p>
              <p className="text-sm text-muted-foreground">{address.city}, {address.state}</p>
              <p className="text-sm text-muted-foreground mt-2 font-medium">{address.phone}</p>
              
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border">
                <button className="text-sm font-medium text-foreground hover:text-primary-600 flex items-center gap-1">
                  <Edit2 className="h-4 w-4" />
                  Edit
                </button>
                <button className="text-sm font-medium text-error-600 hover:text-error-700 flex items-center gap-1">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
