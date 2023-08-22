import { recipify } from "../recipify";
import {
  companyFactory,
  transporterReceiptFactory
} from "../../__tests__/factories";

describe("BSVHU Recipify Module", () => {
  it("recipify should correctly process input and return completedInput with transporter receipt", async () => {
    const company = await companyFactory();
    const mockInput = {
      transporter: {
        company,
        recepisse: {
          isExempted: false
        }
      }
    };
    const companyWithReceipt = await transporterReceiptFactory({ company });
    const completedInput = await recipify(mockInput);
    expect(completedInput).toEqual({
      transporter: {
        company: mockInput.transporter.company,
        recepisse: {
          isExempted: false,
          department: companyWithReceipt.transporterReceiptDepartment,
          number: companyWithReceipt.transporterReceiptNumber,
          validityLimit: companyWithReceipt.transporterReceiptValidityLimit
        }
      }
    });
  });

  it("recipify should correctly process input with isExempted true and return completedInput without transporter recepisse", async () => {
    const company = await companyFactory();
    const mockInput = {
      transporter: {
        company: company,
        recepisse: {
          isExempted: true
        }
      }
    };

    const completedInput = await recipify(mockInput);
    expect(completedInput).toEqual(mockInput);
  });
});
