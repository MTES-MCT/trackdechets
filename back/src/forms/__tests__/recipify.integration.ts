import {
  recipifyFormInput,
  recipifyResealedFormInput,
  recipifyTransportSegmentInput,
  recipifyTransporterInDb
} from "../recipify";
import {
  companyFactory,
  formFactory,
  transporterReceiptFactory,
  userWithCompanyFactory
} from "../../__tests__/factories";
import { TransportMode } from "../../generated/graphql/types";
import { getFirstTransporter } from "../database";

describe("Test Bsdd Transporter Recipify Module for FormInput", () => {
  it("recipify should correctly process input and return completedInput with transporter receipt", async () => {
    const company = await companyFactory();
    const mockInput = {
      transporter: {
        company,
        isExemptedOfReceipt: false
      }
    };
    const receipt = await transporterReceiptFactory({ company });
    const completedInput = await recipifyFormInput(mockInput);
    expect(completedInput).toEqual({
      transporter: {
        company: company,
        isExemptedOfReceipt: false,
        receipt: receipt.transporterReceiptNumber,
        department: receipt.transporterReceiptNumber,
        validityLimit: receipt.transporterReceiptValidityLimit
      }
    });
  });

  it("recipify should correctly process input with isExempted true and return completedInput with receipt exemption", async () => {
    const company = await companyFactory();
    const mockInput = {
      transporter: {
        company,
        isExemptedOfReceipt: true
      }
    };

    const completedInput = await recipifyFormInput(mockInput);
    expect(completedInput).toEqual(mockInput);
  });
});

describe("Bsdd Resealed Recipify Module", () => {
  it("recipify should correctly process input and return completedInput with transporter receipt", async () => {
    const company = await companyFactory();
    const mockInput = {
      transporter: {
        company,
        isExemptedOfReceipt: false
      }
    };
    const receipt = await transporterReceiptFactory({ company });
    const completedInput = await recipifyResealedFormInput(mockInput);
    expect(completedInput).toEqual({
      transporter: {
        company: mockInput.transporter.company,
        isExemptedOfReceipt: false,
        receipt: receipt.transporterReceiptNumber,
        department: receipt.transporterReceiptNumber,
        validityLimit: receipt.transporterReceiptValidityLimit
      }
    });
  });

  it("recipify should correctly process input with isExempted true and return completedInput with receipt exemption", async () => {
    const company = await companyFactory();
    const mockInput = {
      transporter: {
        company,
        isExemptedOfReceipt: true
      }
    };

    const completedInput = await recipifyResealedFormInput(mockInput);
    expect(completedInput).toEqual(mockInput);
  });
});

describe("Bsdd Transporter segment Recipify Module", () => {
  it("recipify should correctly process input and return completedInput with transporter receipt", async () => {
    const company = await companyFactory();
    const mockInput = {
      transporter: {
        company,
        isExemptedOfReceipt: false
      },
      mode: "ROAD" as TransportMode
    };
    const receipt = await transporterReceiptFactory({ company });
    const completedInput = await recipifyTransportSegmentInput(mockInput);
    expect(completedInput).toEqual({
      transporter: {
        company: mockInput.transporter.company,
        isExemptedOfReceipt: false,
        receipt: receipt.transporterReceiptNumber,
        department: receipt.transporterReceiptNumber,
        validityLimit: receipt.transporterReceiptValidityLimit
      },
      mode: "ROAD" as TransportMode
    });
  });

  it("recipify should correctly process input with isExempted true and return completedInput with receipt exemption", async () => {
    const company = await companyFactory();
    const mockInput = {
      transporter: {
        company,
        isExemptedOfReceipt: true
      },
      mode: "ROAD" as TransportMode
    };

    const completedInput = await recipifyTransportSegmentInput(mockInput);
    expect(completedInput).toEqual(mockInput);
  });
});

describe("Test Bsdd Transporter recipify module for db update, recipifyTransporterInDb", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("should return undefined when the transporter is null", async () => {
    const result = await recipifyTransporterInDb(null);
    expect(result).toBeUndefined();
  });

  it("should correctly recipify and update a transporter", async () => {
    const { company, user } = await userWithCompanyFactory("ADMIN");
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        sentAt: new Date(),
        transporters: {
          create: {
            transporterCompanySiret: company.siret,
            number: 1
          }
        }
      }
    });
    const transporter = await getFirstTransporter(form);
    expect(transporter).toBeDefined();
    const receipt = await transporterReceiptFactory({ company });

    const result = await recipifyTransporterInDb(transporter);
    expect(result).toEqual({
      transporters: {
        update: {
          data: {
            transporterReceipt: receipt.transporterReceiptNumber,
            transporterDepartment: receipt.transporterReceiptNumber,
            transporterValidityLimit: receipt.transporterReceiptValidityLimit,
            transporterIsExemptedOfReceipt: false
          },
          where: { id: transporter?.id }
        }
      }
    });
  });
});
