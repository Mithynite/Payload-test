'use client'
import Button from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import Dropbox from '../ui/dropbox'
import { Input } from '@/components/ui/input'
import { TextArea } from '../ui/textarea'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { SheetTitle } from '../ui/sheet'
import { useContactStore } from '@/lib/stores/contact-store'
import { Spinner } from "@/components/ui/spinner"
import { Form } from '@/payload-types'
import { $sendApplicationForm } from '@/lib/actions/application-actions'

interface ApplicationFormProps extends Omit<Form, "id" | "updatedAt" | "createdAt">{

}

function ApplicationForm(props:ApplicationFormProps) {
  // TODO zmapovat jako pole nebo tak, a pak přistupovat k hodnotám dle id
  const initialFields = props.fields ? props.fields : []

  const formFields = Object.fromEntries(
    initialFields.map(f => { 
      return [f.name, f.defaultValue ?? ""]
    })
  )

  const { fields, file, consent, setField, resetForm } =
  useContactStore()

  /*const { fullname, email, phoneNumber, comment, file, consent, setField, resetForm } =
    useContactStore()*/

  const [message, setMessage] = useState<string>('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | string[]>>({
    fullname: '',
    position: '',
    email: '',
    phone_number: '',
    comment: '',
    file: '',
    formError: '',
  })

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/[^\d+]/g, '')
    const hasPlus = cleaned.startsWith('+')
    const digits = hasPlus ? cleaned.slice(1) : cleaned

    const groups = digits.match(/.{1,3}/g)
    const formattedDigits = groups ? groups.join(' ') : ''

    return hasPlus ? `+${formattedDigits}` : formattedDigits
  }

  async function handleFormAction(formData: FormData) {
    setIsSubmitting(true)
    setFieldErrors({
      fullname: '',
      position: '',
      email: '',
      phone_number: '',
      comment: '',
      file: '',
      formError: '',
    })
    
    try {
      const result = await $sendApplicationForm({ formData })
      if (result.success) {
        resetForm()
        setMessage('Děkujeme za Váš zájem o pozici ve Wi. Ozveme se Vám co nejdříve.')
      } else {
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors)
        } else {
          setFieldErrors({
            ...fieldErrors,
            formError: 'Něco se pokazilo. Zkuste to prosím znovu.',
          })
        }
        setMessage('')
      }
    } catch (error) {
      setFieldErrors({
        ...fieldErrors,
        formError: 'Došlo k chybě. Zkuste to prosím znovu.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section
      id="application-form"
      className="mx-auto mt-[70px] mb-[50px] flex h-auto max-w-[1340px] scroll-mt-[80px] flex-col items-center gap-[24px] px-[30px] desktop:mt-[100px] desktop:mb-[100px] desktop:scroll-mt-[120px] desktop:gap-[42px]"
    >
      <SheetTitle>Máte zájem o pozici? Napište nám</SheetTitle>
      {message ? (
        <div className="mb-[53px] flex flex-col items-center">
          <h2 className="text-center text-[32px] uppercase desktop:text-[32px] desktop:tracking-[0.1em]">
            {message}
          </h2>
        </div>
      ) : (
        <form
          className="max-w-fit"
          action={async (formData) => {
            await handleFormAction(formData)
          }}
        >
          <div className="flex flex-col gap-[24px] desktop:gap-[42px]">
            {fields.length > 0 ? fields.map((field) => {
              return(
              <div>
                  <Input
                    value={fullname} // state value
                    onChange={(e) => setField('fullname', e.target.value)} // differs based on type (phone, text)
                    name="fullname" // just name
                    required //required
                    placeholder="jméno / příjmení" // use label
                    aria-invalid={!!fieldErrors.fullname} // error state
                  />
                  {fieldErrors.fullname && (
                    <div className="bg-destructive-foreground flex w-full flex-col gap-[2px] rounded-b-[4px] px-[4px] py-[6px] text-sm">
                      {!Array.isArray(fieldErrors.fullname) // error state
                        ? fieldErrors.fullname
                        : fieldErrors.fullname.map((error) => {
                            return (
                              <span
                                className="text-[12px] text-destructive desktop:text-[20px]"
                                key={error}
                              >
                                {error}
                              </span>
                            )
                          })}
                    </div>
                  )}
                </div>)
              }) : "Formulář neobsahuje žádná pole."}
            <div>
              <Input
                value={fullname}
                onChange={(e) => setField('fullname', e.target.value)}
                name="fullname"
                required
                placeholder="jméno / příjmení"
                aria-invalid={!!fieldErrors.fullname}
              />
              {fieldErrors.fullname && (
                <div className="bg-destructive-foreground flex w-full flex-col gap-[2px] rounded-b-[4px] px-[4px] py-[6px] text-sm">
                  {!Array.isArray(fieldErrors.fullname)
                    ? fieldErrors.fullname
                    : fieldErrors.fullname.map((error) => {
                        return (
                          <span
                            className="text-[12px] text-destructive desktop:text-[20px]"
                            key={error}
                          >
                            {error}
                          </span>
                        )
                      })}
                </div>
              )}
            </div>
            <div>
              <Input
                value={email}
                onChange={(e) => setField('email', e.target.value)}
                name="email"
                required
                placeholder="e-mail"
                aria-invalid={!!fieldErrors.email}
              />
              {fieldErrors.email && (
                <div className="bg-destructive-foreground flex w-full flex-col gap-[2px] rounded-b-[4px] px-[4px] py-[6px] text-sm">
                  {!Array.isArray(fieldErrors.email)
                    ? fieldErrors.email
                    : fieldErrors.email.map((error) => {
                        return (
                          <span
                            className="text-[12px] text-destructive desktop:text-[20px]"
                            key={error}
                          >
                            {error}
                          </span>
                        )
                      })}
                </div>
              )}
            </div>
            <div>
              <Input
                value={phoneNumber}
                onChange={(e) => setField('phoneNumber', formatPhoneNumber(e.target.value))}
                name="phonenumber"
                required
                placeholder="telefon"
                aria-invalid={!!fieldErrors.phonenumber}
              />
              {fieldErrors.phonenumber && (
                <div className="bg-destructive-foreground flex w-full flex-col gap-[2px] rounded-b-[4px] px-[4px] py-[6px] text-sm">
                  {!Array.isArray(fieldErrors.phonenumber)
                    ? fieldErrors.phonenumber
                    : fieldErrors.phonenumber.map((error) => {
                        return (
                          <span
                            className="text-[12px] text-destructive desktop:text-[20px]"
                            key={error}
                          >
                            {error}
                          </span>
                        )
                      })}
                </div>
              )}
            </div>
            <div className="desktop:col-span-2">
              <TextArea
                value={comment}
                onChange={(e) => setField('comment', e.target.value)}
                name="comment"
                placeholder="Komentář"
                required
                aria-invalid={!!fieldErrors.comment}
                className="max-h-[750px] min-h-[55px] desktop:max-h-[1000px] desktop:min-h-[100px]"
              />
              {fieldErrors.comment && (
                <div className="bg-destructive-foreground flex w-full flex-col gap-[2px] rounded-b-[4px] px-[4px] py-[6px] text-sm">
                  {!Array.isArray(fieldErrors.comment)
                    ? fieldErrors.comment
                    : fieldErrors.comment.map((error) => {
                        return (
                          <span
                            className="text-[12px] text-destructive desktop:text-[20px]"
                            key={error}
                          >
                            {error}
                          </span>
                        )
                      })}
                </div>
              )}
            </div>
            <div className="desktop:col-span-2">
              <Dropbox
                tabIndex={0}
                value={file}
                onFileChange={(f) => setField('file', f)}
                name="file"
                required
                placeholder={{
                  dropingPlaceholder: 'Pusťte soubor zde',
                  emptyPlaceholder: 'Přetáhněte nebo vyberte soubor',
                  emptyMobilePlaceholder: 'Vyberte soubor',
                }}
                aria-invalid={!!fieldErrors.file}
                className="aria-invalid:rounded-b-none"
              />
              {fieldErrors.file && (
                <div className="bg-destructive-foreground flex w-full flex-col gap-[2px] rounded-b-[4px] px-[4px] py-[6px] text-sm">
                  {!Array.isArray(fieldErrors.file)
                    ? fieldErrors.file
                    : fieldErrors.file.map((error) => {
                        return (
                          <span
                            className="text-[12px] text-destructive desktop:text-[20px]"
                            key={error}
                          >
                            {error}
                          </span>
                        )
                      })}
                </div>
              )}
            </div>
          </div>
          <div className="mt-[20px] mb-[60px] flex items-center justify-center gap-[15px] text-[16px]">
            <Checkbox
              checked={consent || isSubmitting}
              onCheckedChange={(val) => setField('consent', !!val)}
              name="consent"
              id="consent"
            />
            <label htmlFor="consent" className="hover:cursor-pointer">
              <span>
                Souhlasím se{' '}
                <Link
                  className="underline decoration-2 underline-offset-2"
                  href={'/zpracovani-osobnich-udaju'}
                >
                  zpracováním osobních údajů
                </Link>
              </span>
            </label>
          </div>
          <div className="flex justify-center">
            <Button
              type="submit"
              disabled={
                isSubmitting || !consent || !fullname || !email || !phoneNumber || !comment || !file
              }
              className="desktop:w-[618px] flex flex-row gap-2"
            >
              {isSubmitting && fullname && email && phoneNumber && comment && file ? <Spinner className="size-6"/> : null}
              {isSubmitting ? 'Odesílám...' : 'Odeslat'}
            </Button>
          </div>
        </form>
      )}
    </section>
  )
}
----
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

interface ContactState {
  fields: Record<any, any>
  file: File | null
  consent: boolean
  setField: (field: string, value: any) => void
  resetForm: () => void
}

export const useContactStore = create<ContactState>((set) => ({
  fields: {...fields},
  file: null,
  consent: false,
  setField: (field, value) => set((state) => ({ ...state, [field]: value })),
  resetForm: () =>
    set({
      fullname: '',
      email: '',
      phoneNumber: '',
      comment: '',
      file: null,
      consent: false,
    }),
}))


export default ApplicationForm
