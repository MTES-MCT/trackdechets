import { Bsff, TransportMode } from ".prisma/client";
import { UserInputError } from "apollo-server-express";
import * as yup from "yup";
import { checkIsAuthenticated } from "../../../common/permissions";
import {
  BsffPackaging,
  BsffPackagingType,
  BsffSignatureType,
  MutationResolvers,
  MutationSignBsffArgs
} from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { PACKAGING_TYPE, WASTE_CODES } from "../../constants";
import { unflattenBsff } from "../../converter";
import { getBsffOrNotFound } from "../../database";

async function checkIsAllowed(
  siret: string | null,
  user: Express.User,
  securityCode: number | null
) {
  if (siret == null) {
    throw new UserInputError(
      `Les informations relatives à l'acteur pour lequel vous souhaitez signer sont manquantes.`
    );
  }

  if (securityCode) {
    const count = await prisma.company.count({
      where: {
        siret,
        securityCode
      }
    });
    if (count <= 0) {
      throw new UserInputError(`Le code de sécurité est incorrect.`);
    }
  } else {
    const count = await prisma.companyAssociation.count({
      where: {
        userId: user.id,
        company: {
          siret
        }
      }
    });
    if (count <= 0) {
      throw new UserInputError(
        `Vous n'êtes pas autorisé à signer pour cet acteur.`
      );
    }
  }
}

const beforeEmissionSchema: yup.SchemaOf<Pick<
  Bsff,
  | "emitterCompanyName"
  | "emitterCompanySiret"
  | "emitterCompanyAddress"
  | "emitterCompanyContact"
  | "emitterCompanyPhone"
  | "emitterCompanyMail"
  | "emitterEmissionSignatureDate"
  | "wasteCode"
  | "wasteDescription"
  | "quantityKilos"
>> = yup.object({
  emitterCompanyName: yup
    .string()
    .nullable()
    .required("Le nom de l'entreprise émettrice est requis"),
  emitterCompanySiret: yup
    .string()
    .nullable()
    .required("Le SIRET de l'entreprise émettrice est requis")
    .length(
      14,
      "Le SIRET de l'entreprise émettrice n'est pas au bon format (${length} caractères)"
    ),
  emitterCompanyAddress: yup
    .string()
    .nullable()
    .required("L'adresse de l'entreprise émettrice est requise"),
  emitterCompanyContact: yup
    .string()
    .nullable()
    .required("Le nom du contact dans l'entreprise émettrice est requis"),
  emitterCompanyPhone: yup
    .string()
    .nullable()
    .required("Le numéro de téléphone de l'entreprise émettrice est requis"),
  emitterCompanyMail: yup
    .string()
    .nullable()
    .email()
    .required("L'adresse email de l'entreprise émettrice est requis"),
  emitterEmissionSignatureDate: yup
    .date()
    .nullable()
    .test(
      "is-not-signed",
      "L'entreprise émettrice a déjà signé ce bordereau",
      value => value == null
    ) as any, // https://github.com/jquense/yup/issues/1302
  wasteCode: yup
    .string()
    .nullable()
    .required("Le code déchet est requis")
    .oneOf(
      WASTE_CODES,
      "Le code déchet ne fait pas partie de la liste reconnue : ${values}"
    ),
  wasteDescription: yup
    .string()
    .nullable()
    .required("La description du déchet est requise"),
  quantityKilos: yup
    .number()
    .nullable()
    .required("Le poids total du déchet est requis")
});

const beforeTransportSchema: yup.SchemaOf<Pick<
  Bsff,
  | "emitterEmissionSignatureDate"
  | "packagings"
  | "wasteAdr"
  | "transporterCompanyName"
  | "transporterCompanySiret"
  | "transporterCompanyAddress"
  | "transporterCompanyContact"
  | "transporterCompanyPhone"
  | "transporterCompanyMail"
  | "transporterTransportMode"
  | "transporterTransportSignatureDate"
>> = yup.object({
  emitterEmissionSignatureDate: yup
    .date()
    .nullable()
    .required(
      "Le transporteur ne peut pas signer l'enlèvement avant que l'émetteur ait signé le bordereau"
    ) as any, // https://github.com/jquense/yup/issues/1302
  packagings: yup
    .array()
    .nullable()
    .of<yup.SchemaOf<Omit<BsffPackaging, "__typename">>>(
      yup.object({
        numero: yup
          .string()
          .nullable()
          .required("Le numéro identifiant du contenant est requis"),
        type: yup
          .mixed<BsffPackagingType>()
          .nullable()
          .oneOf(
            Object.values(PACKAGING_TYPE),
            "Le type du contenant ne fait pas partie de la liste reconnue : ${values}"
          )
          .required("Le type de contenant est requis"),
        litres: yup
          .number()
          .nullable()
          .required("Le volume du contenant est requis")
      })
    )
    .required("Le conditionnement est requis")
    .min(1, "Le conditionnement est requis"),
  wasteAdr: yup.string().nullable().required("La mention ADR est requise"),
  transporterCompanyName: yup
    .string()
    .nullable()
    .required("Le nom du transporteur est requis"),
  transporterCompanySiret: yup
    .string()
    .nullable()
    .required("Le SIRET du transporteur est requis")
    .length(
      14,
      "Le SIRET du transporteur n'est pas au bon format (${length} caractères)"
    ),
  transporterCompanyAddress: yup
    .string()
    .nullable()
    .required("L'adresse du transporteur est requise"),
  transporterCompanyContact: yup
    .string()
    .nullable()
    .required("Le nom du contact dans l'entreprise émettrice est requis"),
  transporterCompanyPhone: yup
    .string()
    .nullable()
    .required("Le numéro de téléphone du transporteur est requis"),
  transporterCompanyMail: yup
    .string()
    .nullable()
    .email()
    .required("L'adresse email du transporteur est requis"),
  transporterTransportMode: yup
    .mixed<TransportMode>()
    .nullable()
    .oneOf(
      Object.values(TransportMode),
      "Le mode de transport ne fait pas partie de la liste reconnue : ${values}"
    )
    .required("Le mode de transport utilisé par le transporteur est requis"),
  transporterTransportSignatureDate: yup
    .date()
    .nullable()
    .test(
      "is-not-signed",
      "Le transporteur a déjà signé ce bordereau",
      value => value == null
    ) as any // https://github.com/jquense/yup/issues/1302
});

const signatures: Record<
  BsffSignatureType,
  (
    args: MutationSignBsffArgs,
    user: Express.User,
    existingBsff: Bsff
  ) => Promise<Bsff>
> = {
  EMITTER: async ({ id, signature, securityCode }, user, existingBsff) => {
    await checkIsAllowed(existingBsff.emitterCompanySiret, user, securityCode);
    await beforeEmissionSchema.validate(existingBsff, { abortEarly: false });

    return prisma.bsff.update({
      data: {
        emitterEmissionSignatureDate: signature.date,
        emitterEmissionSignatureAuthor: signature.author
      },
      where: {
        id
      }
    });
  },
  TRANSPORTER: async ({ id, signature, securityCode }, user, existingBsff) => {
    await checkIsAllowed(
      existingBsff.transporterCompanySiret,
      user,
      securityCode
    );
    await beforeTransportSchema.validate(existingBsff, { abortEarly: false });

    return prisma.bsff.update({
      data: {
        transporterTransportSignatureDate: signature.date,
        transporterTransportSignatureAuthor: signature.author
      },
      where: {
        id
      }
    });
  }
};

const signBsff: MutationResolvers["signBsff"] = async (_, args, context) => {
  const user = checkIsAuthenticated(context);
  const existingBsff = await getBsffOrNotFound(args.id);
  const sign = signatures[args.type];
  const updatedBsff = await sign(args, user, existingBsff);

  return {
    ...unflattenBsff(updatedBsff),
    ficheInterventions: [],
    bsffs: []
  };
};

export default signBsff;
