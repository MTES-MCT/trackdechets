import { resetDatabase } from "../../../../../integration-tests/helper";
import prisma from "../../../../prisma";
import { ErrorCode } from "../../../../common/errors";
import {
  companyFactory,
  destinationFactory,
  formWithTempStorageFactory,
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { CompanyType, CompanyVerificationStatus, Status } from "@prisma/client";

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

  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    delete process.env.VERIFY_COMPANY;
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

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
        message: `L'installation de destination après entreposage provisoire ou reconditionnement qui a été renseignée en case 14 (SIRET 11111111111111) n'est pas inscrite sur Trackdéchets`
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
        status: Status.TEMP_STORER_ACCEPTED,
        recipientCompanySiret: collector.siret
      },
      tempStorageOpts: {
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
        message: `L'installation de destination après entreposage provisoire ou reconditionnement qui a été renseignée en case 14 (SIRET ${destination.siret})
      n'est pas inscrite sur Trackdéchets en tant qu'installation de traitement ou de tri transit regroupement.
      Cette installation ne peut donc pas être visée en case 14 du bordereau. Veuillez vous rapprocher de l'administrateur
      de cette installation pour qu'il modifie le profil de l'installation depuis l'interface Trackdéchets Mon Compte > Établissements`
      })
    ]);
  });

  it("should throw an error if VERIFY_COMPANY=true and destination after temp storage is not verified", async () => {
    // patch process.env and reload server
    process.env.VERIFY_COMPANY = "true";
    const makeClient = require("../../../../__tests__/testClient").default;

    const {
      user: owner,
      company: emitterCompany
    } = await userWithCompanyFactory("MEMBER");

    const { user, company: collector } = await userWithCompanyFactory(
      "MEMBER",
      {
        companyTypes: { set: [CompanyType.COLLECTOR] },
        verificationStatus: CompanyVerificationStatus.VERIFIED
      }
    );

    const destination = await companyFactory({
      companyTypes: { set: [CompanyType.WASTEPROCESSOR] },
      verificationStatus: CompanyVerificationStatus.TO_BE_VERIFIED
    });

    const form = await formWithTempStorageFactory({
      ownerId: owner.id,
      opt: {
        status: Status.TEMP_STORER_ACCEPTED,
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: collector.siret
      },
      tempStorageOpts: {
        destinationCompanySiret: destination.siret
      }
    });

    await prisma.form.update({
      where: { id: form.id },
      data: {
        temporaryStorageDetail: {
          update: { destinationCompanySiret: destination.siret }
        }
      }
    });
    const { mutate } = makeClient(user);
    const { errors } = await mutate(MARK_AS_RESEALED, {
      variables: {
        id: form.id,
        resealedInfos: {}
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: `Le compte de l'installation de destination ou d’entreposage ou de reconditionnement prévue ${destination.siret}
      n'a pas encore été vérifié. Cette installation ne peut pas être visée en case 14 du bordereau.`
      })
    ]);
  });
});
