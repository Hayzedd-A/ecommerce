import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Coupon from "@/lib/db/models/Coupon";
import Order from "@/lib/db/models/Order";
import { requireAdmin } from "@/lib/auth/requireAdmin";
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await requireAdmin(req);
        await dbConnect();
        const { id } = await params;
        console.log("Updating coupon with ID:", id);
        const body = await req.json();
        const update: any = {};
        if (body.code) update.code = body.code.toString().trim().toUpperCase();
        if (body.type) update.type = body.type;
        if (body.value != null) update.value = Number(body.value);
        if (body.minPurchase != null) update.minPurchase = Number(body.minPurchase);
        if (body.maxUses != null) update.maxUses = Number(body.maxUses);
        if (body.expiresAt) update.expiresAt = new Date(body.expiresAt);
        if (body.startsAt) update.startsAt = new Date(body.startsAt);
        if (body.isActive != null) update.isActive = !!body.isActive;
        const updated = await Coupon.findByIdAndUpdate(id, update, { new: true });
        if (!updated) return NextResponse.json({ success: false, message: "Coupon not found" }, { status: 404 });
        return NextResponse.json({ success: true, data: updated });
    } catch (error: any) {
        console.error("Admin coupon update error:", error);
        return NextResponse.json({ success: false, message: error.message || "Server error" }, { status: 500 });
    }
}
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await requireAdmin(req);
        await dbConnect();
        const { id } = params;
        const coupon = await Coupon.findById(id);
        if (!coupon) return NextResponse.json({ success: false, message: "Coupon not found" }, { status: 404 });
        if ((coupon.usedCount || 0) > 0) {
            return NextResponse.json({ success: false, message: "Cannot delete coupon with existing uses" }, { status: 400 });
        }
        await coupon.remove();
        return NextResponse.json({ success: true, message: "Coupon deleted" });
    } catch (error: any) {
        console.error("Admin coupon delete error:", error);
        return NextResponse.json({ success: false, message: error.message || "Server error" }, { status: 500 });
    }
}
