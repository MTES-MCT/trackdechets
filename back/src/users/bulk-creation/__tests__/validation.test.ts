import { ValidationError } from "yup";
import { companyValidationSchema, validateRoleGenerator } from "../validations";
import { CompanyType } from "@prisma/client";
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
      companyTypes: ["PRODUCER"],
      collectorTypes: [],
      wasteProcessorTypes: [],
      wasteVehiclesTypes: []
    };
    await expect(companyValidationSchema.validate(company)).resolves.toEqual(
      company
    );
  });

  test("missing siret", async () => {
    await expect(
      companyValidationSchema.validate({
        siret: null,
        companyTypes: ["PRODUCER"],
        collectorTypes: [],
        wasteProcessorTypes: [],
        wasteVehiclesTypes: []
      })
    ).rejects.toThrow(ValidationError);

    await expect(
      companyValidationSchema.validate({
        companyTypes: ["PRODUCER"],
        collectorTypes: [],
        wasteProcessorTypes: [],
        wasteVehiclesTypes: []
      })
    ).rejects.toThrow(ValidationError);
  });

  test("siret does not have length of 14", async () => {
    await expect(
      companyValidationSchema.validate({
        siret: "123",
        companyTypes: ["PRODUCER"],
        collectorTypes: [],
        wasteProcessorTypes: [],
        wasteVehiclesTypes: []
      })
    ).rejects.toThrow(ValidationError);
  });

  test("siret is not a well formatted 14 numbers", async () => {
    await expect(
      companyValidationSchema.validate({
        siret: "123456789 234",
        companyTypes: ["PRODUCER"],
        collectorTypes: [],
        wasteProcessorTypes: [],
        wasteVehiclesTypes: []
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
        companyTypes: ["PRODUCER"],
        collectorTypes: [],
        wasteProcessorTypes: [],
        wasteVehiclesTypes: []
      })
    ).rejects.toThrow(ValidationError);
  });

  test("company already exists in TD", async () => {
    mockCompanyExists.mockResolvedValueOnce(true);
    console.warn = jest.fn();
    await companyValidationSchema.validate({
      siret: siretify(1),
      companyTypes: ["PRODUCER"],
      collectorTypes: [],
      wasteProcessorTypes: [],
      wasteVehiclesTypes: []
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
        ],
        collectorTypes: [],
        wasteProcessorTypes: [],
        wasteVehiclesTypes: []
      })
    ).rejects.toThrow(ValidationError);
  });
  test("companyTypes includes deprecated CREMATORIUM value", async () => {
    await expect(
      companyValidationSchema.validate({
        siret: siretify(1),
        companyTypes: [
          "CREMATORIUM" // deprecated
        ],
        collectorTypes: [],
        wasteProcessorTypes: [],
        wasteVehiclesTypes: []
      })
    ).rejects.toThrow(ValidationError);
  });
  test("wasteProcessorTypes wihtout WASTEPROCESSOR", async () => {
    await expect(
      companyValidationSchema.validate({
        siret: siretify(1),
        companyTypes: ["PRODUCER"],
        collectorTypes: [],
        wasteProcessorTypes: ["DANGEROUS_WASTES_INCINERATION"],
        wasteVehiclesTypes: []
      })
    ).rejects.toThrow(ValidationError);
  });

  test("collectorTypes wihtout COLLECTOR", async () => {
    await expect(
      companyValidationSchema.validate({
        siret: siretify(1),
        companyTypes: ["PRODUCER"],
        collectorTypes: ["DEEE_WASTES"],
        wasteProcessorTypes: [],
        wasteVehiclesTypes: []
      })
    ).rejects.toThrow(ValidationError);
  });

  test("wasteVehiclesType wihtout WASTE_VEHICLES", async () => {
    await expect(
      companyValidationSchema.validate({
        siret: siretify(1),
        companyTypes: ["PRODUCER"],
        collectorTypes: [],
        wasteProcessorTypes: [],
        wasteVehiclesTypes: ["DEMOLISSEUR"]
      })
    ).rejects.toThrow(ValidationError);
  });

  test("full subtypes", async () => {
    // valid subtypes
    const company = {
      siret: siretify(1),
      companyTypes: ["COLLECTOR", "WASTE_VEHICLES", "WASTEPROCESSOR"],
      collectorTypes: [
        "NON_DANGEROUS_WASTES",
        "DANGEROUS_WASTES",
        "DEEE_WASTES"
      ],
      wasteProcessorTypes: [
        "DANGEROUS_WASTES_INCINERATION",
        "CREMATION",
        "DANGEROUS_WASTES_STORAGE",
        "INERT_WASTES_STORAGE"
      ],
      wasteVehiclesTypes: ["BROYEUR", "DEMOLISSEUR"],
      contactEmail: "john.snow@trackdechets.fr"
    };
    await expect(companyValidationSchema.validate(company)).resolves.toEqual(
      company
    );
  });

  test("contactEmail format", async () => {
    // valid email
    const company = {
      siret: siretify(1),
      companyTypes: ["PRODUCER"],
      collectorTypes: [],
      wasteProcessorTypes: [],
      wasteVehiclesTypes: [],
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
        collectorTypes: [],
        wasteProcessorTypes: [],
        wasteVehiclesTypes: [],
        contactEmail: "azerty"
      })
    ).rejects.toThrow(ValidationError);
  });

  test("website format", async () => {
    // valid URL
    const company = {
      siret: siretify(1),
      companyTypes: ["PRODUCER"],
      collectorTypes: [],
      wasteProcessorTypes: [],
      wasteVehiclesTypes: [],
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
      collectorTypes: [],
      wasteProcessorTypes: [],
      wasteVehiclesTypes: [],
      contactPhone: "0100000000"
    };
    await expect(companyValidationSchema.validate(company)).resolves.toEqual(
      company
    );
    company = {
      siret: siretify(1),
      companyTypes: ["PRODUCER"],
      collectorTypes: [],
      wasteProcessorTypes: [],
      wasteVehiclesTypes: [],
      contactPhone: "01 00 00 00 00"
    };
    await expect(companyValidationSchema.validate(company)).resolves.toEqual(
      company
    );

    company = {
      siret: siretify(1),
      companyTypes: ["PRODUCER"],
      collectorTypes: [],
      wasteProcessorTypes: [],
      wasteVehiclesTypes: [],
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
        collectorTypes: [],
        wasteProcessorTypes: [],
        wasteVehiclesTypes: [],
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
        companyTypes: ["PRODUCER"],
        collectorTypes: [],
        wasteProcessorTypes: [],
        wasteVehiclesTypes: []
      })
    ).rejects.toThrow(
      `Siret ${siret} was not found in SIRENE database or company is closed`
    );
  });
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
