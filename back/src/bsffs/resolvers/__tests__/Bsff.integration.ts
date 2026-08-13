import { gql } from "graphql-tag";
import { resetDatabase } from "../../../../integration-tests/helper";
import type { Query } from "@td/codegen-back";
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

const GET_BSFF_PACKAGINGS = gql`
  query GetBsffPackagings($id: ID!) {
    bsff(id: $id) {
      packagings {
        id
        numero
        detenteurs {
          company {
            siret
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

describe("Bsff.packagings", () => {
  afterAll(resetDatabase);

  it("only returns packagings associated with the requesting detenteur", async () => {
    const detenteur1 = await userWithCompanyFactory("MEMBER");
    const detenteur2 = await userWithCompanyFactory("MEMBER");
    const operateur = await userWithCompanyFactory("MEMBER");
    const bsff = await createBsff({ emitter: operateur });

    const secondPackaging = await prisma.bsffPackaging.create({
      data: {
        bsffId: bsff.id,
        type: "BOUTEILLE",
        numero: "second-packaging",
        emissionNumero: "second-packaging",
        weight: 1
      }
    });

    await prisma.bsffPackaging.update({
      where: { id: bsff.packagings[0].id },
      data: {
        detenteurs: {
          create: {
            detenteurCompanyName: detenteur1.company.name,
            detenteurCompanySiret: detenteur1.company.siret,
            detenteurCompanyAddress: detenteur1.company.address
          }
        }
      }
    });
    await prisma.bsffPackaging.update({
      where: { id: secondPackaging.id },
      data: {
        detenteurs: {
          create: {
            detenteurCompanyName: detenteur2.company.name,
            detenteurCompanySiret: detenteur2.company.siret,
            detenteurCompanyAddress: detenteur2.company.address
          }
        }
      }
    });
    await prisma.bsff.update({
      where: { id: bsff.id },
      data: {
        detenteurCompanySirets: [
          detenteur1.company.siret!,
          detenteur2.company.siret!
        ]
      }
    });

    const { query } = makeClient(detenteur1.user);
    const { data, errors } = await query<Pick<Query, "bsff">>(
      GET_BSFF_PACKAGINGS,
      { variables: { id: bsff.id } }
    );

    expect(errors).toBeUndefined();
    expect(data.bsff.packagings).toHaveLength(1);
    expect(data.bsff.packagings[0].id).toEqual(bsff.packagings[0].id);
    expect(data.bsff.packagings[0].detenteurs[0].company!.siret).toEqual(
      detenteur1.company.siret
    );
  });
});
