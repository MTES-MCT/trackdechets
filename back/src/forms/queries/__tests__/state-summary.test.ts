import {
  createForm,
  createEmitter,
  createTransporter,
  createRecipient,
  createCompany
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
    it("should set the collector as recipient", async () => {
      const stateSummary = await getStateSummary(
        createForm({
          status: "SEALED",
          emitter: PRODUCER,
          transporter: TRANSPORTER,
          recipient: COLLECTOR
        })
      );
      expect(stateSummary.recipient).toMatchObject({
        name: COLLECTOR.company?.name
      });
    });
  });

  describe("when leaving the producer for a temporary storage", () => {
    const TEMPORARY_STORAGE = createRecipient({
      company: createCompany({
        siret: "temporary-storage",
        name: "TEMPORARY STORAGE"
      })
    });

    beforeEach(() => {
      temporaryStorageDetail.mockReturnValueOnce(
        Promise.resolve({
          id: "temporary-storage",
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
      const stateSummary = await getStateSummary(
        createForm({
          status: "SEALED",
          emitter: PRODUCER,
          transporter: TRANSPORTER,
          recipient: TEMPORARY_STORAGE
        })
      );
      expect(stateSummary.recipient).toMatchObject({
        name: TEMPORARY_STORAGE.company?.name
      });
    });
  });
});
