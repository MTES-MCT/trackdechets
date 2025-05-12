import { WasteAcceptationStatus } from "@prisma/client";
import { gql } from "graphql-tag";
import type {
  Mutation,
  MutationUpdateBsffPackagingArgs
} from "@td/codegen-back";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import {
  createBsffAfterOperation,
  createBsffAfterReception,
  createBsffAfterRefusal,
  createBsffBeforeEmission,
  createBsffBeforeOperation
} from "../../../__tests__/factories";
import { prisma } from "@td/prisma";
import { resetDatabase } from "../../../../../integration-tests/helper";

export const UPDATE_BSFF_PACKAGING = gql`
  mutation UpdateBsffPackaging($id: ID!, $input: UpdateBsffPackagingInput!) {
    updateBsffPackaging(id: $id, input: $input) {
      id
    }
  }
`;

describe("Mutation.updateBsffPackaging", () => {
  afterEach(resetDatabase);

  test("before acceptation > it should be possible to update acceptation fields", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const transporter = await userWithCompanyFactory("MEMBER");
    const destination = await userWithCompanyFactory("MEMBER");
    const bsff = await createBsffAfterReception({
      emitter,
      transporter,
      destination
    });

    const packagingId = bsff.packagings[0].id;

    const { mutate } = makeClient(destination.user);
    await mutate<
      Pick<Mutation, "updateBsffPackaging">,
      MutationUpdateBsffPackagingArgs
    >(UPDATE_BSFF_PACKAGING, {
      variables: {
        id: packagingId,
        input: {
          acceptation: {
            date: new Date().toISOString() as any,
            status: WasteAcceptationStatus.ACCEPTED,
            weight: 3
          }
        }
      }
    });

    const updatedPackaging = await prisma.bsffPackaging.findUniqueOrThrow({
      where: { id: packagingId }
    });
    expect(updatedPackaging.acceptationStatus).toEqual(
      WasteAcceptationStatus.ACCEPTED
    );
    expect(updatedPackaging.acceptationWeight).toEqual(3);
  });

  it("should throw error if the mutation is not called by the destination", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const transporter = await userWithCompanyFactory("MEMBER");
    const destination = await userWithCompanyFactory("MEMBER");
    const bsff = await createBsffAfterReception({
      emitter,
      transporter,
      destination
    });

    const packagingId = bsff.packagings[0].id;

    const { mutate } = makeClient(emitter.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsffPackaging">,
      MutationUpdateBsffPackagingArgs
    >(UPDATE_BSFF_PACKAGING, {
      variables: {
        id: packagingId,
        input: {
          acceptation: {
            date: new Date().toISOString() as any,
            status: WasteAcceptationStatus.ACCEPTED,
            weight: 1
          }
        }
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Seul le destinataire du BSFF peut modifier les informations d'acceptation et d'opération sur un contenant"
      })
    ]);
  });

  test("before acceptation > it should be possible to update acceptation fields", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const transporter = await userWithCompanyFactory("MEMBER");
    const destination = await userWithCompanyFactory("MEMBER");
    const bsff = await createBsffAfterReception({
      emitter,
      transporter,
      destination
    });

    const packagingId = bsff.packagings[0].id;

    const { mutate } = makeClient(destination.user);
    await mutate<
      Pick<Mutation, "updateBsffPackaging">,
      MutationUpdateBsffPackagingArgs
    >(UPDATE_BSFF_PACKAGING, {
      variables: {
        id: packagingId,
        input: {
          acceptation: {
            date: "2022-11-04" as any,
            weight: 1,
            status: "ACCEPTED",
            wasteCode: "14 06 01*",
            wasteDescription: "R404A"
          }
        }
      }
    });

    const updatedPackaging = await prisma.bsffPackaging.findUniqueOrThrow({
      where: { id: packagingId }
    });
    expect(updatedPackaging.acceptationStatus).toEqual(
      WasteAcceptationStatus.ACCEPTED
    );
  });

  test("after acceptation > it should be possible to update sealed fields", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const transporter = await userWithCompanyFactory("MEMBER");
    const destination = await userWithCompanyFactory("MEMBER");
    const bsff = await createBsffBeforeOperation({
      emitter,
      transporter,
      destination
    });

    const packagingId = bsff.packagings[0].id;

    const { mutate } = makeClient(destination.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsffPackaging">,
      MutationUpdateBsffPackagingArgs
    >(UPDATE_BSFF_PACKAGING, {
      variables: {
        id: packagingId,
        input: {
          numero: "nouveau-numero",
          acceptation: {
            date: "2022-11-04" as any,
            weight: 2,
            status: "ACCEPTED",
            wasteCode: "14 06 02*",
            wasteDescription: "HFC"
          }
        }
      }
    });

    expect(errors).toBeUndefined();

    const updatedPackaging = await prisma.bsffPackaging.findUniqueOrThrow({
      where: { id: packagingId }
    });
    expect(updatedPackaging.numero).toEqual("nouveau-numero");
  });

  test("before acceptation > it should be possible to update numero", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const transporter = await userWithCompanyFactory("MEMBER");
    const destination = await userWithCompanyFactory("MEMBER");
    const bsff = await createBsffAfterReception({
      emitter,
      transporter,
      destination
    });

    const packagingId = bsff.packagings[0].id;

    const { mutate } = makeClient(destination.user);
    await mutate<
      Pick<Mutation, "updateBsffPackaging">,
      MutationUpdateBsffPackagingArgs
    >(UPDATE_BSFF_PACKAGING, {
      variables: {
        id: packagingId,
        input: {
          numero: "nouveau-numero"
        }
      }
    });

    const updatedPackaging = await prisma.bsffPackaging.findUniqueOrThrow({
      where: { id: packagingId }
    });
    expect(updatedPackaging.numero).toEqual("nouveau-numero");
    expect(updatedPackaging.emissionNumero).toEqual(bsff.packagings[0].numero);
  });

  test("before acceptation > it should throw error when trying to set an empty or null numero", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const transporter = await userWithCompanyFactory("MEMBER");
    const destination = await userWithCompanyFactory("MEMBER");
    const bsff = await createBsffAfterReception({
      emitter,
      transporter,
      destination
    });

    const packagingId = bsff.packagings[0].id;

    const { mutate } = makeClient(destination.user);
    const { errors: errors1 } = await mutate<
      Pick<Mutation, "updateBsffPackaging">,
      MutationUpdateBsffPackagingArgs
    >(UPDATE_BSFF_PACKAGING, {
      variables: {
        id: packagingId,
        input: {
          numero: ""
        }
      }
    });

    expect(errors1).toEqual([
      expect.objectContaining({
        message: "Le numéro de contenant ne peut pas être nul ou vide"
      })
    ]);

    const { errors: errors2 } = await mutate<
      Pick<Mutation, "updateBsffPackaging">,
      MutationUpdateBsffPackagingArgs
    >(UPDATE_BSFF_PACKAGING, {
      variables: {
        id: packagingId,
        input: {
          numero: null
        }
      }
    });

    expect(errors2).toEqual([
      expect.objectContaining({
        message: "Le numéro de contenant ne peut pas être nul ou vide"
      })
    ]);
  });

  test(
    "less than 60 days after refusal > " +
      " it should be possible to update acceptation status",
    async () => {
      const emitter = await userWithCompanyFactory("MEMBER");
      const transporter = await userWithCompanyFactory("MEMBER");
      const destination = await userWithCompanyFactory("MEMBER");
      const bsff = await createBsffAfterRefusal(
        {
          emitter,
          transporter,
          destination
        },
        { packagingData: { acceptationSignatureDate: new Date() } }
      );

      expect(bsff.status).toEqual("REFUSED");

      const packagingId = bsff.packagings[0].id;

      const { mutate } = makeClient(destination.user);
      const { errors } = await mutate<
        Pick<Mutation, "updateBsffPackaging">,
        MutationUpdateBsffPackagingArgs
      >(UPDATE_BSFF_PACKAGING, {
        variables: {
          id: packagingId,
          input: {
            numero: "nouveau-numero",
            acceptation: {
              date: new Date().toISOString() as any,
              weight: 2,
              status: "ACCEPTED",
              refusalReason: null
            }
          }
        }
      });
      expect(errors).toBeUndefined();

      const updatedPackaging = await prisma.bsffPackaging.findUniqueOrThrow({
        where: { id: packagingId },
        include: { bsff: true }
      });
      expect(updatedPackaging.acceptationStatus).toEqual("ACCEPTED");
      // status of bsff should be recalculated to ACCEPTED
      expect(updatedPackaging.bsff.status).toEqual("ACCEPTED");
    }
  );

  test.skip(
    "more than 60 days after refusal > " +
      " it should not be possible to update acceptation status",
    async () => {
      const emitter = await userWithCompanyFactory("MEMBER");
      const transporter = await userWithCompanyFactory("MEMBER");
      const destination = await userWithCompanyFactory("MEMBER");
      const bsff = await createBsffAfterRefusal(
        {
          emitter,
          transporter,
          destination
        },
        { packagingData: { acceptationSignatureDate: new Date(0) } }
      );

      expect(bsff.status).toEqual("REFUSED");

      const packagingId = bsff.packagings[0].id;

      const { mutate } = makeClient(destination.user);
      const { errors } = await mutate<
        Pick<Mutation, "updateBsffPackaging">,
        MutationUpdateBsffPackagingArgs
      >(UPDATE_BSFF_PACKAGING, {
        variables: {
          id: packagingId,
          input: {
            numero: "nouveau-numero",
            acceptation: {
              date: new Date().toISOString() as any,
              weight: 2,
              status: "ACCEPTED",
              refusalReason: null
            }
          }
        }
      });
      expect(errors).toEqual([
        expect.objectContaining({
          message:
            "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés :" +
            " Le champ acceptationRefusalReason a été verrouillé via signature et ne peut pas être modifié.," +
            " Le champ acceptationStatus a été verrouillé via signature et ne peut pas être modifié."
        })
      ]);
    }
  );

  test(
    "less than 60 days after operation >" +
      " it should be possible to update acceptation and operation fields",
    async () => {
      const emitter = await userWithCompanyFactory("MEMBER");
      const transporter = await userWithCompanyFactory("MEMBER");
      const destination = await userWithCompanyFactory("MEMBER");
      const nextDestination = await userWithCompanyFactory("MEMBER");
      const bsff = await createBsffAfterOperation(
        {
          emitter,
          transporter,
          destination
        },
        { packagingData: { operationSignatureDate: new Date() } }
      );

      expect(bsff.status).toEqual("PROCESSED");

      const packagingId = bsff.packagings[0].id;

      const { mutate } = makeClient(destination.user);
      const { errors } = await mutate<
        Pick<Mutation, "updateBsffPackaging">,
        MutationUpdateBsffPackagingArgs
      >(UPDATE_BSFF_PACKAGING, {
        variables: {
          id: packagingId,
          input: {
            numero: "nouveau-numero",
            acceptation: {
              date: "2022-11-04" as any,
              weight: 2,
              status: "ACCEPTED",
              wasteCode: "14 06 02*",
              wasteDescription: "HFC"
            },
            operation: {
              date: "2022-11-05" as any,
              code: "D13",
              mode: null,
              description: "Regroupement",
              nextDestination: {
                plannedOperationCode: "R2",
                cap: "CAP 2",
                company: {
                  siret: nextDestination.company.siret,
                  name: "Traiteur & Co",
                  address: "1 avenue des roses 67100 Strasbourg",
                  contact: "Thomas Largeron",
                  phone: "03 00 00 00 00",
                  mail: "thomas.largeron@traiteur.fr"
                }
              }
            }
          }
        }
      });
      expect(errors).toBeUndefined();

      const updatedPackaging = await prisma.bsffPackaging.findUniqueOrThrow({
        where: { id: packagingId },
        include: { bsff: true }
      });
      expect(updatedPackaging.operationCode).toEqual("D13");
      // status of bsff should be recalculated to INTERMEDIATELY_PROCESSED
      expect(updatedPackaging.bsff.status).toEqual("INTERMEDIATELY_PROCESSED");
    }
  );

  test(
    "less than 60 days after operation > " +
      "it should not be possible de update acceptation and operation fields " +
      "if the packaging is already grouped, forwarded or repackaged",
    async () => {
      const emitter = await userWithCompanyFactory("MEMBER");
      const transporter = await userWithCompanyFactory("MEMBER");
      const destination = await userWithCompanyFactory("MEMBER");
      const nextDestination = await userWithCompanyFactory("MEMBER");
      const nextBsff = await createBsffBeforeEmission({
        emitter: destination,
        destination: nextDestination
      });
      const bsff = await createBsffAfterOperation(
        {
          emitter,
          transporter,
          destination
        },
        {
          data: { status: "INTERMEDIATELY_PROCESSED" },
          packagingData: {
            operationCode: "D13",
            operationSignatureDate: new Date(),
            nextPackaging: { connect: { id: nextBsff.packagings[0].id } }
          }
        }
      );

      const packagingId = bsff.packagings[0].id;

      const { mutate } = makeClient(destination.user);
      const { errors } = await mutate<
        Pick<Mutation, "updateBsffPackaging">,
        MutationUpdateBsffPackagingArgs
      >(UPDATE_BSFF_PACKAGING, {
        variables: {
          id: packagingId,
          input: {
            numero: "nouveau-numero",
            acceptation: {
              date: "2022-11-04" as any,
              weight: 2,
              status: "ACCEPTED",
              wasteCode: "14 06 02*",
              wasteDescription: "HFC"
            },
            operation: {
              date: "2022-11-05" as any,
              code: "R1",
              mode: "VALORISATION_ENERGETIQUE",
              description: "Incinération"
            }
          }
        }
      });
      expect(errors).toEqual([
        expect.objectContaining({
          message:
            "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés :" +
            " Le champ numero a été verrouillé via signature et ne peut pas être modifié.," +
            " Le champ acceptationDate a été verrouillé via signature et ne peut pas être modifié.," +
            " Le champ acceptationWeight a été verrouillé via signature et ne peut pas être modifié.," +
            " Le champ acceptationWasteDescription a été verrouillé via signature et ne peut pas être modifié.," +
            " Le champ operationDate a été verrouillé via signature et ne peut pas être modifié.," +
            " Le champ operationMode a été verrouillé via signature et ne peut pas être modifié.," +
            " Le champ operationDescription a été verrouillé via signature et ne peut pas être modifié.," +
            " Le champ acceptationWasteCode a été verrouillé via signature et ne peut pas être modifié.," +
            " Le champ operationCode a été verrouillé via signature et ne peut pas être modifié."
        })
      ]);
    }
  );

  test.skip(
    "more than 60 days after operation >" +
      " it should not be possible to update acceptation and operation fields",
    async () => {
      const emitter = await userWithCompanyFactory("MEMBER");
      const transporter = await userWithCompanyFactory("MEMBER");
      const destination = await userWithCompanyFactory("MEMBER");
      const nextDestination = await userWithCompanyFactory("MEMBER");
      const bsff = await createBsffAfterOperation(
        {
          emitter,
          transporter,
          destination
        },
        { packagingData: { operationSignatureDate: new Date(0) } }
      );

      const packagingId = bsff.packagings[0].id;

      const { mutate } = makeClient(destination.user);
      const { errors } = await mutate<
        Pick<Mutation, "updateBsffPackaging">,
        MutationUpdateBsffPackagingArgs
      >(UPDATE_BSFF_PACKAGING, {
        variables: {
          id: packagingId,
          input: {
            numero: "nouveau-numero",
            acceptation: {
              date: "2022-11-04" as any,
              weight: 2,
              status: "ACCEPTED",
              wasteCode: "14 06 02*",
              wasteDescription: "HFC"
            },
            operation: {
              date: "2022-11-05" as any,
              code: "D13",
              description: "Regroupement",
              nextDestination: {
                plannedOperationCode: "R2",
                cap: "CAP 2",
                company: {
                  siret: nextDestination.company.siret,
                  name: "Traiteur & Co",
                  address: "1 avenue des roses 67100 Strasbourg",
                  contact: "Thomas Largeron",
                  phone: "03 00 00 00 00",
                  mail: "thomas.largeron@traiteur.fr"
                }
              }
            }
          }
        }
      });

      expect(errors).toEqual([
        expect.objectContaining({
          message:
            "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés :" +
            " Le champ numero a été verrouillé via signature et ne peut pas être modifié.," +
            " Le champ acceptationDate a été verrouillé via signature et ne peut pas être modifié.," +
            " Le champ acceptationWeight a été verrouillé via signature et ne peut pas être modifié.," +
            " Le champ acceptationWasteDescription a été verrouillé via signature et ne peut pas être modifié.," +
            " Le champ operationDate a été verrouillé via signature et ne peut pas être modifié.," +
            " Le champ operationDescription a été verrouillé via signature et ne peut pas être modifié.," +
            " Le champ operationNextDestinationCap a été verrouillé via signature et ne peut pas être modifié.," +
            " Le champ operationNextDestinationCompanyName a été verrouillé via signature et ne peut pas être modifié.," +
            " Le champ operationNextDestinationCompanySiret a été verrouillé via signature et ne peut pas être modifié.," +
            " Le champ operationNextDestinationCompanyAddress a été verrouillé via signature et ne peut pas être modifié.," +
            " Le champ operationNextDestinationCompanyContact a été verrouillé via signature et ne peut pas être modifié.," +
            " Le champ operationNextDestinationCompanyPhone a été verrouillé via signature et ne peut pas être modifié.," +
            " Le champ operationNextDestinationCompanyMail a été verrouillé via signature et ne peut pas être modifié.," +
            " Le champ acceptationWasteCode a été verrouillé via signature et ne peut pas être modifié.," +
            " Le champ operationCode a été verrouillé via signature et ne peut pas être modifié.," +
            " Le champ operationNextDestinationPlannedOperationCode a été verrouillé via signature et ne peut pas être modifié."
        })
      ]);
    }
  );
});
