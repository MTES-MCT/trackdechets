import { hash } from "bcrypt";
import getReadableId from "../forms/readableId";
import {
  CompanyType,
  Consistence,
  EmitterType,
  QuantityType,
  Status,
  UserRole,
  Prisma
} from "@prisma/client";
import prisma from "../prisma";
import { hashToken } from "../utils";
/**
 * Create a user with name and email
 * @param opt: extra parameters
 */
export const userFactory = async (
  opt: Partial<Prisma.UserCreateInput> = {}
) => {
  const defaultPassword = await hash("pass", 10);
  const userIndex = (await prisma.user.count()) + 1;
  const data = {
    name: `User_${userIndex}`,
    email: `user_${userIndex}@td.io`,
    password: defaultPassword,
    isActive: true,
    ...opt
  };

  return prisma.user.create({ data });
};

/**
 * Left pad a given index with 0s
 * @param index numerical index
 */
function siretify(index) {
  const siretLength = 14;
  const siret = `${index}`;
  if (siret.length === siretLength) {
    return siret;
  }
  if (siret.length > siretLength) {
    throw Error("Generated siret is too long");
  }
  // polyfill for str.padStart
  const padding = "0".repeat(siretLength - siret.length);
  return padding + siret;
}

/**
 * Create a company with name, siret, security code and PORDUCER by default
 * @param opt: extram parameters
 */
export const companyFactory = async (
  companyOpts: Partial<Prisma.CompanyCreateInput> = {}
) => {
  const opts = companyOpts || {};
  const companyIndex = (await prisma.company.count()) + 1;
  return prisma.company.create({
    data: {
      siret: siretify(companyIndex),
      companyTypes: {
        set: ["PRODUCER" as CompanyType]
      },
      name: `company_${companyIndex}`,
      securityCode: 1234,
      ...opts
    }
  });
};

/**
 * Create a company and a member
 * @param role: user role in the company
 */
export const userWithCompanyFactory = async (
  role: UserRole,
  companyOpts: Partial<Prisma.CompanyCreateInput> = {}
) => {
  const company = await companyFactory(companyOpts);

  const user = await userFactory({
    companyAssociations: {
      create: {
        company: { connect: { siret: company.siret } },
        role: role as UserRole
      }
    }
  });
  return { user, company };
};

export const destinationFactory = async (
  companyOpts: Partial<Prisma.CompanyCreateInput> = {}
) => {
  const { company: destination } = await userWithCompanyFactory(
    UserRole.MEMBER,
    {
      ...companyOpts,
      companyTypes: {
        set: [CompanyType.WASTEPROCESSOR]
      }
    }
  );
  return destination;
};

/**
 * Create a user and an accessToken
 * @param opt : extra parameters for user
 */
export const userWithAccessTokenFactory = async (opt = {}) => {
  const user = await userFactory(opt);

  const accessTokenIndex = (await prisma.accessToken.count()) + 1;
  const clearToken = `token_${accessTokenIndex}`;
  await prisma.accessToken.create({
    data: {
      token: hashToken(clearToken),
      user: { connect: { id: user.id } }
    }
  });
  return { user, accessToken: clearToken };
};

const formdata = {
  wasteDetailsQuantity: 22.5,
  signedByTransporter: true,
  emitterCompanyName: "WASTE PRODUCER",
  transporterCompanyName: "WASTE TRANSPORTER",
  traderCompanyAddress: "",
  brokerCompanyAddress: "",
  transporterReceipt: "33AA",
  quantityReceived: null,
  processedAt: null,
  wasteDetailsOnuCode: "2003",
  emitterType: "PRODUCER" as EmitterType,
  traderValidityLimit: null,
  traderCompanyContact: "",
  brokerCompanyContact: "",
  wasteDetailsCode: "05 01 04*",
  processedBy: null,
  recipientCompanyAddress: "16 rue Jean Jaurès 92400 Courbevoie",
  transporterDepartment: "86",
  emitterWorkSiteName: "",
  emitterWorkSiteAddress: "",
  emitterWorkSiteCity: "",
  emitterWorkSitePostalCode: "",
  emitterWorkSiteInfos: "",
  recipientCap: "",
  emitterCompanyPhone: "06 18 76 02 96",
  isAccepted: null,
  emitterCompanyMail: "emitter@compnay.fr",
  wasteDetailsOtherPackaging: "",
  receivedBy: null,
  transporterCompanySiret: "12345678974589",
  processingOperationDescription: null,
  transporterCompanyAddress: "16 rue Jean Jaurès 92400 Courbevoie",
  nextDestinationProcessingOperation: null,
  nextDestinationCompanyAddress: null,
  nextDestinationCompanyPhone: null,
  nextDestinationCompanyMail: null,
  nextDestinationCompanyContact: null,
  nextDestinationCompanySiret: null,
  recipientCompanyPhone: "06 18 76 02 99",
  traderCompanyName: "",
  brokerCompanyName: "",
  wasteAcceptationStatus: null,
  customId: null,
  isDeleted: false,
  transporterCompanyContact: "transporter",
  traderCompanyMail: "",
  brokerCompanyMail: "",
  emitterCompanyAddress: "20 Avenue de la 1ère Dfl 13000 Marseille",
  sentBy: "signe",
  status: "SENT" as Status,
  wasteRefusalReason: "",
  recipientCompanySiret: "56847895684123",
  transporterCompanyMail: "transporter@td.io",
  wasteDetailsName: "Divers",
  traderDepartment: "",
  recipientCompanyContact: "Jean Dupont",
  receivedAt: null,
  transporterIsExemptedOfReceipt: false,
  sentAt: "2019-11-20T00:00:00.000Z",
  traderCompanySiret: "",
  brokerCompanySiret: "",
  transporterNumberPlate: "aa22",
  recipientProcessingOperation: "D 6",
  wasteDetailsPackagingInfos: [{ type: "CITERNE", quantity: 1 }],
  transporterValidityLimit: "2019-11-27T00:00:00.000Z",
  emitterCompanyContact: "Marc Martin",
  traderReceipt: "",
  wasteDetailsQuantityType: "ESTIMATED" as QuantityType,
  transporterCompanyPhone: "06 18 76 02 66",
  recipientCompanyMail: "recipient@td.io",
  wasteDetailsConsistence: "SOLID" as Consistence,
  wasteDetailsPop: false,
  traderCompanyPhone: "",
  brokerCompanyPhone: "",
  noTraceability: null,
  emitterCompanySiret: "15397456982146",
  processingOperationDone: null,
  recipientCompanyName: "WASTE COMPANY"
};

export const tempStorageData: Prisma.TemporaryStorageDetailCreateInput = {
  tempStorerQuantityType: "ESTIMATED",
  tempStorerQuantityReceived: 1,
  tempStorerWasteAcceptationStatus: "ACCEPTED",
  tempStorerWasteRefusalReason: null,
  tempStorerReceivedAt: "2019-12-20T00:00:00.000Z",
  tempStorerReceivedBy: "John Dupont",
  tempStorerSignedAt: "2019-12-20T00:00:00.000Z",
  destinationIsFilledByEmitter: true,
  destinationCompanyName: "Incinérateur du Grand Est",
  destinationCompanySiret: "65478235968471",
  destinationCompanyAddress: "4 chemin des déchets, Mulhouse",
  destinationCompanyContact: "Louis Henry",
  destinationCompanyPhone: "0700000000",
  destinationCompanyMail: "louis.henry@idge.org",
  destinationCap: "",
  destinationProcessingOperation: "R 1",
  wasteDetailsOnuCode: "",
  wasteDetailsPackagingInfos: null,
  wasteDetailsQuantity: 1,
  wasteDetailsQuantityType: "ESTIMATED",
  transporterCompanyName: "Transporteur",
  transporterCompanySiret: "36947581236985",
  transporterCompanyAddress: "6 chemin des pneus, 07100 Bourg d'ici",
  transporterCompanyContact: "Mathieu O'connor",
  transporterCompanyPhone: "0700000000",
  transporterCompanyMail: "mathieu@transporteur.org",
  transporterIsExemptedOfReceipt: false,
  transporterReceipt: "xxxxxx",
  transporterDepartment: "07",
  transporterValidityLimit: "2019-11-27T00:00:00.000Z",
  transporterNumberPlate: "AD-007-XX",
  signedByTransporter: true,
  signedBy: "Mathieu O'connor",
  signedAt: "2019-11-28T00:00:00.000Z"
};

export const transportSegmentFactory = async ({ formId, segmentPayload }) => {
  return prisma.transportSegment.create({
    data: {
      form: { connect: { id: formId } },
      ...segmentPayload
    }
  });
};

export const formFactory = async ({
  ownerId,
  opt = {}
}: {
  ownerId: string;
  opt?: Partial<Prisma.FormCreateInput>;
}) => {
  const formParams = { ...formdata, ...opt };
  return prisma.form.create({
    data: {
      readableId: getReadableId(),
      ...formParams,
      owner: { connect: { id: ownerId } }
    }
  });
};

export const formWithTempStorageFactory = async ({
  ownerId,
  opt = {},
  tempStorageOpts = {}
}: {
  ownerId: string;
  opt?: Partial<Prisma.FormCreateInput>;
  tempStorageOpts?: Partial<Prisma.TemporaryStorageDetailCreateInput>;
}) => {
  return formFactory({
    ownerId,
    opt: {
      recipientIsTempStorage: true,
      temporaryStorageDetail: {
        create: { ...tempStorageData, ...tempStorageOpts }
      },
      ...opt
    }
  });
};

export const statusLogFactory = async ({
  status,
  userId,
  formId,
  updatedFields = {},
  opt = {}
}) => {
  return prisma.statusLog.create({
    data: {
      form: { connect: { id: formId } },
      user: { connect: { id: userId } },
      loggedAt: new Date(),
      authType: "SESSION",
      status,
      updatedFields,
      ...opt
    }
  });
};

export const applicationFactory = async () => {
  const admin = await userFactory();

  const applicationIndex = (await prisma.application.count()) + 1;

  const application = await prisma.application.create({
    data: {
      admins: { connect: { id: admin.id } },
      clientSecret: `Secret_${applicationIndex}`,
      name: `Application_${applicationIndex}`,
      redirectUris: ["https://acme.inc/authorize"]
    }
  });

  return application;
};
