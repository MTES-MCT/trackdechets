import {
  formFactory,
  userWithCompanyFactory
} from "../../../__tests__/factories";
import { CompanyType, prisma } from "../../../generated/prisma-client";
import { resetDatabase } from "../../../../integration-tests/helper";
import { formsWhereInput } from "../where-inputs";

describe("whereInputs", () => {
  afterEach(() => resetDatabase());

  test("OUTGOING exportType", async () => {
    const companyOpts = { companyTypes: { set: ["PRODUCER" as CompanyType] } };
    const { user, company } = await userWithCompanyFactory(
      "MEMBER",
      companyOpts
    );

    // Form with outgoing waste
    // SHOULD BE RETURNED
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "PROCESSED",
        sentAt: "2020-03-01T00:00:00",
        emitterCompanySiret: company.siret,
        wasteDetailsCode: "06 01 01*"
      }
    });

    // Form with different emitter or recipient sirets
    // SHOULD NOT BE RETURNED
    await formFactory({
      ownerId: user.id,
      opt: {
        status: "PROCESSED",
        sentAt: "2020-03-01T00:00:00",
        emitterCompanySiret: "xxxxxxxxxxxxxx",
        recipientCompanySiret: "zzzzzzzzzzzzzz",
        wasteDetailsCode: "06 01 01*"
      }
    });

    // DRAFT and SEALED forms
    // SHOULD NOT BE RETURNED
    await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: company.siret,
        sentAt: "2020-03-01T00:00:00",
        wasteDetailsCode: "06 01 01*"
      }
    });
    await formFactory({
      ownerId: user.id,
      opt: {
        status: "SEALED",
        emitterCompanySiret: company.siret,
        sentAt: "2020-03-01T00:00:00",
        wasteDetailsCode: "06 01 01*"
      }
    });

    // Form in which the company is the destination of the waste
    // SHOULD NOT BE RETURNED
    await formFactory({
      ownerId: user.id,
      opt: {
        status: "PROCESSED",
        recipientCompanySiret: company.siret,
        sentAt: "2020-03-01T00:00:00",
        wasteDetailsCode: "06 01 01*"
      }
    });

    // Form sent before the start date filter
    // SHOULD NOT BE RETURNED
    await formFactory({
      ownerId: user.id,
      opt: {
        status: "PROCESSED",
        emitterCompanySiret: company.siret,
        sentAt: "2019-03-01T00:00:00",
        wasteDetailsCode: "06 01 01*"
      }
    });

    // Form sent after the end date filter
    // SHOULD NOT BE RETURNED
    await formFactory({
      ownerId: user.id,
      opt: {
        status: "PROCESSED",
        emitterCompanySiret: company.siret,
        sentAt: "2021-03-01T00:00:00",
        wasteDetailsCode: "06 01 01*"
      }
    });

    // Form with different waste code
    // SHOULD NOT BE RETURNED
    await formFactory({
      ownerId: user.id,
      opt: {
        status: "PROCESSED",
        emitterCompanySiret: company.siret,
        sentAt: "2021-03-01T00:00:00",
        wasteDetailsCode: "06 01 02*"
      }
    });

    const whereInput = formsWhereInput(
      "OUTGOING",
      [company.siret],
      "2020-01-01T00:00:00",
      "2020-12-31T00:00:00",
      "06 01 01*"
    );
    const forms = await prisma.forms({ where: whereInput });

    expect(forms).toHaveLength(1);
    expect(forms[0]).toEqual(form);
  });

  test("INCOMING exportType", async () => {
    const companyOpts = {
      companyTypes: { set: ["WASTEPROCESSOR" as CompanyType] }
    };
    const { user, company } = await userWithCompanyFactory(
      "MEMBER",
      companyOpts
    );

    // Form with incoming waste
    // SHOULD BE RETURNED
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "PROCESSED",
        sentAt: "2020-03-01T00:00:00",
        recipientCompanySiret: company.siret,
        wasteDetailsCode: "06 01 01*"
      }
    });

    // Form with different emitter or recipient sirets
    // SHOULD NOT BE RETURNED
    await formFactory({
      ownerId: user.id,
      opt: {
        status: "PROCESSED",
        sentAt: "2020-03-01T00:00:00",
        emitterCompanySiret: "xxxxxxxxxxxxxx",
        recipientCompanySiret: "zzzzzzzzzzzzzz",
        wasteDetailsCode: "06 01 01*"
      }
    });

    // DRAFT, SEALED and SENT forms
    // SHOULD NOT BE RETURNED
    await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        recipientCompanySiret: company.siret,
        sentAt: "2020-03-01T00:00:00",
        wasteDetailsCode: "06 01 01*"
      }
    });
    await formFactory({
      ownerId: user.id,
      opt: {
        status: "SEALED",
        recipientCompanySiret: company.siret,
        sentAt: "2020-03-01T00:00:00",
        wasteDetailsCode: "06 01 01*"
      }
    });
    await formFactory({
      ownerId: user.id,
      opt: {
        status: "SENT",
        recipientCompanySiret: company.siret,
        sentAt: "2020-03-01T00:00:00",
        wasteDetailsCode: "06 01 01*"
      }
    });

    // Form in which the company is the emitter of the waste
    // SHOULD NOT BE RETURNED
    await formFactory({
      ownerId: user.id,
      opt: {
        status: "PROCESSED",
        emitterCompanySiret: company.siret,
        sentAt: "2020-03-01T00:00:00",
        wasteDetailsCode: "06 01 01*"
      }
    });

    // Form sent before the start date filter
    // SHOULD NOT BE RETURNED
    await formFactory({
      ownerId: user.id,
      opt: {
        status: "PROCESSED",
        recipientCompanySiret: company.siret,
        sentAt: "2019-03-01T00:00:00",
        wasteDetailsCode: "06 01 01*"
      }
    });

    // Form sent after the end date filter
    // SHOULD NOT BE RETURNED
    await formFactory({
      ownerId: user.id,
      opt: {
        status: "PROCESSED",
        recipientCompanySiret: company.siret,
        sentAt: "2021-03-01T00:00:00",
        wasteDetailsCode: "06 01 01*"
      }
    });

    // Form with different waste code
    // SHOULD NOT BE RETURNED
    await formFactory({
      ownerId: user.id,
      opt: {
        status: "PROCESSED",
        emitterCompanySiret: company.siret,
        sentAt: "2021-03-01T00:00:00",
        wasteDetailsCode: "06 01 02*"
      }
    });

    const whereInput = formsWhereInput(
      "INCOMING",
      [company.siret],
      "2020-01-01T00:00:00",
      "2020-12-31T00:00:00",
      "06 01 01*"
    );
    const forms = await prisma.forms({ where: whereInput });

    expect(forms).toHaveLength(1);
    expect(forms[0]).toEqual(form);
  });
  test("TRANSPORTED exportType", async () => {
    const companyOpts = {
      companyTypes: { set: ["TRANSPORTER" as CompanyType] }
    };
    const { user, company } = await userWithCompanyFactory(
      "MEMBER",
      companyOpts
    );

    // Form transported by company
    // SHOULD BE RETURNED
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "PROCESSED",
        sentAt: "2020-03-01T00:00:00",
        transporterCompanySiret: company.siret,
        wasteDetailsCode: "06 01 01*"
      }
    });

    // Form with a different transporter siret
    // SHOULD NOT BE RETURNED
    await formFactory({
      ownerId: user.id,
      opt: {
        status: "PROCESSED",
        sentAt: "2020-03-01T00:00:00",
        transporterCompanySiret: "xxxxxxxxxxxxxx",
        wasteDetailsCode: "06 01 01*"
      }
    });

    // DRAFT and SEALED forms
    // SHOULD NOT BE RETURNED
    await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        transporterCompanySiret: company.siret,
        sentAt: "2020-03-01T00:00:00",
        wasteDetailsCode: "06 01 01*"
      }
    });
    await formFactory({
      ownerId: user.id,
      opt: {
        status: "SEALED",
        recipientCompanySiret: company.siret,
        sentAt: "2020-03-01T00:00:00",
        wasteDetailsCode: "06 01 01*"
      }
    });

    // Form in which the company is the emitter of the waste
    // SHOULD NOT BE RETURNED
    await formFactory({
      ownerId: user.id,
      opt: {
        status: "PROCESSED",
        emitterCompanySiret: company.siret,
        sentAt: "2020-03-01T00:00:00",
        wasteDetailsCode: "06 01 01*"
      }
    });

    // Form sent before the start date filter
    // SHOULD NOT BE RETURNED
    await formFactory({
      ownerId: user.id,
      opt: {
        status: "PROCESSED",
        transporterCompanySiret: company.siret,
        sentAt: "2019-03-01T00:00:00",
        wasteDetailsCode: "06 01 01*"
      }
    });

    // Form sent after the end date filter
    // SHOULD NOT BE RETURNED
    await formFactory({
      ownerId: user.id,
      opt: {
        status: "PROCESSED",
        transporterCompanySiret: company.siret,
        sentAt: "2021-03-01T00:00:00",
        wasteDetailsCode: "06 01 01*"
      }
    });

    // Form with different waste code
    // SHOULD NOT BE RETURNED
    await formFactory({
      ownerId: user.id,
      opt: {
        status: "PROCESSED",
        transporterCompanySiret: company.siret,
        sentAt: "2021-03-01T00:00:00",
        wasteDetailsCode: "06 01 02*"
      }
    });

    const whereInput = formsWhereInput(
      "TRANSPORTED",
      [company.siret],
      "2020-01-01T00:00:00",
      "2020-12-31T00:00:00",
      "06 01 01*"
    );
    const forms = await prisma.forms({ where: whereInput });

    expect(forms).toHaveLength(1);
    expect(forms[0]).toEqual(form);
  });
});
