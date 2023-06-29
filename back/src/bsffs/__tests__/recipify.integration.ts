import { recipify as recipifyFn } from "../recipify";
import {
  companyFactory,
  transporterReceiptFactory
} from "../../__tests__/factories";

describe("Bsff Recipify Module", () => {
  it("recipifyGeneric should correctly process input and return completedInput with transporter receipt", async () => {
    const company = await companyFactory();
    const mockInput = {
      transporter: {
        company,
        recepisse: {
          isExempted: false
        }
      }
    };
    const receipt = await transporterReceiptFactory({ company });
    const completedInput = await recipifyFn(mockInput);
    expect(completedInput).toEqual({
      transporter: {
        company: mockInput.transporter.company,
        recepisse: {
          isExempted: false,
          department: receipt.department,
          number: receipt.receiptNumber,
          validityLimit: receipt.validityLimit
        }
      }
    });
  });

  it("recipifyGeneric should correctly process BsffInput with null recepisse and return completedInput", async () => {
    const mockInput = {
      transporter: {
        company: {
          siret: "12345678912345",
          recepisse: null
        }
      }
    };
    const completedInput = await recipifyFn(mockInput);
    expect(completedInput).toEqual(mockInput);
  });

  it("recipifyGeneric should correctly process input with null recepisse and return completedInput", async () => {
    const mockInput = {
      transporter: {
        company: {
          siret: "12345678912345",
          recepisse: {
            isExempted: true
          }
        }
      }
    };
    const completedInput = await recipifyFn(mockInput);
    expect(completedInput).toEqual(mockInput);
  });
});
