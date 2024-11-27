import { hash } from "bcrypt";
import { faker } from "@faker-js/faker";
import getReadableId, { ReadableIdPrefix } from "../forms/readableId";
import {
  CompanyType,
  Consistence,
  EmitterType,
  QuantityType,
  Status,
  UserRole,
  User,
  Prisma,
  Company,
  WasteProcessorType,
  CollectorType,
  TransportMode
} from "@prisma/client";
import { prisma } from "@td/prisma";
import { hashToken } from "../utils";
import { createUser, getUserCompanies } from "../users/database";
import { getFormSiretsByRole, SIRETS_BY_ROLE_INCLUDE } from "../forms/database";
import { CompanyRole } from "../common/validation/zod/schema";
import { getDefaultNotifications } from "../users/notifications";

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

  return createUser({ data });
};

/**
 * Return a random valid siret
 * a random number will not pass the luhnCheck
 * @param index numerical index
 */
export function siretify(index?: number) {
  if (index && index <= 9) {
    // Compatibility with an old version of siretify using
    // a company index. This should be refactored to remove
    // index everywhere in the function calls to siretify
    return faker.helpers.replaceCreditCardSymbols(
      Math.abs(index) + "############L"
    );
  }

  return faker.helpers.replaceCreditCardSymbols("#############L");
}

/**
 * Create a company with name, siret, security code and PRODUCER by default
 * @param opt: extram parameters
 */
export const companyFactory = async (
  companyOpts: Partial<Prisma.CompanyCreateInput> = {}
) => {
  const opts = companyOpts || {};

  const companyIndex = (await prisma.company.count()) + 1;

  const siret = opts.siret ?? siretify(companyIndex);
  return prisma.company.create({
    data: {
      orgId: opts.vatNumber ?? siret,
      siret: opts.vatNumber ? null : siret,
      companyTypes: {
        set: [
          "PRODUCER",
          "TRANSPORTER",
          "WASTEPROCESSOR",
          "WORKER",
          "WASTE_VEHICLES"
        ]
      },
      name: `company_${companyIndex}`,
      givenName: `Company Given Name`,
      contact: "Company Contact",
      securityCode: 1234,
      verificationCode: "34567",
      address: "Champ de Mars, 5 Av. Anatole France, 75007 Paris",
      codeDepartement: "75",
      contactEmail: `contact_${companyIndex}@gmail.com`,
      contactPhone: `+${companyIndex} 606060606`,
      verificationStatus: "VERIFIED",
      ...opts
    }
  });
};

/**
 * Create a company with name, siret, security code and PRODUCER by default
 * and associate that company to the user
 * @param opt: extram parameters
 */
export const companyAssociatedToExistingUserFactory = async (
  user: User,
  role: UserRole,
  companyOpts: Partial<Prisma.CompanyCreateInput> = {}
) => {
  const company = await companyFactory(companyOpts);

  await prisma.companyAssociation.create({
    data: {
      company: { connect: { id: company.id } },
      user: { connect: { id: user.id } },
      role
    }
  });

  return company;
};

export interface UserWithCompany {
  user: User;
  company: Company;
}

/**
 * Create a company and a member
 * @param role: user role in the company
 */
export const userWithCompanyFactory = async (
  role: UserRole = "ADMIN",
  companyOpts: Partial<Prisma.CompanyCreateInput> = {},
  userOpts: Partial<Prisma.UserCreateInput> = {},
  companyAssociationOpts: Partial<Prisma.CompanyAssociationCreateInput> = {}
): Promise<UserWithCompany> => {
  const company = await companyFactory(companyOpts);

  const notifications = getDefaultNotifications(role);

  const user = await userFactory({
    ...userOpts,
    companyAssociations: {
      create: {
        company: { connect: { id: company.id } },
        ...notifications,
        role,
        ...companyAssociationOpts
      }
    }
  });
  return { user, company };
};

/**
 * Create a user and add him to an existing company
 */
export const userInCompany = async (
  role: UserRole = "ADMIN",
  companyId: string,
  userOpts: Partial<Prisma.UserCreateInput> = {}
) => {
  const user = await userFactory({
    ...userOpts,
    companyAssociations: {
      create: {
        company: { connect: { id: companyId } },
        role: role,
        ...getDefaultNotifications(role)
      }
    }
  });

  return user;
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
      },
      wasteProcessorTypes: {
        set: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
      }
    }
  );
  return destination;
};

/**
 * Create a user and an accessToken
 * @param opt : extra parameters for user
 */
export const userWithAccessTokenFactory = async (
  opt: Partial<Prisma.UserCreateInput> = {}
) => {
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

/**
 * Will create a membership request from user to company
 */
export const createMembershipRequest = async (
  user: User,
  company: Company,
  opt = {}
) => {
  return await prisma.membershipRequest.create({
    data: {
      userId: user.id,
      companyId: company.id,
      ...opt
    }
  });
};

/**
 * Returns the destination info for a BSD
 */
export const getDestinationCompanyInfo = async () => {
  const destinationCompany = await companyFactory();
  return {
    destination: {
      company: {
        name: destinationCompany.name,
        address: destinationCompany.address,
        phone: destinationCompany.contactPhone,
        siret: destinationCompany.siret,
        contact: destinationCompany.contact
      }
    }
  };
};

export const bsddTransporterData: Omit<
  Prisma.BsddTransporterCreateInput,
  "number"
> = {
  transporterCompanyAddress: "16 rue Jean Jaurès 92400 Courbevoie",
  transporterCompanyContact: "transporter",
  transporterCompanyMail: "transporter@td.io",
  transporterCompanyName: "WASTE TRANSPORTER",
  transporterCompanyPhone: "06 18 76 02 66",
  transporterCompanySiret: siretify(1),
  transporterDepartment: "86",
  transporterIsExemptedOfReceipt: false,
  transporterTransportMode: TransportMode.ROAD,
  transporterNumberPlate: "aa22",
  transporterReceipt: "33AA",
  transporterValidityLimit: "2019-11-27T00:00:00.000Z",
  readyToTakeOver: true
};

const formdata: Partial<Prisma.FormCreateInput> = {
  brokerCompanyAddress: "",
  brokerCompanyContact: "",
  brokerCompanyMail: "",
  brokerCompanyName: "",
  brokerCompanyPhone: "",
  brokerCompanySiret: "",
  customId: null,
  emitterCompanyAddress: "20 Avenue de la 1ère Dfl 13000 Marseille",
  emitterCompanyContact: "Marc Martin",
  emitterCompanyMail: "emitter@compnay.fr",
  emitterCompanyName: "WASTE PRODUCER",
  emitterCompanyPhone: "06 18 76 02 96",
  emitterCompanySiret: siretify(1),
  emitterType: "PRODUCER" as EmitterType,
  emitterWorkSiteAddress: "",
  emitterWorkSiteCity: "",
  emitterWorkSiteInfos: "",
  emitterWorkSiteName: "",
  emitterWorkSitePostalCode: "",
  isAccepted: null,
  isDeleted: false,
  nextDestinationCompanyAddress: null,
  nextDestinationCompanyContact: null,
  nextDestinationCompanyMail: null,
  nextDestinationCompanyPhone: null,
  nextDestinationCompanySiret: null,
  nextDestinationProcessingOperation: null,
  noTraceability: null,
  processedAt: null,
  processedBy: null,
  processingOperationDescription: null,
  processingOperationDone: null,
  quantityReceived: null,
  receivedAt: null,
  receivedBy: null,
  recipientCap: "I am a CAP",
  recipientCompanyAddress: "16 rue Jean Jaurès 92400 Courbevoie",
  recipientCompanyContact: "Jean Dupont",
  recipientCompanyMail: "recipient@td.io",
  recipientCompanyName: "WASTE COMPANY",
  recipientCompanyPhone: "06 18 76 02 99",
  recipientCompanySiret: siretify(2),
  recipientProcessingOperation: "D 6",
  sentAt: "2019-11-20T00:00:00.000Z",
  sentBy: "signe",
  signedByTransporter: true,
  status: "SENT" as Status,
  traderCompanyAddress: "",
  traderCompanyContact: "",
  traderCompanyMail: "",
  traderCompanyName: "",
  traderCompanyPhone: "",
  traderCompanySiret: "",
  traderDepartment: "",
  traderReceipt: "",
  traderValidityLimit: null,
  transporters: {
    create: { ...bsddTransporterData, number: 1 }
  },
  wasteAcceptationStatus: null,
  wasteDetailsCode: "05 01 04*",
  wasteDetailsConsistence: "SOLID" as Consistence,
  wasteDetailsIsDangerous: true,
  wasteDetailsName: "Divers",
  wasteDetailsOnuCode: "2003",
  wasteDetailsPackagingInfos: [{ type: "CITERNE", quantity: 1 }],
  wasteDetailsPop: false,
  wasteDetailsQuantity: 22.5,
  wasteDetailsQuantityType: "ESTIMATED" as QuantityType,
  wasteRefusalReason: null
};

export const forwardedInData: Partial<Prisma.FormCreateInput> = {
  status: "RESENT",
  quantityReceived: 1,
  wasteAcceptationStatus: "ACCEPTED",
  wasteRefusalReason: null,
  receivedAt: "2019-12-20T00:00:00.000Z",
  receivedBy: "John Dupont",
  signedAt: "2019-12-20T00:00:00.000Z",
  recipientCompanyName: "Incinérateur du Grand Est",
  recipientCompanySiret: siretify(3),
  recipientCompanyAddress: "4 chemin des déchets, Mulhouse",
  recipientCompanyContact: "Louis Henry",
  recipientCompanyPhone: "0700000000",
  recipientCompanyMail: "louis.henry@idge.org",
  recipientCap: "CAP",
  recipientProcessingOperation: "R 1",
  wasteDetailsCode: "05 01 04*",
  wasteDetailsName: "Déchets divers",
  wasteDetailsIsDangerous: true,
  wasteDetailsOnuCode: "2003",
  wasteDetailsPackagingInfos: [{ type: "CITERNE", quantity: 1 }],
  wasteDetailsQuantity: 1,
  wasteDetailsConsistence: "SOLID" as Consistence,
  wasteDetailsQuantityType: "ESTIMATED",
  transporters: {
    create: { ...bsddTransporterData, number: 1 }
  },

  signedByTransporter: true,
  signedBy: "Mathieu O'connor"
};

export const bsddTransporterFactory = async ({
  formId,
  opts
}: {
  formId: string;
  opts: Omit<Prisma.BsddTransporterCreateWithoutFormInput, "number">;
}) => {
  const count = await prisma.bsddTransporter.count({ where: { formId } });
  const transporter = await prisma.bsddTransporter.create({
    data: {
      form: { connect: { id: formId } },
      ...bsddTransporterData,
      number: count + 1,
      ...opts
    }
  });

  const form = await prisma.form.findFirstOrThrow({
    where: { id: formId },
    include: {
      ...SIRETS_BY_ROLE_INCLUDE,
      forwardedIn: true,
      transporters: true
    }
  });

  // Fix fields like "recipientsSirets" or "transportersSirets"
  const denormalizedSirets = getFormSiretsByRole(form as any); // Ts doesn't infer correctly because of the boolean
  await prisma.form.update({
    where: { id: formId },
    data: { ...denormalizedSirets, updatedAt: form.updatedAt }
  });

  return transporter;
};

export const upsertBaseSiret = async ({
  siret,
  companyTypes = ["TRANSPORTER", "WASTEPROCESSOR", "WORKER"],
  wasteProcessorTypes = [],
  collectorTypes = []
}: {
  siret: string;
  companyTypes?: CompanyType[];
  wasteProcessorTypes?: WasteProcessorType[];
  collectorTypes?: CollectorType[];
}) => {
  const exists = await prisma.company.findUnique({ where: { siret } });
  if (!exists) {
    // Using prisma.upsert gives us "Unique constraint failed on the fields: (`siret`)"
    // Instead we create if it didn't exist upon entry, and ignore errors.
    try {
      await prisma.company.create({
        data: {
          orgId: siret,
          siret,
          companyTypes: {
            set: companyTypes
          },
          wasteProcessorTypes: {
            set: wasteProcessorTypes
          },
          collectorTypes: {
            set: collectorTypes
          },
          name: `company_${siret}`,
          securityCode: 1234,
          verificationCode: "34567",
          verificationStatus: "VERIFIED",
          address: "Champ de Mars, 5 Av. Anatole France, 75007 Paris",
          contactEmail: `contact_${siret}@gmail.com`,
          contactPhone: `+${siret}`
        }
      });
    } catch (_) {
      // Must have been already created (race condition). Just ignore
    }
  }
};

export const formFactory = async ({
  ownerId,
  opt = {}
}: {
  ownerId: string;
  opt?: Partial<Prisma.FormCreateInput>;
}) => {
  // Those sirets are required for the form to be updatable

  await upsertBaseSiret({
    siret: (formdata.transporters!.create! as any).transporterCompanySiret
  });

  // recipient needs appropriate profiles and subprofiles
  await upsertBaseSiret({
    siret: formdata.recipientCompanySiret!,
    wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
  });

  const ownerCompanies = await getUserCompanies(ownerId);
  const ownerOrgIds = ownerCompanies.map(company => company.orgId);

  const formParams: Omit<Prisma.FormCreateInput, "readableId" | "owner"> = {
    ...formdata,
    canAccessDraftSirets: ownerOrgIds,
    ...opt,
    transporters: {
      ...(opt.transporters?.createMany
        ? {
            createMany: opt.transporters!.createMany
          }
        : {
            create: {
              ...formdata.transporters!.create,
              ...opt.transporters?.create,
              number: 1
            }
          })
    }
  };

  const form = await prisma.form.create({
    data: {
      readableId: getReadableId(),
      ...formParams,
      owner: { connect: { id: ownerId } }
    },
    include: {
      ...SIRETS_BY_ROLE_INCLUDE,
      forwardedIn: true,
      transporters: true
    }
  });

  // Fix fields like "recipientsSirets" or "transportersSirets"
  const denormalizedSirets = getFormSiretsByRole(form as any); // Ts doesn't infer correctly because of the boolean
  const updated = await prisma.form.update({
    where: { id: form.id },
    data: {
      ...denormalizedSirets,
      updatedAt: opt?.updatedAt ?? new Date()
    },
    include: { forwardedIn: true }
  });

  return updated;
};

export const formWithTempStorageFactory = async ({
  ownerId,
  opt = {},
  forwardedInOpts = {}
}: {
  ownerId: string;
  opt?: Partial<Prisma.FormCreateInput>;
  forwardedInOpts?: Partial<Prisma.FormCreateInput>;
}) => {
  await upsertBaseSiret({
    siret: (forwardedInData.transporters?.create as any).transporterCompanySiret
  });
  await upsertBaseSiret({ siret: forwardedInData.recipientCompanySiret! });

  const forwardedCreateInput: Omit<
    Prisma.FormCreateInput,
    "readableId" | "owner"
  > = {
    ...forwardedInData,
    ...forwardedInOpts,
    transporters: {
      create: {
        ...forwardedInData.transporters!.create,
        ...forwardedInOpts?.transporters?.create,
        number: 1
      }
    }
  };

  const readableId = getReadableId(ReadableIdPrefix.BSD);

  return formFactory({
    ownerId,
    opt: {
      readableId,
      recipientIsTempStorage: true,
      forwardedIn: {
        create: {
          readableId: `${readableId}-suite`,
          owner: { connect: { id: ownerId } },
          ...forwardedCreateInput
        }
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

export const applicationFactory = async (openIdEnabled?: boolean) => {
  const admin = await userFactory();

  const applicationIndex = (await prisma.application.count()) + 1;

  const application = await prisma.application.create({
    data: {
      admin: { connect: { id: admin.id } },
      clientSecret: `Secret_${applicationIndex}`,
      name: `Application_${applicationIndex}`,
      redirectUris: ["https://acme.inc/authorize"],
      openIdEnabled: !!openIdEnabled
    }
  });

  return application;
};

export const ecoOrganismeFactory = async ({
  siret,
  handle,
  createAssociatedCompany
}: {
  siret?: string;
  handle?: {
    handleBsdasri?: boolean;
    handleBsda?: boolean;
    handleBsvhu?: boolean;
  };
  createAssociatedCompany?: boolean;
}) => {
  const { handleBsdasri, handleBsda, handleBsvhu } = handle ?? {};
  const ecoOrganismeIndex = (await prisma.ecoOrganisme.count()) + 1;
  const ecoOrganisme = await prisma.ecoOrganisme.create({
    data: {
      address: "",
      name: `Eco-Organisme ${ecoOrganismeIndex}`,
      siret: siret ?? siretify(),
      handleBsdasri,
      handleBsda,
      handleBsvhu
    }
  });
  if (createAssociatedCompany) {
    // create the related company so sirenify works as expected
    await companyFactory({
      siret: ecoOrganisme.siret,
      name: `Eco-Organisme ${ecoOrganismeIndex}`
    });
  }

  return ecoOrganisme;
};

export const toIntermediaryCompany = (company: Company, contact = "toto") => ({
  siret: company.siret!,
  name: company.name,
  address: company.address,
  contact
});

export const transporterReceiptFactory = async ({
  number = "the number",
  department = "83",
  company
}: {
  number?: string;
  department?: string;
  company?: Company;
}) => {
  const receipt = await prisma.transporterReceipt.create({
    data: {
      receiptNumber: number,
      validityLimit: "2055-01-01T00:00:00.000Z",
      department: department
    }
  });
  if (!!company) {
    await prisma.company.update({
      where: { id: company.id },
      data: { transporterReceipt: { connect: { id: receipt.id } } }
    });
  }

  return receipt;
};

export const intermediaryReceiptFactory = async ({
  role = CompanyRole.Broker,
  number = "el numero",
  department = "69",
  company
}: {
  role: CompanyRole.Broker | CompanyRole.Trader;
  number?: string;
  department?: string;
  company?: Company;
}) => {
  let receipt;
  if (role === CompanyRole.Broker) {
    receipt = await prisma.brokerReceipt.create({
      data: {
        receiptNumber: number,
        validityLimit: "2055-01-01T00:00:00.000Z",
        department: department
      }
    });
    if (!!company) {
      await prisma.company.update({
        where: { id: company.id },
        data: { brokerReceipt: { connect: { id: receipt.id } } }
      });
    }
  } else if (role === CompanyRole.Trader) {
    receipt = await prisma.traderReceipt.create({
      data: {
        receiptNumber: number,
        validityLimit: "2055-01-01T00:00:00.000Z",
        department: department
      }
    });
    if (!!company) {
      await prisma.company.update({
        where: { id: company.id },
        data: { traderReceipt: { connect: { id: receipt.id } } }
      });
    }
  }
  return receipt;
};

export const bsddFinalOperationFactory = async ({
  bsddId,
  opts = {}
}: {
  bsddId: string;
  opts?: Omit<
    Partial<Prisma.BsddFinalOperationCreateInput>,
    "initialForm" | "finalForm"
  >;
}) => {
  return prisma.bsddFinalOperation.create({
    data: {
      initialForm: { connect: { id: bsddId } },
      finalForm: { connect: { id: bsddId } },
      operationCode: "",
      quantity: 1,
      noTraceability: false,
      ...opts
    }
  });
};
