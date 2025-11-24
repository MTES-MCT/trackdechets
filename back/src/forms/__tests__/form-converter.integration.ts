import {
  bsddTransporterData,
  formFactory,
  formWithTempStorageFactory,
  userFactory
} from "../../__tests__/factories";
import { prisma } from "@td/prisma";
import { expandFormFromDb, expandableFormIncludes } from "../converter";
import { getFirstTransporter } from "../database";
import { PackagingInfo } from "@td/codegen-back";

describe("expandFormFromDb", () => {
  it("should expand normal form from db", async () => {
    const user = await userFactory();
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        transporters: {
          create: {
            ...bsddTransporterData,
            number: 1,
            takenOverAt: new Date("2023-01-01"),
            takenOverBy: "Roger"
          }
        }
      }
    });
    const transporter = await getFirstTransporter(form);
    const fullForm = await prisma.form.findUniqueOrThrow({
      where: { id: form.id },
      include: expandableFormIncludes
    });
    const expanded = expandFormFromDb(fullForm);
    expect(expanded).toEqual({
      id: form.id,
      readableId: form.readableId,
      customId: null,
      isImportedFromPaper: false,
      isDirectSupply: false,
      metadata: undefined,
      citerneNotWashedOutReason: null,
      hasCiterneBeenWashedOut: null,
      isDuplicateOf: null,
      emitter: {
        type: form.emitterType,
        workSite: null,
        pickupSite: null,
        company: {
          name: form.emitterCompanyName,
          siret: form.emitterCompanySiret,
          address: form.emitterCompanyAddress,
          contact: form.emitterCompanyContact,
          phone: form.emitterCompanyPhone,
          mail: form.emitterCompanyMail,
          omiNumber: null
        },
        isForeignShip: false,
        isPrivateIndividual: false
      },
      emptyReturnADR: form.emptyReturnADR,
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
      grouping: null,
      transportSegments: [],
      transporter: {
        id: transporter!.id,
        company: {
          name: transporter!.transporterCompanyName,
          orgId: transporter!.transporterCompanySiret,
          siret: transporter!.transporterCompanySiret,
          vatNumber: transporter!.transporterCompanyVatNumber,
          address: transporter!.transporterCompanyAddress,
          contact: transporter!.transporterCompanyContact,
          phone: transporter!.transporterCompanyPhone,
          mail: transporter!.transporterCompanyMail
        },
        isExemptedOfReceipt: transporter!.transporterIsExemptedOfReceipt,
        receipt: transporter!.transporterReceipt,
        department: transporter!.transporterDepartment,
        validityLimit: transporter!.transporterValidityLimit,
        numberPlate: transporter!.transporterNumberPlate,
        customInfo: transporter!.transporterCustomInfo,
        mode: transporter!.transporterTransportMode,
        takenOverAt: new Date("2023-01-01T00:00:00.000Z"),
        takenOverBy: "Roger"
      },
      transporters: [
        {
          id: transporter!.id,
          company: {
            name: transporter!.transporterCompanyName,
            orgId: transporter!.transporterCompanySiret,
            siret: transporter!.transporterCompanySiret,
            vatNumber: transporter!.transporterCompanyVatNumber,
            address: transporter!.transporterCompanyAddress,
            contact: transporter!.transporterCompanyContact,
            phone: transporter!.transporterCompanyPhone,
            mail: transporter!.transporterCompanyMail
          },
          isExemptedOfReceipt: transporter!.transporterIsExemptedOfReceipt,
          receipt: transporter!.transporterReceipt,
          department: transporter!.transporterDepartment,
          validityLimit: transporter!.transporterValidityLimit,
          numberPlate: transporter!.transporterNumberPlate,
          customInfo: transporter!.transporterCustomInfo,
          mode: transporter!.transporterTransportMode,
          takenOverAt: new Date("2023-01-01T00:00:00.000Z"),
          takenOverBy: "Roger"
        }
      ],
      wasteDetails: {
        code: form.wasteDetailsCode,
        name: form.wasteDetailsName,
        isSubjectToADR: form.wasteDetailsIsSubjectToADR,
        onuCode: form.wasteDetailsOnuCode,
        nonRoadRegulationMention: form.wasteDetailsNonRoadRegulationMention,
        packagingInfos: (
          form.wasteDetailsPackagingInfos as PackagingInfo[]
        ).map(p => ({
          ...p,
          identificationNumbers: [],
          volume: null
        })),
        packagings: ["CITERNE"],
        otherPackaging: undefined,
        numberOfPackages: 1,
        quantity: 22.5,
        quantityType: form.wasteDetailsQuantityType,
        consistence: form.wasteDetailsConsistence[0],
        consistences: form.wasteDetailsConsistence,
        pop: false,
        isDangerous: true,
        analysisReferences: [],
        landIdentifiers: [],
        parcelNumbers: [],
        sampleNumber: null
      },
      trader: null,
      broker: null,
      intermediaries: undefined,
      ecoOrganisme: null,
      createdAt: form.createdAt,
      updatedAt: form.updatedAt,
      status: form.status,
      emittedAt: null,
      emittedBy: null,
      emittedByEcoOrganisme: null,
      takenOverAt: null,
      takenOverBy: null,
      signedByTransporter: true,
      sentAt: form.sentAt,
      sentBy: form.sentBy,
      wasteAcceptationStatus: null,
      wasteRefusalReason: null,
      receivedBy: null,
      receivedAt: null,
      signedAt: null,
      quantityReceived: undefined,
      quantityRefused: undefined,
      quantityReceivedType: null,
      quantityAccepted: undefined,
      processingOperationDone: null,
      quantityGrouped: 0,
      processingOperationDescription: null,
      processedBy: null,
      processedAt: null,
      noTraceability: null,
      nextDestination: null,
      currentTransporterSiret: null,
      nextTransporterSiret: null,
      temporaryStorageDetail: null,
      destinationOperationMode: null
    });
  });

  it("should expand form with temp storage from db", async () => {
    const user = await userFactory();
    const { forwardedIn, ...form } = await formWithTempStorageFactory({
      ownerId: user.id
    });
    const fullForm = await prisma.form.findUniqueOrThrow({
      where: { id: form.id },
      include: expandableFormIncludes
    });
    const expanded = await expandFormFromDb(fullForm);
    const transporter = await getFirstTransporter(forwardedIn!);
    expect(expanded.temporaryStorageDetail).toEqual({
      temporaryStorer: {
        quantityType: null,
        quantityReceived: null,
        quantityAccepted: null,
        quantityRefused: null,
        wasteAcceptationStatus: null,
        wasteRefusalReason: null,
        receivedAt: null,
        receivedBy: null,
        signedAt: null
      },
      destination: {
        cap: "CAP",
        processingOperation: forwardedIn!.recipientProcessingOperation,
        company: {
          name: forwardedIn!.recipientCompanyName,
          siret: forwardedIn!.recipientCompanySiret,
          address: forwardedIn!.recipientCompanyAddress,
          contact: forwardedIn!.recipientCompanyContact,
          phone: forwardedIn!.recipientCompanyPhone,
          mail: forwardedIn!.recipientCompanyMail
        },
        isFilledByEmitter: false
      },
      wasteDetails: {
        code: forwardedIn!.wasteDetailsCode,
        name: forwardedIn!.wasteDetailsName,
        isSubjectToADR: forwardedIn!.wasteDetailsIsSubjectToADR,
        onuCode: forwardedIn!.wasteDetailsOnuCode,
        nonRoadRegulationMention:
          forwardedIn!.wasteDetailsNonRoadRegulationMention,
        packagingInfos: (
          form.wasteDetailsPackagingInfos as PackagingInfo[]
        ).map(p => ({
          ...p,
          identificationNumbers: [],
          volume: null
        })),
        packagings: ["CITERNE"],
        otherPackaging: undefined,
        numberOfPackages: 1,
        quantity: 1,
        quantityType: "ESTIMATED",
        consistence: "SOLID",
        consistences: ["SOLID"],
        pop: false,
        isDangerous: forwardedIn!.wasteDetailsIsDangerous
      },
      transporter: {
        id: transporter!.id,
        company: {
          name: transporter!.transporterCompanyName,
          orgId: transporter!.transporterCompanySiret,
          siret: transporter!.transporterCompanySiret,
          vatNumber: transporter!.transporterCompanyVatNumber,
          address: transporter!.transporterCompanyAddress,
          contact: transporter!.transporterCompanyContact,
          phone: transporter!.transporterCompanyPhone,
          mail: transporter!.transporterCompanyMail
        },
        isExemptedOfReceipt: false,
        receipt: transporter!.transporterReceipt,
        department: transporter!.transporterDepartment,
        validityLimit: transporter!.transporterValidityLimit,
        numberPlate: transporter!.transporterNumberPlate,
        customInfo: null,
        mode: transporter!.transporterTransportMode,
        takenOverAt: null,
        takenOverBy: null
      },
      emittedAt: null,
      emittedBy: null,
      takenOverAt: null,
      takenOverBy: null,
      signedAt: null,
      signedBy: null
    });
  });

  it("should expand a form nulling the transporterTransportMode from db", async () => {
    const user = await userFactory();
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        transporters: {
          create: {
            transporterCompanySiret: null,
            transporterTransportMode: "ROAD",
            number: 1
          }
        }
      }
    });
    const fullForm = await prisma.form.findUniqueOrThrow({
      where: { id: form.id },
      include: expandableFormIncludes
    });
    const transporter = await getFirstTransporter(form);
    const expanded = await expandFormFromDb(fullForm);
    expect(expanded.transporters[0]).toEqual({
      id: transporter!.id,
      mode: null,
      company: {
        name: transporter!.transporterCompanyName,
        orgId: null,
        siret: transporter!.transporterCompanySiret,
        vatNumber: transporter!.transporterCompanyVatNumber,
        address: transporter!.transporterCompanyAddress,
        contact: transporter!.transporterCompanyContact,
        phone: transporter!.transporterCompanyPhone,
        mail: transporter!.transporterCompanyMail
      },
      isExemptedOfReceipt: transporter!.transporterIsExemptedOfReceipt,
      receipt: transporter!.transporterReceipt,
      department: transporter!.transporterDepartment,
      validityLimit: transporter!.transporterValidityLimit,
      numberPlate: transporter!.transporterNumberPlate,
      customInfo: transporter!.transporterCustomInfo,
      takenOverAt: null,
      takenOverBy: null
    });
  });

  it("should not hide the transport mode from db if transporter siret is defined", async () => {
    const user = await userFactory();
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        transporters: {
          create: {
            transporterCompanySiret: "11111111111111",
            transporterCompanyVatNumber: null,
            transporterTransportMode: "ROAD",
            number: 1
          }
        }
      }
    });
    const fullForm = await prisma.form.findUniqueOrThrow({
      where: { id: form.id },
      include: expandableFormIncludes
    });
    const transporter = await getFirstTransporter(form);
    const expanded = expandFormFromDb(fullForm);
    expect(expanded.transporters[0]).toEqual({
      id: transporter!.id,
      mode: "ROAD",
      company: {
        name: transporter!.transporterCompanyName,
        orgId: transporter!.transporterCompanySiret,
        siret: transporter!.transporterCompanySiret,
        vatNumber: transporter!.transporterCompanyVatNumber,
        address: transporter!.transporterCompanyAddress,
        contact: transporter!.transporterCompanyContact,
        phone: transporter!.transporterCompanyPhone,
        mail: transporter!.transporterCompanyMail
      },
      isExemptedOfReceipt: transporter!.transporterIsExemptedOfReceipt,
      receipt: transporter!.transporterReceipt,
      department: transporter!.transporterDepartment,
      validityLimit: transporter!.transporterValidityLimit,
      numberPlate: transporter!.transporterNumberPlate,
      customInfo: transporter!.transporterCustomInfo,
      takenOverAt: null,
      takenOverBy: null
    });
  });

  it("should not hide the transport mode from db if transporter vat number is defined", async () => {
    const user = await userFactory();
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        transporters: {
          create: {
            transporterCompanySiret: null,
            transporterCompanyVatNumber: "FRXXXXX",
            transporterTransportMode: "ROAD",
            number: 1
          }
        }
      }
    });
    const fullForm = await prisma.form.findUniqueOrThrow({
      where: { id: form.id },
      include: expandableFormIncludes
    });
    const transporter = await getFirstTransporter(form);
    const expanded = expandFormFromDb(fullForm);
    expect(expanded.transporters[0]).toEqual({
      id: transporter!.id,
      mode: "ROAD",
      company: {
        name: transporter!.transporterCompanyName,
        orgId: transporter!.transporterCompanyVatNumber,
        siret: transporter!.transporterCompanySiret,
        vatNumber: transporter!.transporterCompanyVatNumber,
        address: transporter!.transporterCompanyAddress,
        contact: transporter!.transporterCompanyContact,
        phone: transporter!.transporterCompanyPhone,
        mail: transporter!.transporterCompanyMail
      },
      isExemptedOfReceipt: transporter!.transporterIsExemptedOfReceipt,
      receipt: transporter!.transporterReceipt,
      department: transporter!.transporterDepartment,
      validityLimit: transporter!.transporterValidityLimit,
      numberPlate: transporter!.transporterNumberPlate,
      customInfo: transporter!.transporterCustomInfo,
      takenOverAt: null,
      takenOverBy: null
    });
  });

  it("should set packagingInfos.numeros to empty array if not present", async () => {
    const user = await userFactory();
    const form = await formFactory({
      ownerId: user.id,
      opt: { wasteDetailsPackagingInfos: [{ type: "CITERNE", quantity: 1 }] }
    });
    const fullForm = await prisma.form.findUniqueOrThrow({
      where: { id: form.id },
      include: expandableFormIncludes
    });
    const expanded = expandFormFromDb(fullForm);
    expect(expanded.wasteDetails?.packagingInfos).toEqual([
      expect.objectContaining({ volume: null, identificationNumbers: [] })
    ]);
  });
});
