import { saveForm } from "../save-form";
import { ErrorCode } from "../../../common/errors";
import * as queries from "../../../companies/queries";

const temporaryStorageDetailMock = jest.fn(() => Promise.resolve(null));
const ecoOrganismeMock = jest.fn<Promise<null | { siret: string }>, []>(() =>
  Promise.resolve(null)
);
const formMock = jest.fn(() => Promise.resolve({}));
function mockFormWith(value) {
  const result: any = Promise.resolve(value);
  result.temporaryStorageDetail = temporaryStorageDetailMock;
  result.ecoOrganisme = ecoOrganismeMock;
  formMock.mockReturnValue(result);
}

const prisma = {
  form: formMock,
  forms: jest.fn(() => []),
  updateForm: jest.fn(() => ({})),
  createForm: jest.fn(() => ({}))
};

jest.mock("../../../generated/prisma-client", () => ({
  prisma: {
    form: () => prisma.form(),
    forms: () => prisma.forms(),
    updateForm: () => prisma.updateForm(),
    createForm: () => prisma.createForm()
  }
}));

describe("Forms -> saveForm mutation", () => {
  const getUserCompaniesMock = jest.spyOn(queries, "getUserCompanies");
  getUserCompaniesMock.mockResolvedValue([
    {
      id: "",
      securityCode: 123,
      companyTypes: [],
      siret: "user siret",
      createdAt: new Date().toString(),
      updatedAt: new Date().toString(),
      documentKeys: []
    }
  ]);

  beforeEach(() => {
    formMock.mockReset();
  });

  it("should fail when creating a form the current user is not part of", async () => {
    expect.assertions(1);
    mockFormWith(null);

    const formInput = {
      emitterCompanySiret: "an unknown siret",
      traderCompanySiret: "an unknown siret",
      recipientCompanySiret: "an unknown siret",
      transporterCompanySiret: "an unknown siret"
    };

    try {
      await saveForm("userId", { formInput } as any);
    } catch (err) {
      expect(err.extensions.code).toBe(ErrorCode.FORBIDDEN);
    }
  });

  it("should fail when editing a form the current user is not part of", async () => {
    expect.assertions(1);
    mockFormWith(null);

    const formInput = {
      id: "existing id",
      emitterCompanySiret: "an unknown siret",
      traderCompanySiret: "an unknown siret",
      recipientCompanySiret: "an unknown siret",
      transporterCompanySiret: "an unknown siret"
    };

    try {
      await saveForm("userId", { formInput } as any);
    } catch (err) {
      expect(err.extensions.code).toBe(ErrorCode.FORBIDDEN);
    }
  });

  it("should work when editing a form the current user is part of, with partial input", async () => {
    const formInput = {
      id: "existing id"
      // No siret infos
    };

    mockFormWith({ emitterCompanySiret: "user siret" });

    const result = await saveForm("userId", { formInput } as any);

    expect(result).not.toBeNull();
  });

  it("should work when editing a form the current user is eco-organisme, with partial input", async () => {
    const formInput = {
      id: "existing id"
      // No siret infos
    };

    ecoOrganismeMock.mockResolvedValueOnce({ siret: "user siret" });
    mockFormWith({});

    const result = await saveForm("userId", { formInput } as any);

    expect(result).not.toBeNull();
  });

  it("should fail when editing a form the current user is not part of, with partial input", async () => {
    expect.assertions(1);
    const formInput = {
      id: "existing id"
      // No siret infos
    };

    mockFormWith({
      emitterCompanySiret: "unknown resolved siret"
    });

    try {
      await saveForm("userId", { formInput } as any);
    } catch (err) {
      expect(err.extensions.code).toBe(ErrorCode.FORBIDDEN);
    }
  });

  it("should fail when creating a form the current user is not part of, with partial input", async () => {
    expect.assertions(1);
    mockFormWith(null);

    const formInput = {
      // No id
      // No siret infos
    };

    try {
      await saveForm("userId", { formInput } as any);
    } catch (err) {
      expect(err.extensions.code).toBe(ErrorCode.FORBIDDEN);
    }
  });
});
