import { gql } from "graphql-tag";
import { resetDatabase } from "../../../../integration-tests/helper";
import { Query } from "../../../generated/graphql/types";
import { prisma } from "@td/prisma";
import { userWithCompanyFactory } from "../../../__tests__/factories";
import makeClient from "../../../__tests__/testClient";
import { createBsff, createFicheIntervention } from "../../__tests__/factories";

const GET_BSFF = gql`
  query GetBsff($id: ID!) {
    bsff(id: $id) {
      ficheInterventions {
        operateur {
          company {
            siret
          }
        }
        detenteur {
          company {
            siret
          }
        }
      }
    }
  }
`;
const GET_NEXT_BSFF = gql`
  query GetBsff($id: ID!) {
    bsff(id: $id) {
      forwarding {
        bsff {
          ficheInterventions {
            detenteur {
              company {
                siret
              }
            }
          }
        }
      }
    }
  }
`;

describe("Bsff.ficheInterventions", () => {
  afterAll(resetDatabase);

  test("it should return operateur's fiche d'interventions", async () => {
    const detenteur = await userWithCompanyFactory("MEMBER");
    const operateur = await userWithCompanyFactory("MEMBER");
    const bsff = await createBsff({ emitter: operateur });
    const ficheIntervention = await createFicheIntervention({
      detenteur,
      operateur
    });
    await prisma.bsff.update({
      where: { id: bsff.id },
      data: { ficheInterventions: { connect: { id: ficheIntervention.id } } }
    });
    const { query } = makeClient(operateur.user);
    const { data } = await query<Pick<Query, "bsff">>(GET_BSFF, {
      variables: { id: bsff.id }
    });
    expect(data.bsff.ficheInterventions).toHaveLength(1);
    expect(data.bsff.ficheInterventions[0].operateur!.company.siret).toEqual(
      ficheIntervention.operateurCompanySiret
    );
    expect(data.bsff.ficheInterventions[0].detenteur!.company!.siret).toEqual(
      ficheIntervention.detenteurCompanySiret
    );
  });

  test("it should not return other detenteur's fiche d'intervention", async () => {
    const detenteur1 = await userWithCompanyFactory("MEMBER");
    const detenteur2 = await userWithCompanyFactory("MEMBER");

    const operateur = await userWithCompanyFactory("MEMBER");
    const bsff = await createBsff({ emitter: operateur });
    const ficheIntervention1 = await createFicheIntervention({
      detenteur: detenteur1,
      operateur
    });
    const ficheIntervention2 = await createFicheIntervention({
      detenteur: detenteur2,
      operateur
    });
    await prisma.bsff.update({
      where: { id: bsff.id },
      data: {
        detenteurCompanySirets: [
          detenteur1.company.siret!,
          detenteur2.company.siret!
        ],
        ficheInterventions: {
          connect: [
            { id: ficheIntervention1.id },
            { id: ficheIntervention2.id }
          ]
        }
      }
    });
    const { query } = makeClient(detenteur1.user);
    const { data } = await query<Pick<Query, "bsff">>(GET_BSFF, {
      variables: { id: bsff.id }
    });

    expect(data.bsff.ficheInterventions).toHaveLength(1);
    expect(data.bsff.ficheInterventions[0].operateur!.company.siret).toEqual(
      ficheIntervention1.operateurCompanySiret
    );
    expect(data.bsff.ficheInterventions[0].detenteur!.company!.siret).toEqual(
      ficheIntervention1.detenteurCompanySiret
    );
  });

  it("should not allow next Bsff destination to read fiche d'interventions", async () => {
    const detenteur = await userWithCompanyFactory("MEMBER");
    const operateur = await userWithCompanyFactory("MEMBER");
    const ttr = await userWithCompanyFactory("MEMBER");
    const traiteur = await userWithCompanyFactory("MEMBER");
    const bsff = await createBsff({ emitter: operateur, destination: ttr });
    const ficheIntervention = await createFicheIntervention({
      detenteur,
      operateur
    });
    await prisma.bsff.update({
      where: { id: bsff.id },
      data: { ficheInterventions: { connect: { id: ficheIntervention.id } } }
    });
    const nextBsff = await createBsff(
      {
        emitter: ttr,
        destination: traiteur
      },
      { data: { type: "REEXPEDITION" }, previousPackagings: bsff.packagings }
    );
    const { query } = makeClient(traiteur.user);
    const { errors } = await query<Pick<Query, "bsff">>(GET_NEXT_BSFF, {
      variables: { id: nextBsff.id }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Vous n'êtes pas autorisé à consulter les fiches d'interventions de ce BSFF"
      })
    ]);
  });
});
