import path from "path";
import fs from "fs/promises";
import { userUploadedImagesDirectory } from "@/types/userUploadedTypes";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    //get imageName
    const imageName = searchParams.get("imageName");
    if (!imageName) throw new Error("imageName not sent");

    const imagePath = path.join(userUploadedImagesDirectory, imageName)

    // Read the image file
    const imageBuffer = await fs.readFile(imagePath);

    // Set the appropriate Content-Type header based on file extension
    const ext = path.extname(imagePath).toLowerCase();
    let contentType = 'application/octet-stream'; // Default content type

    if (ext === '.jpg' || ext === '.jpeg') {
        contentType = 'image/jpeg';
    } else if (ext === '.png') {
        contentType = 'image/png';
    } else if (ext === '.gif') {
        contentType = 'image/gif';
    }

    // Return the image file in the response
    return new Response(imageBuffer, {
        status: 200,
        headers: {
            'Content-Type': contentType,
            'Content-Length': imageBuffer.length.toString(),
        },
    });
}


