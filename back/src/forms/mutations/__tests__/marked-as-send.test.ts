import { ErrorCode } from "../../../common/errors";
import * as companiesHelpers from "../../../companies/queries/userCompanies";
import { flattenObjectForDb } from "../../form-converter";
import { FormState } from "../../workflow/model";
import { markAsSent } from "../mark-as";
import { getNewValidForm } from "../__mocks__/data";

describe("Forms -> markAsSealed mutation", () => {
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
    updateForm: jest.fn(() => Promise.resolve({})),
    createForm: jest.fn(() => Promise.resolve({})),
    createStatusLog: jest.fn(() => Promise.resolve({})),
    updateManyForms: jest.fn(() => Promise.resolve({}))
  };

  const getUserCompaniesMock = jest.spyOn(companiesHelpers, "getUserCompanies");

  const defaultContext = {
    prisma,
    user: { id: "userId" },
    request: null
  } as any;

  beforeEach(() => {
    Object.keys(prisma).forEach(key => prisma[key].mockClear());
    getUserCompaniesMock.mockReset();
  });

  it("should fail when SENT is not a possible next step", async () => {
    expect.assertions(1);
    try {
      getUserCompaniesMock.mockResolvedValue([{ siret: "a siret" } as any]);
      mockFormWith({ id: 1, status: FormState.Sent });

      await markAsSent(null, { id: 1, sentInfo: {} }, defaultContext);
    } catch (err) {
      expect(err.extensions.code).toBe(ErrorCode.FORBIDDEN);
    }
  });

  it("should work when form is complete and has no appendix 2", async () => {
    expect.assertions(1);
    const form = getNewValidForm();
    form.status = "SEALED";

    getUserCompaniesMock.mockResolvedValue([
      { siret: form.emitter.company.siret } as any
    ]);

    appendix2FormsMock.mockResolvedValue([]);
    mockFormWith(flattenObjectForDb(form));

    await markAsSent(null, { id: 1, sentInfo: {} }, defaultContext);
    expect(prisma.updateForm).toHaveBeenCalledTimes(1);
  });

  it("should work with appendix 2 and mark them as GROUPED", async () => {
    const form = getNewValidForm();
    form.status = "SEALED";

    getUserCompaniesMock.mockResolvedValue([
      { siret: form.emitter.company.siret } as any
    ]);

    appendix2FormsMock.mockResolvedValue([{ id: "appendix id" }]);
    mockFormWith(flattenObjectForDb(form));

    await markAsSent(null, { id: 1, sentInfo: {} }, defaultContext);
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
