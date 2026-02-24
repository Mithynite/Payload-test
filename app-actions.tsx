'use server'

import config from '@/payload.config'
import { getPayload } from 'payload'
import * as v from 'valibot'
import { IActionResult } from '../types/IActionResult'
import { Form } from '@/payload-types'
import { BaseIssue, PipeItem } from 'valibot'
import { getFieldName } from '../helpers/form-fields-helper'

type FormField = NonNullable<Form["fields"]>[number]

export async function $sendApplicationForm({
  formData,
  initialFields,
}: {
  formData: FormData,
  initialFields: FormField[]
}): Promise<IActionResult<undefined>> {

  const constructFieldSchema = (field : FormField) => {
    const rules : PipeItem<any, string, BaseIssue<unknown>>[] = [];
    let base : any = v.string(); // TODO: get rid of "any"

    if(field.blockType === "checkbox"){
      base = v.boolean()
    }else if(field.blockType === "upload"){
      base = v.file()
    }

    // TODO: create generic function for this
    const blockType : string = field.blockType
    const fname : (string | null) = getFieldName(field)

    const required : boolean = "required" in field && field.required ? field.required : false
    const label : string = "label" in field && field.label ? field.label : ""
    const maxLength = "maxLength" in field && field.maxLength ? field.maxLength : null
    const fileSize = "fileSize" in field && field.fileSize ? field.fileSize : null

    /**
     * Text:
     *  - string
     * 
     *  - required
     *  - maxlength
     */

    if(required){
      rules.push(v.nonEmpty(`Vyplňte ${label}`))
    }

    if(blockType === "email"){
      rules.push(v.email('E-mail je ve špatném formátu'))
    }

    if(maxLength){
      rules.push(v.maxLength(maxLength, `Hodnota ${label} je moc dlouhá`))
    }

    if(fileSize){
      rules.push(v.maxSize(fileSize.maxSize, `Prosím vyberte soubor menší jak ${fileSize.maxSize} ${fileSize.units}.`))
    }

    return v.pipe(base, ...rules);
  }

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
      v.check((input) => input),
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
