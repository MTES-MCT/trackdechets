import { resetDatabase } from "../../../../../integration-tests/helper";
import prisma from "../../../../prisma";
import { ErrorCode } from "../../../../common/errors";
import {
  companyFactory,
  destinationFactory,
  formFactory,
  formWithTempStorageFactory,
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { CompanyType } from "@prisma/client";

const MARK_AS_RESEALED = `
  mutation MarkAsResealed($id: ID!, $resealedInfos: ResealedFormInput!){
    markAsResealed(id: $id, resealedInfos: $resealedInfos) {
      id
      status
    }
  }
`;

describe("Mutation markAsResealed", () => {
  afterEach(resetDatabase);

  test("the temp storer of the BSD can reseal it", async () => {
    const owner = await userFactory();
    const { user, company: collector } = await userWithCompanyFactory(
      "MEMBER",
      {
        companyTypes: { set: [CompanyType.COLLECTOR] }
      }
    );
    const destination = await destinationFactory();

    const { mutate } = makeClient(user);

    const form = await formWithTempStorageFactory({
      ownerId: owner.id,
      opt: {
        status: "TEMP_STORER_ACCEPTED",
        recipientCompanySiret: collector.siret
      },
      tempStorageOpts: { destinationCompanySiret: destination.siret }
    });

    await mutate(MARK_AS_RESEALED, {
      variables: {
        id: form.id,
        resealedInfos: {}
      }
    });

    const resealedForm = await prisma.form.findUnique({
      where: { id: form.id }
    });
    expect(resealedForm.status).toEqual("RESEALED");
  });

  test("it should fail if temporary storage detail is incomplete", async () => {
    const owner = await userFactory();
    const { user, company: collector } = await userWithCompanyFactory(
      "MEMBER",
      { companyTypes: { set: [CompanyType.COLLECTOR] } }
    );

    const { mutate } = makeClient(user);

    const form = await formWithTempStorageFactory({
      ownerId: owner.id,
      opt: {
        status: "TEMP_STORER_ACCEPTED",
        recipientCompanySiret: collector.siret
      }
    });

    // assume destination siret missing
    await prisma.form.update({
      where: { id: form.id },
      data: {
        temporaryStorageDetail: { update: { destinationCompanySiret: "" } }
      }
    });

    const { errors } = await mutate(MARK_AS_RESEALED, {
      variables: {
        id: form.id,
        resealedInfos: {}
      }
    });

    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual(
      "Destination prévue: Le siret de l'entreprise est obligatoire"
    );
    expect(errors[0].extensions.code).toEqual(ErrorCode.BAD_USER_INPUT);
    const resealedForm = await prisma.form.findUnique({
      where: { id: form.id }
    });
    expect(resealedForm.status).toEqual("TEMP_STORER_ACCEPTED");
  });

  test("it should work if resealedInfos is completing current data", async () => {
    const owner = await userFactory();
    const { user, company: collector } = await userWithCompanyFactory(
      "MEMBER",
      { companyTypes: { set: [CompanyType.COLLECTOR] } }
    );

    const { mutate } = makeClient(user);

    const form = await formWithTempStorageFactory({
      ownerId: owner.id,
      opt: {
        status: "TEMP_STORER_ACCEPTED",
        recipientCompanySiret: collector.siret
      },
      tempStorageOpts: {
        // assume destination siret is missing
        destinationCompanySiret: ""
      }
    });

    const destination = await destinationFactory();

    // provide missing info in resealedInfos
    await mutate(MARK_AS_RESEALED, {
      variables: {
        id: form.id,
        resealedInfos: {
          destination: {
            company: {
              siret: destination.siret
            }
          }
        }
      }
    });

    const resealedForm = await prisma.form.findUnique({
      where: { id: form.id }
    });
    expect(resealedForm.status).toEqual("RESEALED");
  });

  it("should fail if destination after temp storage is not registered in TD", async () => {
    const owner = await userFactory();
    const { user, company: collector } = await userWithCompanyFactory(
      "MEMBER",
      { companyTypes: { set: [CompanyType.COLLECTOR] } }
    );

    const { mutate } = makeClient(user);

    const form = await formWithTempStorageFactory({
      ownerId: owner.id,
      opt: {
        status: "TEMP_STORER_ACCEPTED",
        recipientCompanySiret: collector.siret
      },
      tempStorageOpts: {
        // this SIRET is not registered in TD
        destinationCompanySiret: "11111111111111"
      }
    });

    const { errors } = await mutate(MARK_AS_RESEALED, {
      variables: {
        id: form.id,
        resealedInfos: {}
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "L'installation de destination prévue après entreposage provisoire ou reconditionnement (cadre 14) n'est pas inscrite sur Trackdéchets"
      })
    ]);
  });

  it("should fail if destination after temp storage is not resgistered as COLLECTOR or WASTEPROCESSOR", async () => {
    const owner = await userFactory();
    const { user, company: collector } = await userWithCompanyFactory(
      "MEMBER",
      { companyTypes: { set: [CompanyType.COLLECTOR] } }
    );

    const { mutate } = makeClient(user);

    const destination = await companyFactory({
      // assume profile is not COLLECTOR or WASTEPROCESSOR
      companyTypes: [CompanyType.PRODUCER]
    });

    const form = await formWithTempStorageFactory({
      ownerId: owner.id,
      opt: {
        status: "TEMP_STORER_ACCEPTED",
        recipientCompanySiret: collector.siret
      },
      tempStorageOpts: {
        // this company p
        destinationCompanySiret: destination.siret
      }
    });

    const { errors } = await mutate(MARK_AS_RESEALED, {
      variables: {
        id: form.id,
        resealedInfos: {}
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: `L'installation de destination prévue après entreposage provisoire ou reconditionnement ${destination.siret}
      n'est pas inscrite sur Trackdéchets en tant que qu'installation de traitement ou de tri transit regroupement.
      Cette installation ne peut donc pas être visée en case 14 du bordereau. Veuillez vous rapprocher de l'administrateur
      de cette installation pour qu'il modifie le profil de l'installation depuis l'interface Trackdéchets Mon Compte > Établissements`
      })
    ]);
  });
});
