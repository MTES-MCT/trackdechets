import {
  string,
  object,
  date,
  number,
  array,
  setLocale,
  LocaleObject
} from "yup";

setLocale({
  mixed: {
    notType: "Ce champ ne peut pas être nul"
  },
  number: {
    min: "Deve ser maior que ${min}"
  }
} as LocaleObject);

const companySchema = object().shape({
  name: string().required(),
  siret: string().required(
    "La sélection d'une entreprise par SIRET est obligatoire"
  ),
  address: string().required(),
  contact: string().required("Le contact dans l'entreprise est obligatoire"),
  phone: string().required("Le téléphone de l'entreprise est obligatoire"),
  mail: string()
    .email("Le format d'adresse email est incorrect")
    .required("L'email est obligatoire")
});

const packagingSchema = string().matches(/(FUT|GRV|CITERNE|BENNE|AUTRE)/);

export const formSchema = object().shape({
  id: string().required(),
  emitter: object().shape({
    type: string().matches(/(PRODUCER|OTHER)/),
    pickupSite: string(),
    company: companySchema
  }),
  recipient: object().shape({
    processingOperation: string()
      .required()
      .test(
        "selected",
        "Vous devez sélectionner une valeur",
        (v: string) => v != ""
      ),
    cap: string(),
    company: companySchema
  }),
  transporter: object().shape({
    receipt: string().required(
      "Le numéro de récépissé du transporteur est obligatoire"
    ),
    department: string().required(
      "Le département du transporteur est obligatoire"
    ),
    validityLimit: date(),
    contact: string().required("Le contact du transporteur est obligatoire"),
    numberPlate: string(),
    company: companySchema
  }),
  wasteDetails: object().shape({
    code: string().required("Code déchet manquant"),
    name: string().required("Appelation du déchet manquante"),
    onuCode: string(),
    packagings: array().of(packagingSchema),
    otherPackaging: string(),
    numberOfPackages: number()
      .integer()
      .min(1, "Le nombre de colis doit être supérieur à 0"),
    quantity: number().min(0, "La quantité doit être supérieure à 0"),
    quantityType: string().matches(
      /(REAL|ESTIMATED)/,
      "Le type de quantité (réelle ou estimée) doit être précisé"
    )
  })
});
