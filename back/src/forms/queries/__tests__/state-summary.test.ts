import {
  createForm,
  createEmitter,
  createTransporter,
  createRecipient,
  createCompany,
  createWasteDetails
} from "../../../__mocks__";
import { stateSummary as getStateSummary } from "../state-summary";

const PRODUCER = createEmitter({
  company: createCompany({
    siret: "producer",
    name: "PRODUCER"
  })
});

const TRANSPORTER = createTransporter({
  company: createCompany({
    siret: "transporter",
    name: "TRANSPORTER"
  })
});

const COLLECTOR = createRecipient({
  company: createCompany({
    siret: "collector",
    name: "COLLECTOR"
  })
});

const temporaryStorageDetail = jest.fn(() => Promise.resolve(null));
jest.mock("../../../generated/prisma-client", () => ({
  prisma: {
    form: jest.fn(() => ({
      temporaryStorageDetail
    }))
  }
}));

describe("stateSummary", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("when leaving the producer for a collector", () => {
    const FORM = createForm({
      status: "SEALED",
      emitter: PRODUCER,
      transporter: TRANSPORTER,
      recipient: COLLECTOR,
      wasteDetails: createWasteDetails({
        code: "oil-code",
        name: "Oil",
        onuCode: "oil-onu-code",
        packagings: [],
        otherPackaging: null,
        numberOfPackages: 1,
        quantity: 2,
        quantityType: "ESTIMATED",
        consistence: "LIQUID"
      })
    });

    it("should set the collector as recipient", async () => {
      const stateSummary = await getStateSummary(FORM);

      expect(stateSummary.recipient).toMatchObject({
        name: COLLECTOR.company?.name
      });
    });

    it("should set the waste details based on the initial declaration", async () => {
      const stateSummary = await getStateSummary(FORM);

      expect(stateSummary.wasteDetails).toMatchObject({
        code: FORM.wasteDetails?.code,
        name: FORM.wasteDetails?.name,
        onuCode: FORM.wasteDetails?.onuCode,
        packagings: FORM.wasteDetails?.packagings,
        otherPackaging: FORM.wasteDetails?.otherPackaging,
        numberOfPackages: FORM.wasteDetails?.numberOfPackages,
        quantity: FORM.wasteDetails?.quantity,
        quantityType: FORM.wasteDetails?.quantityType,
        consistence: FORM.wasteDetails?.consistence
      });
    });
  });

  describe("when leaving the producer for a temporary storage", () => {
    const INITIAL_WASTE_DETAILS = createWasteDetails({
      code: "oil-code",
      name: "Oil",
      onuCode: "oil-onu-code",
      packagings: [],
      otherPackaging: null,
      numberOfPackages: 1,
      quantity: 2,
      quantityType: "ESTIMATED",
      consistence: "LIQUID"
    });
    const TEMPORARY_STORAGE = createRecipient({
      company: createCompany({
        siret: "temporary-storage",
        name: "TEMPORARY STORAGE"
      }),
      isTempStorage: true
    });
    const FORM = createForm({
      status: "SEALED",
      emitter: PRODUCER,
      transporter: TRANSPORTER,
      recipient: TEMPORARY_STORAGE,
      wasteDetails: INITIAL_WASTE_DETAILS
    });
    const TEMPORARY_WASTE_DETAILS = createWasteDetails({
      onuCode: "temporary-oil-onu-code",
      packagings: [],
      otherPackaging: null,
      numberOfPackages: 2,
      quantity: 4,
      quantityType: "REAL"
    });

    beforeEach(() => {
      temporaryStorageDetail.mockReturnValueOnce(
        Promise.resolve({
          id: "temporary-storage",
          wasteDetailsOnuCode: TEMPORARY_WASTE_DETAILS.onuCode,
          wasteDetailsPackagings: TEMPORARY_WASTE_DETAILS.packagings,
          wasteDetailsOtherPackaging: TEMPORARY_WASTE_DETAILS.otherPackaging,
          wasteDetailsNumberOfPackages:
            TEMPORARY_WASTE_DETAILS.numberOfPackages,
          wasteDetailsQuantity: TEMPORARY_WASTE_DETAILS.quantity,
          wasteDetailsQuantityType: TEMPORARY_WASTE_DETAILS.quantityType,
          destinationCompanyName: COLLECTOR.company?.name,
          destinationCompanySiret: COLLECTOR.company?.siret,
          destinationCompanyAddress: COLLECTOR.company?.address,
          destinationCompanyContact: COLLECTOR.company?.contact,
          destinationCompanyPhone: COLLECTOR.company?.phone,
          destinationCompanyMail: COLLECTOR.company?.mail
        })
      );
    });

    it("should set the temporary storage as recipient", async () => {
      const stateSummary = await getStateSummary(FORM);

      expect(stateSummary.recipient).toEqual(TEMPORARY_STORAGE.company);
    });

    it("should set the waste details based on the temporary storage's declaration", async () => {
      const stateSummary = await getStateSummary(FORM);
      const { __typename, ...wasteDetails } = TEMPORARY_WASTE_DETAILS;

      expect(stateSummary.wasteDetails).toEqual({
        ...wasteDetails,

        // The following information is not present on the temporary waste details
        // and must be taken from the initial declaration
        code: INITIAL_WASTE_DETAILS.code,
        name: INITIAL_WASTE_DETAILS.name,
        consistence: INITIAL_WASTE_DETAILS.consistence
      });
    });
  });
});
