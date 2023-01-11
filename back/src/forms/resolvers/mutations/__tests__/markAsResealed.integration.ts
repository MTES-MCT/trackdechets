import { resetDatabase } from "../../../../../integration-tests/helper";
import prisma from "../../../../prisma";
import { ErrorCode } from "../../../../common/errors";
import {
  companyFactory,
  destinationFactory,
  formFactory,
  formWithTempStorageFactory,
  siretify,
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { CompanyType, CompanyVerificationStatus, Status } from "@prisma/client";
import {
  Mutation,
  MutationMarkAsResealedArgs
} from "../../../../generated/graphql/types";
import { gql } from "apollo-server-core";

const MARK_AS_RESEALED = gql`
  mutation MarkAsResealed($id: ID!, $resealedInfos: ResealedFormInput!) {
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

  afterAll(resetDatabase);

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
        recipientCompanySiret: collector.siret,
        quantityReceived: 1
      },
      forwardedInOpts: { recipientCompanySiret: destination.siret }
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

  test("can convert a simple form to a form with temporary storage", async () => {
    const owner = await userFactory();
    const { user, company: collector } = await userWithCompanyFactory(
      "MEMBER",
      {
        companyTypes: { set: [CompanyType.COLLECTOR] }
      }
    );
    const destination = await destinationFactory();
    const transporter = await companyFactory({
      companyTypes: { set: [CompanyType.TRANSPORTER] }
    });

    const { mutate } = makeClient(user);

    const form = await formFactory({
      ownerId: owner.id,
      opt: {
        status: "ACCEPTED",
        recipientCompanySiret: collector.siret,
        quantityReceived: 1
      }
    });

    await mutate<Pick<Mutation, "markAsResealed">, MutationMarkAsResealedArgs>(
      MARK_AS_RESEALED,
      {
        variables: {
          id: form.id,
          resealedInfos: {
            destination: {
              company: {
                siret: destination.siret,
                name: destination.name,
                address: destination.address,
                contact: "Mr Destination",
                mail: destination.contactEmail,
                phone: destination.contactPhone
              },
              cap: "CAP 2",
              processingOperation: "R 1"
            },
            transporter: {
              company: {
                siret: transporter.siret,
                name: transporter.name,
                address: transporter.address,
                contact: "Mr transporter",
                mail: transporter.contactEmail,
                phone: transporter.contactPhone
              },
              isExemptedOfReceipt: true
            }
          }
        }
      }
    );

    const resealedForm = await prisma.form.findUnique({
      where: { id: form.id },
      include: { forwardedIn: true }
    });
    expect(resealedForm.status).toEqual("RESEALED");
    expect(resealedForm.forwardedIn.emitterCompanySiret).toEqual(
      collector.siret
    );
    expect(resealedForm.forwardedIn.recipientCompanySiret).toEqual(
      destination.siret
    );
    expect(resealedForm.forwardedIn.transporterCompanySiret).toEqual(
      transporter.siret
    );
    expect(resealedForm.forwardedIn.readableId).toEqual(
      `${form.readableId}-suite`
    );
    expect(resealedForm.forwardedIn.status).toEqual("SEALED");
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
        recipientCompanySiret: collector.siret,
        quantityReceived: 1
      }
    });

    // assume destination siret missing
    await prisma.form.update({
      where: { id: form.id },
      data: {
        forwardedIn: { update: { recipientCompanySiret: "" } }
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
      "Destinataire: Le siret de l'entreprise est obligatoire"
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
        recipientCompanySiret: collector.siret,
        quantityReceived: 1
      },
      forwardedInOpts: {
        // assume destination siret is missing
        recipientCompanySiret: ""
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

  it("should allow updating an already RESEALED form", async () => {
    const owner = await userFactory();
    const { user, company: collector } = await userWithCompanyFactory(
      "MEMBER",
      {
        companyTypes: { set: [CompanyType.COLLECTOR] }
      }
    );
    const destination = await destinationFactory();
    const transporter = await companyFactory();

    const { mutate } = makeClient(user);

    const form = await formWithTempStorageFactory({
      ownerId: owner.id,
      opt: {
        status: Status.RESEALED,
        recipientCompanySiret: collector.siret,
        quantityReceived: 1
      },
      forwardedInOpts: { recipientCompanySiret: destination.siret }
    });

    // change transporter
    await mutate(MARK_AS_RESEALED, {
      variables: {
        id: form.id,
        resealedInfos: {
          transporter: {
            company: {
              siret: transporter.siret
            }
          }
        }
      }
    });

    const resealedForm = await prisma.form.findUnique({
      where: { id: form.id },
      include: { forwardedIn: true }
    });
    expect(resealedForm.status).toEqual("RESEALED");
    expect(resealedForm.forwardedIn.transporterCompanySiret).toEqual(
      transporter.siret
    );
  });

  it("should not be possible de set a quantity > 40T when transport mode is ROAD", async () => {
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
        status: Status.RESEALED,
        recipientCompanySiret: collector.siret,
        quantityReceived: 1
      },
      forwardedInOpts: { recipientCompanySiret: destination.siret }
    });

    const { errors } = await mutate<
      Pick<Mutation, "markAsResealed">,
      MutationMarkAsResealedArgs
    >(MARK_AS_RESEALED, {
      variables: {
        id: form.id,
        resealedInfos: {
          wasteDetails: { quantity: 60 },
          transporter: { mode: "ROAD" }
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Déchet : le poids doit être inférieur à 40 tonnes lorsque le transport se fait par la route"
      })
    ]);
  });

  test("when resealedInfos contains repackaging data", async () => {
    const owner = await userFactory();
    const { user, company: collector } = await userWithCompanyFactory(
      "MEMBER",
      { companyTypes: { set: [CompanyType.COLLECTOR] } }
    );

    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR]
    });

    const { mutate } = makeClient(user);

    const form = await formWithTempStorageFactory({
      ownerId: owner.id,
      opt: {
        status: "TEMP_STORER_ACCEPTED",
        recipientCompanySiret: collector.siret,
        quantityReceived: 1
      },
      forwardedInOpts: {
        recipientCompanySiret: destination.siret
      }
    });

    const repackaging = {
      packagingInfos: [{ type: "FUT", other: null, quantity: 1 }],
      onuCode: "adr",
      quantity: 0.01,
      quantityType: "ESTIMATED"
    };

    // add a repackaging
    await mutate(MARK_AS_RESEALED, {
      variables: {
        id: form.id,
        resealedInfos: {
          wasteDetails: repackaging
        }
      }
    });
    const tempStorage = await prisma.form
      .findUnique({
        where: { id: form.id }
      })
      .forwardedIn();
    expect(tempStorage.wasteDetailsPackagingInfos).toEqual(
      repackaging.packagingInfos
    );
    expect(tempStorage.wasteDetailsOnuCode).toEqual(repackaging.onuCode);
    expect(tempStorage.wasteDetailsQuantity).toEqual(repackaging.quantity);
    expect(tempStorage.wasteDetailsQuantityType).toEqual(
      repackaging.quantityType
    );
  });

  test("when resealedInfos contains transporter data", async () => {
    const owner = await userFactory();
    const { user, company: collector } = await userWithCompanyFactory(
      "MEMBER",
      {
        companyTypes: { set: [CompanyType.COLLECTOR] }
      }
    );
    const destination = await destinationFactory();
    const transporter = await companyFactory();

    const { mutate } = makeClient(user);

    const form = await formWithTempStorageFactory({
      ownerId: owner.id,
      opt: {
        status: "TEMP_STORER_ACCEPTED",
        recipientCompanySiret: collector.siret,
        quantityReceived: 1
      },
      forwardedInOpts: { recipientCompanySiret: destination.siret }
    });

    await mutate(MARK_AS_RESEALED, {
      variables: {
        id: form.id,
        resealedInfos: {
          transporter: {
            isExemptedOfReceipt: false,
            receipt: "333",
            department: "27",
            numberPlate: "",
            validityLimit: "2021-12-31",
            customInfo: "Route",
            company: {
              name: "Transporteur",
              siret: transporter.siret,
              address: "rue des 6 chemins",
              contact: ".",
              phone: ".",
              mail: "contact@transport.fr"
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

    const recipientCompanySiret = siretify(3);
    const form = await formWithTempStorageFactory({
      ownerId: owner.id,
      opt: {
        status: "TEMP_STORER_ACCEPTED",
        recipientCompanySiret: collector.siret,
        quantityReceived: 1
      },
      forwardedInOpts: {
        // this SIRET is not registered in TD
        recipientCompanySiret
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
        message: `L'installation de destination avec le SIRET ${recipientCompanySiret} n'est pas inscrite sur Trackdéchets`
      })
    ]);
  });

  it("should fail if destination after temp storage is not registered as COLLECTOR or WASTEPROCESSOR", async () => {
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
        recipientCompanySiret: collector.siret,
        quantityReceived: 1
      },
      forwardedInOpts: {
        recipientCompanySiret: destination.siret
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
        message: `L'installation de destination ou d’entreposage ou de reconditionnement avec le SIRET "${destination.siret}" n'est pas inscrite sur Trackdéchets en tant qu'installation de traitement ou de tri transit regroupement. Cette installation ne peut donc pas être visée sur le bordereau. Veuillez vous rapprocher de l'administrateur de cette installation pour qu'il modifie le profil de l'établissement depuis l'interface Trackdéchets Mon Compte > Établissements`
      })
    ]);
  });

  it("should throw an error if VERIFY_COMPANY=true and destination after temp storage is not verified", async () => {
    // patch process.env and reload server
    process.env.VERIFY_COMPANY = "true";
    const server = require("../../../../server").server;
    await server.start();
    const makeClient = require("../../../../__tests__/testClient").default;

    const { user: owner, company: emitterCompany } =
      await userWithCompanyFactory("MEMBER");

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
        recipientCompanySiret: collector.siret,
        quantityReceived: 1
      },
      forwardedInOpts: {
        recipientCompanySiret: destination.siret
      }
    });

    await prisma.form.update({
      where: { id: form.id },
      data: {
        forwardedIn: {
          update: { recipientCompanySiret: destination.siret }
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
        message: `Le compte de l'installation de destination ou d’entreposage ou de reconditionnement prévue avec le SIRET ${destination.siret} n'a pas encore été vérifié. Cette installation ne peut pas être visée sur le bordereau bordereau.`
      })
    ]);
  }, 10000);

  it("should not work when a transporter french vat number is present along with a SIRET", async () => {
    const owner = await userFactory();
    const { user, company: collector } = await userWithCompanyFactory(
      "MEMBER",
      { companyTypes: { set: [CompanyType.COLLECTOR] } }
    );
    const transporterAfterTempstorage = await companyFactory();

    const { mutate } = makeClient(user);

    const destination = await companyFactory({
      companyTypes: [CompanyType.WASTEPROCESSOR]
    });

    const form = await formWithTempStorageFactory({
      ownerId: owner.id,
      opt: {
        status: Status.TEMP_STORER_ACCEPTED,
        recipientCompanySiret: collector.siret,
        quantityReceived: 1
      },
      forwardedInOpts: {
        recipientCompanySiret: destination.siret
      }
    });

    const { errors } = await mutate<
      Pick<Mutation, "markAsResealed">,
      MutationMarkAsResealedArgs
    >(
      gql`
        mutation MarkAsResealed($id: ID!, $resealedInfos: ResealedFormInput!) {
          markAsResealed(id: $id, resealedInfos: $resealedInfos) {
            temporaryStorageDetail {
              transporter {
                company {
                  vatNumber
                }
              }
            }
          }
        }
      `,
      {
        variables: {
          id: form.id,
          resealedInfos: {
            transporter: {
              company: {
                name: "Code en stock",
                siret: transporterAfterTempstorage.siret,
                vatNumber: "FR87850019464",
                address: "Marseille",
                contact: "Mr Transport",
                phone: "00 00 00 00 00",
                mail: "transporter@codenstock.fr"
              },
              isExemptedOfReceipt: true
            }
          }
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Transporteur : Impossible d'utiliser le numéro de TVA pour un établissement français, veuillez renseigner son SIRET uniquement",
        extensions: {
          code: "BAD_USER_INPUT"
        }
      })
    ]);
  });

  it("should fail if bsd is canceled", async () => {
    const owner = await userFactory();
    const { user, company: collector } = await userWithCompanyFactory(
      "MEMBER",
      { companyTypes: { set: [CompanyType.COLLECTOR] } }
    );

    const { mutate } = makeClient(user);

    const destination = await companyFactory({
      companyTypes: [CompanyType.COLLECTOR]
    });

    const form = await formWithTempStorageFactory({
      ownerId: owner.id,
      opt: {
        status: Status.CANCELED,
        recipientCompanySiret: collector.siret,
        quantityReceived: 1
      },
      forwardedInOpts: {
        recipientCompanySiret: destination.siret
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
        message: `Vous ne pouvez pas faire cette action, ce bordereau a été annulé`
      })
    ]);
  });
});
