import { hash } from "bcrypt";
import {
  CompanyType,
  Consistence,
  EmitterType,
  QuantityType,
  prisma,
  UserRole,
  Status,
  CompanyCreateInput,
  FormCreateInput
} from "../generated/prisma-client";

/**
 * Create a user with name and email
 * @param opt: extra parameters
 */
export const userFactory = async (opt = {}) => {
  const defaultPassword = await hash("pass", 10);
  const userIndex = (await prisma.usersConnection().aggregate().count()) + 1;
  const data = {
    name: `User_${userIndex}`,
    email: `user_${userIndex}@td.io`,
    password: defaultPassword,
    isActive: true,
    ...opt
  };

  return prisma.createUser(data);
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
  companyOpts: Partial<CompanyCreateInput> = {}
) => {
  const opts = companyOpts || {};
  const companyIndex =
    (await prisma.companiesConnection().aggregate().count()) + 1;
  return prisma.createCompany({
    siret: siretify(companyIndex),
    companyTypes: {
      set: ["PRODUCER" as CompanyType]
    },
    name: `company_${companyIndex}`,
    securityCode: 1234,
    ...opts
  });
};

/**
 * Create a company and a member
 * @param role: user role in the company
 */
export const userWithCompanyFactory = async (
  role,
  companyOpts: Partial<CompanyCreateInput> = {}
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

/**
 * Create a user and an accessToken
 * @param opt : extra parameters for user
 */
export const userWithAccessTokenFactory = async (opt = {}) => {
  const user = await userFactory(opt);

  const accessTokenIndex =
    (await prisma.accessTokensConnection().aggregate().count()) + 1;

  const accessToken = await prisma.createAccessToken({
    token: `token_${accessTokenIndex}`,
    user: { connect: { id: user.id } }
  });
  return { user, accessToken };
};

const formdata = {
  wasteDetailsQuantity: 22.5,
  signedByTransporter: true,
  emitterCompanyName: "WASTE PRODUCER",
  transporterCompanyName: "WASTE TRANSPORTER",
  traderCompanyAddress: "",
  transporterReceipt: "33AA",
  quantityReceived: null,
  processedAt: null,
  wasteDetailsOnuCode: "",
  emitterType: "PRODUCER" as EmitterType,
  traderValidityLimit: null,
  traderCompanyContact: "",
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
  transporterCompanySiret: "9876",
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
  wasteAcceptationStatus: null,
  customId: null,
  isDeleted: false,
  transporterCompanyContact: "transporter",
  traderCompanyMail: "",
  emitterCompanyAddress: "20 Avenue de la 1ère Dfl 13000 Marseille",
  sentBy: "signe",
  status: "SENT" as Status,
  wasteRefusalReason: "",
  recipientCompanySiret: "5678",
  transporterCompanyMail: "transporter@td.io",
  wasteDetailsName: "Divers",
  traderDepartment: "",
  recipientCompanyContact: "Jean Dupont",
  receivedAt: null,
  transporterIsExemptedOfReceipt: false,
  sentAt: "2019-11-20T00:00:00.000Z",
  traderCompanySiret: "",
  transporterNumberPlate: "aa22",
  recipientProcessingOperation: "D 6",
  wasteDetailsPackagings: ["CITERNE"],
  transporterValidityLimit: "2019-11-27T00:00:00.000Z",
  emitterCompanyContact: "Marc Martin",
  traderReceipt: "",
  wasteDetailsQuantityType: "ESTIMATED" as QuantityType,
  transporterCompanyPhone: "06 18 76 02 66",
  recipientCompanyMail: "recipient@td.io",
  wasteDetailsConsistence: "SOLID" as Consistence,
  wasteDetailsNumberOfPackages: 1,
  traderCompanyPhone: "",
  noTraceability: null,
  emitterCompanySiret: "1234",
  processingOperationDone: null,
  recipientCompanyName: "WASTE COMPANY"
};

export const transportSegmentFactory = async ({ formId, segmentPayload }) => {
  return prisma.createTransportSegment({
    form: { connect: { id: formId } },
    ...segmentPayload
  });
};

/**
 * Thread-safe version of getReadableId for tests
 */
export function getReadableId() {
  const year = new Date().getFullYear().toString().slice(-2);
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const uid = Array.from({ length: 8 })
    .map(() => chars.charAt(Math.floor(Math.random() * chars.length)))
    .join("");

  return `TD-${year}-${uid}`;
}

export const formFactory = async ({
  ownerId,
  opt = {}
}: {
  ownerId: string;
  opt?: Partial<FormCreateInput>;
}) => {
  const formParams = { ...formdata, ...opt };
  return prisma.createForm({
    readableId: getReadableId(),
    ...formParams,
    owner: { connect: { id: ownerId } }
  });
};

export const statusLogFactory = async ({
  status,
  userId,
  formId,
  updatedFields = {},
  opt = {}
}) => {
  return prisma.createStatusLog({
    form: { connect: { id: formId } },
    user: { connect: { id: userId } },
    loggedAt: new Date(),
    status,
    updatedFields,
    ...opt
  });
};

export const applicationFactory = async () => {
  const admin = await userFactory();

  const applicationIndex =
    (await prisma.applicationsConnection().aggregate().count()) + 1;

  const application = await prisma.createApplication({
    admins: { connect: { id: admin.id } },
    clientSecret: `Secret_${applicationIndex}`,
    name: `Application_${applicationIndex}`,
    redirectUris: { set: ["https://acme.inc/authorize"] }
  });

  return application;
};
