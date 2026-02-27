import type { CollectionConfig } from 'payload'

export const ApplicationFiles: CollectionConfig = {
  slug: 'application-files',
  labels: {
    plural: 'Soubory pracovních nabídek',
    singular: 'Soubor pracovní nabídeky',
  },
  admin: {
    useAsTitle: 'filename',
  },
  access: {
    read: () => true,
    create: () => false,
  },
  fields: [
    {
      name: 'application_message',
      type: 'join',
      collection: 'application-form-messages',
      on: "submissionData.uploadValue",
    },
  ],
  upload: {
    focalPoint: false,
    crop: false,
    mimeTypes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
  },
}
