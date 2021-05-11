import { UserRole } from ".prisma/client";
import getReadableId, { ReadableIdPrefix } from "../../../../forms/readableId";
import {
  createBsffFicheInterventionInputMock,
  Mutation,
  MutationUpdateFicheInterventionBsffArgs
} from "../../../../generated/graphql/types";
import prisma from "../../../../prisma";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import {
  flattenFicheInterventionBsffInput,
  getFicheInterventionId
} from "../../../converter";

const UPDATE_FICHE_INTERVENTION = `
  mutation UpdateFicheIntervention($id: ID!, $numero: String!, $input: BsffFicheInterventionInput!) {
    updateFicheInterventionBsff(id: $id, numero: $numero, input: $input) {
      numero
    }
  }
`;

describe("Mutation.updateFicheInterventionBsff", () => {
  it("should allow user to update a fiche d'intervention", async () => {
    const { user, company } = await userWithCompanyFactory(UserRole.ADMIN);

    const bsffId = getReadableId(ReadableIdPrefix.FF);
    const ficheInterventionNumero = "ABCDEFGHIJK";
    const ficheInterventionId = getFicheInterventionId(
      bsffId,
      ficheInterventionNumero
    );
    await prisma.bsff.create({
      data: {
        id: bsffId,
        emitterCompanySiret: company.siret,
        ficheInterventions: {
          create: {
            id: ficheInterventionId,
            numero: ficheInterventionNumero,
            ...flattenFicheInterventionBsffInput(
              createBsffFicheInterventionInputMock({})
            )
          }
        }
      }
    });

    const { mutate } = makeClient(user);
    const { data } = await mutate<
      Pick<Mutation, "updateFicheInterventionBsff">,
      MutationUpdateFicheInterventionBsffArgs
    >(UPDATE_FICHE_INTERVENTION, {
      variables: {
        id: bsffId,
        numero: ficheInterventionNumero,
        input: createBsffFicheInterventionInputMock({})
      }
    });

    expect(data.updateFicheInterventionBsff.numero).toBeTruthy();
  });

  it.todo(
    "should disallow unauthenticated user to update a fiche d'intervention"
  );
  it.todo(
    "should disallow user to update a fiche d'intervention on a bsff they are not part of"
  );
  it.todo("should throw an error if the bsff doesn't exist");
  it.todo("should throw an error if the fiche d'intervention doesn't exist");
});
