import { mapCerfaToBsffOperateurDraft } from "../mapper";
import { RestCerfa, RestUtilisationBouteilleRecuperation } from "../types";

const bottle: RestUtilisationBouteilleRecuperation = {
  bouteilleId: "b-1",
  bouteilleIdentification: "BOUT-1",
  capaciteUtilisee: 2.5,
  inflammable: false
};

const cerfa: RestCerfa = {
  siret: "53075596600047",
  ficheInterventionNumero: "FI-123",
  operateur: { nom: "Opérateur", siret: "53075596600047" },
  detenteur: {
    nom: "Détenteur",
    siret: "35600000000048",
    adresseCerfa: {
      adresse: "1 rue du Test",
      codePostal: "75001",
      ville: "Paris"
    }
  },
  dateSignatureTechnicien: "2026-01-02T10:00:00.000Z",
  bouteilleRecuperations: [bottle],
  quantiteTotalRecuperation: "2.5"
};

describe("mapCerfaToBsffOperateurDraft", () => {
  it("maps identity, holder, date, address and a non-flammable bottle", () => {
    expect(mapCerfaToBsffOperateurDraft(cerfa)).toEqual({
      ficheInterventionNumero: "FI-123",
      dateIntervention: "2026-01-02T10:00:00.000Z",
      dechets: [
        {
          bouteilleId: "b-1",
          bouteilleIdentification: "BOUT-1",
          codeDechet: "14 06 01*",
          poidsFluide: 2.5,
          volumeContenant: null,
          mentionADR: null
        }
      ],
      detenteur: {
        siret: "35600000000048",
        nom: "Détenteur",
        adresse: "1 rue du Test, 75001 Paris",
        codePostal: "75001",
        ville: "Paris"
      },
      operateur: { nom: "Opérateur", siret: "53075596600047" },
      sourceData: "fluides_frigo",
      ffFicheId: "FI-123",
      quantiteTotalRecuperation: "2.5"
    });
  });

  it("uses the BSFF allowed code and ADR mention for flammable bottles", () => {
    const mapped = mapCerfaToBsffOperateurDraft({
      ...cerfa,
      bouteilleRecuperations: [
        {
          ...bottle,
          inflammable: true,
          codeUN: "UN 1234"
        }
      ]
    });

    expect(mapped.dechets[0]).toEqual(
      expect.objectContaining({
        codeDechet: "16 05 04*",
        mentionADR: "ADR UN 1234"
      })
    );
  });

  it("falls back to the holder signature date and accepts missing bottles", () => {
    const mapped = mapCerfaToBsffOperateurDraft({
      ...cerfa,
      dateSignatureTechnicien: undefined,
      signatureDetenteur: { dateSignature: "2026-01-03T10:00:00.000Z" },
      bouteilleRecuperations: undefined
    });

    expect(mapped.dateIntervention).toBe("2026-01-03T10:00:00.000Z");
    expect(mapped.dechets).toEqual([]);
  });
});
