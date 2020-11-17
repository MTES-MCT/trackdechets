import { formFieldsSelection } from "../fragments";
import { resetDatabase } from "../../../../integration-tests/helper";
import { userFactory, formFactory } from "../../../__tests__/factories";
import prisma from "src/prisma";

/**
 * Check that fragments are in sync with prisma schema
 * It will fail if any of the queried field is invalid
 */
describe("fragments", () => {
  beforeAll(async () => {
    // create a form
    const user = await userFactory();
    await formFactory({ ownerId: user.id });
  });

  afterAll(() => resetDatabase());

  test("Incoming waste fragment", async () => {
    const fragment = formFieldsSelection("INCOMING");
    const forms = await prisma.form.findMany().$fragment<any[]>(fragment);
    expect(forms.length).toBe(1);
  });

  test("Outgoing waste fragmnet", async () => {
    const fragment = formFieldsSelection("OUTGOING");
    const forms = await prisma.form.findMany().$fragment<any[]>(fragment);
    expect(forms.length).toBe(1);
  });

  test("Transported waste fragmnet", async () => {
    const fragment = formFieldsSelection("TRANSPORTED");
    const forms = await prisma.form.findMany().$fragment<any[]>(fragment);
    expect(forms.length).toBe(1);
  });

  test("Traded waste fragmnet", async () => {
    const fragment = formFieldsSelection("TRADED");
    const forms = await prisma.form.findMany().$fragment<any[]>(fragment);
    expect(forms.length).toBe(1);
  });

  test("All waste fragmnet", async () => {
    const fragment = formFieldsSelection("ALL");
    const forms = await prisma.form.findMany().$fragment<any[]>(fragment);
    expect(forms.length).toBe(1);
  });
});
