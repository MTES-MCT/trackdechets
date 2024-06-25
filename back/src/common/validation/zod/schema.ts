import { z } from "zod";
import { TransportMode } from "@prisma/client";
import { isForeignVat, isSiret, isVat } from "@td/constants";

export const siretSchema = z
  .string({ required_error: "le N° SIRET est obligatoire" })
  .refine(
    value => {
      if (!value) {
        return true;
      }
      return isSiret(value);
    },
    val => ({ message: `${val} n'est pas un numéro de SIRET valide` })
  );
export const vatNumberSchema = z.string().refine(
  value => {
    if (!value) {
      return true;
    }
    return isVat(value);
  },
  val => ({ message: `${val} n'est pas un numéro de TVA valide` })
);
export const foreignVatNumberSchema = vatNumberSchema.refine(value => {
  if (!value) return true;
  return isForeignVat(value);
}, "Impossible d'utiliser le numéro de TVA pour un établissement français, veuillez renseigner son SIRET uniquement");

export const rawTransporterSchema = z.object({
  id: z.string().nullish(),
  number: z.number().nullish(),
  transporterCompanyName: z.string().nullish(),
  transporterCompanySiret: siretSchema.nullish(),
  transporterCompanyAddress: z.string().nullish(),
  transporterCompanyContact: z.string().nullish(),
  transporterCompanyPhone: z.string().nullish(),
  transporterCompanyMail: z
    .string()
    .email("E-mail transporteur invalide")
    .nullish(),
  transporterCompanyVatNumber: foreignVatNumberSchema.nullish(),
  transporterCustomInfo: z.string().nullish(),
  transporterRecepisseIsExempted: z
    .boolean()
    .nullish()
    .transform(v => Boolean(v)),
  transporterRecepisseNumber: z.string().nullish(),
  transporterRecepisseDepartment: z.string().nullish(),
  transporterRecepisseValidityLimit: z.coerce.date().nullish(),
  transporterTransportMode: z.nativeEnum(TransportMode).nullish(),
  transporterTransportPlates: z
    .array(z.string())
    .max(2, "Un maximum de 2 plaques d'immatriculation est accepté")
    .default([]),
  transporterTransportTakenOverAt: z.coerce.date().nullish(),
  transporterTransportSignatureAuthor: z.string().nullish(),
  transporterTransportSignatureDate: z.coerce.date().nullish()
});
