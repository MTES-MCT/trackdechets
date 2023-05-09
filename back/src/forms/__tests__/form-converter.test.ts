import { flattenFormInput } from "../converter";
import { nullIfNoValues, safeInput, chain } from "../../common/converter";
import { FormInput, WasteDetailsInput } from "../../generated/graphql/types";
import { siretify } from "../../__tests__/factories";
import { Prisma } from "@prisma/client";

test("nullIfNoValues", () => {
  let obj: any = { a: null, b: null };
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
    } | null;
  };

  const input: Input = {
    foo: { bar1: "foobar1" },
    bar: {},
    baz: null
  };

  const foobar1 = chain(input.foo, foo => foo.bar1);
  expect(foobar1).toEqual(input.foo!.bar1);

  const foobar2 = chain(input.foo, foo => foo.bar2);
  expect(foobar2).toBeUndefined();

  const barfoo1 = chain(input.bar, bar => bar.foo1);
  expect(barfoo1).toBeUndefined();

  const bazfoo1 = chain(input.baz, baz => baz.foo1);
  expect(bazfoo1).toBeNull();
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
          siret: siretify(1),
          name: "Boues and Co",
          address: "1 rue de paradis, 75010 PARIS",
          contact: "Jean Dupont de la Boue",
          mail: "jean.dupont@boues.fr",
          phone: "01 00 00 00 00",
          omiNumber: "OMI1234567"
        },
        isForeignShip: true,
        isPrivateIndividual: false
      },
      recipient: {
        processingOperation: "D 10",
        company: {
          siret: siretify(2),
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
      emitterType: input.emitter!.type,
      emitterWorkSiteAddress: input.emitter!.workSite!.address,
      emitterWorkSiteCity: input.emitter!.workSite!.city,
      emitterWorkSitePostalCode: input.emitter!.workSite!.postalCode,
      emitterWorkSiteInfos: input.emitter!.workSite!.infos,
      emitterCompanyName: input.emitter!.company!.name,
      emitterCompanySiret: input.emitter!.company!.siret,
      emitterCompanyAddress: input.emitter!.company!.address,
      emitterCompanyContact: input.emitter!.company!.contact,
      emitterCompanyPhone: input.emitter!.company!.phone,
      emitterCompanyMail: input.emitter!.company!.mail,
      emitterIsPrivateIndividual: input.emitter!.isPrivateIndividual,
      emitterIsForeignShip: input.emitter!.isForeignShip,
      emitterCompanyOmiNumber: input.emitter!.company!.omiNumber,
      recipientProcessingOperation: input.recipient!.processingOperation,
      recipientCompanyName: input.recipient!.company!.name,
      recipientCompanySiret: input.recipient!.company!.siret,
      recipientCompanyAddress: input.recipient!.company!.address,
      recipientCompanyContact: input.recipient!.company!.contact,
      recipientCompanyPhone: input.recipient!.company!.phone,
      recipientCompanyMail: input.recipient!.company!.mail,
      transporterCompanyName: null,
      transporterCompanySiret: null,
      transporterCompanyVatNumber: null,
      transporterCompanyAddress: null,
      transporterCompanyContact: null,
      transporterCompanyPhone: null,
      transporterCompanyMail: null,
      transporterReceipt: input.transporter!.receipt,
      transporterDepartment: input.transporter!.department,
      transporterValidityLimit: input.transporter!.validityLimit,
      transporterNumberPlate: input.transporter!.numberPlate,
      wasteDetailsCode: null,
      wasteDetailsName: null,
      wasteDetailsOnuCode: null,
      wasteDetailsPackagingInfos: Prisma.JsonNull,
      wasteDetailsQuantity: null,
      wasteDetailsQuantityType: null,
      wasteDetailsConsistence: null,
      wasteDetailsPop: false,
      wasteDetailsIsDangerous: false,
      wasteDetailsAnalysisReferences: [],
      wasteDetailsParcelNumbers: Prisma.JsonNull,
      wasteDetailsLandIdentifiers: [],
      wasteDetailsSampleNumber: null
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
      wasteDetailsPackagingInfos: Prisma.JsonNull,
      wasteDetailsPop: false,
      wasteDetailsIsDangerous: false,
      wasteDetailsQuantity: null,
      wasteDetailsQuantityType: null,
      wasteDetailsParcelNumbers: Prisma.JsonNull,
      wasteDetailsAnalysisReferences: [],
      wasteDetailsLandIdentifiers: [],
      wasteDetailsSampleNumber: null
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
