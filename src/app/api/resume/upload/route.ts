import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/auth";
import { removeResumePdfFile } from "@/lib/site-content";
import { storeUploadedResume } from "@/lib/resume-upload";

export const dynamic = "force-dynamic";

/** Upload a resume PDF. Same validation and storage as the admin server action. */
export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized. Administrator session required." }, { status: 401 });
  }
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }
  const result = await storeUploadedResume(formData.get("file"));
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({
    success: true,
    message: "Resume PDF uploaded and activated successfully.",
    pdf: { ...result, updatedAt: new Date().toISOString() },
  });
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

    revalidatePath("/", "layout");

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
