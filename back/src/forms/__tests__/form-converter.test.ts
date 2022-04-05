import {
  expandFormFromDb,
  flattenFormInput,
  nullIfNoValues,
  safeInput,
  chain
} from "../form-converter";
import { Form } from "@prisma/client";
import { FormInput, WasteDetailsInput } from "../../generated/graphql/types";

test("nullIfNoValues", () => {
  let obj = { a: null, b: null };
  expect(nullIfNoValues(obj)).toEqual(null);
  obj = { a: "a", b: "b" };
  expect(nullIfNoValues(obj)).toEqual(obj);
  obj = { a: "a", b: null };
  expect(nullIfNoValues(obj)).toEqual(obj);
  obj = { a: false, b: null };
  expect(nullIfNoValues(obj)).toEqual(obj);
});

test("safeInput should remove undefined", () => {
  const input = {
    a: "a",
    b: null
  };

  const extra = {
    c: undefined
  };

  const safe = safeInput({
    ...input,
    ...extra
  });

  expect(safe).toEqual(input);
});

test("chain should optionnally chain data access", () => {
  type Input = {
    foo?: {
      bar1?: string;
      bar2?: string;
    };
    bar?: {
      foo1?: string;
    };
    baz?: {
      foo1?: string;
    };
  };

  const input: Input = {
    foo: { bar1: "foobar1" },
    bar: {},
    baz: null
  };

  const foobar1 = chain(input.foo, foo => foo.bar1);
  expect(foobar1).toEqual(input.foo.bar1);

  const foobar2 = chain(input.foo, foo => foo.bar2);
  expect(foobar2).toBeUndefined();

  const barfoo1 = chain(input.bar, bar => bar.foo1);
  expect(barfoo1).toBeUndefined();

  const bazfoo1 = chain(input.baz, baz => baz.foo1);
  expect(bazfoo1).toBeNull();
});

test("expandFormFromDb", () => {
  const form: Partial<Form> = {
    id: "ckcejngdp00p00895cxaze1e8",
    readableId: "BSD-20210101-AAAAAAAA",
    isImportedFromPaper: false,
    customId: null,
    isDeleted: false,
    createdAt: new Date("2020-07-09T08:43:23.434Z"),
    updatedAt: new Date("2020-07-09T08:43:23.434Z"),
    signedByTransporter: true,
    status: "SENT",
    sentAt: new Date("2019-11-20T00:00:00.000Z"),
    sentBy: "signe",
    isAccepted: null,
    wasteAcceptationStatus: null,
    wasteRefusalReason: "",
    receivedBy: null,
    receivedAt: null,
    signedAt: null,
    quantityReceived: null,
    processedBy: null,
    processedAt: null,
    processingOperationDone: null,
    processingOperationDescription: null,
    noTraceability: null,
    nextDestinationCompanyPhone: null,
    nextDestinationCompanySiret: null,
    nextDestinationCompanyName: null,
    nextDestinationCompanyMail: null,
    nextDestinationProcessingOperation: null,
    nextDestinationCompanyContact: null,
    nextDestinationCompanyAddress: null,
    nextDestinationCompanyCountry: null,
    emitterCompanyName: "WASTE PRODUCER",
    emitterType: "PRODUCER",
    emitterWorkSiteAddress: "",
    emitterWorkSiteName: "",
    emitterWorkSitePostalCode: "",
    emitterPickupSite: null,
    emitterWorkSiteInfos: "",
    emitterCompanyPhone: "06 18 76 02 96",
    emitterCompanyMail: "emitter@compnay.fr",
    emitterWorkSiteCity: "",
    emitterCompanySiret: "1234",
    emitterCompanyAddress: "20 Avenue de la 1ère Dfl 13000 Marseille",
    emitterCompanyContact: "Marc Martin",
    recipientCompanyAddress: "16 rue Jean Jaurès 92400 Courbevoie",
    recipientCap: "",
    recipientIsTempStorage: false,
    recipientCompanyPhone: "06 18 76 02 99",
    recipientCompanySiret: "5678",
    recipientCompanyContact: "Jean Dupont",
    recipientProcessingOperation: "D 6",
    recipientCompanyMail: "recipient@td.io",
    recipientCompanyName: "WASTE COMPANY",
    transporterCompanyName: "WASTE TRANSPORTER",
    transporterReceipt: "33AA",
    transporterCustomInfo: null,
    transporterDepartment: "86",
    transporterCompanySiret: "9876",
    transporterCompanyAddress: "16 rue Jean Jaurès 92400 Courbevoie",
    transporterCompanyContact: "transporter",
    transporterCompanyMail: "transporter@td.io",
    transporterIsExemptedOfReceipt: false,
    transporterNumberPlate: "aa22",
    transporterValidityLimit: new Date("2019-11-27T00:00:00.000Z"),
    transporterCompanyPhone: "06 18 76 02 66",
    currentTransporterSiret: null,
    nextTransporterSiret: null,
    wasteDetailsQuantity: 22.5,
    wasteDetailsOnuCode: "",
    wasteDetailsCode: "05 01 04*",
    wasteDetailsIsDangerous: true,
    wasteDetailsName: "Divers",
    wasteDetailsPackagingInfos: [
      { type: "AUTRE", other: "Autre packaging", quantity: 1 }
    ],
    wasteDetailsQuantityType: "ESTIMATED",
    wasteDetailsConsistence: "SOLID",
    wasteDetailsPop: false,
    traderCompanyAddress: null,
    traderValidityLimit: null,
    traderCompanyContact: null,
    traderCompanyName: null,
    traderCompanyMail: null,
    traderDepartment: null,
    traderCompanySiret: null,
    traderReceipt: null,
    traderCompanyPhone: null,
    brokerCompanyAddress: null,
    brokerValidityLimit: null,
    brokerCompanyContact: null,
    brokerCompanyName: null,
    brokerCompanyMail: null,
    brokerDepartment: null,
    brokerCompanySiret: null,
    brokerReceipt: null,
    brokerCompanyPhone: null,
    ecoOrganismeName: null,
    ecoOrganismeSiret: null
  };

  const expanded = expandFormFromDb(form as Form);

  const expected = {
    id: form.id,
    readableId: form.readableId,
    isImportedFromPaper: false,
    customId: form.customId,
    emitter: {
      type: form.emitterType,
      workSite: {
        name: form.emitterWorkSiteName,
        address: form.emitterWorkSiteAddress,
        city: form.emitterWorkSiteCity,
        postalCode: form.emitterWorkSitePostalCode,
        infos: form.emitterWorkSiteInfos
      },
      pickupSite: form.emitterPickupSite,
      company: {
        name: form.emitterCompanyName,
        siret: form.emitterCompanySiret,
        address: form.emitterCompanyAddress,
        contact: form.emitterCompanyContact,
        phone: form.emitterCompanyPhone,
        mail: form.emitterCompanyMail
      }
    },
    recipient: {
      cap: form.recipientCap,
      processingOperation: form.recipientProcessingOperation,
      company: {
        name: form.recipientCompanyName,
        siret: form.recipientCompanySiret,
        address: form.recipientCompanyAddress,
        contact: form.recipientCompanyContact,
        phone: form.recipientCompanyPhone,
        mail: form.recipientCompanyMail
      },
      isTempStorage: false
    },
    transporter: {
      company: {
        name: form.transporterCompanyName,
        siret: form.transporterCompanySiret,
        address: form.transporterCompanyAddress,
        contact: form.transporterCompanyContact,
        phone: form.transporterCompanyPhone,
        mail: form.transporterCompanyMail
      },
      isExemptedOfReceipt: form.transporterIsExemptedOfReceipt,
      receipt: form.transporterReceipt,
      department: form.transporterDepartment,
      validityLimit: form.transporterValidityLimit,
      numberPlate: form.transporterNumberPlate,
      customInfo: form.transporterCustomInfo
    },
    wasteDetails: {
      code: form.wasteDetailsCode,
      name: form.wasteDetailsName,
      onuCode: form.wasteDetailsOnuCode,
      packagingInfos: form.wasteDetailsPackagingInfos,
      packagings: ["AUTRE"],
      otherPackaging: "Autre packaging",
      numberOfPackages: 1,
      quantity: form.wasteDetailsQuantity,
      quantityType: form.wasteDetailsQuantityType,
      consistence: form.wasteDetailsConsistence,
      isDangerous: form.wasteDetailsIsDangerous,
      pop: form.wasteDetailsPop
    },
    trader: null,
    broker: null,
    ecoOrganisme: null,
    createdAt: form.createdAt,
    updatedAt: form.updatedAt,
    status: form.status,
    signedByTransporter: form.signedByTransporter,
    sentAt: form.sentAt,
    sentBy: form.sentBy,
    wasteAcceptationStatus: form.wasteAcceptationStatus,
    wasteRefusalReason: form.wasteRefusalReason,
    receivedBy: form.receivedBy,
    receivedAt: form.receivedAt,
    signedAt: form.signedAt,
    quantityReceived: form.quantityReceived,
    processingOperationDone: form.processingOperationDone,
    processingOperationDescription: form.processingOperationDescription,
    processedBy: form.processedBy,
    processedAt: form.processedAt,
    noTraceability: form.noTraceability,
    nextDestination: null,
    currentTransporterSiret: form.currentTransporterSiret,
    nextTransporterSiret: form.nextTransporterSiret
  };

  expect(expanded).toEqual(expected);
});

describe("flattenFormInput", () => {
  it("should convert form input to prisma input", () => {
    const input: FormInput = {
      customId: "TD-20-AAA00256",
      emitter: {
        type: "PRODUCER",
        workSite: {
          address: "5 rue du chantier",
          city: "Annonay",
          postalCode: "07100",
          infos: "Site de stockage de boues"
        },
        company: {
          siret: "11111111111111",
          name: "Boues and Co",
          address: "1 rue de paradis, 75010 PARIS",
          contact: "Jean Dupont de la Boue",
          mail: "jean.dupont@boues.fr",
          phone: "01 00 00 00 00"
        }
      },
      recipient: {
        processingOperation: "D 10",
        company: {
          siret: "22222222222222",
          name: "Incinérateur du Grand Est",
          address: "1 avenue de Colmar 67100 Strasbourg",
          contact: "Thomas Largeron",
          mail: "thomas.largeron@incinerateur.fr",
          phone: "03 00 00 00 00"
        }
      },
      transporter: {
        receipt: "12379",
        department: "07",
        validityLimit: new Date("2020-06-30"),
        numberPlate: "AD-007-TS",
        company: null
      },
      wasteDetails: null
    };

    const flattened = flattenFormInput(input);

    const expected = {
      customId: input.customId,
      emitterType: input.emitter.type,
      emitterWorkSiteAddress: input.emitter.workSite.address,
      emitterWorkSiteCity: input.emitter.workSite.city,
      emitterWorkSitePostalCode: input.emitter.workSite.postalCode,
      emitterWorkSiteInfos: input.emitter.workSite.infos,
      emitterCompanyName: input.emitter.company.name,
      emitterCompanySiret: input.emitter.company.siret,
      emitterCompanyAddress: input.emitter.company.address,
      emitterCompanyContact: input.emitter.company.contact,
      emitterCompanyPhone: input.emitter.company.phone,
      emitterCompanyMail: input.emitter.company.mail,
      recipientProcessingOperation: input.recipient.processingOperation,
      recipientCompanyName: input.recipient.company.name,
      recipientCompanySiret: input.recipient.company.siret,
      recipientCompanyAddress: input.recipient.company.address,
      recipientCompanyContact: input.recipient.company.contact,
      recipientCompanyPhone: input.recipient.company.phone,
      recipientCompanyMail: input.recipient.company.mail,
      transporterCompanyName: null,
      transporterCompanySiret: null,
      transporterCompanyVatNumber: null,
      transporterCompanyAddress: null,
      transporterCompanyContact: null,
      transporterCompanyPhone: null,
      transporterCompanyMail: null,
      transporterReceipt: input.transporter.receipt,
      transporterDepartment: input.transporter.department,
      transporterValidityLimit: input.transporter.validityLimit,
      transporterNumberPlate: input.transporter.numberPlate,
      wasteDetailsCode: null,
      wasteDetailsName: null,
      wasteDetailsOnuCode: null,
      wasteDetailsPackagingInfos: null,
      wasteDetailsQuantity: null,
      wasteDetailsQuantityType: null,
      wasteDetailsConsistence: null,
      wasteDetailsPop: null,
      wasteDetailsIsDangerous: null
    };

    expect(flattened).toEqual(expected);
  });

  it("should not set any fiels if wasteDetails is undefined", () => {
    const flattened = flattenFormInput({});
    expect(flattened).toEqual({});
  });

  it("should set all fields to null if wasteDetails is null", () => {
    const flattened = flattenFormInput({ wasteDetails: null });
    expect(flattened).toEqual({
      wasteDetailsCode: null,
      wasteDetailsConsistence: null,
      wasteDetailsName: null,
      wasteDetailsOnuCode: null,
      wasteDetailsPackagingInfos: null,
      wasteDetailsPop: null,
      wasteDetailsIsDangerous: null,
      wasteDetailsQuantity: null,
      wasteDetailsQuantityType: null
    });
  });

  it("should not set wasteDetailPackagingInfos if wasteDetails.packagingInfos is not set", () => {
    const wasteDetails: WasteDetailsInput = {
      code: "01 01 01"
    };
    const flattened = flattenFormInput({ wasteDetails });
    expect(flattened).toEqual({ wasteDetailsCode: wasteDetails.code });
  });

  it("should set wasteDetailPackagingInfos if wasteDetails.packagingInfos is set", () => {
    const wasteDetails: WasteDetailsInput = {
      packagingInfos: [{ type: "CITERNE", quantity: 1 }]
    };
    const flattened = flattenFormInput({ wasteDetails });
    expect(flattened).toEqual({
      wasteDetailsPackagingInfos: wasteDetails.packagingInfos
    });
  });

  it("should convert old wasteDetails.packagings to new wasteDetails.packagingInfos", () => {
    const wasteDetails: WasteDetailsInput = {
      packagings: ["CITERNE"]
    };
    const flattened = flattenFormInput({ wasteDetails });
    expect(flattened).toEqual({
      wasteDetailsPackagingInfos: [
        {
          other: null,
          quantity: 1,
          type: "CITERNE"
        }
      ]
    });
  });

  it("should give priority to wasteDetails.packagingInfos over wasteDetails.packagings", () => {
    const wasteDetails: WasteDetailsInput = {
      packagingInfos: [{ type: "CITERNE", quantity: 1 }],
      packagings: ["BENNE"]
    };
    const flattened = flattenFormInput({ wasteDetails });
    expect(flattened).toEqual({
      wasteDetailsPackagingInfos: wasteDetails.packagingInfos
    });
  });
});
