import { ErrorCode } from "../../../common/errors";
import { FormState } from "../../workflow/model";
import { markAsSent } from "../mark-as";
import {
  getNewValidPrismaForm,
  getContext
} from "../../resolvers/mutations/__mocks__/data";

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
  updateManyForms: jest.fn((..._args) => Promise.resolve({}))
};

jest.mock("../../../generated/prisma-client", () => ({
  prisma: {
    form: () => prisma.form(),
    updateForm: (...args) => prisma.updateForm(...args),
    createForm: () => prisma.createForm(),
    createStatusLog: () => prisma.createStatusLog(),
    updateManyForms: (...args) => prisma.updateManyForms(...args)
  }
}));

describe("Forms -> markAsSealed mutation", () => {
  const defaultContext = getContext();

  beforeEach(() => {
    Object.keys(prisma).forEach(key => prisma[key].mockClear());
  });

  it("should fail when SENT is not a possible next step", async () => {
    expect.assertions(1);
    try {
      mockFormWith({ id: 1, status: FormState.Sent });

      await markAsSent({ id: "1", sentInfo: {} }, defaultContext);
    } catch (err) {
      expect(err.extensions.code).toBe(ErrorCode.FORBIDDEN);
    }
  });

  it("should work when form is complete and has no appendix 2", async () => {
    expect.assertions(1);
    const form = getNewValidPrismaForm();
    form.status = "SEALED";

    appendix2FormsMock.mockResolvedValue([]);
    mockFormWith(getNewValidPrismaForm());

    await markAsSent({ id: "1", sentInfo: {} }, defaultContext);
    expect(prisma.updateForm).toHaveBeenCalledTimes(1);
  });

  it("should work with appendix 2 and mark them as GROUPED", async () => {
    const form = getNewValidPrismaForm();
    form.status = "SEALED";

    appendix2FormsMock.mockResolvedValue([{ id: "appendix id" }]);
    mockFormWith(form);

    await markAsSent({ id: "1", sentInfo: {} }, defaultContext);
    expect(prisma.updateForm).toHaveBeenCalledTimes(1);
    expect(prisma.updateManyForms).toHaveBeenCalledWith({
      where: {
        status: "AWAITING_GROUP",
        OR: [{ id: "appendix id" }]
      },
      data: { status: "GROUPED" }
    });
  });
});
