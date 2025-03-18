import path from "path";

export const maxImageUploadSize = 5 * 1024 * 1024; // 5 MB limit
export const maxBodyToServerSize = 100 * 1024 * 1024  //100 MB limit
export const uploadedUserImagesStarterUrl = `https://squaremaxtech.com/api/userImages/view?imageName=`

export const userUploadedImagesDirectory = path.join(process.cwd(), "userUploadedData", "images")

//https://squaremaxtech.com/api/userImages/view?imageName=5fffe53c-8fdf-4b1d-adc7-ebbb438749e3.png