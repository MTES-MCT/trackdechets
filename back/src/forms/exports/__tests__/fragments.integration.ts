import { formFieldsSelection } from "../fragments";
import { resetDatabase } from "../../../../integration-tests/helper";
import { userFactory, formFactory } from "../../../__tests__/factories";
import prisma from "src/prisma";

/**
 * Check that selection are in sync with prisma schema
 * It will fail if any of the queried field is invalid
 */
describe("selections", () => {
  beforeAll(async () => {
    // create a form
    const user = await userFactory();
    await formFactory({ ownerId: user.id });
  });

  afterAll(() => resetDatabase());

  test("Incoming waste selection", async () => {
    const selection = formFieldsSelection("INCOMING");
    const forms = await prisma.form.findMany({ select: selection });
    expect(forms.length).toBe(1);
  });

  test("Outgoing waste selection", async () => {
    const selection = formFieldsSelection("OUTGOING");
    const forms = await prisma.form.findMany({ select: selection });
    expect(forms.length).toBe(1);
  });

  test("Transported waste selection", async () => {
    const selection = formFieldsSelection("TRANSPORTED");
    const forms = await prisma.form.findMany({ select: selection });
    expect(forms.length).toBe(1);
  });

  test("Traded waste selection", async () => {
    const selection = formFieldsSelection("TRADED");
    const forms = await prisma.form.findMany({ select: selection });
    expect(forms.length).toBe(1);
  });

  test("All waste selection", async () => {
    const selection = formFieldsSelection("ALL");
    const forms = await prisma.form.findMany({ select: selection });
    expect(forms.length).toBe(1);
  });
});
