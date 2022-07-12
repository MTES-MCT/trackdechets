import { UserRole } from "@prisma/client";
import { gql } from "apollo-server-core";
import getReadableId, { ReadableIdPrefix } from "../../../../forms/readableId";
import {
  Mutation,
  MutationPublishBsffArgs
} from "../../../../generated/graphql/types";
import prisma from "../../../../prisma";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

const PUBLISH_BSFF = gql`
  mutation PublishBsff($id: ID!) {
    publishBsff(id: $id) {
      isDraft
    }
  }
`;

describe("publishBsff", () => {
  it("should throw error if data is missing", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await prisma.bsff.create({
      data: {
        isDraft: true,
        id: getReadableId(ReadableIdPrefix.FF),
        type: "TRACER_FLUIDE",
        emitterCompanySiret: emitter.company.siret
      }
    });

    const { mutate } = makeClient(emitter.user);

    const { errors } = await mutate<
      Pick<Mutation, "publishBsff">,
      MutationPublishBsffArgs
    >(PUBLISH_BSFF, { variables: { id: bsff.id } });

    // TODO harmoniser les messages d'erreurs
    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Erreur de validation des données. Des champs sont manquants ou mal formatés : \n" +
          " Le nom de l'installation de destination est requis\n" +
          "Le SIRET de l'installation de destination est requis\n" +
          "L'adresse de l'installation de destination est requise\n" +
          "Le nom du contact sur l'installation de destination est requis\n" +
          "Le numéro de téléphone de l'installation de destination est requis\n" +
          "L'adresse email de l'installation de destination est requis\n" +
          "destinationPlannedOperationCode est un champ requis et doit avoir une valeur\n" +
          "Le nom du transporteur est requis\n" +
          'Transporteur : "Le n°SIRET ou le numéro de TVA intracommunautaire est obligatoire"\n' +
          "transporterCompanySiret n'est pas un numéro de SIRET valide\n" +
          "L'adresse du transporteur est requise\n" +
          "Le nom du contact dans l'entreprise émettrice est requis\n" +
          "Le numéro de téléphone du transporteur est requis\n" +
          "L'adresse email du transporteur est requis\n" +
          "Le code déchet est requis\n" +
          "La description du fluide est obligatoire\n" +
          "La mention ADR est requise\n" +
          "Le poids total du déchet est requis\n" +
          "weightIsEstimate ne peut pas être null\n" +
          "Le nom de l'entreprise émettrice est requis\n" +
          "L'adresse de l'entreprise émettrice est requise\n" +
          "Le nom du contact dans l'entreprise émettrice est requis\n" +
          "Le numéro de téléphone de l'entreprise émettrice est requis\n" +
          "L'adresse email de l'entreprise émettrice est requis"
      })
    ]);
  });

  it("should publish a valid BSFF", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await prisma.bsff.create({
      data: {
        isDraft: true,
        id: getReadableId(ReadableIdPrefix.FF),
        type: "TRACER_FLUIDE",
        emitterCompanySiret: emitter.company.siret,
        emitterCompanyName: emitter.company.name,
        emitterCompanyAddress: emitter.company.address,
        emitterCompanyContact: "John Snow",
        emitterCompanyPhone: "0000000000",
        emitterCompanyMail: "john.snow@trackdechets.fr",
        transporterCompanySiret: transporter.company.siret,
        transporterCompanyName: transporter.company.name,
        transporterCompanyAddress: transporter.company.address,
        transporterCompanyContact: "John Snow",
        transporterCompanyPhone: "0000000000",
        transporterCompanyMail: "john.snow@trackdechets.fr",
        destinationCompanySiret: destination.company.siret,
        destinationCompanyName: destination.company.name,
        destinationCompanyAddress: destination.company.address,
        destinationCompanyContact: "John Snow",
        destinationCompanyPhone: "0000000000",
        destinationCompanyMail: "john.snow@trackdechets.fr",
        destinationPlannedOperationCode: "R2",
        wasteCode: "14 06 01*",
        wasteAdr: "adr",
        wasteDescription: "fluide",
        weightValue: 1,
        weightIsEstimate: false,
        packagings: {
          create: { name: "BOUTEILLE", numero: "123", weight: 1 }
        }
      }
    });

    const { mutate } = makeClient(emitter.user);

    const { data } = await mutate<
      Pick<Mutation, "publishBsff">,
      MutationPublishBsffArgs
    >(PUBLISH_BSFF, { variables: { id: bsff.id } });

    expect(data.publishBsff.isDraft).toEqual(false);
  });
});
