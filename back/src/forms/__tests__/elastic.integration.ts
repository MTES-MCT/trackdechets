import { Company, Form, Status } from "@prisma/client";
import { resetDatabase } from "../../../integration-tests/helper";
import prisma from "../../prisma";
import {
  companyFactory,
  formFactory,
  formWithTempStorageFactory,
  userFactory,
  userWithCompanyFactory
} from "../../__tests__/factories";
import { getFirstTransporterSync, getFullForm } from "../database";
import { getSiretsByTab } from "../elasticHelpers";
import { FormForElastic, getFormForElastic, toBsdElastic } from "../elastic";
import { BsdElastic } from "../../common/elastic";

describe("getSiretsByTab", () => {
  afterEach(resetDatabase);

  test("status DRAFT", async () => {
    const { user, company } = await userWithCompanyFactory();
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret,
        status: Status.DRAFT
      }
    });
    const fullForm = await getFullForm(form);
    const { isDraftFor } = getSiretsByTab(fullForm);
    expect(isDraftFor).toContain(form.emitterCompanySiret);
  });

  test("status SEALED", async () => {
    const user = await userFactory();
    const form = await formFactory({
      ownerId: user.id,
      opt: { status: Status.SEALED }
    });
    const fullForm = await getFullForm(form);
    const transporter = getFirstTransporterSync(fullForm);
    const { isFollowFor, isForActionFor, isToCollectFor } =
      getSiretsByTab(fullForm);
    expect(isForActionFor).toContain(form.emitterCompanySiret);
    expect(isFollowFor).toContain(form.recipientCompanySiret);
    expect(isToCollectFor).toContain(transporter!.transporterCompanySiret);
  });

  test("status SENT", async () => {
    const user = await userFactory();
    const form = await formFactory({
      ownerId: user.id,
      opt: { status: Status.SENT }
    });
    const fullForm = await getFullForm(form);
    const transporter = getFirstTransporterSync(fullForm);
    const { isFollowFor, isCollectedFor, isForActionFor } =
      getSiretsByTab(fullForm);
    expect(isFollowFor).toContain(form.emitterCompanySiret);
    expect(isForActionFor).toContain(form.recipientCompanySiret);
    expect(isCollectedFor).toContain(transporter!.transporterCompanySiret);
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
        status: Status.SENT
      }
    });

    await prisma.form.update({
      where: { id: form.id },
      data: {
        transporters: {
          createMany: {
            data: [
              {
                transporterCompanySiret: transporter2.siret,
                readyToTakeOver: false,
                number: 2
              },
              {
                transporterCompanyVatNumber: transporter3.vatNumber,
                readyToTakeOver: false,
                number: 3
              }
            ]
          }
        }
      }
    });

    let fullForm = await getFullForm(form);
    let transporter = getFirstTransporterSync(fullForm);
    let tabs = getSiretsByTab(fullForm);
    let isFollowFor = tabs.isFollowFor;
    let isCollectedFor = tabs.isCollectedFor;
    let isToCollectFor = tabs.isToCollectFor;
    let isForActionFor = tabs.isForActionFor;
    expect(isFollowFor).toContain(form.emitterCompanySiret);
    expect(isForActionFor).toContain(form.recipientCompanySiret);
    expect(isFollowFor).toContain(transporter2.siret);
    expect(isFollowFor).toContain(transporter3.vatNumber);
    expect(isCollectedFor).toContain(transporter!.transporterCompanySiret);
    // next segment is marked as ready to take over
    // BSDD should appear in transporter n°1 "collected" tab and
    // in transporter n°2 to "to collect" tab
    await prisma.bsddTransporter.updateMany({
      where: { formId: form.id, transporterCompanySiret: transporter2.siret },
      data: { readyToTakeOver: true }
    });
    fullForm = await getFullForm(form);
    transporter = getFirstTransporterSync(fullForm);
    tabs = getSiretsByTab(fullForm);
    isFollowFor = tabs.isFollowFor;
    isCollectedFor = tabs.isCollectedFor;
    isToCollectFor = tabs.isToCollectFor;
    isForActionFor = tabs.isForActionFor;
    expect(isFollowFor).toContain(form.emitterCompanySiret);
    expect(isCollectedFor).toContain(transporter!.transporterCompanySiret);
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
    transporter = getFirstTransporterSync(fullForm);
    tabs = getSiretsByTab(fullForm);
    isFollowFor = tabs.isFollowFor;
    isCollectedFor = tabs.isCollectedFor;
    isToCollectFor = tabs.isToCollectFor;
    isForActionFor = tabs.isForActionFor;
    expect(isFollowFor).toContain(form.emitterCompanySiret);
    expect(isFollowFor).toContain(transporter!.transporterCompanySiret);
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
    transporter = getFirstTransporterSync(fullForm);
    tabs = getSiretsByTab(fullForm);
    isFollowFor = tabs.isFollowFor;
    isCollectedFor = tabs.isCollectedFor;
    isToCollectFor = tabs.isToCollectFor;
    isForActionFor = tabs.isForActionFor;
    expect(isFollowFor).toContain(form.emitterCompanySiret);
    expect(isFollowFor).toContain(transporter!.transporterCompanySiret);
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
    const transporter = getFirstTransporterSync(fullForm);
    const forwardedInTransporter = getFirstTransporterSync(
      fullForm.forwardedIn!
    );
    const { isFollowFor, isCollectedFor, isForActionFor } =
      getSiretsByTab(fullForm);
    expect(isFollowFor).toContain(form.emitterCompanySiret);
    expect(isFollowFor).toContain(
      forwardedInTransporter!.transporterCompanySiret
    );
    expect(isFollowFor).toContain(fullForm.forwardedIn!.recipientCompanySiret);

    expect(isForActionFor).toContain(form.recipientCompanySiret);
    expect(isCollectedFor).toContain(transporter!.transporterCompanySiret);
  });

  test("status RECEIVED", async () => {
    const user = await userFactory();
    const form = await formFactory({
      ownerId: user.id,
      opt: { status: Status.RECEIVED }
    });
    const fullForm = await getFullForm(form);
    const transporter = getFirstTransporterSync(fullForm);
    const { isFollowFor, isForActionFor } = getSiretsByTab(fullForm);
    expect(isFollowFor).toContain(form.emitterCompanySiret);
    expect(isFollowFor).toContain(transporter!.transporterCompanySiret);
    expect(isForActionFor).toContain(form.recipientCompanySiret);
  });

  test("status ACCEPTED", async () => {
    const user = await userFactory();
    const form = await formFactory({
      ownerId: user.id,
      opt: { status: Status.ACCEPTED }
    });
    const fullForm = await getFullForm(form);
    const transporter = getFirstTransporterSync(fullForm);
    const { isFollowFor, isForActionFor } = getSiretsByTab(fullForm);
    expect(isFollowFor).toContain(form.emitterCompanySiret);
    expect(isFollowFor).toContain(transporter!.transporterCompanySiret);
    expect(isForActionFor).toContain(form.recipientCompanySiret);
  });

  test("status TEMP_STORED", async () => {
    const user = await userFactory();
    const form = await formWithTempStorageFactory({
      ownerId: user.id,
      opt: { status: Status.TEMP_STORED }
    });
    const fullForm = await getFullForm(form);
    const transporter = getFirstTransporterSync(fullForm);
    const { isFollowFor, isForActionFor } = getSiretsByTab(fullForm);
    expect(isFollowFor).toContain(form.emitterCompanySiret);
    expect(isFollowFor).toContain(transporter!.transporterCompanySiret);
    expect(isForActionFor).toContain(form.recipientCompanySiret);
  });

  test("status RESEALED", async () => {
    const user = await userFactory();
    const form = await formWithTempStorageFactory({
      opt: { status: Status.RESEALED },
      ownerId: user.id
    });
    const fullForm = await getFullForm(form);
    const transporter = getFirstTransporterSync(fullForm);
    const forwardedInTransporter = getFirstTransporterSync(
      fullForm.forwardedIn!
    );
    const { isFollowFor, isForActionFor, isToCollectFor } =
      getSiretsByTab(fullForm);
    expect(isFollowFor).toContain(form.emitterCompanySiret);
    expect(isFollowFor).toContain(transporter!.transporterCompanySiret);
    expect(isForActionFor).toContain(form.recipientCompanySiret);
    expect(isFollowFor).toContain(fullForm.forwardedIn!.recipientCompanySiret);
    expect(isToCollectFor).toContain(
      forwardedInTransporter!.transporterCompanySiret
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
    const transporter = getFirstTransporterSync(fullForm);
    const forwardedInTransporter = getFirstTransporterSync(
      fullForm.forwardedIn!
    );
    expect(isFollowFor).toContain(form.emitterCompanySiret);
    expect(isFollowFor).toContain(transporter!.transporterCompanySiret);
    expect(isFollowFor).toContain(form.recipientCompanySiret);
    expect(isForActionFor).toContain(
      fullForm.forwardedIn!.recipientCompanySiret
    );
    expect(isCollectedFor).toContain(
      forwardedInTransporter!.transporterCompanySiret
    );
  });
});

describe("toBsdElastic > companies Names & Sirets", () => {
  afterEach(resetDatabase);

  let emitter: Company;
  let recipient: Company;
  let intermediary1: Company;
  let intermediary2: Company;
  let transporter1: Company;
  let transporter2: Company;
  let nextDestination: Company;
  let ecoOrganisme: Company;
  let trader: Company;
  let broker: Company;
  let forwardedInNextDestination: Company;
  let form: any;
  let elasticBsd: BsdElastic;

  beforeAll(async () => {
    // Given
    const user = await userFactory();
    emitter = await companyFactory({ name: "Emitter" });
    recipient = await companyFactory({ name: "Recipient" });
    intermediary1 = await companyFactory({ name: "Intermediaire 1" });
    intermediary2 = await companyFactory({ name: "Intermediaire 2" });
    transporter1 = await companyFactory({ name: "Transporter 1" });
    transporter2 = await companyFactory({ name: "Transporter 2" });
    nextDestination = await companyFactory({ name: "Next destination" });
    ecoOrganisme = await companyFactory({ name: "Eco organisme" });
    trader = await companyFactory({ name: "Trader" });
    broker = await companyFactory({ name: "Broker" });
    forwardedInNextDestination = await companyFactory({
      name: "ForwardedIn next destination"
    });

    // const form = await formWithTempStorageFactory({
    form = await formWithTempStorageFactory({
      opt: {
        emitterCompanyName: emitter.name,
        emitterCompanySiret: emitter.siret,
        recipientCompanyName: recipient.name,
        recipientCompanySiret: recipient.siret,
        nextDestinationCompanyName: nextDestination.name,
        nextDestinationCompanySiret: nextDestination.siret,
        ecoOrganismeName: ecoOrganisme.name,
        ecoOrganismeSiret: ecoOrganisme.siret,
        traderCompanyName: trader.name,
        traderCompanySiret: trader.siret,
        brokerCompanyName: broker.name,
        brokerCompanySiret: broker.siret
      },
      ownerId: user.id,
      forwardedInOpts: {
        recipientCompanyName: forwardedInNextDestination.name,
        recipientCompanySiret: forwardedInNextDestination.siret
      }
    });

    // Add transporters & intermediaries
    await prisma.form.update({
      where: { id: form.id },
      data: {
        transporters: {
          createMany: {
            data: [
              {
                transporterCompanySiret: transporter1.siret,
                transporterCompanyName: transporter1.name,
                readyToTakeOver: false,
                number: 2
              },
              {
                transporterCompanySiret: transporter2.siret,
                transporterCompanyName: transporter2.name,
                readyToTakeOver: false,
                number: 3
              }
            ]
          }
        },
        intermediaries: {
          createMany: {
            data: [
              {
                siret: intermediary1.siret!,
                name: intermediary1.name!,
                contact: intermediary1.contact!
              },
              {
                siret: intermediary2.siret!,
                name: intermediary2.name!,
                contact: intermediary2.contact!
              }
            ]
          }
        }
      }
    });

    const formForElastic = await getFormForElastic(form);

    // When
    elasticBsd = toBsdElastic(formForElastic);
  });

  test("companiesNames > should contain the names of ALL BSD companies", async () => {
    // Then
    expect(elasticBsd.companiesNames).toContain(emitter.name);
    expect(elasticBsd.companiesNames).toContain(nextDestination.name);
    expect(elasticBsd.companiesNames).toContain(trader.name);
    expect(elasticBsd.companiesNames).toContain(broker.name);
    expect(elasticBsd.companiesNames).toContain(ecoOrganisme.name);
    expect(elasticBsd.companiesNames).toContain(recipient.name);
    expect(elasticBsd.companiesNames).toContain(transporter1.name);
    expect(elasticBsd.companiesNames).toContain(transporter2.name);
    expect(elasticBsd.companiesNames).toContain(intermediary1.name);
    expect(elasticBsd.companiesNames).toContain(intermediary2.name);
    expect(elasticBsd.companiesNames).toContain(
      forwardedInNextDestination.name
    );
  });

  test("companiesSirets > should contain the sirets of ALL BSD companies", async () => {
    // Then
    expect(elasticBsd.companiesSirets).toContain(emitter.siret);
    expect(elasticBsd.companiesSirets).toContain(nextDestination.siret);
    expect(elasticBsd.companiesSirets).toContain(trader.siret);
    expect(elasticBsd.companiesSirets).toContain(broker.siret);
    expect(elasticBsd.companiesSirets).toContain(ecoOrganisme.siret);
    expect(elasticBsd.companiesSirets).toContain(recipient.siret);
    expect(elasticBsd.companiesSirets).toContain(transporter1.siret);
    expect(elasticBsd.companiesSirets).toContain(transporter2.siret);
    expect(elasticBsd.companiesSirets).toContain(intermediary1.siret);
    expect(elasticBsd.companiesSirets).toContain(intermediary2.siret);
    expect(elasticBsd.companiesSirets).toContain(
      forwardedInNextDestination.siret
    );
  });
});
