import { recipifyGeneric, findCompanyFailFast } from "../recipify";
import logger from "../../logging/logger";
import {
  companyFactory,
  transporterReceiptFactory
} from "../../__tests__/factories";

jest.spyOn(logger, "info");

describe("Company Recipify Module", () => {
  it("findCompanyFailFast should return company transportReceiptId = null", async () => {
    const company = await companyFactory();

    const companySearchResult = await findCompanyFailFast(company.orgId);
    expect(companySearchResult).toEqual({ transporterReceiptId: null });
  });

  it("findCompanyFailFast should return company transportReceiptId", async () => {
    const company = await companyFactory();
    const receipt = await transporterReceiptFactory({ company });

    const companySearchResult = await findCompanyFailFast(company.orgId);
    expect(companySearchResult).toEqual({ transporterReceiptId: receipt.id });
  });

  it("findCompanyFailFast should log an error message when company is not found", async () => {
    expect(findCompanyFailFast("1234")).resolves.toBe(null);
  });

  it("recipifyGeneric should complete data as configured in the accessors", async () => {
    const company = await companyFactory();
    const receipt = await transporterReceiptFactory({ company });
    const mockInput = {
      transporter: {
        company
      }
    };

    const mockAccessor = () => [
      {
        getter: () => company,
        setter: (input: any, receipt: any) => ({
          ...input,
          anyReceiptFormat: receipt
        })
      }
    ];

    const recipifyFn = recipifyGeneric(mockAccessor);
    const completedInput = await recipifyFn(mockInput);
    expect(completedInput).toEqual({
      ...mockInput,
      anyReceiptFormat: {
        number: receipt.receiptNumber,
        validityLimit: receipt.validityLimit,
        department: receipt.department
      }
    });
  });

  it("recipifyGeneric should complete with null receipt values if not TransporterReceipt is not found", async () => {
    const company = await companyFactory();
    const mockInput = {
      transporter: {
        company
      }
    };

    const mockAccessor = () => [
      {
        getter: () => company,
        setter: (input: any, receipt: any) => ({
          ...input,
          anyReceiptFormat: receipt
        })
      }
    ];

    const recipifyFn = recipifyGeneric(mockAccessor);
    const completedInput = await recipifyFn(mockInput);
    expect(completedInput).toEqual({
      ...mockInput,
      anyReceiptFormat: {
        number: null,
        validityLimit: null,
        department: null
      }
    });
  });

  it("recipifyGeneric should not modify the input if the getter return null", async () => {
    const company = await companyFactory();
    const mockInput = {
      transporter: {
        company
      }
    };

    const mockAccessor = () => [
      {
        getter: () => null,
        setter: (input: any, receipt: any) => ({
          ...input,
          anyReceiptFormat: receipt
        })
      }
    ];

    const recipifyFn = recipifyGeneric(mockAccessor);
    const completedInput = await recipifyFn(mockInput);
    expect(completedInput).toEqual(mockInput);
  });
});
