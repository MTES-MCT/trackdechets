import { ErrorCode } from "../../../common/errors";
import { markAsSealed } from "../mark-as";
import * as workflow from "../../workflow";
import { getNewValidForm } from "../__mocks__/data";
import { flattenObjectForDb } from "../../form-converter";

describe("Forms -> markAsSealed mutation", () => {
  const prisma = {
    form: jest.fn(() => Promise.resolve({})),
    updateForm: jest.fn(() => Promise.resolve({})),
    createForm: jest.fn(() => Promise.resolve({})),
    createStatusLog: jest.fn(() => Promise.resolve({})),
    updateManyForms: jest.fn(() => Promise.resolve({}))
  };

  const getNextPossibleStatusMock = jest.spyOn(
    workflow,
    "getNextPossibleStatus"
  );

  const defaultContext = {
    prisma,
    user: { id: "userId" },
    request: null
  } as any;

  beforeEach(() => {
    Object.keys(prisma).forEach(key => prisma[key].mockClear());
    getNextPossibleStatusMock.mockReset();
  });

  it("should fail when form is not fully valid", async () => {
    expect.assertions(1);
    try {
      const form = getNewValidForm();
      // unvalidate form
      form.emitter.company.address = null;

      getNextPossibleStatusMock.mockResolvedValue(["SEALED"]);
      prisma.form.mockResolvedValue(flattenObjectForDb(form));

      await markAsSealed(null, { id: 1 }, defaultContext);
    } catch (err) {
      expect(err.extensions.code).toBe(ErrorCode.BAD_USER_INPUT);
    }
  });

  it("should display the validation error when the form has an invalid field", async () => {
    expect.assertions(1);
    try {
      const form = getNewValidForm();
      // unvalidate form
      form.emitter.company.siret = null;

      getNextPossibleStatusMock.mockResolvedValue(["SEALED"]);
      prisma.form.mockResolvedValue(flattenObjectForDb(form));

      await markAsSealed(null, { id: 1 }, defaultContext);
    } catch (err) {
      expect(err.message).toMatch(
        /emitter.company.siret ne peut pas être null/
      );
    }
  });

  it("should display all validation errors if there are many", async () => {
    try {
      const form = getNewValidForm();
      // unvalidate form
      form.emitter.company.siret = null;
      form.emitter.company.address = null;

      getNextPossibleStatusMock.mockResolvedValue(["SEALED"]);
      prisma.form.mockResolvedValue(flattenObjectForDb(form));

      await markAsSealed(null, { id: 1 }, defaultContext);
    } catch (err) {
      expect(err.message).toMatch(
        /emitter.company.siret ne peut pas être null/
      );
      expect(err.message).toMatch(
        /emitter.company.address ne peut pas être null/
      );
    }
  });

  it("should fail when SEALED is not a possible next step", async () => {
    expect.assertions(1);
    try {
      getNextPossibleStatusMock.mockResolvedValue(["ANYTHING"]);
      prisma.form.mockResolvedValue({ id: 1 });

      await markAsSealed(null, { id: 1 }, defaultContext);
    } catch (err) {
      expect(err.extensions.code).toBe(ErrorCode.FORBIDDEN);
    }
  });

  it("should work when form is complete and has no appendix 2", async () => {
    expect.assertions(1);
    const form = getNewValidForm();

    getNextPossibleStatusMock.mockResolvedValue(["SEALED"]);
    prisma.form
      .mockReturnValue({
        appendix2Forms: () => Promise.resolve([])
      } as any)
      .mockReturnValueOnce(Promise.resolve(flattenObjectForDb(form)));

    await markAsSealed(null, { id: 1 }, defaultContext);
    expect(prisma.updateForm).toHaveBeenCalledTimes(1);
  });

  it("should work with appendix 2 and mark them as GROUPED", async () => {
    const form = getNewValidForm();

    getNextPossibleStatusMock.mockResolvedValue(["SEALED"]);
    prisma.form
      .mockReturnValue({
        appendix2Forms: () => Promise.resolve([{ id: "appendix id" }])
      } as any)
      .mockReturnValueOnce(Promise.resolve(flattenObjectForDb(form)));

    await markAsSealed(null, { id: 1 }, defaultContext);
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
