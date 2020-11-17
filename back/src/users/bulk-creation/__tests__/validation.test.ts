import { ValidationError } from "yup";
import { validateCompany, validateRoleGenerator } from "../validations";
import { CompanyType } from "@prisma/client";

const mockCompanyExists = jest.fn();
const mockUserExists = jest.fn();

jest.mock("src/prisma", () => ({
  prisma: {
    company: { findFirst: jest.fn(() => mockCompanyExists()) },
    user: { findFirst: jest.fn(() => mockUserExists()) }
  }
}));

const mockSirene = jest.fn();

jest.mock("../sirene", () => ({
  getCompanyThrottled: jest.fn(() => mockSirene())
}));

describe("company validation", () => {
  beforeEach(() => {
    mockCompanyExists.mockResolvedValue(false);
    mockUserExists.mockResolvedValue(false);
    mockSirene.mockReset();
  });

  const originalWarn = console.warn;
  afterEach(() => (console.warn = originalWarn));

  test("valid company", async () => {
    const company = {
      siret: "12345678901234",
      companyTypes: ["PRODUCER"]
    };
    await expect(validateCompany(company)).resolves.toEqual(company);
  });

  test("missing siret", async () => {
    await expect(
      validateCompany({
        siret: null,
        companyTypes: ["PRODUCER"]
      })
    ).rejects.toThrow(ValidationError);

    await expect(
      validateCompany({
        companyTypes: ["PRODUCER"]
      })
    ).rejects.toThrow(ValidationError);
  });

  test("siret does not have lenght 14", async () => {
    await expect(
      validateCompany({
        siret: "123",
        companyTypes: ["PRODUCER"]
      })
    ).rejects.toThrow(ValidationError);
  });

  test("siret does not exist in SIRENE database", async () => {
    mockSirene.mockImplementationOnce(() =>
      Promise.reject("SIRET does not exist")
    );
    await expect(
      validateCompany({
        siret: "12345678901234",
        companyTypes: ["PRODUCER"]
      })
    ).rejects.toThrow(ValidationError);
  });

  test("company already exists in TD", async () => {
    mockCompanyExists.mockResolvedValueOnce(true);
    console.warn = jest.fn();
    await validateCompany({
      siret: "12345678901234",
      companyTypes: ["PRODUCER"]
    });
    // a warning must be emitted
    expect(console.warn).toBeCalled();
  });

  test("missing companyTypes", async () => {
    await expect(
      validateCompany({
        siret: "12345678901234"
      })
    ).rejects.toThrow(ValidationError);
    await expect(
      validateCompany({
        siret: "12345678901234",
        companyTypes: null
      })
    ).rejects.toThrow(ValidationError);
    await expect(
      validateCompany({
        siret: "12345678901234",
        companyTypes: []
      })
    ).rejects.toThrow(ValidationError);
    await expect(
      validateCompany({
        siret: "12345678901234",
        companyTypes: [""]
      })
    ).rejects.toThrow(ValidationError);
  });

  test("companyTypes includes bad value", async () => {
    await expect(
      validateCompany({
        siret: "123",
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
      siret: "12345678901234",
      companyTypes: ["PRODUCER"],
      contactEmail: "john.snow@trackdechets.fr"
    };
    await expect(validateCompany(company)).resolves.toEqual(company);
    // invalid email
    await expect(
      validateCompany({
        siret: "12345678901234",
        companyTypes: ["PRODUCER"],
        contactEmail: "azerty"
      })
    ).rejects.toThrow(ValidationError);
  });

  test("website format", async () => {
    // valid URL
    const company = {
      siret: "12345678901234",
      companyTypes: ["PRODUCER"],
      website: "https://trackdechets.beta.gouv.fr"
    };
    await expect(validateCompany(company)).resolves.toEqual(company);
    // invalid URL
    await expect(
      validateCompany({
        siret: "12345678901234",
        companyTypes: ["PRODUCER"],
        website: "azerty"
      })
    ).rejects.toThrow(ValidationError);
  });

  test("contactPhone format", async () => {
    // valid phone number
    let company = {
      siret: "12345678901234",
      companyTypes: ["PRODUCER"],
      contactPhone: "0100000000"
    };
    await expect(validateCompany(company)).resolves.toEqual(company);
    company = {
      siret: "12345678901234",
      companyTypes: ["PRODUCER"],
      contactPhone: "01 00 00 00 00"
    };
    await expect(validateCompany(company)).resolves.toEqual(company);

    company = {
      siret: "12345678901234",
      companyTypes: ["PRODUCER"],
      contactPhone: "01-00-00-00-00"
    };
    await expect(validateCompany(company)).resolves.toEqual(company);
    // invalid phone number
    await expect(
      validateCompany({
        siret: "12345678901234",
        companyTypes: ["PRODUCER"],
        contactPhone: "01-00-00-00" // missing two digits
      })
    ).rejects.toThrow(ValidationError);
  });
});

describe("role validation", () => {
  const companies = [
    { siret: "12345678901234", companyTypes: ["PRODUCER" as CompanyType] }
  ];

  const validateRole = validateRoleGenerator(companies);

  test("valid role", async () => {
    const role = {
      siret: "12345678901234",
      email: "john.snow@trackdechets.fr",
      role: "MEMBER"
    };
    await expect(validateRole(role)).resolves.toEqual(role);
  });

  test("missing email", async () => {
    await expect(
      validateRole({
        siret: "12345678901234",
        role: "MEMBER"
      })
    ).rejects.toThrow(ValidationError);
    await expect(
      validateRole({
        siret: "12345678901234",
        role: "MEMBER",
        email: null
      })
    ).rejects.toThrow(ValidationError);
    await expect(
      validateRole({
        siret: "12345678901234",
        role: "MEMBER",
        email: ""
      })
    ).rejects.toThrow(ValidationError);
  });

  test("email already exists i TD", async () => {
    mockUserExists.mockResolvedValueOnce(true);
    console.warn = jest.fn();
    await validateRole({
      siret: "12345678901234",
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
