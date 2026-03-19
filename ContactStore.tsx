import { create } from 'zustand'

interface ContactState {
  fields: Record<string, {value:any, required:boolean}>,
  initializeFields:(fields: Record<string, {value:any, required:boolean}>) => void,
  setField: (field: string, value: any, required: boolean) => void,
  resetForm: () => void,
}

export const useContactStore = create<ContactState>((set) => ({
  fields: {},
  initializeFields:(incomingFields) => set({
    fields:incomingFields,
  }),
  setField: (field, value, required) => set((state) => ({ //...state, 
    fields:{
      ...state.fields, 
      [field]: {value:value, required:required}
    }
  })),
  resetForm:() =>
    set({
      fields:{},
    }),
}))
