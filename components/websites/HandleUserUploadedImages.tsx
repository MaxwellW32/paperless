"use client"
import { website } from '@/types'
import React, { useState } from 'react'
import ShowMore from '@/components/showMore/ShowMore'
import styles from "./style.module.css"
import Image from 'next/image'
import { toast } from 'react-hot-toast'
import { getSpecificWebsite, updateTheWebsite } from '@/serverFunctions/handleWebsites'
import { maxImageUploadSize, maxBodyToServerSize, uploadedUserImagesStarterUrl } from '@/types/userUploadedTypes'
import { convertBtyes } from '@/usefulFunctions/usefulFunctions'

export default function HandleUserUploadedImages({ seenWebsite, seenProjectSet }: { seenWebsite: website, seenProjectSet: React.Dispatch<React.SetStateAction<website>> }) {
    const [uploadedImages, uploadedImagesSet] = useState<FormData | null>(null)

    return (
        <ShowMore label='Project Images' content={(
            <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem" }}>
                <button className='mainButton'>
                    <label htmlFor='fileUpload' style={{ cursor: "pointer" }}>
                        upload
                    </label>
                </button>

                <input id='fileUpload' type="file" placeholder='Upload images' multiple={true} accept="image/*" style={{ display: "none" }}
                    onChange={(e) => {
                        if (!e.target.files) return

                        let totalUploadSize = 0
                        const uploadedFiles = e.target.files
                        const formData = new FormData();

                        for (let index = 0; index < uploadedFiles.length; index++) {
                            const file = uploadedFiles[index];

                            // Check if file is an image (this will be redundant because of the 'accept' attribute, but can be good for double-checking)
                            if (!file.type.startsWith("image/")) {
                                toast.error(`File ${file.name} is not an image.`);
                                continue;
                            }

                            // Check the file size
                            if (file.size > maxImageUploadSize) {
                                toast.error(`File ${file.name} is too large. Maximum size is ${convertBtyes(maxImageUploadSize, "mb")} MB`);
                                continue;
                            }

                            //add file size to totalUploadSize
                            totalUploadSize += file.size

                            formData.append(`file${index}`, file);
                        }

                        if (totalUploadSize > maxBodyToServerSize) {
                            toast.error(`Please upload less than ${convertBtyes(maxBodyToServerSize, "mb")} MB at a time`);
                            return
                        }

                        uploadedImagesSet(formData)
                    }}
                />

                {uploadedImages !== null && (
                    <button className='mainButton'
                        onClick={async () => {
                            try {
                                const response = await fetch(`/api/userImages/add`, {
                                    method: 'POST',
                                    body: uploadedImages,
                                })

                                //array of image names
                                const seenData = await response.json();

                                //get the latest project images and upload project
                                const latestProject = await getSpecificWebsite({ option: "id", data: { id: seenWebsite.id } })
                                if (latestProject === undefined) {
                                    throw new Error("trouble updating, not seeing latest project")
                                }

                                let latestImagesSeen: website["userUploadedImages"] = latestProject.userUploadedImages

                                if (latestImagesSeen === null) {
                                    latestImagesSeen = [...seenData.imageNames]
                                } else {
                                    latestImagesSeen = [...latestImagesSeen, ...seenData.imageNames]
                                }

                                //update the server
                                await updateTheWebsite(seenWebsite.id, {
                                    userUploadedImages: latestImagesSeen
                                })

                                //update local
                                seenProjectSet(prevSeenProject => {
                                    const newSeenProject = { ...prevSeenProject }

                                    newSeenProject.userUploadedImages = latestImagesSeen

                                    return newSeenProject
                                })

                                toast.success("images uploaded")

                                uploadedImagesSet(null)

                            } catch (error) {
                                toast.error("Error adding image")
                                console.error('Error adding image:', error);
                            }
                        }}
                    >Add</button>
                )}

                {seenWebsite.userUploadedImages !== null && (
                    <div className={styles.imagesCont}>
                        {seenWebsite.userUploadedImages.map(eachImage => {
                            return (
                                <div key={eachImage} className={styles.imageCont}
                                    onClick={() => {
                                        navigator.clipboard.writeText(`${uploadedUserImagesStarterUrl}${eachImage}`);
                                        toast.success("image url copied")
                                    }}
                                >
                                    <Image alt='gallery image' src={`${uploadedUserImagesStarterUrl}${eachImage}`} width={300} height={300} style={{ objectFit: "contain", width: "100%", height: "100%" }} />
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        )}
        />
    )
}
