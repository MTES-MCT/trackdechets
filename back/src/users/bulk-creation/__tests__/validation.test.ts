import { ValidationError } from "yup";
import { companyValidationSchema, validateRoleGenerator } from "../validations";
import { CollectorType, CompanyType, WasteProcessorType } from "@prisma/client";
import { siretify } from "../../../__tests__/factories";

const mockCompanyExists = jest.fn();
const mockUserExists = jest.fn();

jest.mock("@td/prisma", () => ({
  prisma: {
    company: { findFirst: jest.fn(() => mockCompanyExists()) },
    user: { findFirst: jest.fn(() => mockUserExists()) }
  }
}));

const mockSirene = jest.fn();

jest.mock("../../../companies/search", () => ({
  searchCompany: jest.fn(() => mockSirene())
}));

describe("company validation", () => {
  beforeEach(() => {
    mockCompanyExists.mockResolvedValue(false);
    mockUserExists.mockResolvedValue(false);
    mockSirene.mockResolvedValue({});
  });

  const originalWarn = console.warn;
  afterEach(() => (console.warn = originalWarn));

  test("valid company", async () => {
    const company = {
      siret: siretify(1),
      companyTypes: ["PRODUCER"]
    };
    await expect(companyValidationSchema.validate(company)).resolves.toEqual(
      company
    );
  });

  test("missing siret", async () => {
    await expect(
      companyValidationSchema.validate({
        siret: null,
        companyTypes: ["PRODUCER"]
      })
    ).rejects.toThrow(ValidationError);

    await expect(
      companyValidationSchema.validate({
        companyTypes: ["PRODUCER"]
      })
    ).rejects.toThrow(ValidationError);
  });

  test("siret does not have length of 14", async () => {
    await expect(
      companyValidationSchema.validate({
        siret: "123",
        companyTypes: ["PRODUCER"]
      })
    ).rejects.toThrow(ValidationError);
  });

  test("siret is not a well formatted 14 numbers", async () => {
    await expect(
      companyValidationSchema.validate({
        siret: "123456789 234",
        companyTypes: ["PRODUCER"]
      })
    ).rejects.toThrow(ValidationError);
  });

  test("siret does not exist in SIRENE database", async () => {
    mockSirene.mockImplementationOnce(() =>
      Promise.reject("SIRET does not exist")
    );
    await expect(
      companyValidationSchema.validate({
        siret: siretify(1),
        companyTypes: ["PRODUCER"]
      })
    ).rejects.toThrow(ValidationError);
  });

  test("company already exists in TD", async () => {
    mockCompanyExists.mockResolvedValueOnce(true);
    console.warn = jest.fn();
    await companyValidationSchema.validate({
      siret: siretify(1),
      companyTypes: ["PRODUCER"]
    });
    // a warning must be emitted
    expect(console.warn).toBeCalled();
  });

  test("missing companyTypes", async () => {
    await expect(
      companyValidationSchema.validate({
        siret: siretify(1)
      })
    ).rejects.toThrow(ValidationError);
    await expect(
      companyValidationSchema.validate({
        siret: siretify(1),
        companyTypes: null
      })
    ).rejects.toThrow(ValidationError);
    await expect(
      companyValidationSchema.validate({
        siret: siretify(1),
        companyTypes: []
      })
    ).rejects.toThrow(ValidationError);
    await expect(
      companyValidationSchema.validate({
        siret: siretify(1),
        companyTypes: [""]
      })
    ).rejects.toThrow(ValidationError);
  });

  test("companyTypes includes bad value", async () => {
    await expect(
      companyValidationSchema.validate({
        siret: siretify(1),
        companyTypes: [
          "PRODUCE", // typo here
          "WASTE_PROCESSOR"
        ]
      })
    ).rejects.toThrow(ValidationError);
  });

  test("contactEmail format", async () => {
    // valid email
    const company = {
      siret: siretify(1),
      companyTypes: ["PRODUCER"],
      contactEmail: "john.snow@trackdechets.fr"
    };
    await expect(companyValidationSchema.validate(company)).resolves.toEqual(
      company
    );
    // invalid email
    await expect(
      companyValidationSchema.validate({
        siret: siretify(1),
        companyTypes: ["PRODUCER"],
        contactEmail: "azerty"
      })
    ).rejects.toThrow(ValidationError);
  });

  test("website format", async () => {
    // valid URL
    const company = {
      siret: siretify(1),
      companyTypes: ["PRODUCER"],
      website: "https://trackdechets.beta.gouv.fr"
    };
    await expect(companyValidationSchema.validate(company)).resolves.toEqual(
      company
    );
    // invalid URL
    await expect(
      companyValidationSchema.validate({
        siret: siretify(1),
        companyTypes: ["PRODUCER"],
        website: "azerty"
      })
    ).rejects.toThrow(ValidationError);
  });

  test("contactPhone format", async () => {
    // valid phone number
    let company = {
      siret: siretify(1),
      companyTypes: ["PRODUCER"],
      contactPhone: "0100000000"
    };
    await expect(companyValidationSchema.validate(company)).resolves.toEqual(
      company
    );
    company = {
      siret: siretify(1),
      companyTypes: ["PRODUCER"],
      contactPhone: "01 00 00 00 00"
    };
    await expect(companyValidationSchema.validate(company)).resolves.toEqual(
      company
    );

    company = {
      siret: siretify(1),
      companyTypes: ["PRODUCER"],
      contactPhone: "01-00-00-00-00"
    };
    await expect(companyValidationSchema.validate(company)).resolves.toEqual(
      company
    );
    // invalid phone number
    await expect(
      companyValidationSchema.validate({
        siret: siretify(1),
        companyTypes: ["PRODUCER"],
        contactPhone: "01-00-00-00" // missing two digits
      })
    ).rejects.toThrow(ValidationError);
  });

  test("closed company", async () => {
    mockSirene.mockImplementationOnce(() =>
      Promise.resolve({ etatAdministratif: "F" })
    );
    const siret = siretify(1);
    await expect(
      companyValidationSchema.validate({
        siret,
        companyTypes: ["PRODUCER"]
      })
    ).rejects.toThrow(
      `Siret ${siret} was not found in SIRENE database or company is closed`
    );
  });

  it("collector should be able to chose collector types", async () => {
    // Given
    mockSirene.mockImplementationOnce(() =>
      Promise.resolve({ etatAdministratif: "A" })
    );
    const siret = siretify(1);

    // When
    const { companyTypes, collectorTypes } =
      await companyValidationSchema.validate({
        siret,
        companyTypes: ["COLLECTOR"],
        collectorTypes: [
          CollectorType.DANGEROUS_WASTES,
          CollectorType.DEEE_WASTES
        ]
      });

    // Then
    expect(companyTypes).toEqual(["COLLECTOR"]);
    expect(collectorTypes).toEqual([
      CollectorType.DANGEROUS_WASTES,
      CollectorType.DEEE_WASTES
    ]);
  });

  it("cannot chose collector types if not collector", async () => {
    // Given
    mockSirene.mockImplementationOnce(() =>
      Promise.resolve({ etatAdministratif: "A" })
    );
    const siret = siretify(1);

    expect.assertions(1);

    // When
    try {
      await companyValidationSchema.validate({
        siret,
        companyTypes: ["PRODUCER"],
        collectorTypes: [
          CollectorType.DANGEROUS_WASTES,
          CollectorType.DEEE_WASTES
        ]
      });
    } catch (e) {
      // Then
      expect(e.message).toEqual(
        "Your company needs to be a Collector to have collectorTypes"
      );
    }
  });

  it("collectorTypes must be valid CollectorType", async () => {
    // Given
    mockSirene.mockImplementationOnce(() =>
      Promise.resolve({ etatAdministratif: "A" })
    );
    const siret = siretify(1);

    expect.assertions(1);

    // When
    try {
      await companyValidationSchema.validate({
        siret,
        companyTypes: ["COLLECTOR"],
        collectorTypes: [WasteProcessorType.CREMATION]
      });
    } catch (e) {
      // Then
      expect(e.message).toEqual(
        `collectorTypes[0] must be one of the following values: NON_DANGEROUS_WASTES, DANGEROUS_WASTES, DEEE_WASTES, OTHER_NON_DANGEROUS_WASTES, OTHER_DANGEROUS_WASTES`
      );
    }
  });

  it("collector types should not be duplicated", async () => {
    // Given
    mockSirene.mockImplementationOnce(() =>
      Promise.resolve({ etatAdministratif: "A" })
    );
    const siret = siretify(1);

    // When
    const { companyTypes, collectorTypes } =
      await companyValidationSchema.validate({
        siret,
        companyTypes: ["COLLECTOR"],
        collectorTypes: [
          CollectorType.DANGEROUS_WASTES,
          CollectorType.DANGEROUS_WASTES
        ]
      });

    // Then
    expect(companyTypes).toEqual(["COLLECTOR"]);
    expect(collectorTypes).toEqual([CollectorType.DANGEROUS_WASTES]);
  });

  it("collector types are optional", async () => {
    // Given
    mockSirene.mockImplementationOnce(() =>
      Promise.resolve({ etatAdministratif: "A" })
    );
    const siret = siretify(1);

    // When
    const { companyTypes, collectorTypes } =
      await companyValidationSchema.validate({
        siret,
        companyTypes: ["COLLECTOR"]
      });

    // Then
    expect(companyTypes).toEqual(["COLLECTOR"]);
    expect(collectorTypes).toBeUndefined();
  });

  it.each([null, []])(
    "collector types can be nullified > value '%p'",
    async collectorTypesArg => {
      // Given
      mockSirene.mockImplementationOnce(() =>
        Promise.resolve({ etatAdministratif: "A" })
      );
      const siret = siretify(1);

      // When
      const { companyTypes, collectorTypes } =
        await companyValidationSchema.validate({
          siret,
          companyTypes: ["COLLECTOR"],
          collectorTypes: collectorTypesArg
        });

      // Then
      expect(companyTypes).toEqual(["COLLECTOR"]);
      expect(collectorTypes).toEqual([]);
    }
  );

  it("waste processor should be able to chose waste processor types", async () => {
    // Given
    mockSirene.mockImplementationOnce(() =>
      Promise.resolve({ etatAdministratif: "A" })
    );
    const siret = siretify(1);

    // When
    const { companyTypes, wasteProcessorTypes } =
      await companyValidationSchema.validate({
        siret,
        companyTypes: ["WASTEPROCESSOR"],
        wasteProcessorTypes: [
          WasteProcessorType.CREMATION,
          WasteProcessorType.INERT_WASTES_STORAGE
        ]
      });

    // Then
    expect(companyTypes).toEqual(["WASTEPROCESSOR"]);
    expect(wasteProcessorTypes).toEqual([
      WasteProcessorType.CREMATION,
      WasteProcessorType.INERT_WASTES_STORAGE
    ]);
  });

  it("cannot chose wasteProcessorTypes if not waste processor", async () => {
    // Given
    mockSirene.mockImplementationOnce(() =>
      Promise.resolve({ etatAdministratif: "A" })
    );
    const siret = siretify(1);

    expect.assertions(1);

    // When
    try {
      await companyValidationSchema.validate({
        siret,
        companyTypes: ["PRODUCER"],
        wasteProcessorTypes: [
          WasteProcessorType.CREMATION,
          WasteProcessorType.INERT_WASTES_STORAGE
        ]
      });
    } catch (e) {
      // Then
      expect(e.message).toEqual(
        "Your company needs to be a WasteProcessor to have wasteProcessorTypes"
      );
    }
  });

  it("wasteProcessorTypes must be valid WasteProcessorTypes", async () => {
    // Given
    mockSirene.mockImplementationOnce(() =>
      Promise.resolve({ etatAdministratif: "A" })
    );
    const siret = siretify(1);

    expect.assertions(1);

    // When
    try {
      await companyValidationSchema.validate({
        siret,
        companyTypes: ["WASTEPROCESSOR"],
        wasteProcessorTypes: [CollectorType.DANGEROUS_WASTES]
      });
    } catch (e) {
      // Then
      expect(e.message).toEqual(
        `wasteProcessorTypes[0] must be one of the following values: DANGEROUS_WASTES_INCINERATION, NON_DANGEROUS_WASTES_INCINERATION, CREMATION, DANGEROUS_WASTES_STORAGE, NON_DANGEROUS_WASTES_STORAGE, INERT_WASTES_STORAGE, OTHER_DANGEROUS_WASTES, OTHER_NON_DANGEROUS_WASTES`
      );
    }
  });

  it("wasteProcessorTypes should not be duplicated", async () => {
    // Given
    mockSirene.mockImplementationOnce(() =>
      Promise.resolve({ etatAdministratif: "A" })
    );
    const siret = siretify(1);

    // When
    const { companyTypes, wasteProcessorTypes } =
      await companyValidationSchema.validate({
        siret,
        companyTypes: ["WASTEPROCESSOR"],
        wasteProcessorTypes: [
          WasteProcessorType.CREMATION,
          WasteProcessorType.CREMATION
        ]
      });

    // Then
    expect(companyTypes).toEqual(["WASTEPROCESSOR"]);
    expect(wasteProcessorTypes).toEqual([WasteProcessorType.CREMATION]);
  });

  it("wasteProcessorTypes are optional", async () => {
    // Given
    mockSirene.mockImplementationOnce(() =>
      Promise.resolve({ etatAdministratif: "A" })
    );
    const siret = siretify(1);

    // When
    const { companyTypes, wasteProcessorTypes } =
      await companyValidationSchema.validate({
        siret,
        companyTypes: ["WASTEPROCESSOR"]
      });

    // Then
    expect(companyTypes).toEqual(["WASTEPROCESSOR"]);
    expect(wasteProcessorTypes).toBeUndefined();
  });

  it.each([null, []])(
    "wasteProcessorTypes can be nullified > value '%p'",
    async wasteProcessorTypesArg => {
      // Given
      mockSirene.mockImplementationOnce(() =>
        Promise.resolve({ etatAdministratif: "A" })
      );
      const siret = siretify(1);

      // When
      const { companyTypes, wasteProcessorTypes } =
        await companyValidationSchema.validate({
          siret,
          companyTypes: ["WASTEPROCESSOR"],
          wasteProcessorTypes: wasteProcessorTypesArg
        });

      // Then
      expect(companyTypes).toEqual(["WASTEPROCESSOR"]);
      expect(wasteProcessorTypes).toEqual([]);
    }
  );
});

describe("role validation", () => {
  const companies = [
    { siret: siretify(1), companyTypes: ["PRODUCER" as CompanyType] }
  ];

  const validateRole = validateRoleGenerator(companies as any);

  test("valid role", async () => {
    const role = {
      siret: companies[0].siret,
      email: "john.snow@trackdechets.fr",
      role: "MEMBER"
    };
    await expect(validateRole(role)).resolves.toEqual(role);
  });

  test("missing email", async () => {
    await expect(
      validateRole({
        siret: siretify(1),
        role: "MEMBER"
      })
    ).rejects.toThrow(ValidationError);
    await expect(
      validateRole({
        siret: siretify(1),
        role: "MEMBER",
        email: null
      })
    ).rejects.toThrow(ValidationError);
    await expect(
      validateRole({
        siret: siretify(1),
        role: "MEMBER",
        email: ""
      })
    ).rejects.toThrow(ValidationError);
  });

  test("email already exists in TD", async () => {
    mockUserExists.mockResolvedValueOnce(true);
    console.warn = jest.fn();
    await validateRole({
      siret: companies[0].siret,
      email: "john.snow@trackdechets.fr",
      role: "MEMBER"
    });
    expect(console.warn).toBeCalled();
  });

  test("missing siret", async () => {
    await expect(
      validateRole({
        email: "john.snow@trackdechets.fr",
        role: "MEMBER"
      })
    ).rejects.toThrow(ValidationError);
    await expect(
      validateRole({
        siret: null,
        email: "john.snow@trackdechets.fr",
        role: "MEMBER"
      })
    ).rejects.toThrow(ValidationError);
    await expect(
      validateRole({
        siret: "",
        email: "john.snow@trackdechets.fr",
        role: "MEMBER"
      })
    ).rejects.toThrow(ValidationError);
  });

  test("siret not in company list", async () => {
    await expect(
      validateRole({
        siret: "23456789012345",
        email: "arya.stark@trackdechets.fr",
        role: "MEMBER"
      })
    ).rejects.toThrow(ValidationError);
  });

  test("missing role", async () => {
    await expect(
      validateRole({
        siret: "23456789012345",
        email: "arya.stark@trackdechets.fr"
      })
    ).rejects.toThrow(ValidationError);
    await expect(
      validateRole({
        siret: "23456789012345",
        email: "arya.stark@trackdechets.fr",
        role: null
      })
    ).rejects.toThrow(ValidationError);
    await expect(
      validateRole({
        siret: "23456789012345",
        email: "arya.stark@trackdechets.fr",
        role: ""
      })
    ).rejects.toThrow(ValidationError);
  });

  test("role is invalid", async () => {
    await expect(
      validateRole({
        siret: "23456789012345",
        email: "arya.stark@trackdechets.fr",
        role: "SUPERADMIN"
      })
    ).rejects.toThrow(ValidationError);
  });
});
