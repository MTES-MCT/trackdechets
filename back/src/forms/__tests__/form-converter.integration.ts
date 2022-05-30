import {
  formFactory,
  formWithTempStorageFactory,
  userFactory
} from "../../__tests__/factories";
import { expandFormFromDb } from "../form-converter";

describe("expandFormFromDb", () => {
  it("should expand normal form from db", async () => {
    const user = await userFactory();
    const form = await formFactory({ ownerId: user.id });
    const expanded = await expandFormFromDb(form);
    expect(expanded).toEqual({
      id: form.id,
      readableId: form.readableId,
      customId: null,
      isImportedFromPaper: false,
      emitter: {
        type: form.emitterType,
        workSite: {
          name: "",
          address: "",
          city: "",
          postalCode: "",
          infos: ""
        },
        pickupSite: null,
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
          vatNumber: form.transporterCompanyVatNumber,
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
        customInfo: form.transporterCustomInfo,
        mode: form.transporterTransportMode
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
        parcelNumbers: []
      },
      trader: {
        company: {
          name: "",
          siret: "",
          address: "",
          contact: "",
          phone: "",
          mail: ""
        },
        receipt: "",
        department: "",
        validityLimit: null
      },
      broker: {
        company: {
          name: "",
          siret: "",
          address: "",
          contact: "",
          phone: "",
          mail: ""
        },
        receipt: null,
        department: null,
        validityLimit: null
      },
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
      quantityGrouped: 0,
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
    expect(expanded.temporaryStorageDetail).toEqual({
      temporaryStorer: {
        quantityType: "REAL",
        quantityReceived: null,
        wasteAcceptationStatus: null,
        wasteRefusalReason: null,
        receivedAt: null,
        receivedBy: null
      },
      destination: {
        cap: "CAP",
        processingOperation: forwardedIn.recipientProcessingOperation,
        company: {
          name: forwardedIn.recipientCompanyName,
          siret: forwardedIn.recipientCompanySiret,
          address: forwardedIn.recipientCompanyAddress,
          contact: forwardedIn.recipientCompanyContact,
          phone: forwardedIn.recipientCompanyPhone,
          mail: forwardedIn.recipientCompanyMail
        },
        isFilledByEmitter: false
      },
      wasteDetails: {
        code: null,
        name: null,
        onuCode: "",
        packagingInfos: [],
        packagings: [],
        otherPackaging: undefined,
        numberOfPackages: 0,
        quantity: 1,
        quantityType: "ESTIMATED",
        consistence: null,
        pop: false,
        isDangerous: false
      },
      transporter: {
        company: {
          name: forwardedIn.transporterCompanyName,
          siret: forwardedIn.transporterCompanySiret,
          vatNumber: forwardedIn.transporterCompanyVatNumber,
          address: forwardedIn.transporterCompanyAddress,
          contact: forwardedIn.transporterCompanyContact,
          phone: forwardedIn.transporterCompanyPhone,
          mail: forwardedIn.transporterCompanyMail
        },
        isExemptedOfReceipt: false,
        receipt: forwardedIn.transporterReceipt,
        department: forwardedIn.transporterDepartment,
        validityLimit: forwardedIn.transporterValidityLimit,
        numberPlate: forwardedIn.transporterNumberPlate,
        customInfo: null,
        mode: forwardedIn.transporterTransportMode
      },
      emittedAt: null,
      emittedBy: null,
      takenOverAt: null,
      takenOverBy: null,
      signedAt: null,
      signedBy: null
    });
  });
});
