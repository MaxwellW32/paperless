import { toast } from "react-hot-toast";
import { ZodError } from 'zod';

export function consoleAndToastError(error: unknown, userErrorText?: string): void {
    let seenAsZod = false

    //check if zod error
    try {
        JSON.parse(`${error}`)
        seenAsZod = true

    } catch (error) {
    }

    if (seenAsZod) {
        // Handle ZodError
        const seenErr = error as ZodError
        let combinedErrorStr = ""

        seenErr.issues.forEach((err) => {
            combinedErrorStr += `${err.message}\n`
        });

        console.log(`$Error"`, error);
        toast.error(userErrorText === undefined ? combinedErrorStr : userErrorText)
    } else {
        // Handle standard JavaScript Error
        const seenErr = error as Error

        console.error("$Error", error);
        toast.error(userErrorText === undefined ? seenErr.message : userErrorText)
    }
}