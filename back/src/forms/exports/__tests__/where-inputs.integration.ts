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

    // DRAFT, SEALED and CANCELED forms
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
    await formFactory({
      ownerId: user.id,
      opt: {
        status: "SEALED",
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
    await formFactory({
      ownerId: user.id,
      opt: {
        status: "CANCELED",
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

    const expected = [];

    // Form with incoming waste
    // SHOULD BE RETURNED
    const f1 = await formFactory({
      ownerId: user.id,
      opt: {
        status: "PROCESSED",
        sentAt: "2020-03-01T00:00:00",
        recipientCompanySiret: company.siret,
        wasteDetailsCode: "06 01 01*"
      }
    });
    expected.push(f1);

    // Form with incoming waste for temporary storage
    // SHOULD BE RETURNED
    const f2 = await formFactory({
      ownerId: user.id,
      opt: {
        status: "PROCESSED",
        sentAt: "2020-03-01T00:00:00",
        recipientIsTempStorage: true,
        recipientCompanySiret: company.siret,
        wasteDetailsCode: "06 01 01*"
      }
    });
    expected.push(f2);

    // Form with incoming waste for final destination after temporary storage
    // SHOULD BE RETURNED
    const f3 = await formFactory({
      ownerId: user.id,
      opt: {
        status: "PROCESSED",
        sentAt: "2020-03-01T00:00:00",
        recipientIsTempStorage: true,
        temporaryStorageDetail: {
          create: { destinationCompanySiret: company.siret }
        },
        wasteDetailsCode: "06 01 01*"
      }
    });
    expected.push(f3);

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

    // DRAFT, SEALED, CANCELED and SENT forms
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
        status: "CANCELED",
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
        sentAt: "2020-03-01T00:00:00",
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

    expect(forms).toHaveLength(3);
    expect(forms).toEqual(expected);
  });
  test("TRANSPORTED exportType", async () => {
    const companyOpts = {
      companyTypes: { set: ["TRANSPORTER" as CompanyType] }
    };
    const { user, company } = await userWithCompanyFactory(
      "MEMBER",
      companyOpts
    );

    const expected = [];

    // Form transported by company
    // SHOULD BE RETURNED
    const f1 = await formFactory({
      ownerId: user.id,
      opt: {
        status: "PROCESSED",
        sentAt: "2020-03-01T00:00:00",
        transporterCompanySiret: company.siret,
        wasteDetailsCode: "06 01 01*"
      }
    });
    expected.push(f1);

    // Form transported by company after temporary storage
    // SHOULD BE RETUNRED
    const f2 = await formFactory({
      ownerId: user.id,
      opt: {
        status: "PROCESSED",
        sentAt: "2020-03-01T00:00:00",
        recipientIsTempStorage: true,
        temporaryStorageDetail: {
          create: { transporterCompanySiret: company.siret }
        },
        wasteDetailsCode: "06 01 01*"
      }
    });
    expected.push(f2);

    // Form transported by company as a multi-modal segment
    // SHOULD BE RETURNED
    const f3 = await formFactory({
      ownerId: user.id,
      opt: {
        status: "PROCESSED",
        sentAt: "2020-03-01T00:00:00",
        transportSegments: {
          create: {
            transporterCompanySiret: company.siret
          }
        },
        wasteDetailsCode: "06 01 01*"
      }
    });
    expected.push(f3);

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
        sentAt: "2020-03-01T00:00:00",
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

    expect(forms).toHaveLength(3);
    expect(forms).toEqual(expected);
  });

  test("TRADED exportType", async () => {
    const companyOpts = {
      companyTypes: { set: ["TRADER" as CompanyType] }
    };
    const { user, company } = await userWithCompanyFactory(
      "MEMBER",
      companyOpts
    );

    // Form in which the company is trader
    // SHOULD BE RETURNED
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "PROCESSED",
        traderCompanySiret: company.siret,
        sentAt: "2020-03-01T00:00:00",
        wasteDetailsCode: "06 01 01*"
      }
    });

    // DRAFT and SEALED forms
    // SHOULD NOT BE RETURNED
    await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        traderCompanySiret: company.siret,
        sentAt: "2020-03-01T00:00:00",
        wasteDetailsCode: "06 01 01*"
      }
    });
    await formFactory({
      ownerId: user.id,
      opt: {
        status: "SEALED",
        traderCompanySiret: company.siret,
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
        traderCompanySiret: company.siret,
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
        traderCompanySiret: company.siret,
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
        traderCompanySiret: company.siret,
        sentAt: "2020-03-01T00:00:00",
        wasteDetailsCode: "06 01 02*"
      }
    });

    const whereInput = formsWhereInput(
      "TRADED",
      [company.siret],
      "2020-01-01T00:00:00",
      "2020-12-31T00:00:00",
      "06 01 01*"
    );
    const forms = await prisma.forms({ where: whereInput });

    expect(forms).toHaveLength(1);
    expect(forms[0]).toEqual(form);
  });

  test("ALL exportType", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const expected = [];

    // Form in which the company is emitter
    // SHOULD BE RETURNED
    const f1 = await formFactory({
      ownerId: user.id,
      opt: {
        status: "PROCESSED",
        emitterCompanySiret: company.siret,
        sentAt: "2020-03-01T00:00:00",
        wasteDetailsCode: "06 01 01*"
      }
    });
    expected.push(f1);

    // Form in which the company is recipient
    // SHOULD BE RETURNED
    const f2 = await formFactory({
      ownerId: user.id,
      opt: {
        status: "PROCESSED",
        recipientCompanySiret: company.siret,
        sentAt: "2020-03-01T00:00:00",
        wasteDetailsCode: "06 01 01*"
      }
    });
    expected.push(f2);
    // Form in which the company is transporter
    // SHOULD BE RETURNED
    const f3 = await formFactory({
      ownerId: user.id,
      opt: {
        status: "PROCESSED",
        transporterCompanySiret: company.siret,
        sentAt: "2020-03-01T00:00:00",
        wasteDetailsCode: "06 01 01*"
      }
    });
    expected.push(f3);

    // Form in which the company is trader
    // SHOULD BE RETURNED
    const f4 = await formFactory({
      ownerId: user.id,
      opt: {
        status: "PROCESSED",
        traderCompanySiret: company.siret,
        sentAt: "2020-03-01T00:00:00",
        wasteDetailsCode: "06 01 01*"
      }
    });
    expected.push(f4);

    // Form in which the siret does nos appear
    // SHOULD NOT BE RETUNRED
    await formFactory({ ownerId: user.id });

    // DRAFT and SEALED forms
    // SHOULD NOT BE RETURNED
    await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        traderCompanySiret: company.siret,
        sentAt: "2020-03-01T00:00:00",
        wasteDetailsCode: "06 01 01*"
      }
    });
    await formFactory({
      ownerId: user.id,
      opt: {
        status: "SEALED",
        traderCompanySiret: company.siret,
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
        traderCompanySiret: company.siret,
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
        traderCompanySiret: company.siret,
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
        traderCompanySiret: company.siret,
        sentAt: "2020-03-01T00:00:00",
        wasteDetailsCode: "06 01 02*"
      }
    });

    const whereInput = formsWhereInput(
      "ALL",
      [company.siret],
      "2020-01-01T00:00:00",
      "2020-12-31T00:00:00",
      "06 01 01*"
    );
    const forms = await prisma.forms({ where: whereInput });

    expect(forms).toHaveLength(4);
    expect(forms).toEqual(expected);
  });
});
