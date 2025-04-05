
import { userDepartmentCompanySelection, refreshObjType, refreshWSObjType } from '@/types';
import { atom } from 'jotai'

export const userDepartmentCompanySelectionGlobal = atom<userDepartmentCompanySelection | null>(null);
export const refreshObjGlobal = atom<refreshObjType>({});
export const refreshWSObjGlobal = atom<refreshWSObjType>({});


