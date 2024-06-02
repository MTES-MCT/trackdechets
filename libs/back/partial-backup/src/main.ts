import { unescape } from "node:querystring";
import {
  AccessToken,
  AnonymousCompany,
  Application,
  BrokerReceipt,
  Bsda,
  BsdaFinalOperation,
  BsdaRevisionRequest,
  BsdaRevisionRequestApproval,
  BsdaTransporter,
  Bsdasri,
  BsdasriFinalOperation,
  BsdasriRevisionRequest,
  BsdasriRevisionRequestApproval,
  BsddFinalOperation,
  BsddRevisionRequest,
  BsddRevisionRequestApproval,
  BsddTransporter,
  Bsff,
  BsffFicheIntervention,
  BsffPackaging,
  BsffPackagingFinalOperation,
  BsffTransporter,
  Bspaoh,
  BspaohTransporter,
  Company,
  CompanyAssociation,
  EcoOrganisme,
  FeatureFlag,
  Form,
  FormGroupement,
  GovernmentAccount,
  Grant,
  IntermediaryBsdaAssociation,
  IntermediaryFormAssociation,
  MembershipRequest,
  Prisma,
  PrismaClient,
  SignatureAutomation,
  StatusLog,
  TraderReceipt,
  TransporterReceipt,
  User,
  UserActivationHash,
  UserResetPasswordHash,
  VhuAgrement,
  WebhookSetting,
  WorkerCertification
} from "@prisma/client";

const { DATABASE_URL, TUNNELED_DB, DUMP_OBJ } = process.env;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

if (!TUNNELED_DB) {
  throw new Error("TUNNELED_DB is not defined");
}

if (!DUMP_OBJ) {
  throw new Error(
    "DUMP_OBJ is not defined, please specify an object t act as the dump starting point"
  );
}

function getDbUrlWithSchema(rawDatabaseUrl: string) {
  try {
    const dbUrl = new URL(rawDatabaseUrl);
    dbUrl.searchParams.set("schema", "default$default");

    return unescape(dbUrl.href); // unescape needed because of the `$`
  } catch (err) {
    return "";
  }
}

const prismaLocal = new PrismaClient({
  datasources: {
    db: { url: getDbUrlWithSchema(DATABASE_URL) }
  },
  log: ["info", "warn", "error"]
});

const prismaRemote = new PrismaClient({
  datasources: {
    db: { url: getDbUrlWithSchema(TUNNELED_DB) }
  },
  log: ["info", "warn", "error"]
});

const pipelines = {
  Form: {
    getter: async (key: string, value?: string) =>
      value && prismaRemote.form.findMany({ where: { [key]: value } }),
    setter: async (bsd?: Form) =>
      bsd &&
      prismaLocal.form.create({
        data: {
          ...bsd,
          wasteDetailsPackagingInfos:
            bsd.wasteDetailsPackagingInfos ?? Prisma.JsonNull,
          wasteDetailsParcelNumbers:
            bsd.wasteDetailsParcelNumbers ?? Prisma.JsonNull
        }
      })
  },
  Bsdasri: {
    getter: async (key: string, value?: string) =>
      value && prismaRemote.bsdasri.findMany({ where: { [key]: value } }),
    setter: async (bsdasri?: Bsdasri) =>
      bsdasri &&
      prismaLocal.bsdasri.create({
        data: {
          ...bsdasri,
          emitterWastePackagings:
            bsdasri.emitterWastePackagings ?? Prisma.JsonNull,
          transporterWastePackagings:
            bsdasri.transporterWastePackagings ?? Prisma.JsonNull,
          destinationWastePackagings:
            bsdasri.destinationWastePackagings ?? Prisma.JsonNull
        }
      })
  },
  Bsda: {
    getter: async (key: string, value?: string) =>
      value && prismaRemote.bsda.findMany({ where: { [key]: value } }),
    setter: async (bsda?: Bsda) =>
      bsda &&
      prismaLocal.bsda.create({
        data: {
          ...bsda,
          packagings: bsda.packagings ?? Prisma.JsonNull
        }
      })
  },
  Bsff: {
    getter: async (key: string, value?: string) =>
      value && prismaRemote.bsff.findMany({ where: { [key]: value } }),
    setter: async (bsff?: Bsff) =>
      bsff && prismaLocal.bsff.create({ data: bsff })
  },
  Bspaoh: {
    getter: async (key: string, value?: string) =>
      value && prismaRemote.bspaoh.findMany({ where: { [key]: value } }),
    setter: async (bspaoh?: Bspaoh) =>
      bspaoh &&
      prismaLocal.bspaoh.create({
        data: {
          ...bspaoh,
          wastePackagings: bspaoh.wastePackagings ?? Prisma.JsonNull,
          destinationReceptionWastePackagingsAcceptation:
            bspaoh.destinationReceptionWastePackagingsAcceptation ??
            Prisma.JsonNull
        }
      })
  },
  Company: {
    getter: async (key: string, value?: string) =>
      value && prismaRemote.company.findMany({ where: { [key]: value } }),
    setter: async (company?: Company) =>
      company && prismaLocal.company.create({ data: company })
  },
  AnonymousCompany: {
    getter: async (key: string, value?: string) =>
      value &&
      prismaRemote.anonymousCompany.findMany({ where: { [key]: value } }),
    setter: async (anonymousCompany?: AnonymousCompany) =>
      anonymousCompany &&
      prismaLocal.anonymousCompany.create({ data: anonymousCompany })
  },
  EcoOrganisme: {
    getter: async (key: string, value?: string) =>
      value && prismaRemote.ecoOrganisme.findMany({ where: { [key]: value } }),
    setter: async (ecoOrganisme?: EcoOrganisme) =>
      ecoOrganisme && prismaLocal.ecoOrganisme.create({ data: ecoOrganisme })
  },
  BsddTransporter: {
    getter: async (key: string, value?: string) =>
      value &&
      prismaRemote.bsddTransporter.findMany({ where: { [key]: value } }),
    setter: async (transporter?: BsddTransporter) =>
      transporter && prismaLocal.bsddTransporter.create({ data: transporter })
  },
  FormGroupement: {
    getter: async (key: string, value?: string) =>
      value &&
      prismaRemote.formGroupement.findMany({ where: { [key]: value } }),
    setter: async (groupement?: FormGroupement) =>
      groupement && prismaLocal.formGroupement.create({ data: groupement })
  },
  User: {
    getter: async (key: string, value?: string) =>
      value && prismaRemote.user.findMany({ where: { [key]: value } }),
    setter: async (user?: User) =>
      user && prismaLocal.user.create({ data: user })
  },
  StatusLog: {
    getter: async (key: string, value?: string) =>
      value && prismaRemote.statusLog.findMany({ where: { [key]: value } }),
    setter: async (statusLog?: StatusLog) =>
      statusLog &&
      prismaLocal.statusLog.create({
        data: {
          ...statusLog,
          updatedFields: statusLog.updatedFields ?? Prisma.JsonNull
        }
      })
  },
  BsddRevisionRequest: {
    getter: async (key: string, value?: string) =>
      value &&
      prismaRemote.bsddRevisionRequest.findMany({ where: { [key]: value } }),
    setter: async (revisionRequest?: BsddRevisionRequest) =>
      revisionRequest &&
      prismaLocal.bsddRevisionRequest.create({
        data: {
          ...revisionRequest,
          wasteDetailsPackagingInfos:
            revisionRequest.wasteDetailsPackagingInfos ?? Prisma.JsonNull
        }
      })
  },
  IntermediaryFormAssociation: {
    getter: async (key: string, value?: string) =>
      value &&
      prismaRemote.intermediaryFormAssociation.findMany({
        where: { [key]: value }
      }),
    setter: async (intermediaryFormAssociation?: IntermediaryFormAssociation) =>
      intermediaryFormAssociation &&
      prismaLocal.intermediaryFormAssociation.create({
        data: intermediaryFormAssociation
      })
  },
  BsddFinalOperation: {
    getter: async (key: string, value?: string) =>
      value &&
      prismaRemote.bsddFinalOperation.findMany({ where: { [key]: value } }),
    setter: async (bsddFinalOperation?: BsddFinalOperation) =>
      bsddFinalOperation &&
      prismaLocal.bsddFinalOperation.create({ data: bsddFinalOperation })
  },
  TraderReceipt: {
    getter: async (key: string, value?: string) =>
      value && prismaRemote.traderReceipt.findMany({ where: { [key]: value } }),
    setter: async (traderReceipt?: TraderReceipt) =>
      traderReceipt && prismaLocal.traderReceipt.create({ data: traderReceipt })
  },
  BrokerReceipt: {
    getter: async (key: string, value?: string) =>
      value && prismaRemote.brokerReceipt.findMany({ where: { [key]: value } }),
    setter: async (brokerReceipt?: BrokerReceipt) =>
      brokerReceipt && prismaLocal.brokerReceipt.create({ data: brokerReceipt })
  },
  TransporterReceipt: {
    getter: async (key: string, value?: string) =>
      value &&
      prismaRemote.transporterReceipt.findMany({ where: { [key]: value } }),
    setter: async (transporterReceipt?: TransporterReceipt) =>
      transporterReceipt &&
      prismaLocal.transporterReceipt.create({ data: transporterReceipt })
  },
  VhuAgrement: {
    getter: async (key: string, value?: string) =>
      value && prismaRemote.vhuAgrement.findMany({ where: { [key]: value } }),
    setter: async (vhuAgrement?: VhuAgrement) =>
      vhuAgrement && prismaLocal.vhuAgrement.create({ data: vhuAgrement })
  },
  WorkerCertification: {
    getter: async (key: string, value?: string) =>
      value &&
      prismaRemote.workerCertification.findMany({ where: { [key]: value } }),
    setter: async (workerCertification?: WorkerCertification) =>
      workerCertification &&
      prismaLocal.workerCertification.create({ data: workerCertification })
  },
  CompanyAssociation: {
    getter: async (key: string, value?: string) =>
      value &&
      prismaRemote.companyAssociation.findMany({ where: { [key]: value } }),
    setter: async (companyAssociation?: CompanyAssociation) =>
      companyAssociation &&
      prismaLocal.companyAssociation.create({ data: companyAssociation })
  },
  MembershipRequest: {
    getter: async (key: string, value?: string) =>
      value &&
      prismaRemote.membershipRequest.findMany({ where: { [key]: value } }),
    setter: async (membershipRequest?: MembershipRequest) =>
      membershipRequest &&
      prismaLocal.membershipRequest.create({ data: membershipRequest })
  },
  SignatureAutomation: {
    getter: async (key: string, value?: string) =>
      value &&
      prismaRemote.signatureAutomation.findMany({ where: { [key]: value } }),
    setter: async (signatureAutomation?: SignatureAutomation) =>
      signatureAutomation &&
      prismaLocal.signatureAutomation.create({ data: signatureAutomation })
  },
  GovernmentAccount: {
    getter: async (key: string, value?: string) =>
      value &&
      prismaRemote.governmentAccount.findMany({ where: { [key]: value } }),
    setter: async (governmentAccount?: GovernmentAccount) =>
      governmentAccount &&
      prismaLocal.governmentAccount.create({ data: governmentAccount })
  },
  AccessToken: {
    getter: async (key: string, value?: string) =>
      value && prismaRemote.accessToken.findMany({ where: { [key]: value } }),
    setter: async (accessToken?: AccessToken) =>
      accessToken && prismaLocal.accessToken.create({ data: accessToken })
  },
  Application: {
    getter: async (key: string, value?: string) =>
      value && prismaRemote.application.findMany({ where: { [key]: value } }),
    setter: async (application?: Application) =>
      application && prismaLocal.application.create({ data: application })
  },
  FeatureFlag: {
    getter: async (key: string, value?: string) =>
      value && prismaRemote.featureFlag.findMany({ where: { [key]: value } }),
    setter: async (featureFlag?: FeatureFlag) =>
      featureFlag && prismaLocal.featureFlag.create({ data: featureFlag })
  },
  Grant: {
    getter: async (key: string, value?: string) =>
      value && prismaRemote.grant.findMany({ where: { [key]: value } }),
    setter: async (grant?: Grant) =>
      grant && prismaLocal.grant.create({ data: grant })
  },
  UserResetPasswordHash: {
    getter: async (key: string, value?: string) =>
      value &&
      prismaRemote.userResetPasswordHash.findMany({ where: { [key]: value } }),
    setter: async (userResetPasswordHash?: UserResetPasswordHash) =>
      userResetPasswordHash &&
      prismaLocal.userResetPasswordHash.create({ data: userResetPasswordHash })
  },
  UserActivationHash: {
    getter: async (key: string, value?: string) =>
      value &&
      prismaRemote.userActivationHash.findMany({ where: { [key]: value } }),
    setter: async (userActivationHash?: UserActivationHash) =>
      userActivationHash &&
      prismaLocal.userActivationHash.create({ data: userActivationHash })
  },
  BsddRevisionRequestApproval: {
    getter: async (key: string, value?: string) =>
      value &&
      prismaRemote.bsddRevisionRequestApproval.findMany({
        where: { [key]: value }
      }),
    setter: async (bsddRevisionRequestApproval?: BsddRevisionRequestApproval) =>
      bsddRevisionRequestApproval &&
      prismaLocal.bsddRevisionRequestApproval.create({
        data: bsddRevisionRequestApproval
      })
  },
  BsdasriRevisionRequest: {
    getter: async (key: string, value?: string) =>
      value &&
      prismaRemote.bsdasriRevisionRequest.findMany({
        where: { [key]: value }
      }),
    setter: async (bsdasriRevisionRequest?: BsdasriRevisionRequest) =>
      bsdasriRevisionRequest &&
      prismaLocal.bsdasriRevisionRequest.create({
        data: {
          ...bsdasriRevisionRequest,
          destinationWastePackagings:
            bsdasriRevisionRequest.destinationWastePackagings ?? Prisma.JsonNull
        }
      })
  },
  BsdasriFinalOperation: {
    getter: async (key: string, value?: string) =>
      value &&
      prismaRemote.bsdasriFinalOperation.findMany({
        where: { [key]: value }
      }),
    setter: async (bsdasriFinalOperation?: BsdasriFinalOperation) =>
      bsdasriFinalOperation &&
      prismaLocal.bsdasriFinalOperation.create({
        data: bsdasriFinalOperation
      })
  },
  BsdasriRevisionRequestApproval: {
    getter: async (key: string, value?: string) =>
      value &&
      prismaRemote.bsdasriRevisionRequestApproval.findMany({
        where: { [key]: value }
      }),
    setter: async (
      bsdasriRevisionRequestApproval?: BsdasriRevisionRequestApproval
    ) =>
      bsdasriRevisionRequestApproval &&
      prismaLocal.bsdasriRevisionRequestApproval.create({
        data: bsdasriRevisionRequestApproval
      })
  },
  BsdaTransporter: {
    getter: async (key: string, value?: string) =>
      value &&
      prismaRemote.bsdaTransporter.findMany({
        where: { [key]: value }
      }),
    setter: async (bsdaTransporter?: BsdaTransporter) =>
      bsdaTransporter &&
      prismaLocal.bsdaTransporter.create({
        data: bsdaTransporter
      })
  },
  BsdaRevisionRequest: {
    getter: async (key: string, value?: string) =>
      value &&
      prismaRemote.bsdaRevisionRequest.findMany({
        where: { [key]: value }
      }),
    setter: async (bsdaRevisionRequest?: BsdaRevisionRequest) =>
      bsdaRevisionRequest &&
      prismaLocal.bsdaRevisionRequest.create({
        data: {
          ...bsdaRevisionRequest,
          packagings: bsdaRevisionRequest.packagings ?? Prisma.JsonNull
        }
      })
  },
  IntermediaryBsdaAssociation: {
    getter: async (key: string, value?: string) =>
      value &&
      prismaRemote.intermediaryBsdaAssociation.findMany({
        where: { [key]: value }
      }),
    setter: async (intermediaryBsdaAssociation?: IntermediaryBsdaAssociation) =>
      intermediaryBsdaAssociation &&
      prismaLocal.intermediaryBsdaAssociation.create({
        data: intermediaryBsdaAssociation
      })
  },
  BsdaFinalOperation: {
    getter: async (key: string, value?: string) =>
      value &&
      prismaRemote.bsdaFinalOperation.findMany({
        where: { [key]: value }
      }),
    setter: async (bsdaFinalOperation?: BsdaFinalOperation) =>
      bsdaFinalOperation &&
      prismaLocal.bsdaFinalOperation.create({
        data: bsdaFinalOperation
      })
  },
  BsdaRevisionRequestApproval: {
    getter: async (key: string, value?: string) =>
      value &&
      prismaRemote.bsdaRevisionRequestApproval.findMany({
        where: { [key]: value }
      }),
    setter: async (bsdaRevisionRequestApproval?: BsdaRevisionRequestApproval) =>
      bsdaRevisionRequestApproval &&
      prismaLocal.bsdaRevisionRequestApproval.create({
        data: bsdaRevisionRequestApproval
      })
  },
  BsffFicheIntervention: {
    getter: async (key: string, value?: string) =>
      value &&
      prismaRemote.bsff
        .findUnique({
          where: { id: value }
        })
        .ficheInterventions(),
    setter: async (bsffFicheIntervention?: BsffFicheIntervention) =>
      bsffFicheIntervention &&
      prismaLocal.bsffFicheIntervention.create({
        data: bsffFicheIntervention
      })
  },
  BsffPackaging: {
    getter: async (key: string, value?: string) =>
      value &&
      prismaRemote.bsffPackaging.findMany({
        where: { [key]: value }
      }),
    setter: async (bsffPackaging?: BsffPackaging) =>
      bsffPackaging &&
      prismaLocal.bsffPackaging.create({
        data: bsffPackaging
      })
  },
  BsffTransporter: {
    getter: async (key: string, value?: string) =>
      value &&
      prismaRemote.bsffTransporter.findMany({
        where: { [key]: value }
      }),
    setter: async (bsffTransporter?: BsffTransporter) =>
      bsffTransporter &&
      prismaLocal.bsffTransporter.create({
        data: bsffTransporter
      })
  },
  BsffPackagingFinalOperation: {
    getter: async (key: string, value?: string) =>
      value &&
      prismaRemote.bsffPackagingFinalOperation.findMany({
        where: { [key]: value }
      }),
    setter: async (bsffPackagingFinalOperation?: BsffPackagingFinalOperation) =>
      bsffPackagingFinalOperation &&
      prismaLocal.bsffPackagingFinalOperation.create({
        data: bsffPackagingFinalOperation
      })
  },
  BspaohTransporter: {
    getter: async (key: string, value?: string) =>
      value &&
      prismaRemote.bspaohTransporter.findMany({
        where: { [key]: value }
      }),
    setter: async (bspaohTransporter?: BspaohTransporter) =>
      bspaohTransporter &&
      prismaLocal.bspaohTransporter.create({
        data: bspaohTransporter
      })
  },
  WebhookSetting: {
    getter: async (key: string, value?: string) =>
      value &&
      prismaRemote.webhookSetting.findMany({
        where: { [key]: value }
      }),
    setter: async (webhookSetting?: WebhookSetting) =>
      webhookSetting &&
      prismaLocal.webhookSetting.create({
        data: webhookSetting
      })
  }
};

const traversals = {
  Form: [
    {
      type: "Company",
      localKey: "emitterCompanySiret",
      foreignKey: "orgId"
    },
    {
      type: "Company",
      localKey: "recipientCompanySiret",
      foreignKey: "orgId"
    },
    {
      type: "Company",
      localKey: "traderCompanySiret",
      foreignKey: "orgId"
    },
    {
      type: "EcoOrganisme",
      localKey: "ecoOrganismeSiret",
      foreignKey: "orgId"
    },
    {
      type: "Company",
      localKey: "brokerCompanySiret",
      foreignKey: "orgId"
    },
    {
      type: "Company",
      localKey: "nextDestinationCompanySiret",
      foreignKey: "orgId"
    },
    {
      type: "AnonymousCompany",
      localKey: "emitterCompanySiret",
      foreignKey: "orgId"
    },
    {
      type: "AnonymousCompany",
      localKey: "recipientCompanySiret",
      foreignKey: "orgId"
    },
    {
      type: "AnonymousCompany",
      localKey: "traderCompanySiret",
      foreignKey: "orgId"
    },
    {
      type: "AnonymousCompany",
      localKey: "brokerCompanySiret",
      foreignKey: "orgId"
    },
    {
      type: "AnonymousCompany",
      localKey: "nextDestinationCompanySiret",
      foreignKey: "orgId"
    },
    {
      type: "BsddTransporter",
      localKey: "id",
      foreignKey: "formId"
    },
    {
      type: "FormGroupement",
      localKey: "id",
      foreignKey: "nextFormId"
    },
    {
      type: "FormGroupement",
      localKey: "id",
      foreignKey: "initialFormId"
    },
    {
      type: "User",
      localKey: "ownerId",
      foreignKey: "id"
    },
    {
      type: "StatusLog",
      localKey: "id",
      foreignKey: "formId"
    },
    {
      type: "BsddRevisionRequest",
      localKey: "id",
      foreignKey: "bsddId"
    },
    {
      type: "IntermediaryFormAssociation",
      localKey: "id",
      foreignKey: "formId"
    },
    {
      type: "Form",
      localKey: "forwardedInId",
      foreignKey: "id"
    },
    {
      type: "Form",
      localKey: "id",
      foreignKey: "forwardedInId"
    },
    {
      type: "BsddFinalOperation",
      localKey: "id",
      foreignKey: "finalFormId"
    },
    {
      type: "BsddFinalOperation",
      localKey: "id",
      foreignKey: "initialFormId"
    }
  ],
  Bsdasri: [
    {
      type: "Company",
      localKey: "emitterCompanySiret",
      foreignKey: "orgId"
    },
    {
      type: "Company",
      localKey: "transporterCompanySiret",
      foreignKey: "orgId"
    },
    {
      type: "Company",
      localKey: "destinationCompanySiret",
      foreignKey: "orgId"
    },
    {
      type: "EcoOrganisme",
      localKey: "ecoOrganismeSiret",
      foreignKey: "orgId"
    },
    {
      type: "AnonymousCompany",
      localKey: "emitterCompanySiret",
      foreignKey: "orgId"
    },
    {
      type: "AnonymousCompany",
      localKey: "transporterCompanySiret",
      foreignKey: "orgId"
    },
    {
      type: "AnonymousCompany",
      localKey: "destinationCompanySiret",
      foreignKey: "orgId"
    },
    {
      type: "User",
      localKey: "emissionSignatoryId",
      foreignKey: "id"
    },
    {
      type: "User",
      localKey: "transportSignatoryId",
      foreignKey: "id"
    },
    {
      type: "User",
      localKey: "receptionSignatoryId",
      foreignKey: "id"
    },
    {
      type: "User",
      localKey: "operationSignatoryId",
      foreignKey: "id"
    },
    {
      type: "Bsdasri",
      localKey: "groupedInId",
      foreignKey: "id"
    },
    {
      type: "Bsdasri",
      localKey: "id",
      foreignKey: "groupedInId"
    },
    {
      type: "Bsdasri",
      localKey: "synthesizedInId",
      foreignKey: "id"
    },
    {
      type: "Bsdasri",
      localKey: "id",
      foreignKey: "synthesizedInId"
    },
    {
      type: "BsdasriRevisionRequest",
      localKey: "id",
      foreignKey: "bsdasriId"
    },
    {
      type: "BsdasriFinalOperation",
      localKey: "id",
      foreignKey: "finalBsdasriId"
    },
    {
      type: "BsdasriFinalOperation",
      localKey: "id",
      foreignKey: "initialBsdasriId"
    }
  ],
  Bsda: [
    {
      type: "Company",
      localKey: "emitterCompanySiret",
      foreignKey: "orgId"
    },
    {
      type: "EcoOrganisme",
      localKey: "ecoOrganismeSiret",
      foreignKey: "orgId"
    },
    {
      type: "Company",
      localKey: "destinationCompanySiret",
      foreignKey: "orgId"
    },
    {
      type: "Company",
      localKey: "destinationOperationNextDestinationCompanySiret",
      foreignKey: "orgId"
    },
    {
      type: "AnonymousCompany",
      localKey: "emitterCompanySiret",
      foreignKey: "orgId"
    },
    {
      type: "AnonymousCompany",
      localKey: "destinationCompanySiret",
      foreignKey: "orgId"
    },
    {
      type: "AnonymousCompany",
      localKey: "destinationOperationNextDestinationCompanySiret",
      foreignKey: "orgId"
    },
    {
      type: "BsdaTransporter",
      localKey: "id",
      foreignKey: "bsdaId"
    },
    {
      type: "Company",
      localKey: "workerCompanySiret",
      foreignKey: "orgId"
    },
    {
      type: "Company",
      localKey: "brokerCompanySiret",
      foreignKey: "orgId"
    },
    {
      type: "AnonymousCompany",
      localKey: "workerCompanySiret",
      foreignKey: "orgId"
    },
    {
      type: "AnonymousCompany",
      localKey: "brokerCompanySiret",
      foreignKey: "orgId"
    },
    {
      type: "Bsda",
      localKey: "forwardingId",
      foreignKey: "id"
    },
    {
      type: "Bsda",
      localKey: "id",
      foreignKey: "forwardingId"
    },
    {
      type: "Bsda",
      localKey: "groupedInId",
      foreignKey: "id"
    },
    {
      type: "Bsda",
      localKey: "id",
      foreignKey: "groupedInId"
    },
    {
      type: "BsdaRevisionRequest",
      localKey: "id",
      foreignKey: "bsdaId"
    },
    {
      type: "IntermediaryBsdaAssociation",
      localKey: "id",
      foreignKey: "bsdaId"
    },
    {
      type: "BsdaFinalOperation",
      localKey: "id",
      foreignKey: "finalBsdaId"
    },
    {
      type: "BsdaFinalOperation",
      localKey: "id",
      foreignKey: "initialBsdaId"
    }
  ],
  Bsff: [
    {
      type: "Company",
      localKey: "emitterCompanySiret",
      foreignKey: "orgId"
    },
    {
      type: "Company",
      localKey: "destinationCompanySiret",
      foreignKey: "orgId"
    },
    {
      type: "AnonymousCompany",
      localKey: "emitterCompanySiret",
      foreignKey: "orgId"
    },
    {
      type: "AnonymousCompany",
      localKey: "destinationCompanySiret",
      foreignKey: "orgId"
    },
    {
      type: "BsffFicheIntervention",
      localKey: "id",
      foreignKey: "id"
    },
    {
      type: "BsffPackaging",
      localKey: "id",
      foreignKey: "bsffId"
    },
    {
      type: "BsffTransporter",
      localKey: "id",
      foreignKey: "bsffId"
    }
  ],
  Bspaoh: [
    {
      type: "Company",
      localKey: "emitterCompanySiret",
      foreignKey: "orgId"
    },
    {
      type: "Company",
      localKey: "destinationCompanySiret",
      foreignKey: "orgId"
    },
    {
      type: "AnonymousCompany",
      localKey: "emitterCompanySiret",
      foreignKey: "orgId"
    },
    {
      type: "AnonymousCompany",
      localKey: "destinationCompanySiret",
      foreignKey: "orgId"
    },
    {
      type: "BspaohTransporter",
      localKey: "id",
      foreignKey: "bspaohId"
    }
  ],
  Bsvhu: [
    {
      type: "Company",
      localKey: "emitterCompanySiret",
      foreignKey: "orgId"
    },
    {
      type: "Company",
      localKey: "destinationCompanySiret",
      foreignKey: "orgId"
    },
    {
      type: "Company",
      localKey: "destinationOperationNextDestinationCompanySiret",
      foreignKey: "orgId"
    },
    {
      type: "Company",
      localKey: "transporterCompanySiret",
      foreignKey: "orgId"
    },
    {
      type: "AnonymousCompany",
      localKey: "emitterCompanySiret",
      foreignKey: "orgId"
    },
    {
      type: "AnonymousCompany",
      localKey: "destinationCompanySiret",
      foreignKey: "orgId"
    },
    {
      type: "AnonymousCompany",
      localKey: "destinationOperationNextDestinationCompanySiret",
      foreignKey: "orgId"
    },
    {
      type: "AnonymousCompany",
      localKey: "transporterCompanySiret",
      foreignKey: "orgId"
    }
  ],
  Company: [
    {
      type: "TraderReceipt",
      localKey: "traderReceiptId",
      foreignKey: "id"
    },
    {
      type: "BrokerReceipt",
      localKey: "brokerReceiptId",
      foreignKey: "id"
    },
    {
      type: "TransporterReceipt",
      localKey: "transporterReceiptId",
      foreignKey: "id"
    },
    {
      type: "VhuAgrement",
      localKey: "vhuAgrementDemolisseurId",
      foreignKey: "id"
    },
    {
      type: "VhuAgrement",
      localKey: "vhuAgrementBroyeurId",
      foreignKey: "id"
    },
    {
      type: "WorkerCertification",
      localKey: "workerCertificationId",
      foreignKey: "id"
    },
    {
      type: "CompanyAssociation",
      localKey: "id",
      foreignKey: "companyId"
    },
    {
      type: "MembershipRequest",
      localKey: "id",
      foreignKey: "companyId"
    },
    {
      type: "SignatureAutomation",
      localKey: "id",
      foreignKey: "fromId"
    },
    {
      type: "SignatureAutomation",
      localKey: "id",
      foreignKey: "toId"
    },
    {
      type: "WebhookSetting",
      localKey: "orgId",
      foreignKey: "orgId"
    }
  ],
  BsddTransporter: [],
  FormGroupement: [
    {
      type: "Form",
      localKey: "nextFormId",
      foreignKey: "id"
    },
    {
      type: "Form",
      localKey: "initialFormId",
      foreignKey: "id"
    }
  ],
  User: [
    {
      type: "GovernmentAccount",
      localKey: "governmentAccountId",
      foreignKey: "id"
    },
    {
      type: "AccessToken",
      localKey: "id",
      foreignKey: "userId"
    },
    {
      type: "Application",
      localKey: "id",
      foreignKey: "adminId"
    },
    {
      type: "CompanyAssociation",
      localKey: "id",
      foreignKey: "userId"
    },
    {
      type: "FeatureFlag",
      localKey: "id",
      foreignKey: "userId"
    },
    {
      type: "Grant",
      localKey: "id",
      foreignKey: "userId"
    },
    {
      type: "MembershipRequest",
      localKey: "id",
      foreignKey: "userId"
    },
    // {
    //   type: "StatusLog",
    //   localKey: "id",
    //   foreignKey: "userId"
    // },
    {
      type: "UserResetPasswordHash",
      localKey: "id",
      foreignKey: "userId"
    },
    {
      type: "UserActivationHash",
      localKey: "id",
      foreignKey: "userId"
    }
  ],
  StatusLog: [],
  BsddRevisionRequest: [
    {
      type: "Company",
      localKey: "authoringCompanyId",
      foreignKey: "id"
    },
    {
      type: "BsddRevisionRequestApproval",
      localKey: "id",
      foreignKey: "revisionRequestId"
    },
    {
      type: "Company",
      localKey: "traderCompanySiret",
      foreignKey: "orgId"
    },
    {
      type: "Company",
      localKey: "brokerCompanySiret",
      foreignKey: "orgId"
    },
    {
      type: "AnonymousCompany",
      localKey: "traderCompanySiret",
      foreignKey: "orgId"
    },
    {
      type: "AnonymousCompany",
      localKey: "brokerCompanySiret",
      foreignKey: "orgId"
    }
  ],
  IntermediaryFormAssociation: [
    {
      type: "Company",
      localKey: "siret",
      foreignKey: "orgId"
    },
    {
      type: "AnonymousCompany",
      localKey: "siret",
      foreignKey: "orgId"
    }
  ],
  BsddFinalOperation: [
    {
      type: "Form",
      localKey: "finalFormId",
      foreignKey: "id"
    },
    {
      type: "Form",
      localKey: "initialFormId",
      foreignKey: "id"
    }
  ],
  TraderReceipt: [],
  BrokerReceipt: [],
  TransporterReceipt: [],
  VhuAgrement: [],
  WorkerCertification: [],
  CompanyAssociation: [
    {
      type: "Company",
      localKey: "companyId",
      foreignKey: "id"
    },
    {
      type: "User",
      localKey: "userId",
      foreignKey: "id"
    }
  ],
  MembershipRequest: [
    {
      type: "Company",
      localKey: "companyId",
      foreignKey: "id"
    },
    {
      type: "User",
      localKey: "userId",
      foreignKey: "id"
    }
  ],
  SignatureAutomation: [
    {
      type: "Company",
      localKey: "fromId",
      foreignKey: "id"
    },
    {
      type: "Company",
      localKey: "toId",
      foreignKey: "id"
    }
  ],
  GovernmentAccount: [],
  AccessToken: [
    {
      type: "Application",
      localKey: "applicationId",
      foreignKey: "id"
    },
    {
      type: "User",
      localKey: "userId",
      foreignKey: "id"
    }
  ],
  Application: [
    {
      type: "User",
      localKey: "adminId",
      foreignKey: "id"
    },
    {
      type: "AccessToken",
      localKey: "id",
      foreignKey: "applicationId"
    },
    {
      type: "Grant",
      localKey: "id",
      foreignKey: "applicationId"
    }
  ],
  FeatureFlag: [],
  Grant: [
    {
      type: "Application",
      localKey: "applicationId",
      foreignKey: "id"
    },
    {
      type: "User",
      localKey: "userId",
      foreignKey: "id"
    }
  ],
  UserResetPasswordHash: [],
  UserActivationHash: [],
  BsddRevisionRequestApproval: [],
  BsdasriRevisionRequest: [
    {
      type: "Company",
      localKey: "authoringCompanyId",
      foreignKey: "id"
    },
    {
      type: "BsdasriRevisionRequestApproval",
      localKey: "id",
      foreignKey: "revisionRequestId"
    }
  ],
  BsdasriFinalOperation: [
    {
      type: "Bsdasri",
      localKey: "finalBsdasriId",
      foreignKey: "id"
    },
    {
      type: "Bsdasri",
      localKey: "initialBsdasriId",
      foreignKey: "id"
    }
  ],
  BsdasriRevisionRequestApproval: [],
  BsdaTransporter: [
    {
      type: "Company",
      localKey: "transporterCompanySiret",
      foreignKey: "orgId"
    },
    {
      type: "AnonymousCompany",
      localKey: "transporterCompanySiret",
      foreignKey: "orgId"
    }
  ],
  BsdaRevisionRequest: [
    {
      type: "Company",
      localKey: "authoringCompanyId",
      foreignKey: "id"
    },
    {
      type: "BsdaRevisionRequestApproval",
      localKey: "id",
      foreignKey: "revisionRequestId"
    },
    {
      type: "Company",
      localKey: "brokerCompanySiret",
      foreignKey: "orgId"
    },
    {
      type: "AnonymousCompany",
      localKey: "brokerCompanySiret",
      foreignKey: "orgId"
    }
  ],
  IntermediaryBsdaAssociation: [],
  BsdaFinalOperation: [
    {
      type: "Bsda",
      localKey: "finalBsdaId",
      foreignKey: "id"
    },
    {
      type: "Bsda",
      localKey: "initialBsdaId",
      foreignKey: "id"
    }
  ],
  BsdaRevisionRequestApproval: [],
  BsffFicheIntervention: [
    {
      type: "Company",
      localKey: "detenteurCompanySiret",
      foreignKey: "orgId"
    },
    {
      type: "Company",
      localKey: "operateurCompanySiret",
      foreignKey: "orgId"
    },
    {
      type: "AnonymousCompany",
      localKey: "detenteurCompanySiret",
      foreignKey: "orgId"
    },
    {
      type: "AnonymousCompany",
      localKey: "operateurCompanySiret",
      foreignKey: "orgId"
    }
  ],
  BsffPackaging: [
    {
      type: "Company",
      localKey: "operationNextDestinationCompanySiret",
      foreignKey: "orgId"
    },
    {
      type: "AnonymousCompany",
      localKey: "operationNextDestinationCompanySiret",
      foreignKey: "orgId"
    },
    {
      type: "BsffPackaging",
      localKey: "nextPackagingId",
      foreignKey: "id"
    },
    {
      type: "BsffPackaging",
      localKey: "id",
      foreignKey: "nextPackagingId"
    },
    {
      type: "BsffPackagingFinalOperation",
      localKey: "id",
      foreignKey: "finalBsffPackagingId"
    },
    {
      type: "BsffPackagingFinalOperation",
      localKey: "id",
      foreignKey: "initialBsffPackagingId"
    }
  ],
  BsffTransporter: [
    {
      type: "Company",
      localKey: "transporterCompanySiret",
      foreignKey: "orgId"
    },
    {
      type: "AnonymousCompany",
      localKey: "transporterCompanySiret",
      foreignKey: "orgId"
    }
  ],
  BsffPackagingFinalOperation: [
    {
      type: "BsffPackaging",
      localKey: "finalBsffPackagingId",
      foreignKey: "id"
    },
    {
      type: "BsffPackaging",
      localKey: "initialBsffPackagingId",
      foreignKey: "id"
    }
  ],
  BspaohTransporter: [
    {
      type: "Company",
      localKey: "transporterCompanySiret",
      foreignKey: "orgId"
    },
    {
      type: "AnonymousCompany",
      localKey: "transporterCompanySiret",
      foreignKey: "orgId"
    }
  ]
};

const run = async () => {
  let originType: "Form" | "Bsdasri" | "Bsda" | "Bsff" | "Bspaoh" | "Bsvhu";

  const objType = DUMP_OBJ.split("-")?.[0];
  const alreadyFetched: { [key: string]: any } = {};

  if (!objType) {
    throw new Error("DUMP_OBJ is not a valid BSD id");
  }

  switch (objType) {
    case "BSD":
      originType = "Form";
      break;
    case "DASRI":
      originType = "Bsdasri";
      break;
    case "BSDA":
      originType = "Bsda";
      break;
    case "FF":
      originType = "Bsff";
      break;
    case "PAOH":
      originType = "Bspaoh";
      break;
    case "VHU":
      originType = "Bsvhu";
      break;
    default:
      throw new Error("DUMP_OBJ is not a valid BSD id");
  }
  type structItem = {
    type: string;
    obj: any;
    path: string;
    depth: number;
    children: structItem[];
  };

  const struct: structItem[] = [];
  const bsds = await pipelines[originType].getter("readableId", DUMP_OBJ);
  const bsd = bsds?.[0];
  if (!bsd) {
    throw new Error("root BSD not found");
  }
  const bsdRoot: structItem = {
    type: originType,
    obj: bsd,
    path: `${originType}(${bsd.id})`,
    depth: 0,
    children: []
  };
  struct.push(bsdRoot);
  alreadyFetched[bsd.id] = {
    type: originType,
    obj: bsd
  };
  console.log("got BSD Root");
  console.log(bsdRoot.obj.id);
  let maxDepth = 0;

  const recursiveExtract = async (root: structItem) => {
    console.log(`TRAVERSING ${root.path}`);
    if (root.depth > maxDepth) {
      maxDepth = root.depth;
    }
    if (!traversals[root.type]) {
      console.log(`TRAVERSAL NOT AVAILABLE FOR ${root.type}`);
      return;
    }
    for (const item of traversals[root.type]) {
      console.log(
        `fetching ${item.type}, fKey: ${item.foreignKey}, lKey: ${
          root.obj[item.localKey]
        }`
      );
      const getter = pipelines[item.type]?.getter;
      if (!getter) {
        console.log(`MISSING GETTER ${item.type}`);
      }
      // const setter = pipelines[item.type]?.setter;
      const objects = await getter?.(item.foreignKey, root.obj[item.localKey]);
      const filteredObjects = objects?.filter(obj => {
        if (alreadyFetched[obj.id]) {
          return false;
        }
        alreadyFetched[obj.id] = {
          type: item.type,
          obj
        };
        // alreadyFetched[obj.id] = true;
        return true;
      });
      if (filteredObjects?.length) {
        const subRoots: structItem[] = filteredObjects.map(obj => ({
          type: item.type,
          obj,
          path: `${root.path}>${item.type}(${obj.id})`,
          depth: root.depth + 1,
          children: []
        }));
        root.children = [...root.children, ...subRoots];
      }
    }
    for (const subRoot of root.children) {
      await recursiveExtract(subRoot);
    }
  };
  await recursiveExtract(bsdRoot);
  console.log(Object.keys(alreadyFetched));
  console.log("max depth: ", maxDepth);
  const statsByType = {};
  for (const id of Object.keys(alreadyFetched)) {
    if (!statsByType[alreadyFetched[id].type]) {
      statsByType[alreadyFetched[id].type] = 1;
    } else {
      statsByType[alreadyFetched[id].type] += 1;
    }
  }
  console.log(statsByType);
  const alreadySaved: { [key: string]: boolean } = {};
  const allSaved = () => {
    return !Object.keys(alreadyFetched).some(id => !alreadySaved[id]);
  };
  while (!allSaved()) {
    for (const id of Object.keys(alreadyFetched)) {
      if (alreadySaved[id]) {
        continue;
      }
      const setter = pipelines[alreadyFetched[id].type]?.setter;
      if (!setter) {
        throw new Error(`no setter for type ${alreadyFetched[id].type}`);
      }
      try {
        await setter(alreadyFetched[id].obj);
        alreadySaved[id] = true;
        console.log(`saved ${alreadyFetched[id].type} ${id}`);
      } catch (error) {
        console.log(`could not save ${alreadyFetched[id].type} ${id}`);
      }
    }
  }
};

run();
