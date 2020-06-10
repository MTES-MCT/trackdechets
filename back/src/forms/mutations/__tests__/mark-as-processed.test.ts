import { getNewValidForm } from "../__mocks__/data";
import { markAsProcessed } from "../mark-as";
import { flattenObjectForDb } from "../../form-converter";
import { ProcessedFormInput } from "../../../generated/graphql/types";

const temporaryStorageDetailMock = jest.fn(() => Promise.resolve(null));
const formMock = jest.fn(() => Promise.resolve({}));
function mockFormWith(value) {
  const result: any = Promise.resolve(value);
  result.temporaryStorageDetail = temporaryStorageDetailMock;
  formMock.mockReturnValue(result);
}

const prisma = {
  form: formMock,
  updateForm: jest.fn((..._args) => Promise.resolve({})),
  createForm: jest.fn(() => Promise.resolve({})),
  createStatusLog: jest.fn(() => Promise.resolve({})),
  updateManyForms: jest.fn(() => Promise.resolve({}))
};

jest.mock("../../../generated/prisma-client", () => ({
  prisma: {
    form: () => prisma.form(),
    updateForm: (...args) => prisma.updateForm(...args),
    createForm: () => prisma.createForm(),
    createStatusLog: () => prisma.createStatusLog(),
    updateManyForms: () => prisma.updateManyForms()
  }
}));

const getUserCompaniesMock = jest.fn();
jest.mock("../../../companies/queries/userCompanies", () => ({
  getUserCompanies: () => getUserCompaniesMock()
}));

const defaultContext = {
  prisma,
  user: { id: "userId" },
  request: null
} as any;

describe("Forms -> markAsProcessed mutation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("set status to NoTraceability if actor is exempt of traceability", async () => {
    const form = getNewValidForm();
    form.status = "RECEIVED";

    mockFormWith(flattenObjectForDb(form));
    getUserCompaniesMock.mockResolvedValue([
      { siret: form.recipient.company.siret }
    ]);

    await markAsProcessed(
      {
        id: "1",
        processedInfo: { noTraceability: true } as ProcessedFormInput
      },
      defaultContext
    );
    expect(prisma.updateForm).toHaveBeenCalledTimes(1);
    expect(prisma.updateForm).toHaveBeenCalledWith(
      jasmine.objectContaining({
        data: { noTraceability: true, status: "NO_TRACEABILITY" }
      })
    );
  });

  it("set status to AwaitsGroup if processing operation says so", async () => {
    const form = getNewValidForm();
    form.status = "RECEIVED";

    mockFormWith(flattenObjectForDb(form));
    getUserCompaniesMock.mockResolvedValue([
      { siret: form.recipient.company.siret }
    ]);

    await markAsProcessed(
      {
        id: "1",
        processedInfo: { processingOperationDone: "D 14" } as ProcessedFormInput
      },
      defaultContext
    );
    expect(prisma.updateForm).toHaveBeenCalledTimes(1);
    expect(prisma.updateForm).toHaveBeenCalledWith(
      jasmine.objectContaining({
        data: { processingOperationDone: "D 14", status: "AWAITING_GROUP" }
      })
    );
  });

  it("set status to Processed", async () => {
    const form = getNewValidForm();
    form.status = "RECEIVED";

    mockFormWith(flattenObjectForDb(form));
    getUserCompaniesMock.mockResolvedValue([
      { siret: form.recipient.company.siret }
    ]);

    await markAsProcessed(
      { id: "1", processedInfo: {} as ProcessedFormInput },
      defaultContext
    );
    expect(prisma.updateForm).toHaveBeenCalledTimes(1);
    expect(prisma.updateForm).toHaveBeenCalledWith(
      jasmine.objectContaining({
        data: { status: "PROCESSED" }
      })
    );
  });
});
