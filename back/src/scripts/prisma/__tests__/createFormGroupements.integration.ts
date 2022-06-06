import prisma from "../../../prisma";
import { resetDatabase } from "../../../../integration-tests/helper";
import { formFactory, userFactory } from "../../../__tests__/factories";
import createFormGroupements from "../createFormGroupements";

describe("createFormGroupements", () => {
  afterAll(resetDatabase);

  it("should create FormGroupement records and calculates quantityGrouped", async () => {
    const user = await userFactory();
    const groupementForm = await formFactory({
      ownerId: user.id
    });
    const initialForm = await formFactory({
      ownerId: user.id,
      opt: {
        status: "AWAITING_GROUP",
        appendix2RootFormId: groupementForm.id,
        quantityReceived: 1.2
      }
    });
    let formGroupements = await prisma.formGroupement.findMany();
    expect(formGroupements).toHaveLength(0);
    expect(initialForm.quantityGrouped).toEqual(0);

    await createFormGroupements();
    formGroupements = await prisma.formGroupement.findMany();
    expect(formGroupements).toHaveLength(1);
    const formGroupement = formGroupements[0];
    expect(formGroupement.nextFormId).toEqual(groupementForm.id);
    expect(formGroupement.initialFormId).toEqual(initialForm.id);
    expect(formGroupement.quantity).toEqual(initialForm.quantityReceived);
    const updatedInitialForm = await prisma.form.findUnique({
      where: { id: initialForm.id }
    });
    expect(updatedInitialForm.quantityGrouped).toEqual(1.2);
  });
});
