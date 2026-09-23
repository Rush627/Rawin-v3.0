import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/auth";
import { storeResumePdfFile, removeResumePdfFile } from "@/lib/site-content";

export const dynamic = "force-dynamic";

const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Administrator session required." },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json(
        { error: "No PDF file provided." },
        { status: 400 }
      );
    }

    if (file.size > MAX_PDF_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File size exceeds the 10MB limit." },
        { status: 400 }
      );
    }

    const isPdfType =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdfType) {
      return NextResponse.json(
        { error: "Only PDF documents (.pdf) are allowed." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Magic bytes check (%PDF-)
    if (buffer.length < 5 || buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
      return NextResponse.json(
        { error: "Invalid PDF format. The file header does not match a valid PDF document." },
        { status: 400 }
      );
    }

    const result = await storeResumePdfFile(buffer, file.name, file.size);

    revalidatePath("/resume");
    revalidatePath("/saint-denis/content");

    return NextResponse.json({
      success: true,
      message: "Resume PDF uploaded and activated successfully.",
      pdf: {
        fileId: result.fileId,
        filename: result.filename,
        url: result.url,
        size: result.size,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (err: unknown) {
    console.error("[Resume PDF Upload API Error]:", err);
    const msg = err instanceof Error ? err.message : "Failed to upload resume PDF.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Administrator session required." },
        { status: 401 }
      );
    }

    await removeResumePdfFile();

    revalidatePath("/resume");
    revalidatePath("/saint-denis/content");

    return NextResponse.json({
      success: true,
      message: "Resume PDF removed successfully.",
    });
  } catch (err: unknown) {
    console.error("[Resume PDF Delete API Error]:", err);
    const msg = err instanceof Error ? err.message : "Failed to remove resume PDF.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
