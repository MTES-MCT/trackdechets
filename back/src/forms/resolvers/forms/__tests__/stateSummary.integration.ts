import { Status } from "@prisma/client";
import { gql } from "graphql-tag";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { Query, QueryFormArgs } from "../../../../generated/graphql/types";
import { prisma } from "@td/prisma";
import {
  companyFactory,
  formWithTempStorageFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { getFirstTransporterSync } from "../../../database";

const FORM = gql`
  query Form($id: ID!) {
    form(id: $id) {
      stateSummary {
        quantity
        packagingInfos {
          type
          quantity
        }
        onuCode
        transporter {
          siret
        }
        transporterNumberPlate
        transporterCustomInfo
        recipient {
          siret
        }
        emitter {
          siret
        }
        lastActionOn
      }
    }
  }
`;

describe("stateSummary of a form with temporaryStorageDetail", () => {
  afterAll(resetDatabase);

  let form,
    emitter,
    transporter1Company,
    collectorCompany,
    transporter2Company,
    traiteurCompany;

  beforeAll(async () => {
    emitter = await userWithCompanyFactory("MEMBER");
    transporter1Company = await companyFactory();
    collectorCompany = await companyFactory();
    transporter2Company = await companyFactory();
    traiteurCompany = await companyFactory();

    // create a form with temporary storage detail
    form = await formWithTempStorageFactory({
      ownerId: emitter.user.id,
      opt: {
        status: "SENT",
        emitterCompanySiret: emitter.company.siret,
        recipientCompanySiret: collectorCompany.siret,
        transporters: {
          create: {
            transporterCompanySiret: transporter1Company.siret,
            transporterNumberPlate: "plate 1",
            transporterCustomInfo: "info 1",
            number: 1
          }
        },
        wasteDetailsQuantity: 1,
        wasteDetailsOnuCode: "onu 1",
        wasteDetailsPackagingInfos: [
          { type: "BENNE", quantity: 1, other: null }
        ],
        quantityReceived: null
      },
      forwardedInOpts: {
        emitterCompanySiret: collectorCompany.siret,
        recipientCompanySiret: traiteurCompany.siret,
        quantityReceived: null,
        wasteDetailsOnuCode: null,
        wasteDetailsPackagingInfos: [],
        wasteDetailsQuantity: null,
        transporters: {
          create: {
            transporterCompanySiret: transporter2Company.siret,
            number: 1
          }
        }
      }
    });
  });

  test("when the form is sent", async () => {
    const { query } = makeClient(emitter.user);

    const {
      data: {
        form: { stateSummary }
      }
    } = await query<Pick<Query, "form">, QueryFormArgs>(FORM, {
      variables: { id: form.id }
    });

    expect(stateSummary!.quantity).toEqual(form.wasteDetailsQuantity);
    expect(stateSummary!.packagingInfos).toEqual([
      { type: "BENNE", quantity: 1 }
    ]);
    expect(stateSummary!.onuCode).toEqual(form.wasteDetailsOnuCode);
    expect(stateSummary!.transporter!.siret).toEqual(transporter1Company.siret);
    expect(stateSummary!.transporterNumberPlate).toEqual("plate 1");
    expect(stateSummary!.transporterCustomInfo).toEqual("info 1");
    expect(stateSummary!.emitter!.siret).toEqual(emitter.company.siret);
    expect(stateSummary!.recipient!.siret).toEqual(collectorCompany.siret);
  });

  test("when the form is temp stored", async () => {
    const quantityTempStored = 2;

    form = await prisma.form.update({
      where: { id: form.id },
      data: {
        status: Status.TEMP_STORER_ACCEPTED,
        receivedAt: new Date(),
        quantityReceived: quantityTempStored
      }
    });

    const { query } = makeClient(emitter.user);

    const {
      data: {
        form: { stateSummary }
      }
    } = await query<Pick<Query, "form">, QueryFormArgs>(FORM, {
      variables: { id: form.id }
    });

    expect(stateSummary!.quantity).toEqual(quantityTempStored);
  });

  test("when the form is resealed", async () => {
    const updatedForm = await prisma.form.update({
      where: { id: form.id },
      data: {
        status: Status.RESEALED,
        forwardedIn: {
          update: {
            wasteDetailsQuantity: 3,
            wasteDetailsOnuCode: "onu 2",
            wasteDetailsPackagingInfos: [
              { type: "FUT", quantity: 2, other: null }
            ],
            transporters: {
              updateMany: {
                where: { number: 1 },
                data: {
                  transporterNumberPlate: "plate 2",
                  transporterCustomInfo: "info 2"
                }
              }
            }
          }
        }
      },
      include: { forwardedIn: { include: { transporters: true } } }
    });

    const forwardedInTransporter = getFirstTransporterSync(
      updatedForm.forwardedIn!
    );

    const { query } = makeClient(emitter.user);

    const {
      data: {
        form: { stateSummary }
      }
    } = await query<Pick<Query, "form">, QueryFormArgs>(FORM, {
      variables: { id: form.id }
    });
    expect(stateSummary!.quantity).toEqual(
      updatedForm.forwardedIn!.wasteDetailsQuantity
    );
    expect(stateSummary!.packagingInfos).toEqual([
      { type: "FUT", quantity: 2 }
    ]);
    expect(stateSummary!.onuCode).toEqual(
      updatedForm.forwardedIn!.wasteDetailsOnuCode
    );
    expect(stateSummary!.transporter!.siret).toEqual(transporter2Company.siret);
    expect(stateSummary!.transporterNumberPlate).toEqual(
      forwardedInTransporter!.transporterNumberPlate
    );
    expect(stateSummary!.transporterCustomInfo).toEqual(
      forwardedInTransporter!.transporterCustomInfo
    );
    expect(stateSummary!.emitter!.siret).toEqual(collectorCompany.siret);
    expect(stateSummary!.recipient!.siret).toEqual(traiteurCompany.siret);
  });

  test("when the form is received at final destination", async () => {
    const quantityReceived = 4;

    await prisma.form.update({
      where: { id: form.id },
      data: {
        status: Status.PROCESSED,
        forwardedIn: {
          update: {
            quantityReceived,
            processedAt: new Date(),
            wasteAcceptationStatus: "ACCEPTED"
          }
        }
      }
    });

    const { query } = makeClient(emitter.user);

    const {
      data: {
        form: { stateSummary }
      }
    } = await query<Pick<Query, "form">, QueryFormArgs>(FORM, {
      variables: { id: form.id }
    });

    expect(stateSummary!.quantity).toEqual(quantityReceived);
  });
});
