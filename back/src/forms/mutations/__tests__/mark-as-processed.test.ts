import { getNewValidForm } from "../__mocks__/data";
import { markAsProcessed } from "../mark-as";
import { ErrorCode } from "../../../common/errors";
import { FormState } from "../../workflow/model";
import { flattenObjectForDb } from "../../form-converter";

const prisma = {
  form: jest.fn(() => Promise.resolve({})),
  updateForm: jest.fn(() => Promise.resolve({})),
  createForm: jest.fn(() => Promise.resolve({})),
  createStatusLog: jest.fn(() => Promise.resolve({})),
  updateManyForms: jest.fn(() => Promise.resolve({}))
};

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

  it("fail if current user is not recipient", async () => {
    expect.assertions(1);
    try {
      const form = getNewValidForm();
      form.status = "RECEIVED";

      prisma.form.mockResolvedValue({ id: 1, status: FormState.Received });
      getUserCompaniesMock.mockResolvedValue([{ siret: "any siret" } as any]);

      await markAsProcessed(null, { id: 1, processedInfo: {} }, defaultContext);
    } catch (err) {
      expect(err.extensions.code).toBe(ErrorCode.FORBIDDEN);
    }
  });

  it("set status to NoTraceability if actor is exempt of traceability", async () => {
    const form = getNewValidForm();
    form.status = "RECEIVED";

    prisma.form.mockResolvedValue(flattenObjectForDb(form));
    getUserCompaniesMock.mockResolvedValue([
      { siret: form.recipient.company.siret }
    ]);

    await markAsProcessed(
      null,
      { id: 1, processedInfo: { noTraceability: true } },
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

    prisma.form.mockResolvedValue(flattenObjectForDb(form));
    getUserCompaniesMock.mockResolvedValue([
      { siret: form.recipient.company.siret }
    ]);

    await markAsProcessed(
      null,
      { id: 1, processedInfo: { processingOperationDone: "D 14" } },
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

    prisma.form.mockResolvedValue(flattenObjectForDb(form));
    getUserCompaniesMock.mockResolvedValue([
      { siret: form.recipient.company.siret }
    ]);

    await markAsProcessed(null, { id: 1, processedInfo: {} }, defaultContext);
    expect(prisma.updateForm).toHaveBeenCalledTimes(1);
    expect(prisma.updateForm).toHaveBeenCalledWith(
      jasmine.objectContaining({
        data: { status: "PROCESSED" }
      })
    );
  });
});
