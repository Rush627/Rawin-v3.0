import { NextRequest, NextResponse } from "next/server";
import { getResumePdfFile } from "@/lib/site-content";
import { Readable } from "stream";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ fileId: string }> }
) {
  const { fileId } = await context.params;

  if (!fileId || !ObjectId.isValid(fileId)) {
    return NextResponse.json({ error: "Invalid resume file ID" }, { status: 400 });
  }

  try {
    const pdf = await getResumePdfFile(fileId);

    if (!pdf || !pdf.stream) {
      return NextResponse.json(
        { error: "Resume PDF not found." },
        { status: 404 }
      );
    }

    const filename = pdf.filename || "Rushan-Siddiqui-Resume.pdf";
    const webStream = Readable.toWeb(pdf.stream) as ReadableStream;

    return new Response(webStream, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdf.size),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[ResumeDownloadAPI] Error serving versioned resume PDF (${fileId}):`, msg);
    return NextResponse.json(
      { error: "Failed to download resume PDF." },
      { status: 500 }
    );
  }
}
