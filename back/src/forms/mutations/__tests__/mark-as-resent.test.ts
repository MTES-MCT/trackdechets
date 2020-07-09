import { getNewValidForm, getContext } from "../__mocks__/data";
import { markAsResent } from "../mark-as";
import * as companiesHelpers from "../../../companies/queries/userCompanies";
import { ErrorCode } from "../../../common/errors";
import { FormState } from "../../workflow/model";
import { flattenFormInput } from "../../form-converter";

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
  const getUserCompaniesMock = jest.spyOn(companiesHelpers, "getUserCompanies");

  const defaultContext = getContext();

  beforeEach(() => {
    getUserCompaniesMock.mockReset();
    jest.clearAllMocks();
  });

  it("should fail if form is not TEMP_STORED", async () => {
    expect.assertions(1);

    try {
      getUserCompaniesMock.mockResolvedValue([{ siret: "a siret" } as any]);
      mockFormWith({ id: 1, status: FormState.Draft });

      await markAsResent({ id: "1", resentInfos: {} }, defaultContext);
    } catch (err) {
      expect(err.extensions.code).toBe(ErrorCode.FORBIDDEN);
    }
  });

  it("should set status to RESENT", async () => {
    const form = getNewValidForm();
    form.status = "TEMP_STORED";
    form.recipient.isTempStorage = true;

    getUserCompaniesMock.mockResolvedValue([
      { siret: form.emitter.company.siret } as any
    ]);

    mockFormWith(flattenFormInput(form));

    await markAsResent({ id: "1", resentInfos: {} }, defaultContext);

    expect(prisma.updateForm).toHaveBeenCalledTimes(1);
    expect(prisma.updateForm).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "RESENT" })
      })
    );
  });
});
