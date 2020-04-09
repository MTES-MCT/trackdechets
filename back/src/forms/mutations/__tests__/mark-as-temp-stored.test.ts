import { getNewValidForm } from "../__mocks__/data";
import { markAsTempStored } from "../mark-as";
import * as companiesHelpers from "../../../companies/queries/userCompanies";
import { ErrorCode } from "../../../common/errors";
import { FormState } from "../../workflow/model";
import { flattenObjectForDb } from "../../form-converter";

describe("Forms -> markAsTempStored mutation", () => {
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
    getUserCompaniesMock.mockReset();
    jest.clearAllMocks();
  });

  it("should fail if form is not SENT", async () => {
    expect.assertions(1);

    try {
      getUserCompaniesMock.mockResolvedValue([{ siret: "a siret" } as any]);
      mockFormWith({ id: 1, status: FormState.Draft });

      await markAsTempStored(
        null,
        { id: 1, tempStoredInfos: {} },
        defaultContext
      );
    } catch (err) {
      expect(err.extensions.code).toBe(ErrorCode.FORBIDDEN);
    }
  });

  it("should set status to TEMP_STORED when waste is accepted by temporary storer", async () => {
    const form = getNewValidForm();
    form.status = "SENT";
    form.recipient.isTempStorage = true;

    getUserCompaniesMock.mockResolvedValue([
      { siret: form.emitter.company.siret } as any
    ]);

    mockFormWith(flattenObjectForDb(form));

    await markAsTempStored(
      null,
      { id: 1, tempStoredInfos: { wasteAcceptationStatus: "ACCEPTED" } },
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
    const form = getNewValidForm();
    form.status = "SENT";
    form.recipient.isTempStorage = true;

    getUserCompaniesMock.mockResolvedValue([
      { siret: form.emitter.company.siret } as any
    ]);

    mockFormWith(flattenObjectForDb(form));

    await markAsTempStored(
      null,
      { id: 1, tempStoredInfos: { wasteAcceptationStatus: "REFUSED" } },
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
