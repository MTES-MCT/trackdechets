import { saveForm } from "../save-form";
import { ErrorCode } from "../../../common/errors";

import * as helpers from "../../../companies/helper";

describe("Forms -> saveForm mutation", () => {
  const formMock = jest.fn();
  const prisma = {
    form: formMock,
    updateForm: jest.fn(() => ({})),
    createForm: jest.fn(() => ({}))
  };

  const getUserCompaniesMcock = jest.spyOn(helpers, "getUserCompanies");
  getUserCompaniesMcock.mockResolvedValue([{ siret: "user siret" }]);

  beforeEach(() => {
    formMock.mockReset();
  });

  it("should fail when creating a form the current user is not part of", async () => {
    const formInput = {
      emitterCompanySiret: "an unknown siret",
      traderCompanySiret: "an unknown siret",
      recipientCompanySiret: "an unknown siret",
      transporterCompanySiret: "an unknown siret"
    };

    try {
      await saveForm(null, { formInput }, {
        prisma,
        user: { id: "userId" },
        request: null
      } as any);

      expect("Should throw").toBe("Error");
    } catch (err) {
      expect(err.extensions.code).toBe(ErrorCode.BAD_USER_INPUT);
    }
  });

  it("should fail when editing a form the current user is not part of", async () => {
    const formInput = {
      id: "existing id",
      emitterCompanySiret: "an unknown siret",
      traderCompanySiret: "an unknown siret",
      recipientCompanySiret: "an unknown siret",
      transporterCompanySiret: "an unknown siret"
    };

    try {
      await saveForm(null, { formInput }, {
        prisma,
        user: { id: "userId" },
        request: null
      } as any);

      expect("Should throw").toBe("Error");
    } catch (err) {
      expect(err.extensions.code).toBe(ErrorCode.BAD_USER_INPUT);
    }
  });

  it("should work when editing a form the current user is part of, with partial input", async () => {
    const formInput = {
      id: "existing id"
      // No siret infos
    };

    formMock.mockResolvedValue({ emitterCompanySiret: "user siret" });

    const result = await saveForm(null, { formInput }, {
      prisma,
      user: { id: "userId" },
      request: null
    } as any);

    expect(result).not.toBeNull();
  });

  it("should fail when editing a form the current user is not part of, with partial input", async () => {
    const formInput = {
      id: "existing id"
      // No siret infos
    };

    formMock.mockResolvedValue({
      emitterCompanySiret: "unknown resolved siret"
    });

    try {
      await saveForm(null, { formInput }, {
        prisma,
        user: { id: "userId" },
        request: null
      } as any);

      expect("Should throw").toBe("Error");
    } catch (err) {
      expect(err.extensions.code).toBe(ErrorCode.BAD_USER_INPUT);
    }
  });

  it("should fail when creating a form the current user is not part of, with partial input", async () => {
    const formInput = {
      // No id
      // No siret infos
    };

    try {
      await saveForm(null, { formInput }, {
        prisma,
        user: { id: "userId" },
        request: null
      } as any);

      expect("Should throw").toBe("Error");
    } catch (err) {
      expect(err.extensions.code).toBe(ErrorCode.BAD_USER_INPUT);
    }
  });
});
