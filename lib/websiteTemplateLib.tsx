import path from "path"

// hold all template designs made for websites
export const websiteTemplatesDir = "websiteTemplates"

//the file that allows dynamic builds
export const globalTemplatesFilePath = path.join("utility", "globalTemplates.tsx")

//where to write clients files for building and download
export const websiteBuildsStagingAreaDir = "websiteBuildsStagingArea"

//where the base files are to use building each site
export const websiteBuildsStarterDir = "websiteBuildsStarter"
