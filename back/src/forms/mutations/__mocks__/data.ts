import { GraphQLContext } from "../../../types";
import {
  EmitterType,
  QuantityType,
  Form as PrismaForm
} from "../../../generated/prisma-client";
import {
  Packagings,
  Form as GraphQLForm
} from "../../../generated/graphql/types";

export function getNewValidPrismaForm(): PrismaForm {
  return {
    id: "cjplbvecc000d0766j32r19am",
    readableId: "TD-xxx",
    createdAt: "2018-12-11T00:00:00.000Z",
    updatedAt: "2018-12-11T00:00:00.000Z",
    status: "DRAFT",
    emitterType: "PRODUCER",
    emitterWorkSiteName: "",
    emitterWorkSiteAddress: "",
    emitterWorkSiteCity: "",
    emitterWorkSitePostalCode: "",
    emitterWorkSiteInfos: "",
    emitterCompanyName: "A company 2",
    emitterCompanySiret: "XXX XXX XXX 0002",
    emitterCompanyAddress: "8 rue du Général de Gaulle",
    emitterCompanyContact: "Emetteur",
    emitterCompanyPhone: "01",
    emitterCompanyMail: "e@e.fr",
    recipientCap: "1234",
    recipientProcessingOperation: "D 6",
    recipientCompanyName: "A company 3",
    recipientCompanySiret: "XXX XXX XXX 0003",
    recipientCompanyAddress: "8 rue du Général de Gaulle",
    recipientCompanyContact: "Destination",
    recipientCompanyPhone: "02",
    recipientCompanyMail: "d@d.fr",
    recipientIsTempStorage: false,
    transporterReceipt: "sdfg",
    transporterDepartment: "82",
    transporterValidityLimit: "2018-12-11T00:00:00.000Z",
    transporterNumberPlate: "12345",
    transporterCompanyName: "A company 4",
    transporterCompanySiret: "XXX XXX XXX 0004",
    transporterCompanyAddress: "8 rue du Général de Gaulle",
    transporterCompanyContact: "Transporteur",
    transporterCompanyPhone: "03",
    transporterCompanyMail: "t@t.fr",
    wasteDetailsCode: "01 03 04*",
    wasteDetailsOnuCode: "AAA",
    wasteDetailsPackagings: ["CITERNE", "GRV"],
    wasteDetailsOtherPackaging: "",
    wasteDetailsNumberOfPackages: 2,
    wasteDetailsQuantity: 1.5,
    wasteDetailsQuantityType: "REAL"
  };
}

export function getNewValidForm(): GraphQLForm {
  return {
    id: "cjplbvecc000d0766j32r19am",
    readableId: "TD-xxx",
    status: "DRAFT",
    emitter: {
      type: "PRODUCER" as EmitterType,
      workSite: {
        name: "",
        address: "",
        city: "",
        postalCode: "",
        infos: ""
      },
      company: {
        name: "A company 2",
        siret: "XXX XXX XXX 0002",
        address: "8 rue du Général de Gaulle",
        contact: "Emetteur",
        phone: "01",
        mail: "e@e.fr"
      }
    },
    recipient: {
      cap: "1234",
      processingOperation: "D 6",
      company: {
        name: "A company 3",
        siret: "XXX XXX XXX 0003",
        address: "8 rue du Général de Gaulle",
        contact: "Destination",
        phone: "02",
        mail: "d@d.fr"
      },
      isTempStorage: false
    },
    transporter: {
      receipt: "sdfg",
      department: "82",
      validityLimit: "2018-12-11T00:00:00.000Z",
      numberPlate: "12345",
      company: {
        name: "A company 4",
        siret: "XXX XXX XXX 0004",
        address: "8 rue du Général de Gaulle",
        contact: "Transporteur",
        phone: "03",
        mail: "t@t.fr"
      }
    },
    wasteDetails: {
      code: "01 03 04*",
      onuCode: "AAA",
      packagings: ["CITERNE", "GRV"] as Packagings[],
      otherPackaging: "",
      numberOfPackages: 2,
      quantity: 1.5,
      quantityType: "REAL" as QuantityType
    }
  };
}

const EMPTY_FORM = {
  emitter: {
    type: "PRODUCER",
    workSite: {
      name: "",
      address: "",
      city: "",
      postalCode: "",
      infos: ""
    },
    company: {
      siret: "",
      name: "",
      address: "",
      contact: "Contact",
      mail: "",
      phone: ""
    }
  },
  recipient: {
    cap: "",
    processingOperation: "",
    isTempStorage: false,
    company: {
      siret: "",
      name: "",
      address: "",
      contact: "",
      mail: "",
      phone: ""
    }
  },
  transporter: {
    isExemptedOfReceipt: false,
    receipt: "",
    department: "",
    validityLimit: null,
    numberPlate: "",
    company: {
      siret: "",
      name: "",
      address: "",
      contact: "",
      mail: "",
      phone: ""
    }
  },
  trader: {
    receipt: "",
    department: "",
    validityLimit: null,
    company: {
      siret: "",
      name: "",
      address: "",
      contact: "",
      mail: "",
      phone: ""
    }
  },
  wasteDetails: {
    code: "",
    name: "",
    onuCode: "",
    packagings: [],
    otherPackaging: "",
    numberOfPackages: null,
    quantity: null,
    quantityType: "ESTIMATED",
    consistence: "SOLID"
  },
  appendix2Forms: [],
  ecoOrganisme: {},
  temporaryStorageDetail: {
    destination: {
      company: {
        siret: "",
        name: "",
        address: "",
        contact: "",
        mail: "",
        phone: ""
      },
      cap: "",
      processingOperation: ""
    }
  }
};

// Don't expose the object to avoid sharing modified values of it
// Instead, only pass deep clone
export function getEmptyForm(): typeof EMPTY_FORM & { id?: string } {
  return JSON.parse(JSON.stringify(EMPTY_FORM));
}

/**
 * return default context object
 */
export function getContext(): GraphQLContext {
  return {
    user: {
      id: "userId",
      name: "username",
      email: "user@trackdechets.fr",
      password: "pass",
      createdAt: "",
      updatedAt: ""
    },
    req: null as any,
    res: null as any
  };
}
