'use client'
import { useState } from 'react'
import { Form } from '@/payload-types'
import { useContactStore } from './ContactStore'

interface ApplicationFormProps extends Omit<Form, "id" | "updatedAt" | "createdAt">{}

export default function ApplicationForm(props:ApplicationFormProps) {
  // TODO zmapovat jako pole nebo tak, a pak přistupovat k hodnotám dle id
  type FormField = NonNullable<Form["fields"]>[number]

  function getFieldName(field:FormField):string | null {
    if("name" in field && field.name && field.name.length > 0) 
      return field.name
    return null
  }

  const initialFields : Form["fields"] = props.fields ? props.fields : []

  // Mapování objektů
  const formFields = Object.fromEntries(
    initialFields.map(f => { 
      return [f.name, f.defaultValue ?? ""]
    })
  )

  const { fields, setField, resetForm } =
  useContactStore()

  /*const { fullname, email, phoneNumber, comment, file, consent, setField, resetForm } =
    useContactStore()*/

  const [message, setMessage] = useState<string>('')

    const formFieldsErrors = Object.fromEntries(
        (initialFields ?? [])
        .map((field) => {
          const name = getFieldName(field as FormField)
          if(!name) return null
          return [name, ""]
        }) as [string, string][]
    )

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | string[]>>({
    ...formFieldsErrors,
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

  function resetErrors() {
    const cleared = Object.fromEntries(
      Object.keys(fieldErrors).map((key) => [key,""])
    )
    setFieldErrors({
        ...cleared,
        formError:""
    })
  }

  async function handleFormAction(formData: FormData) {
    setIsSubmitting(true)
    resetErrors()
    
    /*try {
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
    }*/
  }

  return (
    <section
      id="application-form"
      className="mx-auto mt-[70px] mb-[50px] flex h-auto max-w-[1340px] scroll-mt-[80px] flex-col items-center gap-[24px] px-[30px] desktop:mt-[100px] desktop:mb-[100px] desktop:scroll-mt-[120px] desktop:gap-[42px]"
    >
      <h1>Máte zájem o pozici? Napište nám</h1>
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
            {initialFields.length > 0 ? initialFields.map((field) => {

              const name = getFieldName(field as FormField)
              const required = "required" in field && field.required ? field.required : false
              const label = "label" in field && field.label ? field.label : ""

              let defaultValue = null;
              if (
                field.blockType === "text" ||
                field.blockType === "email" ||
                field.blockType === "textarea"
              ) {
                defaultValue = "defaultValue" in field && field.defaultValue ? field.defaultValue : ""
              }
            
              if(!name)
                return null

              return(
              <div>
                  <input
                    value={fields[name]} // state value
                    onChange={(e) => setField(name, e.target.value)} // differs based on type (phone, text)
                    name={name}
                    required = {required}
                    placeholder={label} // use label
                    aria-invalid={!!fieldErrors[name]}
                  />
                  {fieldErrors[name] && (
                    <div className="bg-destructive-foreground flex w-full flex-col gap-[2px] rounded-b-[4px] px-[4px] py-[6px] text-sm">
                      {!Array.isArray(fieldErrors[name]) // error state
                        ? fieldErrors[name]
                        : fieldErrors[name].map((error) => {
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
            {/*<div>
              <input
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
            </div>*/}
            {/*<div>
              <input
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
            </div>*/}
            {/*<div>
              <input
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
            </div>*/}
            {/*<div className="desktop:col-span-2">
              <textarea
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
            </div>*/}
            {/*<div className="desktop:col-span-2">
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
            </div>*/}
          </div>
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={
                isSubmitting || Object.values(fields).some(v => !v)
              }
              className="desktop:w-[618px] flex flex-row gap-2"
            >
              {isSubmitting ? 'Odesílám...' : 'Odeslat'}
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
