import { getNewValidPrismaForm, getContext } from "../__mocks__/data";
import { markAsTempStoredFn as markAsTempStored } from "../markAsTempStored";
import { ErrorCode } from "../../../../common/errors";

const formMock = jest.fn();
const temporaryStorageDetailMock = jest.fn(() => Promise.resolve(null));
const appendix2FormsMock = jest.fn(() => Promise.resolve([]));
function mockFormWith(value) {
  const result: any = Promise.resolve(value);
  result.temporaryStorageDetail = temporaryStorageDetailMock;
  result.appendix2Forms = appendix2FormsMock;
  formMock.mockReturnValue(result);
}

const prisma = {
  form: formMock,
  updateForm: jest.fn((..._args) => Promise.resolve({})),
  createForm: jest.fn(() => Promise.resolve({})),
  createStatusLog: jest.fn(() => Promise.resolve({})),
  updateManyForms: jest.fn(() => Promise.resolve({}))
};

jest.mock("../../../../generated/prisma-client", () => ({
  prisma: {
    form: () => prisma.form(),
    updateForm: (...args) => prisma.updateForm(...args),
    createForm: () => prisma.createForm(),
    createStatusLog: () => prisma.createStatusLog(),
    updateManyForms: () => prisma.updateManyForms()
  }
}));

describe("Forms -> markAsTempStored mutation", () => {
  const defaultContext = getContext();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fail if form is not SENT", async () => {
    expect.assertions(1);
    const form = getNewValidPrismaForm();
    form.status = "DRAFT";

    try {
      mockFormWith(form);

      await markAsTempStored(
        form,
        {
          id: "1",
          tempStoredInfos: {
            wasteAcceptationStatus: "ACCEPTED",
            receivedBy: "John Snow",
            receivedAt: "2019-12-20T00:00:00.000Z",
            signedAt: "2019-12-20T00:00:00.000Z",
            quantityReceived: 1.0,
            quantityType: "REAL"
          }
        },
        defaultContext
      );
    } catch (err) {
      expect(err.extensions.code).toBe(ErrorCode.FORBIDDEN);
    }
  });

  it("should set status to TEMP_STORED when waste is accepted by temporary storer", async () => {
    const form = getNewValidPrismaForm();
    form.status = "SENT";
    form.recipientIsTempStorage = true;

    mockFormWith(form);

    await markAsTempStored(
      form,
      {
        id: "1",
        tempStoredInfos: {
          wasteAcceptationStatus: "ACCEPTED",
          receivedBy: "John Snow",
          receivedAt: "2019-12-20T00:00:00.000Z",
          signedAt: "2019-12-20T00:00:00.000Z",
          quantityReceived: 1.0,
          quantityType: "REAL"
        }
      },
      defaultContext
    );

    expect(prisma.updateForm).toHaveBeenCalledTimes(1);
    expect(prisma.updateForm).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "TEMP_STORED" })
      })
    );
  });

  it("should set status to REFUSED when waste is refused by temporary storer", async () => {
    const form = getNewValidPrismaForm();
    form.status = "SENT";
    form.recipientIsTempStorage = true;

    mockFormWith(form);

    await markAsTempStored(
      form,
      {
        id: "1",
        tempStoredInfos: {
          wasteAcceptationStatus: "REFUSED",
          wasteRefusalReason: "non conforme",
          receivedBy: "John Snow",
          receivedAt: "2019-12-20T00:00:00.000Z",
          signedAt: "2019-12-20T00:00:00.000Z",
          quantityReceived: 0.0,
          quantityType: "REAL"
        }
      },
      defaultContext
    );

    expect(prisma.updateForm).toHaveBeenCalledTimes(1);
    expect(prisma.updateForm).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "REFUSED" })
      })
    );
  });
});
