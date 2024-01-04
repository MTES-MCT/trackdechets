import { resetDatabase } from "../../../../integration-tests/helper";
import {
  formFactory,
  formWithTempStorageFactory,
  userWithCompanyFactory
} from "../../../__tests__/factories";
import { prisma } from "@td/prisma";
import { fixedGroupedFormsStatus } from "../fixGroupedFormsStatus";

describe("fixGroupedFormStatus", () => {
  afterEach(resetDatabase);

  it("should set status to GROUPED if necessary", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const tempStorage = await userWithCompanyFactory("ADMIN");
    const ttr = await userWithCompanyFactory("ADMIN");

    const groupedForm1 = await formWithTempStorageFactory({
      ownerId: emitter.user.id,
      opt: {
        status: "AWAITING_GROUP",
        emitterCompanySiret: emitter.company.siret,
        recipientCompanySiret: tempStorage.company.siret,
        quantityReceived: 1
      },
      forwardedInOpts: {
        recipientCompanySiret: ttr.company.siret,
        quantityReceived: 0.5
      }
    });

    const groupedForm2 = await formWithTempStorageFactory({
      ownerId: emitter.user.id,
      opt: {
        status: "AWAITING_GROUP",
        emitterCompanySiret: emitter.company.siret,
        recipientCompanySiret: tempStorage.company.siret,
        quantityReceived: 1
      },
      forwardedInOpts: {
        recipientCompanySiret: ttr.company.siret,
        quantityReceived: 0.5
      }
    });

    const groupedForm3 = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        emitterCompanySiret: emitter.company.siret,
        status: "AWAITING_GROUP",
        quantityReceived: 1
      }
    });

    // create groupement
    await formFactory({
      ownerId: ttr.user.id,
      opt: {
        status: "SEALED",
        grouping: {
          create: [
            { initialFormId: groupedForm1.id, quantity: 0.5 }, // regroupé en totalité
            { initialFormId: groupedForm2.id, quantity: 0.4 }, // regroupé partiellement
            { initialFormId: groupedForm3.id, quantity: 1 } // regroupé en totalité
          ]
        }
      }
    });

    await fixedGroupedFormsStatus();

    const updatedGroupedForm1 = await prisma.form.findUniqueOrThrow({
      where: { id: groupedForm1.id }
    });
    expect(updatedGroupedForm1.status).toEqual("GROUPED");

    const updatedGroupedForm2 = await prisma.form.findUniqueOrThrow({
      where: { id: groupedForm2.id }
    });
    // Le bordereau 2 n'est pas regroupé en totalité il reste au statut AWAITING_GROUP
    expect(updatedGroupedForm2.status).toEqual("AWAITING_GROUP");

    const updatedGroupedForm3 = await prisma.form.findUniqueOrThrow({
      where: { id: groupedForm3.id }
    });
    // Le script ne doit pas s'appliquer pas aux bordereaux sans entreposage provisoire
    expect(updatedGroupedForm3.status).toEqual("AWAITING_GROUP");
  });

  it("should set status to PROCESSED if necessary", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const tempStorage = await userWithCompanyFactory("ADMIN");
    const ttr = await userWithCompanyFactory("ADMIN");

    const groupedForm1 = await formWithTempStorageFactory({
      ownerId: emitter.user.id,
      opt: {
        status: "AWAITING_GROUP",
        emitterCompanySiret: emitter.company.siret,
        recipientCompanySiret: tempStorage.company.siret,
        quantityReceived: 1
      },
      forwardedInOpts: {
        recipientCompanySiret: ttr.company.siret,
        quantityReceived: 0.5
      }
    });

    const groupedForm2 = await formWithTempStorageFactory({
      ownerId: emitter.user.id,
      opt: {
        status: "AWAITING_GROUP",
        emitterCompanySiret: emitter.company.siret,
        recipientCompanySiret: tempStorage.company.siret,
        quantityReceived: 1
      },
      forwardedInOpts: {
        recipientCompanySiret: ttr.company.siret,
        quantityReceived: 0.5
      }
    });

    const groupedForm3 = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        emitterCompanySiret: emitter.company.siret,
        status: "AWAITING_GROUP",
        quantityReceived: 1
      }
    });

    // create groupement
    await formFactory({
      ownerId: ttr.user.id,
      opt: {
        status: "PROCESSED",
        grouping: {
          create: [
            { initialFormId: groupedForm1.id, quantity: 0.5 }, // regroupé en totalité
            { initialFormId: groupedForm2.id, quantity: 0.4 }, // regroupé partiellement
            { initialFormId: groupedForm3.id, quantity: 1 } // regroupé en totalité
          ]
        }
      }
    });

    await fixedGroupedFormsStatus();

    const updatedGroupedForm1 = await prisma.form.findUniqueOrThrow({
      where: { id: groupedForm1.id }
    });
    expect(updatedGroupedForm1.status).toEqual("PROCESSED");

    const updatedGroupedForm2 = await prisma.form.findUniqueOrThrow({
      where: { id: groupedForm2.id }
    });
    // Le bordereau 2 n'est pas regroupé en totalité il reste au statut AWAITING_GROUP
    expect(updatedGroupedForm2.status).toEqual("AWAITING_GROUP");

    const updatedGroupedForm3 = await prisma.form.findUniqueOrThrow({
      where: { id: groupedForm3.id }
    });
    // Le script ne doit pas s'appliquer pas aux bordereaux sans entreposage provisoire
    expect(updatedGroupedForm3.status).toEqual("AWAITING_GROUP");
  });
});
