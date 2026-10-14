import { NextRequest, NextResponse } from "next/server";
import { publicApiGate } from "@/lib/public-gate";
import { getResumePdfFile } from "@/lib/site-content";
import { Readable } from "stream";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const closed = await publicApiGate("The resume");
  if (closed) return closed;

  try {
    const pdf = await getResumePdfFile();

    if (!pdf || !pdf.stream) {
      return NextResponse.json(
        { error: "Resume PDF not found or not configured." },
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
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[ResumeDownloadAPI] Error serving resume PDF:", msg);
    return NextResponse.json(
      { error: "Failed to download resume PDF." },
      { status: 500 }
    );
  }
}
