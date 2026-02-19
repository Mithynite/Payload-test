import { create } from 'zustand'

/*interface ContactState {
  fullname: string
  email: string
  phoneNumber: string
  comment: string
  file: File | null
  setField: (field: string, value: any) => void
  resetForm: () => void
}*/

interface ContactState {
  fields: Record<string,any>,
  initializeFields:(fields: Record<string,any>) => void,
  setField: (field: string, value: any) => void,
  resetForm: () => void
}

export const useContactStore = create<ContactState>((set) => ({
  fields: {},
  initializeFields:(incomingFields) => set({
    fields:incomingFields,
  }),
  setField: (field, value) => 
    set((state) => ({ 
      fields:{
        ...state, 
        [field]: value 
      }
    })),
  resetForm: () =>
    set({
      fields:{}
    }),
}))
