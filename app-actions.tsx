'use server'

import config from '@/payload.config'
import { getPayload } from 'payload'
import * as v from 'valibot'
import { Form } from '@/payload-types'
import { BaseIssue, PipeItem } from 'valibot'
import { buildFileTypeString, mapAcceptableFileTypes } from '../helpers/file-information-helper'

type FormField = NonNullable<Form["fields"]>[number]
type MimeType = `${string}/${string}`;

export async function $sendApplicationForm({
  formData,
  initialFields,
}: {
  formData: FormData,
  initialFields: FormField[]
}) {

  function getProperty<T extends keyof FormField>(field:FormField, key: T, defaultValue: any){
    const property = key in field && field[key] ? field : defaultValue
    return property;
  }

  const constructFieldSchema = (field : FormField) => {
    const rules : PipeItem<any, string, BaseIssue<unknown>>[] = [];
    let base;

    const fname : (string | null) = "name" in field && field.name ? field.name : null

    const required = getProperty(field, "required", false)
    const isPhoneNumber = getProperty(field,"isPhoneNumber", false)
    const label = getProperty(field, "label", "")
    const maxLength = getProperty(field, "maxLength", null)
    const fileSize = getProperty(field, "fileSize", null)

    const blockType : string = field.blockType
    switch (field.blockType) {
      case "text":
      case "textarea":
        base = v.string()
          if(isPhoneNumber)
            break
          
          // Required
          if(required)
            rules.push(v.nonEmpty(`Vyplňte ${label}`))
          // Max Length
          if(maxLength){
            rules.push(v.maxLength(maxLength, `Zadaná hodnota ${label} je moc dlouhá`))
          }
        break

      case "email":
        base = v.string()

        // Required
        if(required)
          rules.push(v.nonEmpty(`Vyplňte ${label}`))
        // Email
        rules.push(v.email('E-mail je ve špatném formátu'))
        // Max Length
        if(maxLength)
          rules.push(
            v.maxLength(
            254,
            'Vaše emailová adresa přesahuje maximální délku emailu podle specifikace RFC 3696',
          ))
        break
      case "checkbox":
        base = v.boolean()

        // Required
        if(required)
          rules.push(v.check((input) => input))
        break

      case "upload":
        base = v.file('Prosím vyberte soubor')
        const mimeTypes = getProperty(field,"mimeTypes",[] as MimeType[])
        const acceptableFileTypes = mapAcceptableFileTypes(mimeTypes)
        const fileTypeString = buildFileTypeString(mimeTypes)

        rules.push(v.mimeType(acceptableFileTypes, fileTypeString))

      default:
        return null
    }

    if(fileSize){
      rules.push(v.maxSize(fileSize.maxSize, `Prosím vyberte soubor menší jak ${fileSize.maxSize} ${fileSize.units}.`))
    }

    return v.pipe(base, ...rules);
  }

  /** Done */
  const rawFormDataMapped = Object.fromEntries(
    initialFields.map(f => {
      const fname = f.name
      let value = f.blockType === "checkbox" ? 
        (formData.get(f.name) === "on") : formData.get(fname)
      return [fname, value]
    })
  )

  function buildValidationSchema(rawFormData:Record<string,any>) {
    let schema = rawFormData.map(data => {
      return 
    })
  }

  const rawFormData = {
    fullname: formData.get('fullname'),
    email: formData.get('email'),
    phonenumber: formData.get('phonenumber'),
    comment: formData.get('comment'),
    consent: formData.get('consent') === 'on' ? true : false,
    file: formData.get('file') as File,
  }

  /*
    1) Pre-defined checks (fullname, email, etc.)
    2) Create schema based on the incoming fields
    3) Paste it to the v.object({...})
  */

  const contactSchema = v.object({
    fullname: v.pipe(
      v.string(),
      v.nonEmpty('Vyplňte jméno / příjmení'),
      v.maxLength(40, 'Vaše jméno / příjmení je moc dlouhé'),
    ),
    email: v.pipe(
      v.string(),
      v.nonEmpty('Vyplňte e-mail'),
      v.email('E-mail je ve špatném formátu'),
      v.maxLength(
        254,
        'Vaše emailová adresa přesahuje maximální délku emailu podle specifikace RFC 3696',
      ),
    ),
    phonenumber: v.pipe(v.string()),
    comment: v.pipe(v.string(), v.nonEmpty('Vyplňte komentář')),
    consent: v.pipe(
      v.boolean(),
      v.check((input) => input), // input must be true
    ),
    file: v.pipe(
      v.file('Prosím vyberte soubor'),
      v.mimeType(
        [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        'Soubor musí být ve formátu .pdf nebo .docx',
      ),
      v.maxSize(1024 * 1024 * 50, 'Prosím vyberte soubor menší jak 50 MB.'),
    ),
  })

  const validatedFields = v.safeParse(contactSchema, rawFormData)

  if (!validatedFields.success) {
    const errors = v.flatten<typeof contactSchema>(validatedFields.issues).nested

    return {
      success: false,
      fieldErrors: errors,
    }
  }

  try {
    const payload = await getPayload({ config })

    /** Extract all phone number fields and all file-upload fields to work with them separately */
    const { phonenumber, file, ...data } = validatedFields.output

    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)

    const fileResult = await payload.create({
      collection: 'application-files',
      data: {},
      file: {
        data: fileBuffer,
        name: file.name,
        size: file.size,
        mimetype: file.type,
      },
    })

    const payloadResult = await payload.create({
      collection: 'application-form-messages',
      data: {
        phoneNumber: phonenumber.replaceAll(' ', ''),
        file: fileResult.id,
        ...data,
      },
    })
  } catch (e: any) {
    console.error(e.cause)
  }
  return { success: true }
}

export default async function $retrieveFormBuilderFormData(formTitle:string){
  let formData = undefined;

  try{
    const payload = await getPayload({ config })
    formData = await payload.find({
      collection:"forms",
      where:{
        title:{
          equals: formTitle
        },
      },
      limit:1
    });
  }catch(e:any){
    console.error(e.cause)
  }
  return formData ? formData.docs[0] : null
}
