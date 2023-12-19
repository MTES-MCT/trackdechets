import { resetDatabase } from "../../../../integration-tests/helper";
import {
  formFactory,
  userWithCompanyFactory
} from "../../../__tests__/factories";
import { prisma } from "@td/prisma";
import { addQuantityGrouped } from "../addQuantityGrouped";

describe("addQuantityGrouped", () => {
  afterEach(resetDatabase);

  it("should set quantityGrouped on grouped forms", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const ttr = await userWithCompanyFactory("ADMIN");
    const groupingForm1 = await formFactory({
      ownerId: ttr.user.id,
      opt: { emitterCompanySiret: ttr.company.siret }
    });
    const groupingForm2 = await formFactory({
      ownerId: ttr.user.id,
      opt: { emitterCompanySiret: ttr.company.siret }
    });
    const groupedForm1 = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        emitterCompanySiret: emitter.company.siret,
        status: "AWAITING_GROUP"
      }
    });
    const groupedForm2 = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        emitterCompanySiret: emitter.company.siret,
        status: "AWAITING_GROUP"
      }
    });

    const otherRandomForm = await formFactory({ ownerId: emitter.user.id });

    // Ventile les deux bordereaux initiaux sur deux bordereaux de groupement
    // 1 - 1 : 0,3
    // 1 - 2 : 0,5
    // 2 - 1 : 4.32
    // 2 - 2 : 4.78
    // quantityGrouped1 : 0,8
    // quantityGrouped2 : 9,1

    await prisma.formGroupement.create({
      data: {
        initialFormId: groupedForm1.id,
        nextFormId: groupingForm1.id,
        quantity: 0.3
      }
    });
    await prisma.formGroupement.create({
      data: {
        initialFormId: groupedForm1.id,
        nextFormId: groupingForm2.id,
        quantity: 0.5
      }
    });
    await prisma.formGroupement.create({
      data: {
        initialFormId: groupedForm2.id,
        nextFormId: groupingForm1.id,
        quantity: 4.32
      }
    });
    await prisma.formGroupement.create({
      data: {
        initialFormId: groupedForm2.id,
        nextFormId: groupingForm2.id,
        quantity: 4.78
      }
    });

    await addQuantityGrouped();

    const updatedGroupedForm1 = await prisma.form.findUniqueOrThrow({
      where: { id: groupedForm1.id }
    });
    expect(updatedGroupedForm1.quantityGrouped).toEqual(0.8);

    const updatedGroupedForm2 = await prisma.form.findUniqueOrThrow({
      where: { id: groupedForm2.id }
    });

    // vérifie au passage qu'on gère bien la précision des valeurs décimales
    // 4.32 + 4.78 = 9.100000000000001 en Node
    // Le résultat doit être arrondi
    expect(updatedGroupedForm2.quantityGrouped).toEqual(9.1);

    // Un bordereau qui n'est pas inclut dans un regroupement doit
    // avoir un champ `quantityGrouped` à 0
    const updatedOtherRandomForm = await prisma.form.findUniqueOrThrow({
      where: { id: otherRandomForm.id }
    });
    expect(updatedOtherRandomForm.quantityGrouped).toEqual(0);

    // Un bordereau de regroupement doit
    // avoir un champ `quantityGrouped` à 0
    const updatedGroupingForm1 = await prisma.form.findUniqueOrThrow({
      where: { id: groupingForm1.id }
    });
    expect(updatedGroupingForm1.quantityGrouped).toEqual(0);
  });
});
