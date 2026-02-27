'use client'
import Button from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import Dropbox from '../ui/dropbox'
import { Input } from '@/components/ui/input'
import { TextArea } from '../ui/textarea'
import { useState } from 'react'
import { SheetTitle } from '../ui/sheet'
import { useContactStore } from '@/lib/stores/contact-store'
import { Spinner } from "@/components/ui/spinner"
import { Form } from '@/payload-types'
import { $sendApplicationForm } from '@/lib/actions/application-actions'
import { RichText } from '@payloadcms/richtext-lexical/react'
import RichTextSerialize from '@/lib/utils/richtext-serialize/richtext-serialize'
import { getFieldName } from '@/lib/helpers/form-fields-helper'
import { FormField } from '@/lib/types/Form-types'

interface ApplicationFormProps extends Omit<Form, "updatedAt" | "createdAt">{}

function ApplicationForm(props:ApplicationFormProps) {
  const submitButtonLabel = props.submitButtonLabel ?? ""
  const initialFields : FormField[] = props.fields ? props.fields : []

  const confirmationMessage = props.confirmationMessage;
  const formId = props.id

  const formFieldErrors = Object.fromEntries(
    initialFields.map(f => {
      const name = getFieldName(f as FormField)
      if(!name)
        return []
      return [name, ""]
    })
  )

  const { fields, setField, resetForm } =
  useContactStore()

  // TODO: add Richtext option
  const [message, setMessage] = useState<string>("")

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | string[]>>({
    ...formFieldErrors,
    position: '',
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
    // reset errors
    setFieldErrors({
      ...formFieldErrors,
      position: '',
      formError: '',
    })

    try {
      const result = await $sendApplicationForm({ formData, initialFields, formId })
      if (result.success) {
        resetForm()
        setMessage("Děkujeme za Váš zájem o pozici ve Wi. Ozveme se Vám co nejdříve.")
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

  function chooseFormInput(field : FormField){
    const blockType = field.blockType
    const fname = getFieldName(field)
    const required = "required" in field && field.required ? field.required : false
    const label = "label" in field && field.label ? field.label : ""

    const enhancedLabel = "enhancedLabel" in field && field.enhancedLabel ? field.enhancedLabel : null

    if(!fname)
      return null

    let onChangeFunction;
    if(blockType === "text" && field.isPhoneNumber){
      onChangeFunction = (e:any) => setField(fname, formatPhoneNumber(e.target.value))
    }else if (blockType === "checkbox"){
      onChangeFunction = (val:any) => setField(fname, !!val)
    }else if(blockType === "upload") {
      onChangeFunction = (f:any) => setField(fname, f)
    }else{
      onChangeFunction = (e:any) => setField(fname, e.target.value)
    }

    switch(blockType){
      case "textarea":
        return(
          <TextArea
            value={fields[fname]}
            onChange={onChangeFunction}
            name={fname}
            required={required}
            placeholder={label}
            aria-invalid={!!fieldErrors[fname]}
            className="max-h-[750px] min-h-[55px] desktop:max-h-[1000px] desktop:min-h-[100px]"
        />)
      case "checkbox":
        return(
        <div className="mt-[20px] mb-[60px] flex items-center justify-center gap-[15px] text-[16px]">
          <Checkbox
            checked={fields[fname]} //|| isSubmitting}
            onCheckedChange={onChangeFunction}
            name={fname}
            id={fname}
          />
          {enhancedLabel ? 
            <label htmlFor={fname} className="hover:cursor-pointer">
              <span>
                {RichTextSerialize(enhancedLabel)}
              </span>
            </label>
            : 
            <label htmlFor={fname} className="hover:cursor-pointer">
              <span>
                {label}
              </span>
            </label>
          }
        </div>)
      case "upload":
        return(
          <Dropbox
            tabIndex={0}
            value={fields[fname]}
            onFileChange={onChangeFunction}
            name={fname}
            required={required}
            placeholder={{
              ...field.placeholders
            }}
            maxFileSize={field.fileSize.maxSize}
            fileSizeUnits={field.fileSize.units}
            mimeTypes={field.mimeTypes ?? []}
            aria-invalid={!!fieldErrors[fname]}
            className="aria-invalid:rounded-b-none"
        />)
      default:
        return(
          <Input
            value={fields[fname]}
            onChange={onChangeFunction}
            name={fname}
            required={required}
            placeholder={label}
            aria-invalid={!!fieldErrors[fname]}
        />)
    }
  }

  console.log(fields)

  return (
    <section
      id="application-form"
      className="mx-auto mt-[70px] mb-[50px] flex h-auto max-w-[1340px] scroll-mt-[80px] flex-col items-center gap-[24px] px-[30px] desktop:mt-[100px] desktop:mb-[100px] desktop:scroll-mt-[120px] desktop:gap-[42px]"
    >
      <SheetTitle>Máte zájem o pozici? Napište nám.</SheetTitle>
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
            {initialFields.length > 0 ? initialFields.map(((field : FormField, index:number) => {
              const fname = getFieldName(field)
              const blockType = field.blockType
          
              if(!fname)
                return null
              
              return(
                <div key={index}>
                    {chooseFormInput(field)}
                    {blockType != "checkbox" ? fieldErrors[fname] && (
                      <div className="bg-destructive-foreground flex w-full flex-col gap-[2px] rounded-b-[4px] px-[4px] py-[6px] text-sm">
                        {!Array.isArray(fieldErrors[fname])
                          ? fieldErrors[fname]
                          : fieldErrors[fname].map((error) => {
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
                    ): null}
                  </div>
                )
              })) : "Formulář neobsahuje žádná pole."}
          </div>
          <div className="flex justify-center">
            <Button
              type="submit"
              disabled={ isSubmitting || Object.values(fields).some(v => !v) }
              className="desktop:w-[618px] flex flex-row gap-2"
            >
              {isSubmitting && !Object.values(fields).some(v => !v) ? <Spinner className="size-6"/> : null}
              {isSubmitting ? 'Odesílám...' : submitButtonLabel}
            </Button>
          </div>
        </form>
      )}
    </section>
  )
}

export default ApplicationForm
