import {
  recipifyFormInput,
  recipifyResealedFormInput,
  recipifyTransportSegmentInput
} from "../recipify";
import {
  companyFactory,
  transporterReceiptFactory
} from "../../__tests__/factories";
import { TransportMode } from "../../generated/graphql/types";

describe("Bsdd Transporter Recipify Module", () => {
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
        receipt: receipt.receiptNumber,
        department: receipt.department,
        validityLimit: receipt.validityLimit
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
        receipt: receipt.receiptNumber,
        department: receipt.department,
        validityLimit: receipt.validityLimit
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
        receipt: receipt.receiptNumber,
        department: receipt.department,
        validityLimit: receipt.validityLimit
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
