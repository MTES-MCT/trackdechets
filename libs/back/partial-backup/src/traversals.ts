/*
This is an object that contains relations to load for each type of object.
This is used to "traverse" the database from the origin BSD, and get all related objects.

This is not a complete representation of the DB's relations, as some could lead to loading useless BSDs and going too deep.
Also some objects that are not very useful for reproducing issues and take a LOT of queries to fetch (StatusLog, Events) are sometimes omitted.
*/

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
    // {
    //   type: "MembershipRequest",
    //   localKey: "id",
    //   foreignKey: "companyId"
    // },
    // {
    //   type: "SignatureAutomation",
    //   localKey: "id",
    //   foreignKey: "fromId"
    // },
    // {
    //   type: "SignatureAutomation",
    //   localKey: "id",
    //   foreignKey: "toId"
    // },
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
    // {
    //   type: "AccessToken",
    //   localKey: "id",
    //   foreignKey: "userId"
    // },
    {
      type: "Application",
      localKey: "id",
      foreignKey: "adminId"
    },
    // {
    //   type: "CompanyAssociation",
    //   localKey: "id",
    //   foreignKey: "userId"
    // },
    {
      type: "FeatureFlag",
      localKey: "id",
      foreignKey: "userId"
    },
    // {
    //   type: "Grant",
    //   localKey: "id",
    //   foreignKey: "userId"
    // },
    // {
    //   type: "MembershipRequest",
    //   localKey: "id",
    //   foreignKey: "userId"
    // },
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
    }
    // {
    //   type: "AccessToken",
    //   localKey: "id",
    //   foreignKey: "applicationId"
    // },
    // {
    //   type: "Grant",
    //   localKey: "id",
    //   foreignKey: "applicationId"
    // }
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
  ],
  AnonymousCompany: []
};

export default traversals;
