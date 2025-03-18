import { auth } from "@/auth/auth"

export async function sessionCheckWithError() {
    const session = await auth()

    if (session === null) {
        throw new Error("no session seen")

    } else {
        return session
    }
}

// export async function ensureUserCanAccessWebsite(authorId: string, authorisedList: authorisedUserType[], checkForEditRights?: boolean) {
//     const session = await sessionCheckWithError()

//     const authorisedInList = authorisedList.find(eachAuthedUser => eachAuthedUser.userId === session.user.id)

//     const hasEditRights = authorisedInList !== undefined ? authorisedInList.accessLevel === "edit" : false

//     //if not an admin and not the author of the website and not in authorised list deny access
//     if (session.user.role !== "admin" && (session.user.id !== authorId && authorisedInList === undefined)) {
//         throw new Error("not authorised to view")

//     } else if (session.user.role !== "admin" && authorisedInList !== undefined && (checkForEditRights && !hasEditRights)) {
//         throw new Error("not authorised to edit")
//     }

//     return session
// }