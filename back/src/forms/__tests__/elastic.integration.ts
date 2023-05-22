import { Status } from "@prisma/client";
import { resetDatabase } from "../../../integration-tests/helper";
import prisma from "../../prisma";
import {
  companyFactory,
  formFactory,
  formWithTempStorageFactory,
  userFactory
} from "../../__tests__/factories";
import { getFullForm } from "../database";
import { getSiretsByTab } from "../elasticHelpers";

describe("getSiretsByTab", () => {
  afterEach(resetDatabase);

  test("status DRAFT", async () => {
    const user = await userFactory();
    const form = await formFactory({
      ownerId: user.id,
      opt: { status: Status.DRAFT }
    });
    const fullForm = await getFullForm(form);
    const { isDraftFor } = getSiretsByTab(fullForm);
    expect(isDraftFor).toContain(form.emitterCompanySiret);
    expect(isDraftFor).toContain(form.recipientCompanySiret);
    expect(isDraftFor).toContain(form.transporterCompanySiret);
  });

  test("status SEALED", async () => {
    const user = await userFactory();
    const form = await formFactory({
      ownerId: user.id,
      opt: { status: Status.SEALED }
    });
    const fullForm = await getFullForm(form);
    const { isFollowFor, isForActionFor, isToCollectFor } =
      getSiretsByTab(fullForm);
    expect(isForActionFor).toContain(form.emitterCompanySiret);
    expect(isFollowFor).toContain(form.recipientCompanySiret);
    expect(isToCollectFor).toContain(form.transporterCompanySiret);
  });

  test("status SENT", async () => {
    const user = await userFactory();
    const form = await formFactory({
      ownerId: user.id,
      opt: { status: Status.SENT }
    });
    const fullForm = await getFullForm(form);
    const { isFollowFor, isCollectedFor, isForActionFor } =
      getSiretsByTab(fullForm);
    expect(isFollowFor).toContain(form.emitterCompanySiret);
    expect(isForActionFor).toContain(form.recipientCompanySiret);
    expect(isCollectedFor).toContain(form.transporterCompanySiret);
  });

  test("status SENT multi-modal", async () => {
    // In case of multi-modal transport, it is always possible for
    // recipient to receive waste at any time. That's why a BSDD
    // with a SENT status will always appear in recipient's "For Action" tab

    const user = await userFactory();
    const transporter2 = await companyFactory();
    // we check that bsds indexation is OK also with a foreign transport segment
    const transporter3 = await companyFactory({
      siret: null,
      vatNumber: "ESB39052188"
    });
    // waste is still in transporter n°1 truck
    // BSDD should be in transporter n°1 "collected" tab and
    // in transporter n°2 follow tab
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: Status.SENT,
        transportSegments: {
          createMany: {
            data: [
              {
                transporterCompanySiret: transporter2.siret,
                readyToTakeOver: false
              },
              {
                transporterCompanyVatNumber: transporter3.vatNumber,
                readyToTakeOver: false
              }
            ]
          }
        }
      }
    });

    let fullForm = await getFullForm(form);
    let tabs = getSiretsByTab(fullForm);
    let isFollowFor = tabs.isFollowFor;
    let isCollectedFor = tabs.isCollectedFor;
    let isToCollectFor = tabs.isToCollectFor;
    let isForActionFor = tabs.isForActionFor;
    expect(isFollowFor).toContain(form.emitterCompanySiret);
    expect(isForActionFor).toContain(form.recipientCompanySiret);
    expect(isFollowFor).toContain(transporter2.siret);
    expect(isFollowFor).toContain(transporter3.vatNumber);
    expect(isCollectedFor).toContain(form.transporterCompanySiret);
    // next segment is marked as ready to take over
    // BSDD should appear in transporter n°1 "collected" tab and
    // in transporter n°2 to "to collect" tab
    await prisma.bsddTransporter.updateMany({
      where: { formId: form.id, transporterCompanySiret: transporter2.siret },
      data: { readyToTakeOver: true }
    });
    fullForm = await getFullForm(form);
    tabs = getSiretsByTab(fullForm);
    isFollowFor = tabs.isFollowFor;
    isCollectedFor = tabs.isCollectedFor;
    isToCollectFor = tabs.isToCollectFor;
    isForActionFor = tabs.isForActionFor;
    expect(isFollowFor).toContain(form.emitterCompanySiret);
    expect(isCollectedFor).toContain(form.transporterCompanySiret);
    expect(isForActionFor).toContain(form.recipientCompanySiret);
    expect(isToCollectFor).toContain(transporter2.siret);

    // waste is taken over by transporter n°2. BSDD should
    // be in transporter n°1 "Follow" tab and in transporter n°2
    // "Collected" tab
    await prisma.bsddTransporter.updateMany({
      where: { formId: form.id, transporterCompanySiret: transporter2.siret },
      data: { takenOverAt: new Date() }
    });
    fullForm = await getFullForm(form);
    tabs = getSiretsByTab(fullForm);
    isFollowFor = tabs.isFollowFor;
    isCollectedFor = tabs.isCollectedFor;
    isToCollectFor = tabs.isToCollectFor;
    isForActionFor = tabs.isForActionFor;
    expect(isFollowFor).toContain(form.emitterCompanySiret);
    expect(isFollowFor).toContain(form.transporterCompanySiret);
    expect(isForActionFor).toContain(form.recipientCompanySiret);
    expect(isCollectedFor).toContain(transporter2.siret);
    // TEST WITH a foreign transporter
    // next segment is marked as ready to take over
    // BSDD should appear in transporter n°2 "collected" tab and
    // in transporter n°3 to "to collect" tab
    await prisma.bsddTransporter.updateMany({
      where: {
        formId: form.id,
        transporterCompanyVatNumber: transporter3.vatNumber
      },
      data: { readyToTakeOver: true }
    });
    fullForm = await getFullForm(form);
    tabs = getSiretsByTab(fullForm);
    isFollowFor = tabs.isFollowFor;
    isCollectedFor = tabs.isCollectedFor;
    isToCollectFor = tabs.isToCollectFor;
    isForActionFor = tabs.isForActionFor;
    expect(isFollowFor).toContain(form.emitterCompanySiret);
    expect(isCollectedFor).toEqual([transporter2.siret]);
    expect(isForActionFor).toContain(form.recipientCompanySiret);
    expect(isToCollectFor).toContain(transporter3.vatNumber);

    // waste is taken over by transporter n°2. BSDD should
    // be in transporter n°1 "Follow" tab and in transporter n°2
    // "Collected" tab
    await prisma.bsddTransporter.updateMany({
      where: {
        formId: form.id,
        transporterCompanyVatNumber: transporter3.vatNumber
      },
      data: { takenOverAt: new Date() }
    });
    fullForm = await getFullForm(form);
    tabs = getSiretsByTab(fullForm);
    isFollowFor = tabs.isFollowFor;
    isCollectedFor = tabs.isCollectedFor;
    isToCollectFor = tabs.isToCollectFor;
    isForActionFor = tabs.isForActionFor;
    expect(isFollowFor).toContain(form.emitterCompanySiret);
    expect(isFollowFor).toContain(form.transporterCompanySiret);
    expect(isForActionFor).toContain(form.recipientCompanySiret);
    expect(isCollectedFor).toContain(transporter3.vatNumber);
    expect(isCollectedFor).toContain(transporter2.siret);
  });

  test("SENT with temporary storage", async () => {
    const user = await userFactory();
    const form = await formWithTempStorageFactory({
      ownerId: user.id,
      opt: { status: Status.SENT }
    });
    const fullForm = await getFullForm(form);
    const { isFollowFor, isCollectedFor, isForActionFor } =
      getSiretsByTab(fullForm);
    expect(isFollowFor).toContain(form.emitterCompanySiret);
    expect(isFollowFor).toContain(
      fullForm.forwardedIn!.transporterCompanySiret
    );
    expect(isFollowFor).toContain(fullForm.forwardedIn!.recipientCompanySiret);

    expect(isForActionFor).toContain(form.recipientCompanySiret);
    expect(isCollectedFor).toContain(form.transporterCompanySiret);
  });

  test("status RECEIVED", async () => {
    const user = await userFactory();
    const form = await formFactory({
      ownerId: user.id,
      opt: { status: Status.RECEIVED }
    });
    const fullForm = await getFullForm(form);
    const { isFollowFor, isForActionFor } = getSiretsByTab(fullForm);
    expect(isFollowFor).toContain(form.emitterCompanySiret);
    expect(isFollowFor).toContain(form.transporterCompanySiret);
    expect(isForActionFor).toContain(form.recipientCompanySiret);
  });

  test("status ACCEPTED", async () => {
    const user = await userFactory();
    const form = await formFactory({
      ownerId: user.id,
      opt: { status: Status.ACCEPTED }
    });
    const fullForm = await getFullForm(form);
    const { isFollowFor, isForActionFor } = getSiretsByTab(fullForm);
    expect(isFollowFor).toContain(form.emitterCompanySiret);
    expect(isFollowFor).toContain(form.transporterCompanySiret);
    expect(isForActionFor).toContain(form.recipientCompanySiret);
  });

  test("status TEMP_STORED", async () => {
    const user = await userFactory();
    const form = await formWithTempStorageFactory({
      ownerId: user.id,
      opt: { status: Status.TEMP_STORED }
    });
    const fullForm = await getFullForm(form);
    const { isFollowFor, isForActionFor } = getSiretsByTab(fullForm);
    expect(isFollowFor).toContain(form.emitterCompanySiret);
    expect(isFollowFor).toContain(form.transporterCompanySiret);
    expect(isForActionFor).toContain(form.recipientCompanySiret);
  });

  test("status RESEALED", async () => {
    const user = await userFactory();
    const form = await formWithTempStorageFactory({
      opt: { status: Status.RESEALED },
      ownerId: user.id
    });
    const fullForm = await getFullForm(form);
    const { isFollowFor, isForActionFor, isToCollectFor } =
      getSiretsByTab(fullForm);
    expect(isFollowFor).toContain(form.emitterCompanySiret);
    expect(isFollowFor).toContain(form.transporterCompanySiret);
    expect(isForActionFor).toContain(form.recipientCompanySiret);
    expect(isFollowFor).toContain(fullForm.forwardedIn!.recipientCompanySiret);
    expect(isToCollectFor).toContain(
      fullForm.forwardedIn!.transporterCompanySiret
    );
  });

  test("status RESENT", async () => {
    const user = await userFactory();
    const form = await formWithTempStorageFactory({
      opt: { status: Status.RESENT },
      ownerId: user.id
    });
    const fullForm = await getFullForm(form);
    const { isFollowFor, isForActionFor, isCollectedFor } =
      getSiretsByTab(fullForm);
    expect(isFollowFor).toContain(form.emitterCompanySiret);
    expect(isFollowFor).toContain(form.transporterCompanySiret);
    expect(isFollowFor).toContain(form.recipientCompanySiret);
    expect(isForActionFor).toContain(
      fullForm.forwardedIn!.recipientCompanySiret
    );
    expect(isCollectedFor).toContain(
      fullForm.forwardedIn!.transporterCompanySiret
    );
  });
});
