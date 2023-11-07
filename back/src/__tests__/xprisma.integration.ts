import { resetDatabase } from "../../integration-tests/helper";
import xprisma, { Form } from "../xprisma";
import { formFactory, userFactory } from "./factories";

describe("xprisma", () => {
  afterEach(resetDatabase);

  test("xprisma.form.findFirst should work exactly like prisma.form.findFirst because it was not modified", async () => {
    const user = await userFactory();
    const form = await formFactory({ ownerId: user.id });
    const found = await xprisma.form.findUnique({ where: { id: form.id } });
    expect(found?.id).toEqual(form.id);
  });

  test("xprisma.form.findMany should not return soft deleted records", async () => {
    const user = await userFactory();
    const form = await formFactory({
      ownerId: user.id,
      opt: { isDeleted: true }
    });
    const founds = await xprisma.form.findMany({ where: { id: form.id } });
    expect(founds.length).toEqual(0);
  });

  test("Form.findFirst should work exactly like prisma.form.findFirst", async () => {
    const user = await userFactory();
    const form = await formFactory({ ownerId: user.id });
    const found = await Form.findUnique({ where: { id: form.id } });
    expect(found?.id).toEqual(form.id);
  });

  test("Form.findMany should work exactly like prisma.form.findFirst", async () => {
    const user = await userFactory();
    const form = await formFactory({
      ownerId: user.id,
      opt: { isDeleted: true }
    });
    const founds = await Form.findMany({ where: { id: form.id } });
    expect(founds.length).toEqual(0);
  });
});
