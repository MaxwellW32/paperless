import fs from "fs/promises";
import { defaultImagesDirectory } from "@/types/defaultImagesTypes";
import { NextResponse } from "next/server";

export async function GET() {
    const files = await fs.readdir(defaultImagesDirectory);
    return NextResponse.json(files)
}