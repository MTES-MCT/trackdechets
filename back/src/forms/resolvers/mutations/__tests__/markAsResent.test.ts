import { getContext, getNewValidPrismaForm } from "../__mocks__/data";
import { markAsResentFn as markAsResent } from "../markAsResent";
import { ErrorCode } from "../../../../common/errors";
import { createResentFormInputMock } from "../../../../generated/graphql/types";

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

jest.mock("../../../generated/prisma-client", () => ({
  prisma: {
    form: () => prisma.form(),
    updateForm: (...args) => prisma.updateForm(...args),
    createForm: () => prisma.createForm(),
    createStatusLog: () => prisma.createStatusLog(),
    updateManyForms: () => prisma.updateManyForms()
  }
}));

describe("Forms -> markAsResent mutation", () => {
  const defaultContext = getContext();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fail if form is not TEMP_STORED", async () => {
    expect.assertions(1);
    const form = getNewValidPrismaForm();
    form.recipientIsTempStorage = true;
    form.status = "DRAFT";

    try {
      mockFormWith(form);

      await markAsResent(
        form,
        { id: form.id, resentInfos: createResentFormInputMock({}) },
        defaultContext
      );
    } catch (err) {
      expect(err.extensions.code).toBe(ErrorCode.FORBIDDEN);
    }
  });

  it("should set status to RESENT", async () => {
    const form = getNewValidPrismaForm();
    form.status = "TEMP_STORED";
    form.recipientIsTempStorage = true;

    mockFormWith(form);

    await markAsResent(
      form,
      { id: form.id, resentInfos: createResentFormInputMock({}) },
      defaultContext
    );

    expect(prisma.updateForm).toHaveBeenCalledTimes(1);
    expect(prisma.updateForm).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "RESENT" })
      })
    );
  });
});
