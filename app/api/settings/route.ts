import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import getStoreSettings from "@/lib/settings.server";

export async function GET() {
  try {
    await dbConnect();
    const settings = await getStoreSettings();

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
