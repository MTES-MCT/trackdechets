import { ErrorCode } from "../../../common/errors";
import { markAsSealed } from "../mark-as";
import { getNewValidPrismaForm, getContext } from "../__mocks__/data";
import * as companiesHelpers from "../../../companies/queries/userCompanies";

const temporaryStorageDetailMock = jest.fn(() => Promise.resolve(null));
const appendix2FormsMock = jest.fn(() => Promise.resolve([]));
const formMock = jest.fn(() => Promise.resolve({}));
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
  const getUserCompaniesMock = jest.spyOn(companiesHelpers, "getUserCompanies");

  const defaultContext = getContext();

  beforeEach(() => {
    Object.keys(prisma).forEach(key => prisma[key].mockClear());
    getUserCompaniesMock.mockReset();
  });

  it("should fail when form is not fully valid", async () => {
    expect.assertions(1);
    try {
      const form = getNewValidPrismaForm();
      // unvalidate form
      form.emitterCompanyAddress = null;

      getUserCompaniesMock.mockResolvedValue([
        { siret: form.emitterCompanySiret } as any
      ]);

      mockFormWith(form);

      await markAsSealed({ id: "1" }, defaultContext);
    } catch (err) {
      expect(err.extensions.code).toBe(ErrorCode.BAD_USER_INPUT);
    }
  });

  it("should display the validation error when the form has an invalid field", async () => {
    expect.assertions(1);
    try {
      const form = getNewValidPrismaForm();
      // unvalidate form
      form.emitterCompanySiret = "";

      getUserCompaniesMock.mockResolvedValue([
        { siret: form.emitterCompanySiret } as any
      ]);
      mockFormWith(form);

      await markAsSealed({ id: "1" }, defaultContext);
    } catch (err) {
      const errMess =
        `Erreur, impossible de sceller le bordereau car des champs obligatoires ne sont pas renseignés.\n` +
        `Erreur(s): Émetteur: La sélection d'une entreprise par SIRET est obligatoire`;

      expect(err.message).toBe(errMess);
    }
  });

  it("should display all validation errors if there are many", async () => {
    try {
      const form = getNewValidPrismaForm();
      // unvalidate form
      form.emitterCompanySiret = "";
      form.emitterCompanyAddress = "";

      getUserCompaniesMock.mockResolvedValue([
        { siret: form.emitterCompanySiret } as any
      ]);
      mockFormWith(form);

      await markAsSealed({ id: form.id }, defaultContext);
    } catch (err) {
      const errMess =
        `Erreur, impossible de sceller le bordereau car des champs obligatoires ne sont pas renseignés.\n` +
        `Erreur(s): Émetteur: La sélection d'une entreprise par SIRET est obligatoire\n` +
        `Émetteur: L'adresse d'une entreprise est obligatoire`;

      expect(err.message).toBe(errMess);
    }
  });

  it("should fail when SEALED is not a possible next step", async () => {
    expect.assertions(1);
    try {
      getUserCompaniesMock.mockResolvedValue([{ siret: "any siret" } as any]);
      mockFormWith({ id: 1, status: "SENT" });

      await markAsSealed({ id: "1" }, defaultContext);
    } catch (err) {
      expect(err.extensions.code).toBe(ErrorCode.FORBIDDEN);
    }
  });

  it("should work when form is complete and has no appendix 2", async () => {
    expect.assertions(1);
    const form = getNewValidPrismaForm();

    getUserCompaniesMock.mockResolvedValue([
      { siret: form.emitterCompanySiret } as any
    ]);
    appendix2FormsMock.mockResolvedValue([]);
    mockFormWith(form);

    await markAsSealed({ id: "1" }, defaultContext);
    expect(prisma.updateForm).toHaveBeenCalledTimes(1);
  });

  it("should work with appendix 2 and mark them as GROUPED", async () => {
    const form = getNewValidPrismaForm();

    getUserCompaniesMock.mockResolvedValue([
      { siret: form.emitterCompanySiret } as any
    ]);

    appendix2FormsMock.mockResolvedValue([{ id: "appendix id" }]);
    mockFormWith(form);

    await markAsSealed({ id: "1" }, defaultContext);
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
