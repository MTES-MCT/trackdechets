import { getNewValidForm, getContext } from "../__mocks__/data";
import { markAsTempStored } from "../mark-as";
import * as companiesHelpers from "../../../companies/queries/userCompanies";
import { ErrorCode } from "../../../common/errors";
import { FormState } from "../../workflow/model";
import { flattenObjectForDb } from "../../form-converter";
import {
  TempStoredFormInput,
  WasteAcceptationStatusInput
} from "../../../generated/graphql/types";

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
  updateForm: jest.fn((...args) => Promise.resolve({})),
  createForm: jest.fn((...args) => Promise.resolve({})),
  createStatusLog: jest.fn((...args) => Promise.resolve({})),
  updateManyForms: jest.fn((...args) => Promise.resolve({}))
};

jest.mock("../../../generated/prisma-client", () => ({
  prisma: {
    form: () => prisma.form(),
    updateForm: (...args) => prisma.updateForm(...args),
    createForm: (...args) => prisma.createForm(...args),
    createStatusLog: (...args) => prisma.createStatusLog(...args),
    updateManyForms: (...args) => prisma.updateManyForms(...args)
  }
}));

describe("Forms -> markAsTempStored mutation", () => {
  const getUserCompaniesMock = jest.spyOn(companiesHelpers, "getUserCompanies");

  const defaultContext = getContext();

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
        { id: "1", tempStoredInfos: {} as TempStoredFormInput },
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

    const ACCEPTED: WasteAcceptationStatusInput = "ACCEPTED";
    await markAsTempStored(
      {
        id: "1",
        tempStoredInfos: {
          wasteAcceptationStatus: ACCEPTED
        } as TempStoredFormInput
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
    const form = getNewValidForm();
    form.status = "SENT";
    form.recipient.isTempStorage = true;

    getUserCompaniesMock.mockResolvedValue([
      { siret: form.emitter.company.siret } as any
    ]);

    mockFormWith(flattenObjectForDb(form));

    const REFUSED: WasteAcceptationStatusInput = "REFUSED";
    await markAsTempStored(
      {
        id: "1",
        tempStoredInfos: {
          wasteAcceptationStatus: REFUSED
        } as TempStoredFormInput
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
