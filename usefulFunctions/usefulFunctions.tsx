import path from "path"

export function convertBtyes(bytes: number, option: "kb" | "mb" | "gb") {
    if (option === "kb") {
        return bytes / 1024
    } else if (option === "mb") {
        return (bytes / 1024) / 1024
    } else {
        return ((bytes / 1024) / 1024) / 1024
    }
}

export function replaceBaseFolderNameInPath(stringToReplaceWith: string, filePath: string) {
    const splitArr = filePath.split(/[\/\\]/)
    splitArr[0] = stringToReplaceWith
    const finalPath = splitArr.join("/")

    return finalPath
}

export function getPathBaseName(filePath: string) {
    return path.basename(filePath)
}

export function normalizeFilePathToForwardSlashes(filePath: string) {
    return filePath.replace(/\\/g, '/');
}

export function ensureIdDoesNotStartWithNumber(id: string) {
    if (/^\d/.test(id)) {
        return "SAFE" + id;
    }
    return id;
}
