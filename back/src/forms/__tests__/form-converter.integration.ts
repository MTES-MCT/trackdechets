import {
  formFactory,
  formWithTempStorageFactory,
  userFactory
} from "../../__tests__/factories";
import { expandFormFromDb } from "../converter";
import { getFirstTransporter } from "../database";

describe("expandFormFromDb", () => {
  it("should expand normal form from db", async () => {
    const user = await userFactory();
    const form = await formFactory({ ownerId: user.id });
    const transporter = await getFirstTransporter(form);
    const expanded = await expandFormFromDb(form);
    expect(expanded).toEqual({
      id: form.id,
      readableId: form.readableId,
      customId: null,
      isImportedFromPaper: false,
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
        mode: transporter!.transporterTransportMode
      },
      wasteDetails: {
        code: form.wasteDetailsCode,
        name: form.wasteDetailsName,
        onuCode: form.wasteDetailsOnuCode,
        packagingInfos: form.wasteDetailsPackagingInfos,
        packagings: ["CITERNE"],
        otherPackaging: undefined,
        numberOfPackages: 1,
        quantity: 22.5,
        quantityType: form.wasteDetailsQuantityType,
        consistence: form.wasteDetailsConsistence,
        pop: false,
        isDangerous: true,
        analysisReferences: [],
        landIdentifiers: [],
        parcelNumbers: [],
        sampleNumber: null
      },
      trader: null,
      broker: null,
      intermediaries: [],
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
      quantityReceived: null,
      processingOperationDone: null,
      quantityGrouped: null,
      processingOperationDescription: null,
      processedBy: null,
      processedAt: null,
      noTraceability: null,
      nextDestination: null,
      currentTransporterSiret: null,
      nextTransporterSiret: null,
      temporaryStorageDetail: null
    });
  });

  it("should expand form with temp storage from db", async () => {
    const user = await userFactory();
    const { forwardedIn, ...form } = await formWithTempStorageFactory({
      ownerId: user.id
    });
    const expanded = await expandFormFromDb(form);
    const transporter = await getFirstTransporter(forwardedIn!);
    expect(expanded.temporaryStorageDetail).toEqual({
      temporaryStorer: {
        quantityType: null,
        quantityReceived: null,
        wasteAcceptationStatus: null,
        wasteRefusalReason: null,
        receivedAt: null,
        receivedBy: null
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
        onuCode: forwardedIn!.wasteDetailsOnuCode,
        packagingInfos: forwardedIn!.wasteDetailsPackagingInfos,
        packagings: ["CITERNE"],
        otherPackaging: undefined,
        numberOfPackages: 1,
        quantity: 1,
        quantityType: "ESTIMATED",
        consistence: "SOLID",
        pop: false,
        isDangerous: forwardedIn!.wasteDetailsIsDangerous
      },
      transporter: {
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
        mode: transporter!.transporterTransportMode
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
            transporterTransportMode: "ROAD"
          }
        }
      }
    });
    const transporter = await getFirstTransporter(form);
    const expanded = await expandFormFromDb(form);
    expect(expanded.transporter).toEqual({
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
      customInfo: transporter!.transporterCustomInfo
    });
  });

  it("should expand a form not hiding the transporterTransportMode from db", async () => {
    const user = await userFactory();
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        transporters: {
          create: {
            transporterTransportMode: "OTHER"
          }
        }
      }
    });
    const transporter = await getFirstTransporter(form);
    const expanded = await expandFormFromDb(form);
    expect(expanded.transporter).toEqual({
      mode: "OTHER",
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
      customInfo: transporter!.transporterCustomInfo
    });
  });
});
