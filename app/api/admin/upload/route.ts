import { NextRequest, NextResponse } from "next/server";
import { adminGuard } from "@/lib/auth/requireAdmin";
import { UploadService } from "@/lib/services/upload.service";

export async function GET(req: NextRequest) {
  try {
    const guard = await adminGuard(req);
    if (guard) return guard;

    const { searchParams } = new URL(req.url);
    const folder = searchParams.get("folder") || "products";

    const signatureData = UploadService.generateSignature(folder);

    return NextResponse.json({ success: true, data: signatureData });
  } catch (error: any) {
    console.error("Signature error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to generate signature" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const guard = await adminGuard(req);
    if (guard) return guard;

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "products";

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file uploaded" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await UploadService.uploadImageBuffer(buffer, folder);

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const guard = await adminGuard(req);
    if (guard) return guard;

    const { searchParams } = new URL(req.url);
    const publicId = searchParams.get("publicId");

    if (!publicId) {
      return NextResponse.json(
        { success: false, message: "Public ID required" },
        { status: 400 }
      );
    }

    const success = await UploadService.deleteImage(publicId);

    if (!success) {
      return NextResponse.json(
        { success: false, message: "Failed to delete image from Cloudinary" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Image deleted" });
  } catch (error: any) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Delete failed" },
      { status: 500 }
    );
  }
}
