import { UserRole } from "@prisma/client";
import { gql } from "apollo-server-core";
import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  Mutation,
  MutationDuplicateBsffArgs
} from "../../../../generated/graphql/types";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import {
  createBsff,
  createFicheIntervention
} from "../../../__tests__/factories";
import prisma from "../../../../prisma";

const DUPLICATE_BSFF = gql`
  mutation DuplicateBsff($id: ID!) {
    duplicateBsff(id: $id) {
      id
      status
    }
  }
`;

describe("Mutation.duplicateBsff", () => {
  afterEach(resetDatabase);

  it("should allow user to duplicate a bsff", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const { mutate } = makeClient(emitter.user);

    const bsff = await createBsff({ emitter });
    const { data } = await mutate<
      Pick<Mutation, "duplicateBsff">,
      MutationDuplicateBsffArgs
    >(DUPLICATE_BSFF, {
      variables: {
        id: bsff.id
      }
    });

    expect(data.duplicateBsff.status).toEqual("INITIAL");
  });

  it("should disallow unauthenticated user from duplicating a bsff", async () => {
    const { mutate } = makeClient();
    const { errors } = await mutate<
      Pick<Mutation, "duplicateBsff">,
      MutationDuplicateBsffArgs
    >(DUPLICATE_BSFF, {
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
      Pick<Mutation, "duplicateBsff">,
      MutationDuplicateBsffArgs
    >(DUPLICATE_BSFF, {
      variables: {
        id: bsff.id
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Vous ne pouvez pas éditer un bordereau sur lequel le SIRET de votre entreprise n'apparaît pas."
      })
    ]);
  });

  it("should throw an error if the bsff being deleted doesn't exist", async () => {
    const { user } = await userWithCompanyFactory(UserRole.ADMIN);
    const { mutate } = makeClient(user);

    const { errors } = await mutate<
      Pick<Mutation, "duplicateBsff">,
      MutationDuplicateBsffArgs
    >(DUPLICATE_BSFF, {
      variables: {
        id: "123"
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Le bordereau de fluides frigorigènes n°123 n'existe pas."
      })
    ]);
  });

  it("should throw an error if the bsff has already been deleted", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const { mutate } = makeClient(emitter.user);

    const bsff = await createBsff({ emitter }, { isDeleted: true });
    const { errors } = await mutate<
      Pick<Mutation, "duplicateBsff">,
      MutationDuplicateBsffArgs
    >(DUPLICATE_BSFF, {
      variables: {
        id: bsff.id
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: `Le bordereau de fluides frigorigènes n°${bsff.id} n'existe pas.`
      })
    ]);
  });

  it("should not copy fiches d'interventions into duplicated BSFF", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const detenteur = await userWithCompanyFactory(UserRole.ADMIN);

    const ficheIntervention = await createFicheIntervention({
      operateur: emitter,
      detenteur
    });

    const bsff = await createBsff(
      { emitter },
      {
        ficheInterventions: {
          connect: {
            id: ficheIntervention.id
          }
        }
      }
    );

    const { mutate } = makeClient(emitter.user);

    const { data } = await mutate<
      Pick<Mutation, "duplicateBsff">,
      MutationDuplicateBsffArgs
    >(DUPLICATE_BSFF, {
      variables: {
        id: bsff.id
      }
    });

    const duplicata = await prisma.bsff.findUnique({
      where: { id: data.duplicateBsff.id },
      include: { ficheInterventions: true }
    });

    expect(duplicata.ficheInterventions).toHaveLength(0);
  });
});
