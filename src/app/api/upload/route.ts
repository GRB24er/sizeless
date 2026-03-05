// ═══════════════════════════════════════════════════════════════
// src/app/api/upload/route.ts
// File Upload API — Saves base64 files to public/uploads/
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { auth } from "~/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { file, fileName, folder } = body;

    if (!file || !fileName) {
      return NextResponse.json(
        { error: "Missing file or fileName" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedExtensions = [
      ".pdf",
      ".jpg",
      ".jpeg",
      ".png",
      ".webp",
      ".doc",
      ".docx",
    ];
    const ext = path.extname(fileName).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return NextResponse.json(
        { error: "File type not allowed" },
        { status: 400 }
      );
    }

    // Create upload directory
    const subfolder = folder || "kyc";
    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      subfolder,
      session.user.id
    );
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const safeFileName = fileName
      .replace(/[^a-zA-Z0-9.-]/g, "_")
      .toLowerCase();
    const finalName = `${timestamp}-${safeFileName}`;
    const filePath = path.join(uploadDir, finalName);

    // Decode base64 and write
    const base64Data = file.replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // Max 10MB
    if (buffer.length > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum 10MB." },
        { status: 400 }
      );
    }

    await writeFile(filePath, buffer);

    // Return public URL path
    const publicUrl = `/uploads/${subfolder}/${session.user.id}/${finalName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: finalName,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
