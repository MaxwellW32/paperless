
import { departmentCompanySelection, refreshObjType } from '@/types';
import { atom } from 'jotai'

export const departmentCompanySelectionGlobal = atom<departmentCompanySelection | null>(null);
export const refreshObjGlobal = atom<refreshObjType>({});


