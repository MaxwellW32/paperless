
import { userDepartmentCompanySelection, refreshObjType, refreshWSObjType, resourceAuthType } from '@/types';
import { atom } from 'jotai'

export const userDepartmentCompanySelectionGlobal = atom<userDepartmentCompanySelection | null>(null);
export const refreshObjGlobal = atom<refreshObjType>({});
export const refreshWSObjGlobal = atom<refreshWSObjType>({});
export const resourceAuthGlobal = atom<resourceAuthType | undefined>(undefined);



