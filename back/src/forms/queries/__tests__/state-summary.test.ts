import {
  createFormMock,
  createEmitterMock,
  createFormCompanyMock,
  createTransporterMock,
  createRecipientMock,
  createWasteDetailsMock
} from "../../../generated/graphql/types";
import { stateSummary as getStateSummary } from "../state-summary";

const PRODUCER = createEmitterMock({
  company: createFormCompanyMock({
    siret: "producer",
    name: "PRODUCER"
  })
});

const TRANSPORTER = createTransporterMock({
  company: createFormCompanyMock({
    siret: "transporter",
    name: "TRANSPORTER"
  })
});

const COLLECTOR = createRecipientMock({
  company: createFormCompanyMock({
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
    const FORM = createFormMock({
      status: "SEALED",
      emitter: PRODUCER,
      transporter: TRANSPORTER,
      recipient: COLLECTOR,
      wasteDetails: createWasteDetailsMock({
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

      expect(stateSummary).toMatchObject({
        quantity: FORM.wasteDetails?.quantity,
        packagings: FORM.wasteDetails?.packagings,
        onuCode: FORM.wasteDetails?.onuCode
      });
    });
  });

  describe("when leaving the producer for a temporary storage", () => {
    const INITIAL_WASTE_DETAILS = createWasteDetailsMock({
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
    const TEMPORARY_STORAGE = createRecipientMock({
      company: createFormCompanyMock({
        siret: "temporary-storage",
        name: "TEMPORARY STORAGE"
      }),
      isTempStorage: true
    });
    const FORM = createFormMock({
      status: "SEALED",
      emitter: PRODUCER,
      transporter: TRANSPORTER,
      recipient: TEMPORARY_STORAGE,
      wasteDetails: INITIAL_WASTE_DETAILS
    });
    const TEMPORARY_WASTE_DETAILS = createWasteDetailsMock({
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

      expect(stateSummary).toMatchObject({
        quantity: TEMPORARY_WASTE_DETAILS.quantity,
        packagings: TEMPORARY_WASTE_DETAILS.packagings,
        onuCode: TEMPORARY_WASTE_DETAILS.onuCode
      });
    });
  });
});
