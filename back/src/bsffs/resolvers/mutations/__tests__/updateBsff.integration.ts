import {
  UserRole,
  BsffType,
  BsffStatus,
  BsffPackagingType,
  Prisma
} from "@td/prisma";
import { gql } from "graphql-tag";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { BSFF_WASTE_CODES } from "@td/constants";
import type {
  BsffInput,
  BsffOperationCode,
  Mutation,
  MutationUpdateBsffArgs,
  QueryBsffArgs,
  Query,
  MutationUpdateBsffPackagingArgs
} from "@td/codegen-back";
import { prisma } from "@td/prisma";
import {
  companyFactory,
  siretify,
  userWithCompanyFactory,
  transporterReceiptFactory
} from "../../../../__tests__/factories";
import { associateUserToCompany } from "../../../../users/database";
import makeClient from "../../../../__tests__/testClient";
import { OPERATION } from "../../../constants";
import { fullBsff } from "../../../fragments";
import { getReadonlyBsffPackagingRepository } from "../../../repository";
import {
  createBsff,
  createBsffAfterEmission,
  createBsffAfterOperation,
  createBsffAfterTransport,
  createBsffBeforeEmission,
  createBsffAfterReception,
  createFicheIntervention,
  createBsffAfterAcceptation,
  createBsffBeforeReception,
  addBsffTransporter,
  createBsffPackaging
} from "../../../__tests__/factories";
import {
  getFirstTransporter,
  getFirstTransporterSync,
  getTransportersSync
} from "../../../database";
import { UPDATE_BSFF_PACKAGING } from "./updateBsffPackaging.integration";

export const UPDATE_BSFF = gql`
  mutation UpdateBsff($id: ID!, $input: BsffInput!) {
    updateBsff(id: $id, input: $input) {
      ...FullBsff
    }
  }
  ${fullBsff}
`;

const BSFF = gql`
  query Bsff($id: ID!) {
    bsff(id: $id) {
      ...FullBsff
    }
  }
  ${fullBsff}
`;

describe("Mutation.updateBsff", () => {
  afterEach(resetDatabase);

  it("should allow user to update a bsff", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await createBsff(
      { emitter },
      { data: { isDraft: true }, userId: emitter.user.id }
    );

    const { mutate } = makeClient(emitter.user);
    const { data, errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          emitter: {
            company: {
              name: "New Name"
            }
          }
        }
      }
    });

    expect(errors).toBeUndefined();
    expect(data.updateBsff.id).toBeTruthy();
  });

  it("should update allowed companies on a draft bsff", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const anotherCompany = await companyFactory();
    await associateUserToCompany(
      emitter.user.id,
      anotherCompany.orgId,
      UserRole.ADMIN,
      { notificationIsActiveMembershipRequest: false }
    );
    const bsff = await createBsff(
      { emitter },
      { data: { isDraft: true }, userId: emitter.user.id }
    );

    expect(bsff.canAccessDraftOrgIds).toEqual([emitter.company.siret]);
    const { mutate } = makeClient(emitter.user);
    const { data, errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          destination: { company: { siret: anotherCompany.siret } }
        }
      }
    });

    expect(errors).toBeUndefined();
    expect(data.updateBsff.id).toBeTruthy();

    const updatedBsff = await prisma.bsff.findUniqueOrThrow({
      where: { id: bsff.id }
    });

    expect(updatedBsff.canAccessDraftOrgIds.sort()).toEqual(
      [emitter.company.siret, anotherCompany.siret].sort()
    );
  });

  it("should update a bsff transporter recepisse with data pulled from db", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await createBsff(
      { emitter, transporter: emitter },
      { data: { isDraft: true }, userId: emitter.user.id }
    );

    const transporter = await companyFactory({
      companyTypes: ["TRANSPORTER"]
    });
    const receipt = await transporterReceiptFactory({
      company: transporter
    });
    const { mutate } = makeClient(emitter.user);
    const { data } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          transporter: {
            company: {
              siret: transporter.siret
            }
          }
        }
      }
    });

    // recepisse is pulled from db
    expect(data.updateBsff.transporter!.recepisse!.number).toEqual(
      receipt.receiptNumber
    );
    expect(data.updateBsff.transporter!.recepisse!.department).toEqual(
      receipt.department
    );
    expect(data.updateBsff.transporter!.recepisse!.validityLimit).toEqual(
      receipt.validityLimit.toISOString()
    );
  });

  it("should empty a bsff transporter recepisse if transporter has no receipt data", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await createBsff(
      { emitter, transporter: emitter },
      {
        data: { isDraft: true },
        userId: emitter.user.id,
        transporterData: {
          transporterRecepisseNumber: "abc",
          transporterRecepisseDepartment: "13",
          transporterRecepisseValidityLimit: new Date()
        }
      }
    );

    const transporter = await companyFactory({
      companyTypes: ["TRANSPORTER"]
    });
    const { mutate } = makeClient(emitter.user);
    const { data } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          transporter: {
            company: {
              siret: transporter.siret
            }
          }
        }
      }
    });

    // recepisse is pulled from db
    expect(data.updateBsff.transporter!.recepisse).toEqual({
      department: null,
      isExempted: false,
      number: null,
      validityLimit: null
    });
  });

  it("should empty a bsff transporter recepisse if transporter siret has changed", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await createBsff(
      { emitter, transporter: emitter },
      {
        data: { isDraft: true },
        userId: emitter.user.id,
        transporterData: {
          transporterRecepisseNumber: "abc",
          transporterRecepisseDepartment: "13",
          transporterRecepisseValidityLimit: new Date()
        }
      }
    );

    const transporter = await companyFactory({
      companyTypes: ["TRANSPORTER"]
    });
    const { mutate } = makeClient(emitter.user);
    const { data } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          transporter: {
            company: {
              siret: transporter.siret
            }
          }
        }
      }
    });

    // recepisse is empty
    expect(data.updateBsff.transporter!.recepisse).toEqual({
      department: null,
      isExempted: false,
      number: null,
      validityLimit: null
    });
  });

  it("should empty a bsff transporter recepisse if transporter has isExempted", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await createBsff(
      { emitter, transporter: emitter },
      {
        data: { isDraft: true },
        userId: emitter.user.id,
        transporterData: {
          transporterRecepisseIsExempted: true
        }
      }
    );

    const transporter = await companyFactory({
      companyTypes: ["TRANSPORTER"]
    });
    const { mutate } = makeClient(emitter.user);
    const { data } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          transporter: {
            company: {
              siret: transporter.siret
            }
          }
        }
      }
    });

    // recepisse is empty
    expect(data.updateBsff.transporter!.recepisse?.isExempted).toEqual(true);
    expect(data.updateBsff.transporter!.recepisse?.number).toBeNull();
    expect(data.updateBsff.transporter!.recepisse?.validityLimit).toBeNull();
    expect(data.updateBsff.transporter!.recepisse?.department).toBeNull();
  });

  it("should allow user to update a bsff packagings", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await createBsff(
      { emitter },
      {
        data: { isDraft: true },
        userId: emitter.user.id,
        packagingData: {
          type: BsffPackagingType.BOUTEILLE,
          weight: 1,
          numero: "1",
          emissionNumero: "1"
        }
      }
    );

    let packagings = await prisma.bsff
      .findUniqueOrThrow({ where: { id: bsff.id } })
      .packagings();

    expect(packagings.length).toEqual(1);

    const { mutate } = makeClient(emitter.user);
    const { data } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          packagings: [
            {
              type: BsffPackagingType.BOUTEILLE,
              weight: 1,
              numero: "2",
              volume: 1
            },
            {
              type: BsffPackagingType.BOUTEILLE,
              weight: 1,
              numero: "3",
              volume: 1
            }
          ]
        }
      }
    });

    packagings = await prisma.bsff
      .findUniqueOrThrow({ where: { id: bsff.id } })
      .packagings();

    expect(packagings.length).toEqual(2); // previous packagings should be deleted
    expect(packagings[0].numero).toEqual("2");
    expect(packagings[1].numero).toEqual("3");
    expect(data.updateBsff.packagings).toEqual([
      expect.objectContaining({ name: "BOUTEILLE", weight: 1, numero: "2" }),
      expect.objectContaining({ name: "BOUTEILLE", weight: 1, numero: "3" })
    ]);
  });

  it("should allow emitter to update packagings after his own signature", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);

    const bsff = await createBsffAfterEmission(
      { emitter, destination },
      {
        packagingData: {
          type: BsffPackagingType.BOUTEILLE,
          weight: 1,
          numero: "1",
          emissionNumero: "1"
        }
      }
    );

    let packagings = await prisma.bsff
      .findUniqueOrThrow({ where: { id: bsff.id } })
      .packagings();

    expect(packagings.length).toEqual(1);

    const { mutate } = makeClient(emitter.user);
    const { data, errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          packagings: [
            {
              type: BsffPackagingType.BOUTEILLE,
              weight: 1,
              numero: "2",
              volume: 1
            },
            {
              type: BsffPackagingType.BOUTEILLE,
              weight: 1,
              numero: "3",
              volume: 1
            }
          ]
        }
      }
    });

    expect(errors).toBeUndefined();

    packagings = await prisma.bsff
      .findUniqueOrThrow({ where: { id: bsff.id } })
      .packagings();

    expect(packagings.length).toEqual(2); // previous packagings should be deleted
    expect(packagings[0].numero).toEqual("2");
    expect(packagings[1].numero).toEqual("3");
    expect(data.updateBsff.packagings).toEqual([
      expect.objectContaining({ name: "BOUTEILLE", weight: 1, numero: "2" }),
      expect.objectContaining({ name: "BOUTEILLE", weight: 1, numero: "3" })
    ]);
  });

  it("should not allow destination tu update packagings after emission signature", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);

    const bsff = await createBsffAfterEmission(
      { emitter, destination },
      {
        packagingData: {
          type: BsffPackagingType.BOUTEILLE,
          weight: 1,
          numero: "1",
          emissionNumero: "1"
        }
      }
    );

    const packagings = await prisma.bsff
      .findUniqueOrThrow({ where: { id: bsff.id } })
      .packagings();

    expect(packagings.length).toEqual(1);

    const { mutate } = makeClient(destination.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          packagings: [
            {
              type: BsffPackagingType.BOUTEILLE,
              weight: 1,
              numero: "2",
              volume: 1
            },
            {
              type: BsffPackagingType.BOUTEILLE,
              weight: 1,
              numero: "3",
              volume: 1
            }
          ]
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés :" +
          " La liste des contenants a été verrouillé via signature et ne peut pas être modifié."
      })
    ]);
  });

  it("should allow destination to resend same packagings data after emitter signature", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);

    const bsff = await createBsffAfterEmission(
      { emitter, destination },
      {
        packagingData: {
          type: BsffPackagingType.BOUTEILLE,
          weight: 1,
          numero: "1",
          emissionNumero: "1",
          volume: 1
        }
      }
    );

    const packagings = await prisma.bsff
      .findUniqueOrThrow({ where: { id: bsff.id } })
      .packagings();

    expect(packagings.length).toEqual(1);

    const { mutate } = makeClient(destination.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          packagings: [
            {
              type: BsffPackagingType.BOUTEILLE,
              weight: 1,
              volume: 1,
              numero: "1"
            }
          ]
        }
      }
    });
    expect(errors).toBeUndefined();
  });

  it("[tra-13669] should not erase packaging signature when resending same packagings data after acceptation", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN, {
      transporterReceipt: {
        create: {
          receiptNumber: "rec",
          department: "07",
          validityLimit: new Date()
        }
      }
    });

    const bsff = await createBsffAfterAcceptation({
      emitter,
      destination,
      transporter
    });

    const packagings = await prisma.bsff
      .findUniqueOrThrow({ where: { id: bsff.id } })
      .packagings();

    expect(packagings.length).toEqual(1);

    const packaging = packagings[0];

    expect(packaging.acceptationSignatureDate).not.toBeNull();

    const { mutate } = makeClient(destination.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          packagings: [
            {
              type: packaging.type,
              other: packaging.other,
              weight: packaging.weight,
              volume: packaging.volume,
              numero: packaging.numero
            }
          ]
        }
      }
    });
    expect(errors).toBeUndefined();

    const updatedPackaging = await prisma.bsffPackaging.findUniqueOrThrow({
      where: { id: packaging.id }
    });

    expect(updatedPackaging.acceptationSignatureDate).not.toBeNull();
  });

  it("should update fiche d'interventions", async () => {
    const operateur = await userWithCompanyFactory(UserRole.ADMIN);
    const detenteur1 = await userWithCompanyFactory(UserRole.ADMIN);
    const detenteur2 = await userWithCompanyFactory(UserRole.ADMIN);

    const ficheIntervention1 = await createFicheIntervention({
      operateur,
      detenteur: detenteur1
    });
    const ficheIntervention2 = await createFicheIntervention({
      operateur,
      detenteur: detenteur2
    });
    const bsff = await createBsff(
      { emitter: operateur },
      {
        data: {
          type: "COLLECTE_PETITES_QUANTITES",
          ficheInterventions: { connect: { id: ficheIntervention1.id } },
          isDraft: true
        },
        userId: operateur.user.id
      }
    );

    const { mutate } = makeClient(operateur.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          ficheInterventions: [ficheIntervention2.id]
        }
      }
    });

    expect(errors).toBeUndefined();

    const updatedBsff = await prisma.bsff.findUniqueOrThrow({
      where: { id: bsff.id },
      include: { ficheInterventions: true }
    });

    expect(updatedBsff.ficheInterventions.map(fi => fi.id)).toEqual([
      ficheIntervention2.id
    ]);
    expect(updatedBsff.detenteurCompanySirets).toEqual([
      detenteur2.company.siret
    ]);
  });

  it("should allow emitter to update fiche d'interventions after his own signatures", async () => {
    const operateur = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
    const detenteur1 = await userWithCompanyFactory(UserRole.ADMIN);
    const detenteur2 = await userWithCompanyFactory(UserRole.ADMIN);

    const ficheIntervention1 = await createFicheIntervention({
      operateur,
      detenteur: detenteur1
    });
    const ficheIntervention2 = await createFicheIntervention({
      operateur,
      detenteur: detenteur2
    });
    const bsff = await createBsffAfterEmission(
      { emitter: operateur, destination },
      {
        data: {
          type: "COLLECTE_PETITES_QUANTITES",
          ficheInterventions: { connect: { id: ficheIntervention1.id } }
        }
      }
    );

    const { mutate } = makeClient(operateur.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          ficheInterventions: [ficheIntervention2.id]
        }
      }
    });

    expect(errors).toBeUndefined();

    const updatedBsff = await prisma.bsff.findUniqueOrThrow({
      where: { id: bsff.id },
      include: { ficheInterventions: true }
    });

    expect(updatedBsff.ficheInterventions.map(fi => fi.id)).toEqual([
      ficheIntervention2.id
    ]);
    expect(updatedBsff.detenteurCompanySirets).toEqual([
      detenteur2.company.siret
    ]);
  });

  it("should not allow destination to update fiche d'interventions after emitter signature", async () => {
    const operateur = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
    const detenteur1 = await userWithCompanyFactory(UserRole.ADMIN);
    const detenteur2 = await userWithCompanyFactory(UserRole.ADMIN);

    const ficheIntervention1 = await createFicheIntervention({
      operateur,
      detenteur: detenteur1
    });
    const ficheIntervention2 = await createFicheIntervention({
      operateur,
      detenteur: detenteur2
    });
    const bsff = await createBsffAfterEmission(
      { emitter: operateur, destination },
      {
        data: {
          type: "COLLECTE_PETITES_QUANTITES",
          ficheInterventions: { connect: { id: ficheIntervention1.id } }
        }
      }
    );

    const { mutate } = makeClient(destination.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          ficheInterventions: [ficheIntervention2.id]
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés" +
          " : La liste des fiches d'intervention a été verrouillé via signature et ne peut pas être modifié."
      })
    ]);
  });

  it("should allow destination to resend same fiche d'interventions data after emitter signature", async () => {
    const operateur = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
    const detenteur = await userWithCompanyFactory(UserRole.ADMIN);

    const ficheIntervention = await createFicheIntervention({
      operateur,
      detenteur
    });
    const bsff = await createBsffAfterEmission(
      { emitter: operateur, destination },
      {
        data: {
          type: "COLLECTE_PETITES_QUANTITES",
          ficheInterventions: { connect: { id: ficheIntervention.id } }
        }
      }
    );

    const { mutate } = makeClient(destination.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          ficheInterventions: [ficheIntervention.id]
        }
      }
    });

    expect(errors).toBeUndefined();
  });

  it("should disallow unauthenticated user from updating a bsff", async () => {
    const { mutate } = makeClient();
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: "123",
        input: {}
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        extensions: expect.objectContaining({
          code: "UNAUTHENTICATED"
        })
      })
    ]);
  });

  it("should disallow user that is not a contributor on the bsff", async () => {
    const { user } = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await createBsff({});

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {}
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Vous ne pouvez pas éditer un bordereau sur lequel le SIRET de votre entreprise n'apparaît pas."
      })
    ]);
  });

  it("should disallow user that is not the draft bsff creator", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);

    const bsff = await createBsff(
      { emitter, transporter, destination },
      { data: { isDraft: true }, userId: destination.user.id }
    );

    const { mutate } = makeClient(emitter.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {}
      }
    });
    // despite being the emitter, they re not allowed to update the bsff creatd by destination
    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Vous ne pouvez pas éditer un bordereau sur lequel le SIRET de votre entreprise n'apparaît pas."
      })
    ]);
  });

  it("should throw an error if the bsff being updated doesn't exist", async () => {
    const { user } = await userWithCompanyFactory(UserRole.ADMIN);

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: "123",
        input: {}
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Le BSFF n°123 n'existe pas."
      })
    ]);
  });

  it("should throw an error if the bsff being updated is deleted", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await createBsff({ emitter }, { data: { isDeleted: true } });

    const { mutate } = makeClient(emitter.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          emitter: {
            company: {
              name: emitter.company.name
            }
          }
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: `Le BSFF n°${bsff.id} n'existe pas.`
      })
    ]);
  });

  test("it should forbid invalid plates", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await createBsffAfterEmission({
      emitter,
      transporter,
      destination
    });
    const { mutate } = makeClient(emitter.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          transporter: {
            transport: {
              takenOverAt: "2022-11-02" as any,
              mode: "ROAD",
              plates: ["BG"]
            }
          }
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Le numéro d'immatriculation doit faire entre 4 et 12 caractères"
      })
    ]);
  });

  it("prevent user from removing their own company from the bsff", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await createBsff(
      { emitter },
      { data: { isDraft: true }, userId: emitter.user.id }
    );

    const { mutate } = makeClient(emitter.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          emitter: {
            company: {
              siret: siretify(2)
            }
          }
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Vous ne pouvez pas enlever votre propre établissement de ce BSFF"
      })
    ]);
  });

  test("before emitter signature > it should be possible to update any field", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await createBsffBeforeEmission({ emitter, destination });
    const { mutate } = makeClient(emitter.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          emitter: {
            company: {
              name: emitter.company.name,
              siret: emitter.company.siret,
              address: emitter.company.address,
              contact: emitter.user.name,
              mail: emitter.user.email,
              phone: emitter.company.contactPhone
            }
          },
          transporter: {
            company: {
              name: transporter.company.name,
              siret: transporter.company.siret,
              address: transporter.company.address,
              contact: transporter.user.name,
              mail: transporter.user.email,
              phone: transporter.company.contactPhone
            }
          },
          destination: {
            company: {
              name: destination.company.name,
              siret: destination.company.siret,
              address: destination.company.address,
              contact: destination.user.name,
              mail: destination.user.email,
              phone: destination.company.contactPhone
            },
            plannedOperationCode: "R12" as BsffOperationCode
          },
          waste: {
            code: BSFF_WASTE_CODES[0],
            adr: "Mention ADR",
            description: "R410"
          },
          weight: {
            value: 1,
            isEstimate: true
          },
          packagings: [
            {
              type: BsffPackagingType.BOUTEILLE,
              numero: "123",
              weight: 1,
              volume: 1
            }
          ]
        }
      }
    });
    expect(errors).toBeUndefined();
  });

  test("after emitter signature > it should not be possible to update sealed fields", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);

    const bsff = await createBsffAfterEmission({ emitter, destination });
    const { mutate } = makeClient(destination.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          emitter: {
            company: {
              name: "Émetteur 2",
              siret: emitter.company.siret,
              address: "Adresse 2",
              contact: "Contact 2",
              mail: "Email 2",
              phone: "0202020202"
            }
          },
          transporter: {
            company: {
              name: "Transporteur 2",
              siret: transporter.company.siret,
              address: "Adresse 2",
              contact: "Contact 2",
              mail: "Email 2",
              phone: "0202020202"
            }
          },
          destination: {
            company: {
              name: "Destination 2",
              siret: destination.company.siret,
              address: "Adresse 2",
              contact: "COntact 2",
              mail: "Email 2",
              phone: "0202020202"
            },
            plannedOperationCode: "D10" as BsffOperationCode
          },
          waste: {
            code: "14 06 03*",
            adr: "ADR",
            description: "HFC"
          },
          weight: {
            value: 2,
            isEstimate: false
          },
          packagings: [
            {
              type: BsffPackagingType.CITERNE,
              numero: "updated-numero",
              weight: 1,
              volume: 1
            }
          ]
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : " +
          "La raison sociale de l'émetteur a été verrouillé via signature et ne peut pas être modifié., " +
          "L'adresse de l'émetteur a été verrouillé via signature et ne peut pas être modifié., " +
          "La personne à contacter chez l'émetteur a été verrouillé via signature et ne peut pas être modifié., " +
          "Le N° de téléphone de l'émetteur a été verrouillé via signature et ne peut pas être modifié., " +
          "L'adresse e-mail de l'émetteur a été verrouillé via signature et ne peut pas être modifié., " +
          "L'ADR a été verrouillé via signature et ne peut pas être modifié., " +
          "La description du déchet a été verrouillé via signature et ne peut pas être modifié., " +
          "La raison sociale de l'installation de destination a été verrouillé via signature et ne peut pas être modifié., " +
          "L'adresse de l'installation de destination a été verrouillé via signature et ne peut pas être modifié., " +
          "La quantité totale a été verrouillé via signature et ne peut pas être modifié., " +
          "Le code déchet a été verrouillé via signature et ne peut pas être modifié., " +
          "La liste des contenants a été verrouillé via signature et ne peut pas être modifié."
      })
    ]);

    const updatedBsff = await prisma.bsff.findUniqueOrThrow({
      where: { id: bsff.id },
      include: { packagings: true }
    });

    // check packagings update has been ignored
    expect(updatedBsff.packagings[0].numero).toEqual("1234");
  });

  test("after emitter signature > it should be possible to update transport fields", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await createBsffAfterEmission({
      emitter,
      transporter,
      destination
    });
    const { mutate } = makeClient(transporter.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          transporter: {
            transport: {
              takenOverAt: "2022-11-02" as any,
              mode: "ROAD",
              plates: ["BG-007-FR"]
            }
          }
        }
      }
    });
    expect(errors).toBeUndefined();
  });

  test("after transporter signature > it should not be possible to update sealed fields", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await createBsffAfterTransport({
      emitter,
      transporter,
      destination
    });
    const { mutate } = makeClient(emitter.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          transporter: {
            transport: {
              takenOverAt: "2022-11-02" as any,
              mode: "ROAD",
              plates: ["BG-007-FR"]
            }
          }
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés :" +
          " L'immatriculation du transporteur n°1 a été verrouillé via signature et ne peut pas être modifié.," +
          " La date d'enlèvement n°1 a été verrouillé via signature et ne peut pas être modifié."
      })
    ]);
  });

  test("after transporter signature > it should be possible to resend same transporter data", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN, {
      transporterReceipt: {
        create: {
          receiptNumber: "receipt",
          department: "13",
          validityLimit: new Date()
        }
      }
    });
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await createBsffAfterTransport({
      emitter,
      transporter,
      destination
    });
    const bsffTransporter = getFirstTransporterSync(bsff)!;
    const { mutate } = makeClient(emitter.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          transporter: {
            transport: {
              mode: bsffTransporter.transporterTransportMode
            }
          }
        }
      }
    });
    expect(errors).toBeUndefined();
  });

  test("after transporter signature > it should be possible to update reception fields", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    await transporterReceiptFactory({ company: transporter.company });
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await createBsffAfterTransport({
      emitter,
      transporter,
      destination
    });
    const { mutate } = makeClient(transporter.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          destination: {
            reception: {
              date: "2022-11-03" as any
            }
          }
        }
      }
    });
    expect(errors).toBeUndefined();
  });

  test("after reception signature > it should not be possible to update sealed fields", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN, {
      transporterReceipt: {
        create: {
          receiptNumber: "recepisse",
          validityLimit: new Date(),
          department: "07"
        }
      }
    });
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await createBsffAfterReception({
      emitter,
      transporter,
      destination
    });

    const { mutate } = makeClient(emitter.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          destination: {
            reception: {
              date: "2022-11-03" as any
            }
          }
        }
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés" +
          " : La date de la réception a été verrouillé via signature et ne peut pas être modifié."
      })
    ]);
  });

  it("should update the list of grouped BSFFs", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);

    const oldGroupingBsffs = await Promise.all([
      createBsffAfterOperation(
        {
          emitter: await userWithCompanyFactory(UserRole.ADMIN),
          transporter: await userWithCompanyFactory(UserRole.ADMIN),
          destination: emitter
        },
        {
          data: {
            status: BsffStatus.INTERMEDIATELY_PROCESSED
          },
          packagingData: { operationCode: OPERATION.R12.code }
        }
      )
    ]);
    const newGroupingBsffs = await Promise.all([
      createBsffAfterOperation(
        {
          emitter: await userWithCompanyFactory(UserRole.ADMIN),
          transporter: await userWithCompanyFactory(UserRole.ADMIN),
          destination: emitter
        },
        {
          data: {
            status: BsffStatus.INTERMEDIATELY_PROCESSED
          },
          packagingData: { operationCode: OPERATION.R12.code }
        }
      )
    ]);

    const bsff = await createBsffBeforeEmission(
      {
        emitter,
        transporter: await userWithCompanyFactory(UserRole.ADMIN),
        destination: await userWithCompanyFactory(UserRole.ADMIN)
      },
      {
        data: {
          type: BsffType.GROUPEMENT
        },
        previousPackagings: oldGroupingBsffs.flatMap(bsff => bsff.packagings)
      }
    );

    const { mutate } = makeClient(emitter.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          grouping: newGroupingBsffs.flatMap(({ packagings }) =>
            packagings.map(p => p.id)
          )
        }
      }
    });

    expect(errors).toBeUndefined();

    const updatedBsff = await prisma.bsff.findUniqueOrThrow({
      where: { id: bsff.id },
      include: { packagings: true }
    });

    const previousPackagings =
      await getReadonlyBsffPackagingRepository().findPreviousPackagings(
        updatedBsff.packagings.map(p => p.id),
        1
      );

    for (const packaging of previousPackagings) {
      expect(
        newGroupingBsffs.flatMap(bsff => bsff.packagings.map(p => p.id))
      ).toContain(packaging.id);
    }
  });

  it("should allow emitter to update the list of grouped BSFFs after his own signature", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);

    const oldGroupingBsffs = await Promise.all([
      createBsffAfterOperation(
        {
          emitter: await userWithCompanyFactory(UserRole.ADMIN),
          transporter: await userWithCompanyFactory(UserRole.ADMIN),
          destination: emitter
        },
        {
          data: {
            status: BsffStatus.INTERMEDIATELY_PROCESSED
          },
          packagingData: { operationCode: OPERATION.R12.code }
        }
      )
    ]);
    const newGroupingBsffs = await Promise.all([
      createBsffAfterOperation(
        {
          emitter: await userWithCompanyFactory(UserRole.ADMIN),
          transporter: await userWithCompanyFactory(UserRole.ADMIN),
          destination: emitter
        },
        {
          data: { status: BsffStatus.INTERMEDIATELY_PROCESSED },
          packagingData: { operationCode: OPERATION.R12.code }
        }
      )
    ]);

    const bsff = await createBsffAfterEmission(
      {
        emitter,
        transporter: await userWithCompanyFactory(UserRole.ADMIN),
        destination: await userWithCompanyFactory(UserRole.ADMIN)
      },
      {
        data: {
          type: BsffType.GROUPEMENT
        },
        previousPackagings: oldGroupingBsffs.flatMap(bsff => bsff.packagings)
      }
    );

    const { mutate } = makeClient(emitter.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          grouping: newGroupingBsffs.flatMap(({ packagings }) =>
            packagings.map(p => p.id)
          )
        }
      }
    });

    expect(errors).toBeUndefined();

    const updatedBsff = await prisma.bsff.findUniqueOrThrow({
      where: { id: bsff.id },
      include: { packagings: true }
    });

    const previousPackagings =
      await getReadonlyBsffPackagingRepository().findPreviousPackagings(
        updatedBsff.packagings.map(p => p.id),
        1
      );

    for (const packaging of previousPackagings) {
      expect(
        newGroupingBsffs.flatMap(bsff => bsff.packagings.map(p => p.id))
      ).toContain(packaging.id);
    }
  });

  it("should not allow destination to update the list of grouped BSFFs after emitter's signature", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);

    const oldGroupingBsffs = await Promise.all([
      createBsffAfterOperation(
        {
          emitter: await userWithCompanyFactory(UserRole.ADMIN),
          transporter: await userWithCompanyFactory(UserRole.ADMIN),
          destination: emitter
        },
        {
          data: {
            status: BsffStatus.INTERMEDIATELY_PROCESSED
          },
          packagingData: { operationCode: OPERATION.R12.code }
        }
      )
    ]);
    const newGroupingBsffs = await Promise.all([
      createBsffAfterOperation(
        {
          emitter: await userWithCompanyFactory(UserRole.ADMIN),
          transporter: await userWithCompanyFactory(UserRole.ADMIN),
          destination: emitter
        },
        {
          data: { status: BsffStatus.INTERMEDIATELY_PROCESSED },
          packagingData: { operationCode: OPERATION.R12.code }
        }
      )
    ]);

    const bsff = await createBsffAfterEmission(
      {
        emitter,
        transporter: await userWithCompanyFactory(UserRole.ADMIN),
        destination
      },
      {
        data: { type: BsffType.GROUPEMENT },
        previousPackagings: oldGroupingBsffs.flatMap(bsff => bsff.packagings)
      }
    );

    const { mutate } = makeClient(destination.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          grouping: newGroupingBsffs.flatMap(({ packagings }) =>
            packagings.map(p => p.id)
          )
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés" +
          " : La liste des contenants à grouper a été verrouillé via signature et ne peut pas être modifié."
      })
    ]);
  });

  it("should allow destination to resend same grouped BSFFs data after emitter's signature", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);

    const groupedBsffs = await Promise.all([
      createBsffAfterOperation(
        {
          emitter: await userWithCompanyFactory(UserRole.ADMIN),
          transporter: await userWithCompanyFactory(UserRole.ADMIN),
          destination: emitter
        },
        {
          data: {
            status: BsffStatus.INTERMEDIATELY_PROCESSED
          },
          packagingData: { operationCode: OPERATION.R12.code }
        }
      )
    ]);

    const bsff = await createBsffAfterEmission(
      {
        emitter,
        transporter: await userWithCompanyFactory(UserRole.ADMIN),
        destination
      },
      {
        data: {
          type: BsffType.GROUPEMENT
        },
        previousPackagings: groupedBsffs.flatMap(bsff => bsff.packagings)
      }
    );

    const { mutate } = makeClient(destination.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          grouping: groupedBsffs.flatMap(({ packagings }) =>
            packagings.map(p => p.id)
          )
        }
      }
    });

    expect(errors).toBeUndefined();
  });

  it("should update the forwarded BSFF", async () => {
    const ttr = await userWithCompanyFactory(UserRole.ADMIN);
    const oldForwarded = await createBsffAfterOperation(
      {
        emitter: await userWithCompanyFactory(UserRole.ADMIN),
        transporter: await userWithCompanyFactory(UserRole.ADMIN),
        destination: ttr
      },
      {
        data: {
          status: BsffStatus.INTERMEDIATELY_PROCESSED
        },
        packagingData: { operationCode: OPERATION.R13.code }
      }
    );

    const bsff = await createBsffBeforeEmission(
      {
        emitter: ttr,
        transporter: await userWithCompanyFactory(UserRole.ADMIN),
        destination: await userWithCompanyFactory(UserRole.ADMIN)
      },
      {
        data: {
          type: BsffType.REEXPEDITION
        },
        previousPackagings: oldForwarded.packagings
      }
    );

    const newForwarded = await createBsffAfterOperation(
      {
        emitter: await userWithCompanyFactory(UserRole.ADMIN),
        transporter: await userWithCompanyFactory(UserRole.ADMIN),
        destination: ttr
      },
      {
        data: {
          status: BsffStatus.INTERMEDIATELY_PROCESSED
        },
        packagingData: {
          operationCode: OPERATION.R13.code
        }
      }
    );

    const { mutate } = makeClient(ttr.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          forwarding: newForwarded.packagings.map(p => p.id)
        }
      }
    });

    expect(errors).toBeUndefined();

    const updatedBsff = await prisma.bsff.findUniqueOrThrow({
      where: { id: bsff.id },
      include: { packagings: true }
    });

    const previousPackagings =
      await getReadonlyBsffPackagingRepository().findPreviousPackagings(
        updatedBsff.packagings.map(p => p.id),
        1
      );
    expect(previousPackagings).toHaveLength(1);

    expect(previousPackagings[0].id).toEqual(newForwarded.packagings[0].id);
  });

  it("should allow emitter to update the forwarded BSFF after his own signature", async () => {
    const ttr = await userWithCompanyFactory(UserRole.ADMIN);
    const oldForwarded = await createBsffAfterOperation(
      {
        emitter: await userWithCompanyFactory(UserRole.ADMIN),
        transporter: await userWithCompanyFactory(UserRole.ADMIN),
        destination: ttr
      },
      {
        data: {
          status: BsffStatus.INTERMEDIATELY_PROCESSED
        },
        packagingData: { operationCode: OPERATION.R13.code }
      }
    );

    const newForwarded = await createBsffAfterOperation(
      {
        emitter: await userWithCompanyFactory(UserRole.ADMIN),
        transporter: await userWithCompanyFactory(UserRole.ADMIN),
        destination: ttr
      },
      {
        data: {
          status: BsffStatus.INTERMEDIATELY_PROCESSED
        },
        packagingData: { operationCode: OPERATION.R13.code }
      }
    );

    const bsff = await createBsffAfterEmission(
      {
        emitter: ttr,
        transporter: await userWithCompanyFactory(UserRole.ADMIN),
        destination: await userWithCompanyFactory(UserRole.ADMIN)
      },
      {
        data: {
          type: BsffType.REEXPEDITION
        },
        previousPackagings: oldForwarded.packagings
      }
    );

    const { mutate } = makeClient(ttr.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          forwarding: newForwarded.packagings.map(p => p.id)
        }
      }
    });

    expect(errors).toBeUndefined();

    const updatedBsff = await prisma.bsff.findUniqueOrThrow({
      where: { id: bsff.id },
      include: { packagings: true }
    });

    const previousPackagings =
      await getReadonlyBsffPackagingRepository().findPreviousPackagings(
        updatedBsff.packagings.map(p => p.id),
        1
      );
    expect(previousPackagings).toHaveLength(1);

    expect(previousPackagings[0].id).toEqual(newForwarded.packagings[0].id);
  });

  it("should not allow destination to update the forwarded BSFF after emitter's signature", async () => {
    const ttr = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
    const oldForwarded = await createBsffAfterOperation(
      {
        emitter: await userWithCompanyFactory(UserRole.ADMIN),
        transporter: await userWithCompanyFactory(UserRole.ADMIN),
        destination: ttr
      },
      {
        data: {
          status: BsffStatus.INTERMEDIATELY_PROCESSED
        },
        packagingData: { operationCode: OPERATION.R13.code }
      }
    );

    const newForwarded = await createBsffAfterOperation(
      {
        emitter: await userWithCompanyFactory(UserRole.ADMIN),
        transporter: await userWithCompanyFactory(UserRole.ADMIN),
        destination: ttr
      },
      {
        data: { status: BsffStatus.INTERMEDIATELY_PROCESSED },
        packagingData: { operationCode: OPERATION.R13.code }
      }
    );

    const bsff = await createBsffAfterEmission(
      {
        emitter: ttr,
        transporter: await userWithCompanyFactory(UserRole.ADMIN),
        destination
      },
      {
        data: {
          type: BsffType.REEXPEDITION
        },
        previousPackagings: oldForwarded.packagings
      }
    );

    const { mutate } = makeClient(destination.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          forwarding: newForwarded.packagings.map(p => p.id)
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés" +
          " : La liste des contenants à réexpedier a été verrouillé via signature et ne peut pas être modifié."
      })
    ]);
  });

  it("should allow destination to resend same forwarded BSFF data after emitter's signature", async () => {
    const ttr = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
    const forwarded = await createBsffAfterOperation(
      {
        emitter: await userWithCompanyFactory(UserRole.ADMIN),
        transporter: await userWithCompanyFactory(UserRole.ADMIN),
        destination: ttr
      },
      {
        data: {
          status: BsffStatus.INTERMEDIATELY_PROCESSED
        },
        packagingData: { operationCode: OPERATION.R13.code }
      }
    );

    const bsff = await createBsffAfterEmission(
      {
        emitter: ttr,
        transporter: await userWithCompanyFactory(UserRole.ADMIN),
        destination
      },
      {
        data: {
          type: BsffType.REEXPEDITION
        },
        previousPackagings: forwarded.packagings
      }
    );

    const { mutate } = makeClient(destination.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          forwarding: forwarded.packagings.map(p => p.id)
        }
      }
    });

    expect(errors).toBeUndefined();
  });

  it("should update the list of repackaged BSFF", async () => {
    const ttr = await userWithCompanyFactory(UserRole.ADMIN);
    const oldRepackaged = await createBsffAfterOperation(
      {
        emitter: await userWithCompanyFactory(UserRole.ADMIN),
        transporter: await userWithCompanyFactory(UserRole.ADMIN),
        destination: ttr
      },
      {
        data: {
          status: BsffStatus.INTERMEDIATELY_PROCESSED
        },
        packagingData: { operationCode: OPERATION.D14.code }
      }
    );

    const bsff = await createBsffBeforeEmission(
      {
        emitter: ttr,
        transporter: await userWithCompanyFactory(UserRole.ADMIN),
        destination: await userWithCompanyFactory(UserRole.ADMIN)
      },
      {
        previousPackagings: oldRepackaged.packagings,
        data: {
          type: BsffType.RECONDITIONNEMENT
        },
        packagingData: {
          type: BsffPackagingType.BOUTEILLE,
          numero: "numero",
          emissionNumero: "numero",
          volume: 1,
          weight: 1,
          previousPackagings: {
            connect: oldRepackaged.packagings.map(p => ({ id: p.id }))
          }
        }
      }
    );

    const newRepackaged = await createBsffAfterOperation(
      {
        emitter: await userWithCompanyFactory(UserRole.ADMIN),
        transporter: await userWithCompanyFactory(UserRole.ADMIN),
        destination: ttr
      },
      {
        data: {
          status: BsffStatus.INTERMEDIATELY_PROCESSED
        },
        packagingData: {
          operationCode: OPERATION.D14.code
        }
      }
    );

    const { mutate } = makeClient(ttr.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          repackaging: [newRepackaged.packagings[0].id]
        }
      }
    });

    expect(errors).toBeUndefined();

    const previousPackagings =
      await getReadonlyBsffPackagingRepository().findPreviousPackagings(
        bsff.packagings.map(p => p.id),
        1
      );

    for (const previousPackaging of previousPackagings) {
      expect(newRepackaged.packagings.map(p => p.id)).toContain(
        previousPackaging.id
      );
    }
  });

  it("should allow emitter to update the list of repackaged BSFF after his own signature", async () => {
    const ttr = await userWithCompanyFactory(UserRole.ADMIN);
    const oldRepackaged = await createBsffAfterOperation(
      {
        emitter: await userWithCompanyFactory(UserRole.ADMIN),
        transporter: await userWithCompanyFactory(UserRole.ADMIN),
        destination: ttr
      },
      {
        data: {
          status: BsffStatus.INTERMEDIATELY_PROCESSED
        },
        packagingData: { operationCode: OPERATION.D14.code }
      }
    );

    const bsff = await createBsffAfterEmission(
      {
        emitter: ttr,
        transporter: await userWithCompanyFactory(UserRole.ADMIN),
        destination: await userWithCompanyFactory(UserRole.ADMIN)
      },
      {
        previousPackagings: oldRepackaged.packagings,
        data: {
          type: BsffType.RECONDITIONNEMENT
        },
        packagingData: {
          type: BsffPackagingType.BOUTEILLE,
          numero: "numero",
          emissionNumero: "numero",
          volume: 1,
          weight: 1,
          previousPackagings: {
            connect: oldRepackaged.packagings.map(p => ({ id: p.id }))
          }
        }
      }
    );

    const newRepackaged = await createBsffAfterOperation(
      {
        emitter: await userWithCompanyFactory(UserRole.ADMIN),
        transporter: await userWithCompanyFactory(UserRole.ADMIN),
        destination: ttr
      },
      {
        data: {
          status: BsffStatus.INTERMEDIATELY_PROCESSED
        },
        packagingData: {
          operationCode: OPERATION.D14.code
        }
      }
    );

    const { mutate } = makeClient(ttr.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          repackaging: [newRepackaged.packagings[0].id]
        }
      }
    });

    expect(errors).toBeUndefined();

    const previousPackagings =
      await getReadonlyBsffPackagingRepository().findPreviousPackagings(
        bsff.packagings.map(p => p.id),
        1
      );

    for (const previousPackaging of previousPackagings) {
      expect(newRepackaged.packagings.map(p => p.id)).toContain(
        previousPackaging.id
      );
    }
  });

  it("should not allow destination to update the list of repackaged BSFF after emitter's signature", async () => {
    const ttr = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
    const oldRepackaged = await createBsffAfterOperation(
      {
        emitter: await userWithCompanyFactory(UserRole.ADMIN),
        transporter: await userWithCompanyFactory(UserRole.ADMIN),
        destination: ttr
      },
      {
        data: {
          status: BsffStatus.INTERMEDIATELY_PROCESSED
        },
        packagingData: { operationCode: OPERATION.D14.code }
      }
    );

    const bsff = await createBsffAfterEmission(
      {
        emitter: ttr,
        transporter: await userWithCompanyFactory(UserRole.ADMIN),
        destination
      },
      {
        previousPackagings: oldRepackaged.packagings,
        data: {
          type: BsffType.RECONDITIONNEMENT
        },
        packagingData: {
          type: BsffPackagingType.BOUTEILLE,
          numero: "numero",
          emissionNumero: "numero",
          volume: 1,
          weight: 1,
          previousPackagings: {
            connect: oldRepackaged.packagings.map(p => ({ id: p.id }))
          }
        }
      }
    );

    const newRepackaged = await createBsffAfterOperation(
      {
        emitter: await userWithCompanyFactory(UserRole.ADMIN),
        transporter: await userWithCompanyFactory(UserRole.ADMIN),
        destination: ttr
      },
      {
        data: {
          status: BsffStatus.INTERMEDIATELY_PROCESSED
        },
        packagingData: { operationCode: OPERATION.D14.code }
      }
    );

    const { mutate } = makeClient(destination.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          repackaging: [newRepackaged.packagings[0].id]
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés :" +
          " La liste des contenants à regrouper a été verrouillé via signature et ne peut pas être modifié."
      })
    ]);
  });

  it("should allow destination to resend same repackaged BSFF data after emitter's signature", async () => {
    const ttr = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
    const repackaged = await createBsffAfterOperation(
      {
        emitter: await userWithCompanyFactory(UserRole.ADMIN),
        transporter: await userWithCompanyFactory(UserRole.ADMIN),
        destination: ttr
      },
      {
        data: {
          status: BsffStatus.INTERMEDIATELY_PROCESSED
        },
        packagingData: { operationCode: OPERATION.D14.code }
      }
    );

    const bsff = await createBsffAfterEmission(
      {
        emitter: ttr,
        transporter: await userWithCompanyFactory(UserRole.ADMIN),
        destination
      },
      {
        previousPackagings: repackaged.packagings,
        data: {
          type: BsffType.RECONDITIONNEMENT
        },
        packagingData: {
          type: BsffPackagingType.BOUTEILLE,
          numero: "numero",
          emissionNumero: "numero",
          volume: 1,
          weight: 1,
          previousPackagings: {
            connect: repackaged.packagings.map(p => ({ id: p.id }))
          }
        }
      }
    );

    const { mutate } = makeClient(destination.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          repackaging: [repackaged.packagings[0].id]
        }
      }
    });

    expect(errors).toBeUndefined();
  });

  it("should change the initial transporter", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const otherTransporter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await createBsffAfterEmission({
      emitter,
      transporter,
      destination
    });

    const { mutate } = makeClient(emitter.user);

    const input = {
      transporter: {
        company: {
          siret: otherTransporter.company.siret,
          name: otherTransporter.company.name
        }
      }
    };
    const { data, errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input
      }
    });

    expect(errors).toBeUndefined();
    expect(data.updateBsff.transporter!.company).toEqual(
      expect.objectContaining(input.transporter.company)
    );
  });

  it("should update a bsff with previous bsffs", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);

    const groupingBsffs = await Promise.all([
      createBsffAfterOperation(
        {
          emitter: await userWithCompanyFactory(UserRole.ADMIN),
          transporter: await userWithCompanyFactory(UserRole.ADMIN),
          destination: emitter
        },
        {
          data: {
            status: BsffStatus.INTERMEDIATELY_PROCESSED
          },
          userId: emitter.user.id,
          packagingData: { operationCode: OPERATION.R12.code }
        }
      )
    ]);
    const bsff = await createBsffBeforeEmission(
      {
        emitter,
        destination
      },
      {
        previousPackagings: groupingBsffs.flatMap(bsff => bsff.packagings),
        data: {
          type: BsffType.GROUPEMENT,
          isDraft: true
        },
        userId: emitter.user.id
      }
    );

    const { mutate } = makeClient(emitter.user);
    const { data, errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          emitter: {
            company: {
              name: "New Name"
            }
          }
        }
      }
    });

    expect(errors).toBeUndefined();
    expect(data.updateBsff.id).toBeTruthy();
  });

  it("should update a bsff with a forwarding BSFF", async () => {
    const ttr = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);

    const forwardedBsff = await createBsffAfterOperation(
      {
        emitter: await userWithCompanyFactory(UserRole.ADMIN),
        transporter: await userWithCompanyFactory(UserRole.ADMIN),
        destination: ttr
      },
      {
        data: {
          status: BsffStatus.INTERMEDIATELY_PROCESSED
        },
        packagingData: { operationCode: OPERATION.R13.code }
      }
    );
    const bsff = await createBsffBeforeEmission(
      { emitter: ttr, destination },

      {
        previousPackagings: forwardedBsff.packagings,
        data: {
          type: BsffType.REEXPEDITION,
          isDraft: true
        },
        userId: ttr.user.id
      }
    );

    const { mutate } = makeClient(ttr.user);
    const { data, errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          emitter: {
            company: {
              name: "New Name"
            }
          }
        }
      }
    });

    expect(errors).toBeUndefined();
    expect(data.updateBsff.id).toBeTruthy();
  });

  it("should update a BSFF of type RECONDITIONNEMENT", async () => {
    const ttr = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
    const repackagingBsff = await createBsffAfterOperation(
      {
        emitter: await userWithCompanyFactory(UserRole.ADMIN),
        transporter: await userWithCompanyFactory(UserRole.ADMIN),
        destination: ttr
      },
      {
        data: {
          status: BsffStatus.INTERMEDIATELY_PROCESSED
        },
        packagingData: { operationCode: OPERATION.D14.code }
      }
    );
    const bsff = await createBsffBeforeEmission(
      { emitter: ttr, destination },
      {
        data: {
          type: BsffType.RECONDITIONNEMENT,
          isDraft: true
        },
        userId: ttr.user.id,
        previousPackagings: repackagingBsff.packagings
      }
    );

    const { mutate } = makeClient(ttr.user);
    const { data, errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          destination: {
            cap: "nouveau cap"
          },
          packagings: [
            { numero: "citerne-1", type: "CITERNE", volume: 1, weight: 1 }
          ],
          repackaging: repackagingBsff.packagings.map(p => p.id)
        }
      }
    });

    expect(errors).toBeUndefined();
    expect(data.updateBsff.destination?.cap).toEqual("nouveau cap");
  });

  it("should be possible to update a bsff's fiches d'intervention", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
    const detenteur1 = await userWithCompanyFactory(UserRole.ADMIN);
    const detenteur2 = await userWithCompanyFactory(UserRole.ADMIN);

    const ficheInterventions = await Promise.all([
      createFicheIntervention({
        operateur: emitter,
        detenteur: detenteur1
      })
    ]);
    const bsff = await createBsffBeforeEmission(
      { emitter, destination },
      {
        data: {
          isDraft: true,
          type: "COLLECTE_PETITES_QUANTITES",
          detenteurCompanySirets: [detenteur1.company.siret!],
          ficheInterventions: {
            connect: ficheInterventions.map(({ id }) => ({ id }))
          }
        },
        userId: emitter.user.id
      }
    );

    const ficheIntervention = await createFicheIntervention({
      operateur: emitter,
      detenteur: detenteur2
    });

    const { mutate } = makeClient(emitter.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          ficheInterventions: [ficheIntervention.id]
        }
      }
    });

    expect(errors).toBeUndefined();
    const updatedBsff = await prisma.bsff.findUniqueOrThrow({
      where: { id: bsff.id },
      include: { ficheInterventions: true }
    });
    expect(updatedBsff.ficheInterventions).toEqual([
      expect.objectContaining({ id: ficheIntervention.id })
    ]);
    expect(updatedBsff.detenteurCompanySirets).toEqual([
      detenteur2.company.siret
    ]);
  });

  it("should not be possible to update BSFF type", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);

    const bsff = await createBsffBeforeEmission(
      { emitter, destination },
      {
        data: {
          type: BsffType.GROUPEMENT,
          isDraft: true
        },
        userId: emitter.user.id
      }
    );
    const { mutate } = makeClient(emitter.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          type: BsffType.COLLECTE_PETITES_QUANTITES
        }
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous ne pouvez pas modifier le type de BSFF après création"
      })
    ]);
  });

  it("should be possible to update transporters with the `transporters` field", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const destination = await userWithCompanyFactory("ADMIN");

    const transporter1 = await userWithCompanyFactory("MEMBER");
    const transporter2 = await userWithCompanyFactory("MEMBER");
    const transporter3 = await userWithCompanyFactory("MEMBER");
    const transporter4 = await userWithCompanyFactory("MEMBER");
    const transporter5 = await userWithCompanyFactory("MEMBER");

    const bsff = await createBsffBeforeEmission(
      {
        emitter,
        destination
      },
      { data: { transporters: undefined } }
    );

    const [
      bsffTransporter1,
      bsffTransporter2,
      bsffTransporter3,
      bsffTransporter4,
      bsffTransporter5
    ] = await Promise.all(
      [
        transporter1,
        transporter2,
        transporter3,
        transporter4,
        transporter5
      ].map((transporter, idx) => {
        return prisma.bsffTransporter.create({
          data: {
            number: idx + 1,
            transporterCompanySiret: transporter.company.siret
          }
        });
      })
    );

    // Initiate the bsff with two transporters
    await prisma.bsff.update({
      where: { id: bsff.id },
      data: {
        transporters: {
          deleteMany: {},
          connect: [{ id: bsffTransporter1.id }, { id: bsffTransporter2.id }]
        }
      }
    });

    const { mutate } = makeClient(emitter.user);

    // Update the bsff by removing the initial two transporters
    // and adding three others
    const input: BsffInput = {
      transporters: [
        bsffTransporter3.id,
        bsffTransporter4.id,
        bsffTransporter5.id
      ]
    };
    const { errors: errors1 } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: { id: bsff.id, input }
    });

    expect(errors1).toBeUndefined();

    const updatedBsff = await prisma.bsff.findUniqueOrThrow({
      where: { id: bsff.id },
      include: { transporters: true }
    });

    const transporters = getTransportersSync(updatedBsff);

    expect(transporters).toHaveLength(3);
    expect(transporters[0]).toMatchObject({
      id: bsffTransporter3.id,
      number: 1 // number should have been set correctly
    });
    expect(transporters[1]).toMatchObject({
      id: bsffTransporter4.id,
      number: 2 // number should have been set correctly
    });
    expect(transporters[2]).toMatchObject({
      id: bsffTransporter5.id,
      number: 3 // number should have been set correctly
    });

    const transporter6 = await userWithCompanyFactory("MEMBER");
    const bsffTransporter6 = await prisma.bsffTransporter.create({
      data: {
        number: 6,
        transporterCompanySiret: transporter6.company.siret
      }
    });

    // it should not be possible though to set more than 5 transporters
    const { errors: errors2 } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          transporters: [
            bsffTransporter1.id,
            bsffTransporter2.id,
            bsffTransporter3.id,
            bsffTransporter4.id,
            bsffTransporter5.id,
            bsffTransporter6.id
          ]
        }
      }
    });

    expect(errors2).toEqual([
      expect.objectContaining({
        message: "Vous ne pouvez pas ajouter plus de 5 transporteurs"
      })
    ]);
  });

  it("should be possible to swap the order of the different transporters", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const destination = await userWithCompanyFactory("ADMIN");

    const transporter1 = await userWithCompanyFactory("MEMBER");
    const transporter2 = await userWithCompanyFactory("MEMBER");

    const bsff = await createBsffBeforeEmission(
      { emitter, destination },
      { data: { transporters: undefined } }
    );

    const [bsffTransporter1, bsffTransporter2] = await Promise.all(
      [transporter1, transporter2].map((transporter, idx) => {
        return prisma.bsffTransporter.create({
          data: {
            number: idx + 1,
            transporterCompanySiret: transporter.company.siret
          }
        });
      })
    );

    // Initiate the bsff with two transporters in a given order
    await prisma.bsff.update({
      where: { id: bsff.id },
      data: {
        transporters: {
          deleteMany: {},
          connect: [{ id: bsffTransporter1.id }, { id: bsffTransporter2.id }]
        }
      }
    });

    const { mutate } = makeClient(emitter.user);

    // swap the order
    const input: BsffInput = {
      transporters: [bsffTransporter2.id, bsffTransporter1.id]
    };
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: { id: bsff.id, input }
    });

    expect(errors).toBeUndefined();

    const updatedBsff = await prisma.bsff.findUniqueOrThrow({
      where: { id: bsff.id },
      include: { transporters: true }
    });

    const transporters = getTransportersSync(updatedBsff);

    expect(transporters).toHaveLength(2);
    expect(transporters[0]).toMatchObject({
      id: bsffTransporter2.id,
      number: 1 // number should have been set correctly
    });
    expect(transporters[1]).toMatchObject({
      id: bsffTransporter1.id,
      number: 2 // number should have been set correctly
    });
  });

  it("should be possible to empty transporters list", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const destination = await userWithCompanyFactory("ADMIN");

    const transporter1 = await userWithCompanyFactory("MEMBER");
    const transporter2 = await userWithCompanyFactory("MEMBER");

    const bsff = await createBsffBeforeEmission(
      { emitter, destination },
      { data: { transporters: undefined } }
    );

    const [bsffTransporter1, bsffTransporter2] = await Promise.all(
      [transporter1, transporter2].map((transporter, idx) => {
        return prisma.bsffTransporter.create({
          data: {
            number: idx + 1,
            transporterCompanySiret: transporter.company.siret
          }
        });
      })
    );

    // Initiate the bsff with two transporters
    await prisma.bsff.update({
      where: { id: bsff.id },
      data: {
        transporters: {
          deleteMany: {},
          connect: [{ id: bsffTransporter1.id }, { id: bsffTransporter2.id }]
        }
      }
    });

    const { mutate } = makeClient(emitter.user);

    const input: BsffInput = {
      transporters: []
    };
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: { id: bsff.id, input }
    });

    expect(errors).toBeUndefined();

    const updatedBsff = await prisma.bsff.findUniqueOrThrow({
      where: { id: bsff.id },
      include: { transporters: true }
    });

    const transporters = getTransportersSync(updatedBsff);
    expect(transporters).toHaveLength(0);
  });

  it("should throw exception if transporters ID's don't exist", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const destination = await userWithCompanyFactory("ADMIN");

    const bsff = await createBsffBeforeEmission(
      { emitter, destination },
      { data: { transporters: undefined } }
    );
    const { mutate } = makeClient(emitter.user);

    const input: BsffInput = {
      transporters: ["ID1", "ID2"]
    };
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: { id: bsff.id, input }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Aucun transporteur ne possède le ou les identifiants suivants : ID1, ID2"
      })
    ]);
  });

  it("should update the first transporter and do not updates next transporters", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const destination = await userWithCompanyFactory("ADMIN");
    const transporter1 = await userWithCompanyFactory("MEMBER");
    const transporter2 = await userWithCompanyFactory("MEMBER");

    const bsff = await createBsffBeforeEmission(
      { emitter, destination },
      { data: { transporters: undefined } }
    );

    const [bsffTransporter1, bsffTransporter2] = await Promise.all(
      [transporter1, transporter2].map((transporter, idx) => {
        return prisma.bsffTransporter.create({
          data: {
            number: idx + 1,
            transporterCompanySiret: transporter.company.siret
          }
        });
      })
    );

    // Initiate the bsff with two transporters
    await prisma.bsff.update({
      where: { id: bsff.id },
      data: {
        transporters: {
          deleteMany: {},
          connect: [{ id: bsffTransporter1.id }, { id: bsffTransporter2.id }]
        }
      }
    });

    const { mutate } = makeClient(emitter.user);

    // update first transporter with deprecated field `transporter`
    const input: BsffInput = {
      transporter: { company: { contact: "Obiwan" } }
    };
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: { id: bsff.id, input }
    });

    expect(errors).toBeUndefined();

    const updatedBsff = await prisma.bsff.findUniqueOrThrow({
      where: { id: bsff.id },
      include: { transporters: true }
    });

    const transporters = getTransportersSync(updatedBsff);
    expect(transporters).toHaveLength(2);
    expect(transporters[0].id).toEqual(bsffTransporter1.id);
    expect(transporters[0].number).toEqual(1);
    expect(transporters[1].id).toEqual(bsffTransporter2.id);
    expect(transporters[1].number).toEqual(bsffTransporter2.number);
    expect(transporters[0].transporterCompanyContact).toEqual("Obiwan");
  });

  it("should delete first transporter and do not updates next transporters", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const destination = await userWithCompanyFactory("ADMIN");

    const transporter1 = await userWithCompanyFactory("MEMBER");
    const transporter2 = await userWithCompanyFactory("MEMBER");
    const transporter3 = await userWithCompanyFactory("MEMBER");

    const bsff = await createBsffBeforeEmission(
      { emitter, destination },
      { data: { transporters: undefined } }
    );

    const [bsffTransporter1, bsffTransporter2, bsffTransporter3] =
      await Promise.all(
        [transporter1, transporter2, transporter3].map((transporter, idx) => {
          return prisma.bsffTransporter.create({
            data: {
              number: idx + 1,
              transporterCompanySiret: transporter.company.siret
            }
          });
        })
      );

    // Initiate the bsff with two transporters
    await prisma.bsff.update({
      where: { id: bsff.id },
      data: {
        transporters: {
          deleteMany: {},
          connect: [
            { id: bsffTransporter1.id },
            { id: bsffTransporter2.id },
            { id: bsffTransporter3.id }
          ]
        }
      }
    });

    const { mutate } = makeClient(emitter.user);

    // set first transporter to `null` with deprecated field `transporter`
    const input: BsffInput = {
      transporter: null
    };
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: { id: bsff.id, input }
    });

    expect(errors).toBeUndefined();

    const updatedBsff = await prisma.bsff.findUniqueOrThrow({
      where: { id: bsff.id },
      include: { transporters: true }
    });

    const transporters = getTransportersSync(updatedBsff);
    expect(transporters).toHaveLength(2);

    // transporters ordering should have been decremented
    expect(transporters[0].id).toEqual(bsffTransporter2.id);
    expect(transporters[0].number).toEqual(1);
    expect(transporters[1].id).toEqual(bsffTransporter3.id);
    expect(transporters[1].number).toEqual(bsffTransporter2.number);
  });

  it("should not be possible to update `transporters` when the bsff has been received", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const destination = await userWithCompanyFactory("ADMIN");
    const transporter = await userWithCompanyFactory("MEMBER");
    const transporter2 = await userWithCompanyFactory("MEMBER");

    // Create a bsff that has already been processed
    const bsff = await createBsffAfterReception({
      emitter,
      destination,
      transporter
    });

    const bsffTransporter1 = await getFirstTransporter(bsff);

    const bsffTransporter2 = await prisma.bsffTransporter.create({
      data: {
        number: 0,
        transporterCompanySiret: transporter2.company.siret
      }
    });

    const { mutate } = makeClient(emitter.user);

    // Trying adding a new transporter
    const input: BsffInput = {
      transporters: [bsffTransporter1!.id, bsffTransporter2.id]
    };
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: { id: bsff.id, input }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés :" +
          " La liste des transporteurs a été verrouillé via signature et ne peut pas être modifié."
      })
    ]);
  });

  it("should not be possible to remove or permutate a transporter that has already signed when status is SENT", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const destination = await userWithCompanyFactory("ADMIN");

    const transporter1 = await userWithCompanyFactory("MEMBER");
    const transporter2 = await userWithCompanyFactory("MEMBER");

    // Create a bsff that has already been sent
    const bsff = await createBsffAfterTransport({
      emitter,
      destination,
      transporter: transporter1
    });

    const bsffTransporter1 = await getFirstTransporter(bsff);

    const bsffTransporter2 = await prisma.bsffTransporter.create({
      data: {
        number: 0,
        transporterCompanySiret: transporter2.company.siret
      }
    });

    const { mutate } = makeClient(emitter.user);

    // Trying permuting two transporters
    const input: BsffInput = {
      transporters: [bsffTransporter2.id, bsffTransporter1!.id]
    };
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: { id: bsff.id, input }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés :" +
          " Le transporteur n°1 a déjà signé le BSFF, il ne peut pas être supprimé ou modifié"
      })
    ]);
  });

  it("should be possible to remove or permute transporters that has not signed yet when status is SENT", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const destination = await userWithCompanyFactory("ADMIN");
    const recepisse = {
      create: {
        receiptNumber: "recepisse",
        validityLimit: new Date(),
        department: "07"
      }
    };
    const transporter1 = await userWithCompanyFactory("MEMBER", {
      transporterReceipt: recepisse
    });
    const transporter2 = await userWithCompanyFactory("MEMBER", {
      transporterReceipt: recepisse
    });
    const transporter3 = await userWithCompanyFactory("MEMBER", {
      transporterReceipt: recepisse
    });

    // Create a bsff that has already been signed by the first transporter
    const bsff = await createBsffAfterTransport({
      emitter,
      destination,
      transporter: transporter1
    });
    const bsffTransporter1 = await getFirstTransporter(bsff);

    // Transporter n°2 (not signed yet)
    const bsffTransporter2 = await addBsffTransporter({
      bsffId: bsff.id,
      transporter: transporter2
    });

    // Transporter n°3 (not signed yet)
    const bsffTransporter3 = await addBsffTransporter({
      bsffId: bsff.id,
      transporter: transporter3
    });

    // Permute transporter 2 and transporter 3
    const input: BsffInput = {
      transporters: [
        bsffTransporter1!.id,
        bsffTransporter3.id,
        bsffTransporter2.id
      ]
    };
    const { mutate } = makeClient(emitter.user);

    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: { id: bsff.id, input }
    });

    expect(errors).toBeUndefined();

    const updatedBsff = await prisma.bsff.findUniqueOrThrow({
      where: { id: bsff.id },
      include: { transporters: true }
    });

    const updatedTransporters = getTransportersSync(updatedBsff);

    expect(updatedTransporters).toHaveLength(3);
    expect(updatedTransporters[0].id).toEqual(bsffTransporter1!.id);
    expect(updatedTransporters[1].id).toEqual(bsffTransporter3.id);
    expect(updatedTransporters[2].id).toEqual(bsffTransporter2.id);
  });

  it("should not be possible to update `transporter` (first transporter) when the bsff has been sent", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const destination = await userWithCompanyFactory("ADMIN");
    const transporter = await userWithCompanyFactory("MEMBER");

    // Create a bsff that has already been sent
    const bsff = await createBsffAfterTransport({
      emitter,
      destination,
      transporter
    });

    const { mutate } = makeClient(emitter.user);

    // Try update first transporter
    const input: BsffInput = {
      transporter: { transport: { mode: "RAIL" } }
    };
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: { id: bsff.id, input }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés :" +
          " Le mode de transport n°1 a été verrouillé via signature et ne peut pas être modifié."
      })
    ]);
  });

  it("should be possible to add a new transporter while the bsff has not been received", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const destination = await userWithCompanyFactory("ADMIN");
    const recepisse = {
      create: {
        receiptNumber: "recepisse",
        validityLimit: new Date(),
        department: "07"
      }
    };
    const transporter1 = await userWithCompanyFactory("MEMBER", {
      transporterReceipt: recepisse
    });
    const transporter2 = await userWithCompanyFactory("MEMBER", {
      transporterReceipt: recepisse
    });

    // Create a bsff that has already been received
    const bsff = await createBsffAfterTransport({
      emitter,
      transporter: transporter1,
      destination
    });

    const bsffTransporter1 = await getFirstTransporter(bsff);

    const bsffTransporter2 = await prisma.bsffTransporter.create({
      data: {
        number: 0,
        transporterCompanySiret: transporter2.company.siret
      }
    });

    const { mutate } = makeClient(emitter.user);

    // Trying adding a new transporter after the first one
    const input: BsffInput = {
      transporters: [bsffTransporter1!.id, bsffTransporter2.id]
    };
    const { errors } = await mutate<Pick<Mutation, "updateBsff">>(UPDATE_BSFF, {
      variables: { id: bsff.id, input }
    });

    expect(errors).toBeUndefined();

    const updatedBsff = await prisma.bsff.findUniqueOrThrow({
      where: { id: bsff.id },
      include: { transporters: true }
    });

    const updatedTransporters = getTransportersSync(updatedBsff);

    expect(updatedTransporters).toHaveLength(2);
    expect(updatedTransporters[0].id).toEqual(bsffTransporter1!.id);
    expect(updatedTransporters[1].id).toEqual(bsffTransporter2.id);
  });

  it("should not be possible to remove a transporter that has already signed", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const destination = await userWithCompanyFactory("ADMIN");
    const transporter1 = await userWithCompanyFactory("MEMBER");
    const transporter2 = await userWithCompanyFactory("MEMBER");

    // Create a bsff that has already been signed by first transporter
    const bsff = await createBsffAfterTransport({
      emitter,
      transporter: transporter1,
      destination
    });

    const bsffTransporter2 = await prisma.bsffTransporter.create({
      data: {
        number: 0,
        transporterCompanySiret: transporter2.company.siret
      }
    });

    const { mutate } = makeClient(emitter.user);

    // Trying removing first transporter and set a different one
    const input: BsffInput = {
      transporters: [bsffTransporter2.id]
    };
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: { id: bsff.id, input }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés :" +
          " Le transporteur n°1 a déjà signé le BSFF, il ne peut pas être supprimé ou modifié"
      })
    ]);
  });

  it(
    "should be possible to resend same packagings data after emitter's signature" +
      "in the same order as it is received from the query bsff { packagings }",
    async () => {
      const emitter = await userWithCompanyFactory("ADMIN");
      const destination = await userWithCompanyFactory("ADMIN");

      const bsff = await createBsffAfterEmission({
        emitter,
        destination
      });

      const packagingsData: Prisma.BsffPackagingUncheckedCreateInput[] = [
        {
          bsffId: bsff.id,
          type: BsffPackagingType.BOUTEILLE,
          weight: 1,
          volume: 1,
          numero: "C",
          emissionNumero: "C"
        },
        {
          bsffId: bsff.id,
          type: BsffPackagingType.BOUTEILLE,
          weight: 1,
          volume: 1,
          numero: "B",
          emissionNumero: "B"
        },
        {
          bsffId: bsff.id,
          type: BsffPackagingType.BOUTEILLE,
          weight: 1,
          volume: 1,
          numero: "A",
          emissionNumero: "A"
        }
      ];

      for (const packagingData of packagingsData) {
        await prisma.bsffPackaging.create({ data: packagingData });
      }

      const { query, mutate } = makeClient(destination.user);

      const { data: bsffData } = await query<
        Pick<Query, "bsff">,
        QueryBsffArgs
      >(BSFF, {
        variables: { id: bsff.id }
      });

      const { errors } = await mutate<
        Pick<Mutation, "updateBsff">,
        MutationUpdateBsffArgs
      >(UPDATE_BSFF, {
        variables: {
          id: bsff.id,
          input: {
            packagings: bsffData.bsff.packagings.map(p => ({
              type: p.type,
              weight: p.weight,
              volume: p.volume,
              numero: p.numero,
              other: p.other
            }))
          }
        }
      });

      expect(errors).toBeUndefined();
    }
  );

  it("should correctly diff the BSFF packagings and allow reception", async () => {
    // Given
    const emitter = await userWithCompanyFactory("ADMIN");
    const transporter = await userWithCompanyFactory("ADMIN", {
      companyTypes: ["TRANSPORTER"]
    });
    await transporterReceiptFactory({ company: transporter.company });

    const destination = await userWithCompanyFactory("ADMIN");

    const bsff = await createBsffBeforeReception(
      {
        emitter,
        transporter,
        destination
      },
      {
        data: {
          packagings: {
            create: [
              createBsffPackaging({
                numero: "NUMERO1",
                emissionNumero: "EMISSION-NUMERO1"
              }),
              createBsffPackaging({
                numero: "NUMERO2",
                emissionNumero: "EMISSION-NUMERO2"
              }),
              createBsffPackaging({
                numero: "NUMERO3",
                emissionNumero: "EMISSION-NUMERO3"
              })
            ]
          }
        }
      }
    );

    // Let's update a packaging
    const { mutate } = makeClient(destination.user);
    const { errors: updatePackagingErrors } = await mutate<
      Pick<Mutation, "updateBsffPackaging">,
      MutationUpdateBsffPackagingArgs
    >(UPDATE_BSFF_PACKAGING, {
      variables: {
        id: bsff.packagings[2].id,
        input: {
          numero: "NUMERO3-UPDATED"
        }
      }
    });
    expect(updatePackagingErrors).toBeUndefined();

    // When
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          destination: {
            reception: {
              date: new Date().toISOString() as any
            }
          }
        }
      }
    });

    // Then
    expect(errors).toBeUndefined();
  });
});
