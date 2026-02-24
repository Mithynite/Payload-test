import { create } from 'zustand'

/*interface ContactState {
  fullname: string
  email: string
  phoneNumber: string
  comment: string
  file: File | null
  consent: boolean
  setField: (field: string, value: any) => void
  resetForm: () => void
}*/

// TODO přidat dynamicky další fieldy, defaultně tu byly fullname, email atd. ale je třeba sem dát jen
// 
interface ContactState {
  fields: Record<string, any>,
  //file: File | null,
  //consent: boolean,
  initializeFields:(fields: Record<string,any>) => void,
  setField: (field: string, value: any) => void,
  //setFileField:(field:string, value:any) => void,
  resetForm: () => void,
}

export const useContactStore = create<ContactState>((set) => ({
  fields: {},
  //file: null,
  initializeFields:(incomingFields) => set({
    fields:incomingFields,
  }),
  setField: (field, value) => set((state) => ({ ...state, 
    fields:{
      ...state, 
      [field]: value
    }
  })),
  //setFileField:(field, value) => set((state) => ({...state, [field]:value})),
  resetForm:() =>
    set({
      fields:{},
      //file: null,
    }),
}))
