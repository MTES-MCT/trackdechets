import { flattenObjectForDb } from "../form-converter";
import FormsResolver from "../resolvers";
import { getNewValidForm } from "../__mocks__/data";

describe("Forms -> markAsSealed mutation", () => {
  it("should fail when model is not valid", async () => {
    const form = getNewValidForm();

    // unvalidate form
    form.emitter.company.address = null;

    const prisma = {
      form: jest.fn(() => flattenObjectForDb(form))
    } as any;

    try {
      await FormsResolver.Mutation.markAsSealed(
        null,
        { id: "" },
        { prisma, request: null }
      );

      expect(false).toBe("Should not have fallen here");
    } catch (err) {
      expect(err).not.toBeNull();
    }
  });

  it("should display the validation error when the form has an invalid field", async () => {
    const form = getNewValidForm();

    // unvalidate form
    form.emitter.company.siret = null;

    const prisma = {
      form: jest.fn(() => flattenObjectForDb(form))
    } as any;

    try {
      await FormsResolver.Mutation.markAsSealed(
        null,
        { id: "" },
        { prisma, request: null }
      );

      expect(false).toBe("Should not have fallen here");
    } catch (err) {
      expect(err.message).toMatch(
        /emitter.company.siret ne peut pas être null/
      );
    }
  });

  it("should display all validation errors if there are many", async () => {
    const form = getNewValidForm();

    // unvalidate form
    form.emitter.company.siret = null;
    form.emitter.company.address = null;

    const prisma = {
      form: jest.fn(() => flattenObjectForDb(form))
    } as any;

    try {
      await FormsResolver.Mutation.markAsSealed(
        null,
        { id: "" },
        { prisma, request: null }
      );

      expect(false).toBe("Should not have fallen here");
    } catch (err) {
      expect(err.message).toMatch(
        /emitter.company.siret ne peut pas être null/
      );
      expect(err.message).toMatch(
        /emitter.company.address ne peut pas être null/
      );
    }
  });
});
