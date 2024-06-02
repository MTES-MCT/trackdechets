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

/*
  This is an object that contains getters and setters to fetch various object types from the source DB
  and write them to the destionation DB.

  Most of them look the same, but some setters are a bit different to handle Json values, and some getters
  are different to handle things like implicit many-to-many relations.
*/

const getPipelines = (
  prismaLocal: PrismaClient,
  prismaRemote: PrismaClient
) => ({
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
});

export default getPipelines;
