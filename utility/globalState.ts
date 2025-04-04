
import { userDepartmentCompanySelection, refreshObjType } from '@/types';
import { atom } from 'jotai'

export const userDepartmentCompanySelectionGlobal = atom<userDepartmentCompanySelection | null>(null);
export const refreshObjGlobal = atom<refreshObjType>({});


