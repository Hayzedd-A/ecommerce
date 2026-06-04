import { Payment } from "@/lib/db/models";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const reference = searchParams.get("reference");
    if (reference) {
      const payment = await Payment.findOne({ reference });
      if (!payment) {
        return NextResponse.json(
          { success: false, message: "Payment not found" },
          { status: 404 },
        );
      }
      return NextResponse.json({ success: true, payment });
    } else {
      const limit = searchParams.get("limit") || "10";
      const page = searchParams.get("page") || "1";
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const payments = await Payment.find().skip(skip).limit(parseInt(limit));
      return NextResponse.json({ success: true, payments });
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Error fetching payments" },
      { status: 500 },
    );
  }
}
