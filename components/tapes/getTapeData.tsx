import { company, newTape } from "@/types";

export function getInitialTapeData(companyId: company["id"], tapeLocationClient?: boolean): newTape {
    return {
        mediaLabel: "",
        initial: "",
        companyId: companyId,
        tapeLocation: ((tapeLocationClient === undefined) || tapeLocationClient) ? "with-client" : "in-vault"
    }
}