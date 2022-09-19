import { WasteAcceptationStatus } from "@prisma/client";
import { gql } from "apollo-server-core";
import {
  Mutation,
  MutationUpdateBsffPackagingArgs
} from "../../../../generated/graphql/types";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { createBsffAfterReception } from "../../../__tests__/factories";
import prisma from "../../../../prisma";
import { resetDatabase } from "../../../../../integration-tests/helper";

const UPDATE_BSFF_PACKAGING = gql`
  mutation UpdateBsffPackaging($id: ID!, $input: UpdateBsffPackagingInput!) {
    updateBsffPackaging(id: $id, input: $input) {
      id
    }
  }
`;

describe("Mutation.updateBsffPackaging", () => {
  afterEach(resetDatabase);

  it("should update a bsff packaging", async () => {
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
            date: new Date().toISOString(),
            status: WasteAcceptationStatus.ACCEPTED,
            weight: 1
          }
        }
      }
    });

    const updatedPackaging = await prisma.bsffPackaging.findUnique({
      where: { id: packagingId }
    });
    expect(updatedPackaging.acceptationStatus).toEqual(
      WasteAcceptationStatus.ACCEPTED
    );
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
            date: new Date().toISOString(),
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
});
