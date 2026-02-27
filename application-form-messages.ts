import { CollectionConfig, getPayload } from 'payload'
import config from '@payload-config'

const ApplicationFormMessages: CollectionConfig = {
  slug: 'application-form-messages',
  labels: {
    plural: 'Odpovědi na formuláře',
    singular: 'Odpověď na formulář',
  },
  access: {
    create: ({ req: { user } }) => {
      return !user
    },
    update: ({ req: { user } }) => {
      return !user
    },
  },
  hooks: {
    afterChange: [
      async ({ doc, operation }) => {
        if (operation !== 'create') {
          return
        }
        /*
        const payload = await getPayload({ config: config })

        try {
          const careerData = await payload.findGlobal({
            slug: 'page_content',
            select: { contactEmail: true },
          })

          const file = doc.file

          const message = `
            Nový zájemce o pracovní pozici React Fullstack developer:
            Jméno: ${doc.fullname}
            Email: ${doc.email}
            Telefon: ${doc.phoneNumber} 
            Komentář: 
            ${doc.comment}
            `

          await payload.sendEmail({
            from: process.env.SMTP_USER || process.env.MAIL_FROM,
            to: careerData.contactEmail,
            subject: `Wi HR - odpověď na kariérní formulář`,
            text: message,
            attachments: [
              {
                filename: file.filename,
                path: process.env.ROOT_URL + file.url,
              },
            ],
          })
        } catch (e) {
          console.error('[application-form-messages:afterChange]:', e)
        }*/
      },
    ],
  },
  fields: [
    {
      name:"form",
      type:"relationship",
      relationTo:"forms",
      required:true,
    },
    {
      name:"submissionData",
      type:"array",
      fields:[
        {
          name:"fieldName",
          type:"text",
          required:true,
        },
        {
          name:"fieldLabel",
          type:"text",
          required:false,
        },
        {
          name:"fieldType",
          type:"select",
          options:[
            {
              label:"Upload",
              value:"upload",
            },
            {
              label:"Text",
              value:"text",
            },
            {
              label:"Textarea",
              value:"textarea",
            },
            {
              label:"Email",
              value:"email",
            },
            {
              label:"Checkbox",
              value:"checkbox",
            },
          ],
          hasMany:false,
          defaultValue:"text",
        },
        {
          name: "textValue",
          type: "text",
          admin: {
            condition: (data, siblingData) => siblingData?.type === 'text',
          },
        },
        {
          name: "textareaValue",
          type: "textarea",
          admin: {
            condition: (data, siblingData) => siblingData?.type === 'textarea',
          },
        },
        {
          name: "uploadValue",
          type: "upload",
          relationTo: "application-files",
          admin: {
            condition: (data, siblingData) => siblingData?.type === 'upload',
          },
        },
        {
          name: "checkboxValue",
          type: "checkbox",
          admin: {
            condition: (data, siblingData) => siblingData?.type === 'checkbox',
          },
        },
        {
          name: "emailValue",
          type: "email",
          admin: {
            condition: (data, siblingData) => siblingData?.type === 'email',
          },
        },
      ]
    },
    /*{
      name: 'fullname',
      label: 'Celé jméno',
      type: 'text',
      required: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      required: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'phoneNumber',
      label: 'Telefonní číslo',
      type: 'text',
      required: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'comment',
      label: 'Komentář',
      type: 'textarea',
      required: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'file',
      label: 'Soubor',
      type: 'upload',
      relationTo: 'application-files',
      required: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'consent',
      label: 'Souhlas se zpracováním osobních údajů',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        readOnly: true,
      },
    },*/
  ],
}
export default ApplicationFormMessages
