import { company, newEquipmentT } from "@/types";

export function getEquipmentData(companyId: company["id"], equipmentLocationOffsite?: boolean): newEquipmentT {
    return {
        companyId: companyId,
        quantity: 0,
        makeModel: "",
        serialNumber: "",
        additionalNotes: "",
        powerSupplyCount: 0,
        rackUnits: 0,
        equipmentLocation: ((equipmentLocationOffsite === undefined) || equipmentLocationOffsite) ? "off-site" : "on-site",
        amps: null,
        weight: null,
    }
}