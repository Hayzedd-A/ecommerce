import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import DeliveryLocation from "@/lib/db/models/DeliveryLocation";
import { adminGuard } from "@/lib/auth/requireAdmin";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const guard = await adminGuard(req);
    if (guard) return guard;

    const { id } = await params;
    const location = await DeliveryLocation.findById(id).lean();
    if (!location) {
      return NextResponse.json({ success: false, message: "Delivery location not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: location });
  } catch (error: any) {
    console.error("Admin delivery location get error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const guard = await adminGuard(req);
    if (guard) return guard;

    const { id } = await params;
    const body = await req.json();
    const update: any = {};
    if (body.name) update.name = body.name.trim();
    if (body.type) update.type = body.type;
    if (body.country) update.country = body.country.trim();
    if (body.state) update.state = body.state.trim();
    if (body.city) update.city = body.city.trim();
    if (body.address !== undefined) update.address = body.address?.trim();
    if (body.price != null) update.price = Number(body.price);
    if (body.estimatedDays !== undefined) update.estimatedDays = body.estimatedDays?.trim();
    if (body.isActive != null) update.isActive = !!body.isActive;

    const updated = await DeliveryLocation.findByIdAndUpdate(id, update, { new: true });
    if (!updated) {
      return NextResponse.json({ success: false, message: "Delivery location not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Admin delivery location update error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const guard = await adminGuard(req);
    if (guard) return guard;

    const { id } = await params;
    const deleted = await DeliveryLocation.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ success: false, message: "Delivery location not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Delivery location removed" });
  } catch (error: any) {
    console.error("Admin delivery location delete error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 },
    );
  }
}
