import { EditingContentType } from "@/types";
import { useRef } from "react";

export default function useEditingContent(timeout = 10000) {
    const editingContent = useRef<EditingContentType>({
        website: false,
        pages: false,
        usedComponents: false,
    });

    const timeouts = useRef<{ [key in keyof EditingContentType]?: NodeJS.Timeout }>({});

    const setEditing = (key: keyof EditingContentType) => {
        editingContent.current[key] = true;

        // Clear the previous timeout if the function is called again within 10 seconds
        if (timeouts.current[key]) {
            clearTimeout(timeouts.current[key]);
        }

        // Set a new timeout to reset the value back to false after 10 seconds
        timeouts.current[key] = setTimeout(() => {
            editingContent.current[key] = false;
        }, timeout);
    };

    return { editingContent, setEditing };
}
