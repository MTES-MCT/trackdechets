import {
  BsffPackagingType,
  BsffStatus,
  BsffType,
  UserRole
} from "@prisma/client";
import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  Mutation,
  MutationDeleteBsffArgs
} from "../../../../generated/graphql/types";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import {
  createBsff,
  createBsffAfterEmission,
  createBsffAfterOperation,
  createBsffAfterTransport
} from "../../../__tests__/factories";
import prisma from "../../../../prisma";
import getReadableId, { ReadableIdPrefix } from "../../../../forms/readableId";

const DELETE_BSFF = `
  mutation DeleteBsff($id: ID!) {
    deleteBsff(id: $id) {
      id
    }
  }
`;

describe("Mutation.deleteBsff", () => {
  afterEach(resetDatabase);

  it("should allow user to delete a bsff", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const { mutate } = makeClient(emitter.user);

    const bsff = await createBsff({ emitter });
    const { data } = await mutate<
      Pick<Mutation, "deleteBsff">,
      MutationDeleteBsffArgs
    >(DELETE_BSFF, {
      variables: {
        id: bsff.id
      }
    });

    expect(data.deleteBsff.id).toBeTruthy();
  });

  it("should disallow unauthenticated user from deleting a bsff", async () => {
    const { mutate } = makeClient();
    const { errors } = await mutate<
      Pick<Mutation, "deleteBsff">,
      MutationDeleteBsffArgs
    >(DELETE_BSFF, {
      variables: {
        id: "123"
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        extensions: {
          code: "UNAUTHENTICATED"
        }
      })
    ]);
  });

  it("should disallow user that is not a contributor on the bsff", async () => {
    const { user } = await userWithCompanyFactory(UserRole.ADMIN);
    const { mutate } = makeClient(user);

    const bsff = await createBsff();
    const { errors } = await mutate<
      Pick<Mutation, "deleteBsff">,
      MutationDeleteBsffArgs
    >(DELETE_BSFF, {
      variables: {
        id: bsff.id
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous ne pouvez pas supprimer ce BSFF"
      })
    ]);
  });

  it("should throw an error if the bsff being deleted doesn't exist", async () => {
    const { user } = await userWithCompanyFactory(UserRole.ADMIN);
    const { mutate } = makeClient(user);

    const { errors } = await mutate<
      Pick<Mutation, "deleteBsff">,
      MutationDeleteBsffArgs
    >(DELETE_BSFF, {
      variables: {
        id: "123"
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Le BSFF n°123 n'existe pas."
      })
    ]);
  });

  it("should throw an error if the bsff has already been deleted", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const { mutate } = makeClient(emitter.user);

    const bsff = await createBsff({ emitter }, { isDeleted: true });
    const { errors } = await mutate<
      Pick<Mutation, "deleteBsff">,
      MutationDeleteBsffArgs
    >(DELETE_BSFF, {
      variables: {
        id: bsff.id
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: `Le BSFF n°${bsff.id} n'existe pas.`
      })
    ]);
  });

  it("should disallow deleting a bsff with a signature", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
    const { mutate } = makeClient(destination.user);

    const bsff = await createBsffAfterEmission({
      emitter,
      transporter,
      destination
    });
    const { errors } = await mutate<
      Pick<Mutation, "deleteBsff">,
      MutationDeleteBsffArgs
    >(DELETE_BSFF, {
      variables: {
        id: bsff.id
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: `Il n'est pas possible de supprimer un bordereau qui a été signé par un des acteurs`
      })
    ]);
  });

  it("should allow emitter to delete a bsff with only his signature", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
    const { mutate } = makeClient(emitter.user);

    const bsff = await createBsffAfterEmission({
      emitter,
      transporter,
      destination
    });
    const { errors } = await mutate<
      Pick<Mutation, "deleteBsff">,
      MutationDeleteBsffArgs
    >(DELETE_BSFF, {
      variables: {
        id: bsff.id
      }
    });

    expect(errors).toBeUndefined();

    const deletedBsff = await prisma.bsff.findUniqueOrThrow({
      where: { id: bsff.id }
    });

    expect(deletedBsff.isDeleted).toBe(true);
  });

  it("should disallow emitter to delete a bsff with transporteur signature", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
    const { mutate } = makeClient(emitter.user);

    const bsff = await createBsffAfterTransport({
      emitter,
      transporter,
      destination
    });
    const { errors } = await mutate<
      Pick<Mutation, "deleteBsff">,
      MutationDeleteBsffArgs
    >(DELETE_BSFF, {
      variables: {
        id: bsff.id
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: `Il n'est pas possible de supprimer un bordereau qui a été signé par un des acteurs`
      })
    ]);
  });

  it("should unlink grouped packagings", async () => {
    const initialEmitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const ttr = await userWithCompanyFactory(UserRole.ADMIN);

    let initialBsff = await createBsffAfterOperation({
      emitter: initialEmitter,
      transporter,
      destination: ttr
    });

    const groupingBsff = await prisma.bsff.create({
      data: {
        id: getReadableId(ReadableIdPrefix.FF),
        isDraft: true,
        type: BsffType.GROUPEMENT,
        status: BsffStatus.INITIAL,
        emitterCompanySiret: ttr.company.siret,
        packagings: {
          create: initialBsff.packagings.map(p => ({
            type: p.type,
            numero: p.numero,
            emissionNumero: p.numero,
            volume: p.volume,
            weight: p.acceptationWeight!,
            previousPackagings: { connect: { id: p.id } }
          }))
        }
      },
      include: { packagings: true }
    });

    initialBsff = await prisma.bsff.findUniqueOrThrow({
      where: { id: initialBsff.id },
      include: { packagings: true }
    });

    for (const packaging of initialBsff.packagings) {
      expect(groupingBsff.packagings.map(p => p.id)).toContain(
        packaging.nextPackagingId
      );
    }

    expect(initialBsff.packagings.map(p => p.nextPackagingId)).toEqual(
      groupingBsff.packagings.map(p => p.id)
    );

    const { mutate } = makeClient(ttr.user);

    await mutate<Pick<Mutation, "deleteBsff">, MutationDeleteBsffArgs>(
      DELETE_BSFF,
      {
        variables: {
          id: groupingBsff.id
        }
      }
    );

    initialBsff = await prisma.bsff.findUniqueOrThrow({
      where: { id: initialBsff.id },
      include: { packagings: true }
    });

    for (const packaging of initialBsff.packagings) {
      expect(packaging.nextPackagingId).toBeNull();
    }
  });

  it("should unlink repackaged bsffs", async () => {
    const initialEmitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const ttr = await userWithCompanyFactory(UserRole.ADMIN);

    let initialBsff = await createBsffAfterOperation({
      emitter: initialEmitter,
      transporter,
      destination: ttr
    });

    const repackagingBsff = await prisma.bsff.create({
      data: {
        id: getReadableId(ReadableIdPrefix.FF),
        isDraft: true,
        type: BsffType.RECONDITIONNEMENT,
        status: BsffStatus.INITIAL,
        emitterCompanySiret: ttr.company.siret,
        packagings: {
          create: {
            type: BsffPackagingType.BOUTEILLE,
            numero: "cont1",
            emissionNumero: "cont1",
            weight: 1,
            volume: 1,
            previousPackagings: {
              connect: initialBsff.packagings.map(p => ({ id: p.id }))
            }
          }
        }
      },
      include: { packagings: true }
    });

    initialBsff = await prisma.bsff.findUniqueOrThrow({
      where: { id: initialBsff.id },
      include: { packagings: true }
    });

    for (const packaging of initialBsff.packagings) {
      expect(repackagingBsff.packagings.map(p => p.id)).toContain(
        packaging.nextPackagingId
      );
    }

    expect(initialBsff.packagings.map(p => p.nextPackagingId)).toEqual(
      repackagingBsff.packagings.map(p => p.id)
    );

    const { mutate } = makeClient(ttr.user);

    await mutate<Pick<Mutation, "deleteBsff">, MutationDeleteBsffArgs>(
      DELETE_BSFF,
      {
        variables: {
          id: repackagingBsff.id
        }
      }
    );

    initialBsff = await prisma.bsff.findUniqueOrThrow({
      where: { id: initialBsff.id },
      include: { packagings: true }
    });

    for (const packaging of initialBsff.packagings) {
      expect(packaging.nextPackagingId).toBeNull();
    }
  });

  it("should unlink forwarded bsff", async () => {
    const initialEmitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const ttr = await userWithCompanyFactory(UserRole.ADMIN);

    let initialBsff = await createBsffAfterOperation({
      emitter: initialEmitter,
      transporter,
      destination: ttr
    });

    const forwardingBsff = await prisma.bsff.create({
      data: {
        id: getReadableId(ReadableIdPrefix.FF),
        isDraft: true,
        type: BsffType.REEXPEDITION,
        status: BsffStatus.INITIAL,
        emitterCompanySiret: ttr.company.siret,
        packagings: {
          create: {
            type: initialBsff.packagings[0].type,
            numero: initialBsff.packagings[0].numero,
            emissionNumero: initialBsff.packagings[0].numero,
            weight: initialBsff.packagings[0].acceptationWeight!,
            volume: initialBsff.packagings[0].volume,
            previousPackagings: {
              connect: { id: initialBsff.packagings[0].id }
            }
          }
        }
      },
      include: { packagings: true }
    });

    initialBsff = await prisma.bsff.findUniqueOrThrow({
      where: { id: initialBsff.id },
      include: { packagings: true }
    });

    for (const packaging of initialBsff.packagings) {
      expect(forwardingBsff.packagings.map(p => p.id)).toContain(
        packaging.nextPackagingId
      );
    }

    expect(initialBsff.packagings.map(p => p.nextPackagingId)).toEqual(
      forwardingBsff.packagings.map(p => p.id)
    );

    const { mutate } = makeClient(ttr.user);

    await mutate<Pick<Mutation, "deleteBsff">, MutationDeleteBsffArgs>(
      DELETE_BSFF,
      {
        variables: {
          id: forwardingBsff.id
        }
      }
    );

    initialBsff = await prisma.bsff.findUniqueOrThrow({
      where: { id: initialBsff.id },
      include: { packagings: true }
    });

    for (const packaging of initialBsff.packagings) {
      expect(packaging.nextPackagingId).toBeNull();
    }
  });
});
