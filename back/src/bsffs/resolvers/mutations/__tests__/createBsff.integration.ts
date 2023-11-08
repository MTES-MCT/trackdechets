import { BsffPackagingType, BsffType, UserRole } from "@prisma/client";
import { gql } from "graphql-tag";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { BSFF_WASTE_CODES } from "shared/constants";
import {
  Mutation,
  MutationCreateBsffArgs,
  BsffOperationCode
} from "../../../../generated/graphql/types";
import {
  siretify,
  userWithCompanyFactory,
  transporterReceiptFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { fullBsff } from "../../../fragments";
import { sirenifyBsffInput } from "../../../sirenify";
import { createFicheIntervention } from "../../../__tests__/factories";
import prisma from "../../../../prisma";

jest.mock("../../../sirenify");
(sirenifyBsffInput as jest.Mock).mockImplementation(input =>
  Promise.resolve(input)
);

const CREATE_BSFF = gql`
  mutation CreateBsff($input: BsffInput!) {
    createBsff(input: $input) {
      ...FullBsff
    }
  }
  ${fullBsff}
`;

const createInput = (emitter, transporter, destination) => ({
  type: BsffType.COLLECTE_PETITES_QUANTITES,
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
});

describe("Mutation.createBsff", () => {
  afterEach(async () => {
    await resetDatabase();
    (sirenifyBsffInput as jest.Mock).mockClear();
  });

  it("should allow user to create a bsff", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
    const { mutate } = makeClient(emitter.user);
    const { data, errors } = await mutate<
      Pick<Mutation, "createBsff">,
      MutationCreateBsffArgs
    >(CREATE_BSFF, {
      variables: {
        input: createInput(emitter, transporter, destination)
      }
    });

    expect(errors).toBeUndefined();
    expect(data.createBsff.id).toBeTruthy();
    expect(data.createBsff.packagings).toEqual([
      expect.objectContaining({
        name: "BOUTEILLE",
        numero: "123",
        weight: 1
      })
    ]);
    // check input is sirenified
    expect(sirenifyBsffInput as jest.Mock).toHaveBeenCalledTimes(1);
  });

  it("should create a bsff with a fiche d'intervention", async () => {
    const operateur = await userWithCompanyFactory(UserRole.ADMIN);
    const detenteur = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
    const ficheIntervention = await createFicheIntervention({
      operateur,
      detenteur
    });
    const { mutate } = makeClient(operateur.user);
    const { data, errors } = await mutate<
      Pick<Mutation, "createBsff">,
      MutationCreateBsffArgs
    >(CREATE_BSFF, {
      variables: {
        input: {
          ...createInput(operateur, transporter, destination),
          ficheInterventions: [ficheIntervention.id]
        }
      }
    });
    expect(errors).toBeUndefined();
    const bsff = await prisma.bsff.findUniqueOrThrow({
      where: { id: data.createBsff.id },
      include: { ficheInterventions: true }
    });
    expect(bsff.ficheInterventions.length).toEqual(1);
    expect(bsff.ficheInterventions.map(fi => fi.id)).toEqual([
      ficheIntervention.id
    ]);
    expect(bsff.detenteurCompanySirets).toEqual([detenteur.company.siret]);
  });

  it("should create a bsff and autocomplete recepisse", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: ["TRANSPORTER"]
    });
    const receipt = await transporterReceiptFactory({
      company: transporter.company
    });
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
    const { mutate } = makeClient(emitter.user);
    const { data } = await mutate<
      Pick<Mutation, "createBsff">,
      MutationCreateBsffArgs
    >(CREATE_BSFF, {
      variables: {
        input: createInput(emitter, transporter, destination)
      }
    });

    expect(data.createBsff.transporter!.recepisse!.number).toEqual(
      receipt.receiptNumber
    );
    expect(data.createBsff.transporter!.recepisse!.department).toEqual(
      receipt.department
    );
    expect(data.createBsff.transporter!.recepisse!.validityLimit).toEqual(
      receipt.validityLimit.toISOString()
    );
  });

  it("should create a bsff and ignore recepisse input", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
    const { mutate } = makeClient(emitter.user);

    const { data } = await mutate<
      Pick<Mutation, "createBsff">,
      MutationCreateBsffArgs
    >(CREATE_BSFF, {
      variables: {
        input: createInput(emitter, transporter, destination)
      }
    });

    expect(data.createBsff.transporter!.recepisse).toEqual(null);
  });

  it("should disallow unauthenticated user from creating a bsff", async () => {
    const { mutate } = makeClient();
    const { errors } = await mutate<
      Pick<Mutation, "createBsff">,
      MutationCreateBsffArgs
    >(CREATE_BSFF, {
      variables: {
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
    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "createBsff">,
      MutationCreateBsffArgs
    >(CREATE_BSFF, {
      variables: {
        input: {
          type: BsffType.COLLECTE_PETITES_QUANTITES,
          emitter: {
            company: {
              name: "Clim' Clean",
              siret: siretify(2),
              address: "12 rue de Laval 69000",
              contact: "Marco Polo",
              mail: "marco.polo@gmail.com"
            }
          }
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Vous ne pouvez pas éditer un bordereau sur lequel le SIRET de votre entreprise n'apparaît pas."
      })
    ]);
  });

  it("should fail with incomplete data", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const { mutate } = makeClient(emitter.user);
    const { errors } = await mutate<
      Pick<Mutation, "createBsff">,
      MutationCreateBsffArgs
    >(CREATE_BSFF, {
      variables: {
        input: {
          type: BsffType.COLLECTE_PETITES_QUANTITES,
          emitter: {
            company: {
              siret: emitter.company.siret
            }
          }
        }
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Erreur de validation des données. Des champs sont manquants ou mal formatés : \n" +
          "Destination : le nom de l'établissement est requis\n" +
          "Destination : le numéro SIRET est requis\n" +
          "Destination : l'adresse de l'établissement est requise\n" +
          "Destination : le nom du contact est requis\n" +
          "Destination : le numéro de téléphone est requis\n" +
          "Destination : l'adresse email est requise\n" +
          "Le code de l'opération de traitement prévu est requis\n" +
          "Le code déchet est requis\n" +
          "La dénomination usuelle du déchet est obligatoire\n" +
          "La mention ADR est requise\n" +
          "Le poids total est requis\n" +
          "Le type de poids (estimé ou non) est un requis\n" +
          "Émetteur : le nom de l'établissement est requis\n" +
          "Émetteur : l'adresse de l'établissement est requise\n" +
          "Émetteur : le nom du contact est requis\n" +
          "Émetteur : le numéro de téléphone est requis\n" +
          "Émetteur : l'adresse email est requise"
      })
    ]);
  });

  it("should not be possible to set a transporter not registered in TD", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
    const { mutate } = makeClient(emitter.user);
    const siret = siretify(1);
    const { errors } = await mutate<
      Pick<Mutation, "createBsff">,
      MutationCreateBsffArgs
    >(CREATE_BSFF, {
      variables: {
        input: {
          ...createInput(emitter, transporter, destination),
          ...{
            transporter: {
              company: {
                name: "Transporter",
                siret,
                address: "Quelque part",
                contact: "John Snow",
                mail: "john.snow@trackdechets.fr",
                phone: "00 00 00 00 00"
              }
            }
          }
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Erreur de validation des données. Des champs sont manquants ou mal formatés : \n" +
          `Transporteur : l'établissement avec le SIRET ${siret} n'est pas inscrit sur Trackdéchets`
      })
    ]);
  });

  it("should not be possible to set a destination not registered in TD", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
    const { mutate } = makeClient(emitter.user);
    const siret = siretify(1);
    const { errors } = await mutate<
      Pick<Mutation, "createBsff">,
      MutationCreateBsffArgs
    >(CREATE_BSFF, {
      variables: {
        input: {
          ...createInput(emitter, transporter, destination),
          destination: {
            company: {
              name: "Destination",
              siret,
              address: "Quelque part",
              contact: "John Snow",
              mail: "john.snow@trackdechets.fr",
              phone: "00 00 00 00 00"
            },
            plannedOperationCode: "R12"
          }
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Erreur de validation des données. Des champs sont manquants ou mal formatés : \n" +
          `Destination : l'établissement avec le SIRET ${siret} n'est pas inscrit sur Trackdéchets`
      })
    ]);
  });

  it("should not be possible to set a transporter which has not the `TRANSPORTER` profile", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: ["PRODUCER"]
    });
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
    const { mutate } = makeClient(emitter.user);
    const { errors } = await mutate<
      Pick<Mutation, "createBsff">,
      MutationCreateBsffArgs
    >(CREATE_BSFF, {
      variables: {
        input: createInput(emitter, transporter, destination)
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Erreur de validation des données. Des champs sont manquants ou mal formatés : \n" +
          `Le transporteur saisi sur le bordereau (SIRET: ${transporter.company.siret}) n'est pas inscrit sur` +
          " Trackdéchets en tant qu'entreprise de transport. Cette entreprise ne peut donc pas" +
          " être visée sur le bordereau. Veuillez vous rapprocher de l'administrateur de cette" +
          " entreprise pour qu'il modifie le profil de l'établissement depuis l'interface" +
          " Trackdéchets Mon Compte > Établissements"
      })
    ]);
  });

  it("should not be possible to set a destination which has not the `WASTEPROCESSOR` or `TTR` profile", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: ["PRODUCER"]
    });
    const { mutate } = makeClient(emitter.user);
    const { errors } = await mutate<
      Pick<Mutation, "createBsff">,
      MutationCreateBsffArgs
    >(CREATE_BSFF, {
      variables: {
        input: createInput(emitter, transporter, destination)
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Erreur de validation des données. Des champs sont manquants ou mal formatés : \n" +
          `L\'installation de destination ou d’entreposage ou de reconditionnement avec le SIRET "${destination.company.siret}"` +
          " n'est pas inscrite sur Trackdéchets en tant qu'installation de traitement ou de tri transit regroupement." +
          " Cette installation ne peut donc pas être visée sur le bordereau. Veuillez vous rapprocher de l'administrateur" +
          " de cette installation pour qu'il modifie le profil de l'établissement depuis l'interface Trackdéchets Mon Compte > Établissements"
      })
    ]);
  });
});
