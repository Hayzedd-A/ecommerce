import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import StoreSettings from "@/lib/db/models/StoreSettings";

export async function GET() {
  try {
    await dbConnect();
    const settings = await StoreSettings.getSettings();

    return NextResponse.json({ success: true, data: settings });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Fetch store settings error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load store settings",
        error: message,
      },
      { status: 500 }
    );
  }
}
