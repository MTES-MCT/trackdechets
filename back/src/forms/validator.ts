import { string, object, date, number, array } from "yup";

const companySchema = object().shape({
  name: string().required(),
  siret: string().required(),
  address: string().required(),
  contact: string().required(),
  phone: string().required(),
  mail: string().required()
});

const packagingSchema = string().matches(/(FUT|GRV|CITERNE|BENNE|AUTRE)/);

export const formSchema = object().shape({
  id: string().required(),
  emitter: object().shape({
    type: string().matches(/(PRODUCER|OTHER)/),
    pickupSite: string().required(),
    company: companySchema
  }),
  recipient: object().shape({
    processingOperation: string().required(),
    cap: string(),
    company: companySchema
  }),
  transporter: object().shape({
    receipt: string().required(),
    department: string().required(),
    validityLimit: date(),
    contact: string().required(),
    numberPlate: string().required(),
    company: companySchema
  }),
  wasteDetails: object().shape({
    code: string().required(),
    onuCode: string().required(),
    packagings: array().of(packagingSchema),
    otherPackaging: string(),
    numberOfPackages: number()
      .integer()
      .min(1),
    quantity: number()
      .min(0),
    quantityType: string().matches(/(REAL|ESTIMATED)/)
  })
});
