import { getGithubRepos, pushToGithubRepo, searchGithubReposByName } from '@/serverFunctions/handleGithub'
import { githubRepo, githubTokenType, requestDownloadWebsiteBodySchema, requestDownloadWebsiteBodyType, website } from '@/types'
import { consoleAndToastError } from '@/usefulFunctions/consoleErrorWithToast'
import React, { HTMLAttributes, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import AddEditGithub from '../users/addEditGithub/AddEditGithub'
import { deleteUserGithubTokens, getUser } from '@/serverFunctions/handleUser'
import { Session } from 'next-auth'
import ShowMore from '../showMore/ShowMore'
import ConfirmationBox from '../confirmationBox/ConfirmationBox'
import Moment from 'react-moment'
import AddGithubRepository from '../users/addEditGithub/AddGithubRepository'
import TextInput from '../textInput/TextInput'

export default function DownloadOptions({ seenSession, seenWebsite, seenGithubTokens, viewingDownloadOptionsSet, ...elProps }: {
    seenSession: Session, seenWebsite: website, seenGithubTokens: githubTokenType[], viewingDownloadOptionsSet?: React.Dispatch<React.SetStateAction<boolean>>
} & HTMLAttributes<HTMLDivElement>) {
    const [githubTokens, githubTokensSet] = useState<githubTokenType[]>(seenGithubTokens)
    const [downloadOption, downloadOptionSet] = useState<"zip" | "github">(githubTokens.length > 0 ? "github" : "zip")

    const activeGithubToken = githubTokens.find(eachGithubToken => eachGithubToken.active)

    const [repositories, repositoriesSet] = useState<githubRepo[]>([])
    const [search, searchSet] = useState("")

    const filteredRepositories = useMemo(() => {
        if (search === "") return repositories

        return repositories.filter(eachRepository => eachRepository.name.toLowerCase().includes(search.toLowerCase()))
    }, [repositories, search])

    async function handleWebsiteDownload(data: { option: "zip" } | { option: "github", data: { token: githubTokenType, websiteId: website["id"], repoName: string } }) {
        try {
            //build site
            toast.success("building site")
            const newrequestDownloadWebsiteBody: requestDownloadWebsiteBodyType = {
                websiteId: seenWebsite.id,
                downloadOption: data.option
            }

            //validation
            requestDownloadWebsiteBodySchema.parse(newrequestDownloadWebsiteBody)

            const response = await fetch(`/api/downloadWebsite`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newrequestDownloadWebsiteBody),
            })
            toast.success("site built!")

            if (data.option === "zip") {
                //download action
                const responseBlob = await response.blob()
                const url = window.URL.createObjectURL(responseBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${seenWebsite.name}.zip`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);

            } else if (data.option === "github") {
                //upload to github with selection

                toast.success("commencing upload")
                await pushToGithubRepo(data.data.token, seenWebsite.id, data.data.repoName)
                toast.success("pushed changes to github repo!")
            }


        } catch (error) {
            consoleAndToastError(error)
        }
    }

    //get repositories each time the github token changes
    useEffect(() => {
        handleRepoSearch()
    }, [activeGithubToken])

    async function handleRepoSearch() {
        if (activeGithubToken === undefined) return

        const seenRepositories = await getGithubRepos(activeGithubToken.token)
        repositoriesSet(seenRepositories)
    }

    async function handleGetGithubTokens() {
        try {
            const seenUser = await getUser({ id: seenSession.user.id })
            if (seenUser === undefined) throw new Error("not seeing user")

            githubTokensSet(seenUser.userGithubTokens)

        } catch (error) {
            consoleAndToastError(error)
        }
    }


    return (
        <div {...elProps} style={{ display: "grid", alignContent: "flex-start", position: "fixed", top: "50%", left: "50%", translate: "-50% -50%", width: "min(500px, 95vw)", height: "80vh", backgroundColor: "rgb(var(--shade2))", zIndex: 10, overflowY: "auto", border: "1px solid rgb(var(--shade1))", ...elProps?.style }}>
            {/* download option selection */}
            <div style={{ display: "flex", overflowX: "auto" }}>
                <button className='mainButton' style={{ backgroundColor: downloadOption === "github" ? "rgb(var(--color1))" : "" }}
                    onClick={() => {
                        downloadOptionSet("github")
                    }}>github</button>

                <button className='mainButton' style={{ backgroundColor: downloadOption === "zip" ? "rgb(var(--color1))" : "" }}
                    onClick={() => {
                        downloadOptionSet("zip")
                    }}>zip</button>

                <button className='secondaryButton' style={{ marginLeft: "auto" }}
                    onClick={() => {
                        if (viewingDownloadOptionsSet !== undefined) {
                            viewingDownloadOptionsSet(false)
                        }
                    }}>close</button>
            </div>


            {/* display area for each download option */}
            <div style={{ display: "grid", alignContent: "flex-start", overflowY: "auto" }}>
                {downloadOption === "zip" && (
                    <div style={{ display: "grid", alignContent: "flex-start", padding: "1rem" }}>
                        <h2>Download your website as a zip file</h2>

                        <button className='mainButton'
                            onClick={() => {
                                handleWebsiteDownload({ option: "zip" })
                            }}
                        >Download</button>
                    </div>
                )}

                {downloadOption === "github" && (
                    <div style={{ display: "grid", alignContent: "flex-start", overflowY: "auto", }}>
                        {/* account selection */}
                        <div style={{ display: "grid", alignContent: "flex-start", gap: "1rem", padding: "1rem", border: "1px solid rgb(var(--shade1))" }}>
                            {activeGithubToken === undefined ? (
                                <>
                                    {githubTokens.map(eachGithubToken => {
                                        return (
                                            <div key={eachGithubToken.id}>
                                                <button className='mainButton'
                                                    onClick={() => {
                                                        githubTokensSet((prevGithubTokens => {
                                                            // set active on all to false
                                                            const newGithubTokens = prevGithubTokens.map(eachPrevGithubToken => {
                                                                eachPrevGithubToken.active = eachPrevGithubToken.id === eachGithubToken.id

                                                                return eachPrevGithubToken
                                                            })

                                                            return newGithubTokens
                                                        }))
                                                    }}
                                                >{eachGithubToken.username}</button>

                                                <ShowMore label='edit'
                                                    content={
                                                        <AddEditGithub sentGithubToken={eachGithubToken}
                                                            functionSubmit={() => {
                                                                //get latest 
                                                                handleGetGithubTokens()
                                                            }}
                                                        />
                                                    }
                                                />

                                                <ConfirmationBox text='' confirmationText='are you sure you want to delete this github token?' successMessage='token deleted!'
                                                    icon={
                                                        <svg style={{ fill: "rgb(var(--shade2))" }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z" /></svg>
                                                    }
                                                    runAction={async () => {
                                                        const seenLatestTokens = await deleteUserGithubTokens(seenSession.user.id, eachGithubToken)

                                                        githubTokensSet(seenLatestTokens)
                                                    }}
                                                />
                                            </div>
                                        )
                                    })}

                                    <ShowMore label='add github token'
                                        content={
                                            <AddEditGithub
                                                functionSubmit={() => {
                                                    //get latest 
                                                    handleGetGithubTokens()
                                                }}
                                            />
                                        }
                                    />
                                </>
                            ) : (
                                <>
                                    <label style={{ cursor: "pointer" }}
                                        onClick={() => {
                                            githubTokensSet((prevGithubTokens => {
                                                // set active on all to false
                                                const newGithubTokens = prevGithubTokens.map(eachPrevGithubToken => {
                                                    eachPrevGithubToken.active = false

                                                    return eachPrevGithubToken
                                                })

                                                return newGithubTokens
                                            }))
                                        }}
                                    >{activeGithubToken.username}</label>
                                </>
                            )}
                        </div>

                        {activeGithubToken !== undefined && (
                            <>
                                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                    <TextInput style={{ flex: "1" }}
                                        name={"search"}
                                        value={search}
                                        placeHolder={"Filter repository name"}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                            searchSet(e.target.value)
                                        }}
                                    />

                                    <button className='secondaryButton'
                                        onClick={handleRepoSearch}
                                    >refresh</button>
                                </div>

                                {search !== "" && (
                                    <>
                                        <button className='mainButton' style={{ justifySelf: "flex-end" }}
                                            onClick={async () => {
                                                toast.success("searching")
                                                const serverRepos = await searchGithubReposByName(activeGithubToken, search)

                                                repositoriesSet(prevLocalRepos => {
                                                    const localRepoIds = new Set(prevLocalRepos.map(repo => repo.id));
                                                    const uniqueNewRepos = serverRepos.filter(repo => !localRepoIds.has(repo.id));

                                                    if (uniqueNewRepos.length > 0) {
                                                        toast.success("searched")
                                                    }

                                                    const newArray: githubRepo[] = [...prevLocalRepos, ...uniqueNewRepos];
                                                    return newArray
                                                })
                                            }}
                                        >search on github
                                        </button>
                                    </>
                                )}

                                <ShowMore label='add github repo'
                                    content={(
                                        <AddGithubRepository seenGithubToken={activeGithubToken}
                                            functionSubmit={handleRepoSearch}
                                        />
                                    )}
                                />

                                {filteredRepositories.map(eachFilteredRepository => {
                                    return (
                                        <div key={eachFilteredRepository.id} style={{ padding: "1rem", display: "flex", alignItems: "center", gap: "1rem", overflowX: "auto", borderTop: "1px solid rgb(var(--shade1))", }}>
                                            <label>{eachFilteredRepository.name}</label>

                                            <p style={{ flex: 1 }}><Moment fromNow>{eachFilteredRepository.updated_at}</Moment></p>

                                            <ConfirmationBox text='' confirmationText='are you sure you want to upload to this repo?' successMessage='uploading!' float={true}
                                                icon={
                                                    <svg style={{ fill: "rgb(var(--shade2))" }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M498.1 5.6c10.1 7 15.4 19.1 13.5 31.2l-64 416c-1.5 9.7-7.4 18.2-16 23s-18.9 5.4-28 1.6L284 427.7l-68.5 74.1c-8.9 9.7-22.9 12.9-35.2 8.1S160 493.2 160 480l0-83.6c0-4 1.5-7.8 4.2-10.8L331.8 202.8c5.8-6.3 5.6-16-.4-22s-15.7-6.4-22-.7L106 360.8 17.7 316.6C7.1 311.3 .3 300.7 0 288.9s5.9-22.8 16.1-28.7l448-256c10.7-6.1 23.9-5.5 34 1.4z" /></svg>
                                                }
                                                runAction={async () => {
                                                    if (activeGithubToken == undefined) return

                                                    //push to this repo
                                                    handleWebsiteDownload({ option: "github", data: { token: activeGithubToken, repoName: eachFilteredRepository.name, websiteId: seenWebsite.id } })
                                                }}
                                            />
                                        </div>
                                    )
                                })}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
