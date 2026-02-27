'use server'

import config from '@/payload.config'
import { BasePayload, getPayload } from 'payload'
import * as v from 'valibot'
import { IActionResult } from '../types/IActionResult'
import { BaseIssue, PipeItem } from 'valibot'
import { getFieldName, getProperty } from '../helpers/form-fields-helper'
import { buildFileTypeString, calculateMaxFileSize, mapAcceptableFileTypes } from '../helpers/file-information-helper'
import { FormField, ValibotSafeMimeType } from '../types/Form-types'

export async function $sendApplicationForm({
  formData,
  initialFields,
  formId,
}: {
  formData: FormData,
  initialFields: FormField[],
  formId: number,
}): Promise<IActionResult<undefined>> {

  const fieldNamesAndTypes : Record<string,string> = {}
  
  const constructFieldValidationSchema = (field : FormField) => {
    const rules : PipeItem<any, string, BaseIssue<unknown>>[] = [];
    let base;
    
    const fname = getFieldName(field);
    const blockType : string = field.blockType;
    
    const required : boolean = getProperty(field,"required", false);
    const label : string = getProperty(field, "label", "");
    const maxLength : number = getProperty(field, "maxLength", null);

    switch(blockType){
      case "text":
      case "textarea":
        base = v.string()
        
        // Required
        if(required)
          rules.push(v.nonEmpty(`Vyplňte ${label}`))
        // Max Length
        if(maxLength)
          rules.push(v.maxLength(maxLength, `Zadaná hodnota ${label} je moc dlouhá`))
        const isPhoneNumber = getProperty(field,"isPhoneNumber", false)
      break;

      case "email":
        base = v.string();
        // Required
        if(required)
          rules.push(v.nonEmpty(`Vyplňte ${label}`))
        rules.push(v.email('E-mail je ve špatném formátu'))
        // Max Length
        if(maxLength)
          rules.push(v.maxLength(
            maxLength, 
            `Vaše emailová adresa přesahuje maximální délku emailu podle specifikace RFC 3696`
          ))
      break;

      case "checkbox":
        base = v.boolean();
        // Required
        if(required)
          rules.push(v.check((input) => input))
      break;

      case "upload":
        base = v.file('Prosím vyberte soubor')
        const mimeTypes = getProperty(field,"mimeTypes",[] as ValibotSafeMimeType[])
        const acceptableFileTypes = mapAcceptableFileTypes(mimeTypes)
        const fileTypeString = buildFileTypeString(mimeTypes)

        rules.push(v.mimeType(acceptableFileTypes, `Soubor musí být ve formátu ${fileTypeString}`))

        const fileSize = getProperty(field, "fileSize", []);
        const units = fileSize.units;
        const maxFileSize = fileSize.maxFileSize;
        const calculatedMaxFileSize = calculateMaxFileSize(units, maxFileSize);
        rules.push(v.maxSize(calculatedMaxFileSize, `Prosím vyberte soubor menší jak ${maxFileSize}${units}.`),)

      break;
      default:
        return null
    }

    fieldNamesAndTypes[fname] = blockType

    return v.pipe(base, ...rules);
  }

  const rawFormDataMapped = Object.fromEntries(
    initialFields.map(f => {
      const fname = getFieldName(f);
      let value = f.blockType === "checkbox" ? 
        (formData.get(f.name) === "on") : formData.get(fname)
      return [fname, value]
    })
  )

  function buildValidationSchema() {
    const schema: Record<string,any> = {};
    initialFields.map(f => {
      const fname = getFieldName(f);
      const fieldSchema = constructFieldValidationSchema(f);
      if(fieldSchema && fname)
        schema[fname] = fieldSchema
    })
    return schema;
  }

  const contactSchemaRemade = v.object(buildValidationSchema())
  const validatedFields = v.safeParse(contactSchemaRemade, rawFormDataMapped)
  
  if (!validatedFields.success) {
    const flatErrors = v.flatten<typeof contactSchemaRemade>(validatedFields.issues);
    return {
      success: false,
      fieldErrors: (flatErrors.nested || {}) as Record<string, string[]>,
    }
  }

  async function resolveFileDataSave(payload: BasePayload, file: any){
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
    return fileResult
  }

  try {
    const payload = await getPayload({ config });
    const data = validatedFields.output;

    const submissionDataPromises = Object.entries(data).map(async ([key,value]) => {
      let blockType = fieldNamesAndTypes[key]           
      
      // TODO: Special check for 
      let finalValue = value;
      if(blockType === "upload"){
        const fileResult = await resolveFileDataSave(payload, value);
        finalValue = fileResult.id;
      }
      
      return({
        fieldName: key,
        fieldType: blockType,
        [`${blockType}Value`]: finalValue
      })
    });

    const submissionData = await Promise.all(submissionDataPromises);

    const payloadResult = await payload.create({
      collection: 'application-form-messages',
      data: {
        form: formId,
        submissionData:submissionData
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
