import { formFragment } from "../fragments";
import { resetDatabase } from "../../../../integration-tests/helper";
import { userFactory, formFactory } from "../../../__tests__/factories";
import { prisma } from "../../../generated/prisma-client";

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
    const fragment = formFragment("INCOMING");
    const forms = await prisma.forms().$fragment<any[]>(fragment);
    expect(forms.length).toBe(1);
  });

  test("Outgoing waste fragmnet", async () => {
    const fragment = formFragment("OUTGOING");
    const forms = await prisma.forms().$fragment<any[]>(fragment);
    expect(forms.length).toBe(1);
  });

  test("Transported waste fragmnet", async () => {
    const fragment = formFragment("TRANSPORTED");
    const forms = await prisma.forms().$fragment<any[]>(fragment);
    expect(forms.length).toBe(1);
  });

  test("Traded waste fragmnet", async () => {
    const fragment = formFragment("TRADED");
    const forms = await prisma.forms().$fragment<any[]>(fragment);
    expect(forms.length).toBe(1);
  });

  test("All waste fragmnet", async () => {
    const fragment = formFragment("ALL");
    const forms = await prisma.forms().$fragment<any[]>(fragment);
    expect(forms.length).toBe(1);
  });
});
