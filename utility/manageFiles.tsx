import fs from "fs/promises";

export async function ensureDirectoryExists(dirPath: string) {
    await fs.mkdir(dirPath, { recursive: true });
}

export async function checkIfDirectoryExists(dirPath: string) {
    try {
        // Check if the directory exists by attempting to read it
        await fs.access(dirPath);

        return true

    } catch (err) {
        // If an error occurs (e.g., directory does not exist), create the directory
        //@ts-expect-error ts not seeing type
        if (err.code === 'ENOENT') {
            return false

        } else {
            console.error('Error checking directory:', err);
            throw new Error("error reading dir")
        }
    }
}