import { BsffPackagingType, BsffType, UserRole } from "@prisma/client";
import { gql } from "apollo-server-core";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { BSFF_WASTE_CODES } from "../../../../common/constants";
import {
  Mutation,
  MutationCreateBsffArgs
} from "../../../../generated/graphql/types";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { fullBsff } from "../../../fragments";

const CREATE_BSFF = gql`
  mutation CreateBsff($input: BsffInput!) {
    createBsff(input: $input) {
      ...FullBsff
    }
  }
  ${fullBsff}
`;

describe("Mutation.createBsff", () => {
  afterEach(resetDatabase);

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
        input: {
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
            plannedOperationCode: "R2"
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
    expect(data.createBsff.id).toBeTruthy();
    expect(data.createBsff.packagings).toEqual([
      expect.objectContaining({
        name: "BOUTEILLE",
        numero: "123",
        weight: 1
      })
    ]);
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
        extensions: {
          code: "UNAUTHENTICATED"
        }
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
              siret: "2".repeat(14),
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
          "Destinataire: Le siret de l'entreprise est obligatoire\n" +
          "Destination : l'adresse de l'établissement est requise\n" +
          "Destination : le nom du contact est requis\n" +
          "Destination : le numéro de téléphone est requis\n" +
          "Destination : l'adresse email est requise\n" +
          "Le code de l'opération de traitement prévu est requis\n" +
          "Transporteur : le nom de l'établissement est requis\n" +
          "Transporteur : Le n°SIRET ou le numéro de TVA intracommunautaire est obligatoire\n" +
          "transporterCompanySiret n'est pas un numéro de SIRET valide\n" +
          "Transporteur : l'adresse de l'établissement est requise\n" +
          "Transporteur : le nom du contact est requis\n" +
          "Transporteur : le numéro de téléphone est requis\n" +
          "Transporteur : l'adresse email est requise\n" +
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
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
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
              name: "Transporter",
              siret: "11111111111111",
              address: "Quelque part",
              contact: "John Snow",
              mail: "john.snow@trackdechets.fr",
              phone: "00 00 00 00 00"
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
            plannedOperationCode: "R2"
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
              name: "BOUTEILLE",
              numero: "123",
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
          "Erreur de validation des données. Des champs sont manquants ou mal formatés : \n" +
          "Le transporteur qui a été renseigné sur le bordereau (SIRET: 11111111111111) n'est pas inscrit sur Trackdéchets"
      })
    ]);
  });

  it("should not be possible to set a transporter not registered in TD", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
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
              name: "Destination",
              siret: "11111111111111",
              address: "Quelque part",
              contact: "John Snow",
              mail: "john.snow@trackdechets.fr",
              phone: "00 00 00 00 00"
            },
            plannedOperationCode: "R2"
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
              name: "BOUTEILLE",
              numero: "123",
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
          "Erreur de validation des données. Des champs sont manquants ou mal formatés : \n" +
          "L'installation de destination avec le SIRET 11111111111111 n'est pas inscrite sur Trackdéchets"
      })
    ]);
  });
});
