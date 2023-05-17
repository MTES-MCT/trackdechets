import { BsffPackagingType, UserRole } from "@prisma/client";
import { gql } from "apollo-server-core";
import { resetDatabase } from "../../../../../integration-tests/helper";
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
  afterEach(resetDatabase);

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
          "Transporteur : le nom de l'établissement est requis\n" +
          "Transporteur : Le n°SIRET ou le numéro de TVA intracommunautaire est obligatoire\n" +
          "Transporteur : l'adresse de l'établissement est requise\n" +
          "Transporteur : le nom du contact est requis\n" +
          "Transporteur : le numéro de téléphone est requis\n" +
          "Transporteur : l'adresse email est requise\n" +
          "Le code déchet est requis\n" +
          "La dénomination usuelle du déchet est obligatoire\n" +
          "La mention ADR est requise\n" +
          "Le poids total est requis\n" +
          "Le type de poids (estimé ou non) est un requis\n" +
          "Conditionnements : le nombre de contenants doit être supérieur ou égal à 1\n" +
          "Émetteur : le nom de l'établissement est requis\n" +
          "Émetteur : l'adresse de l'établissement est requise\n" +
          "Émetteur : le nom du contact est requis\n" +
          "Émetteur : le numéro de téléphone est requis\n" +
          "Émetteur : l'adresse email est requise"
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
          create: {
            type: BsffPackagingType.BOUTEILLE,
            numero: "123",
            emissionNumero: "123",
            weight: 1,
            volume: 1
          }
        }
      }
    });

    const { mutate } = makeClient(emitter.user);

    const { data, errors } = await mutate<
      Pick<Mutation, "publishBsff">,
      MutationPublishBsffArgs
    >(PUBLISH_BSFF, { variables: { id: bsff.id } });

    expect(errors).toBeUndefined();

    expect(data.publishBsff.isDraft).toEqual(false);
  });

  it("should be possible to publish a BSFF without transporter info", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
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
          create: {
            type: BsffPackagingType.BOUTEILLE,
            numero: "123",
            emissionNumero: "123",
            weight: 1,
            volume: 1
          }
        }
      }
    });

    const { mutate } = makeClient(emitter.user);

    const { data, errors } = await mutate<
      Pick<Mutation, "publishBsff">,
      MutationPublishBsffArgs
    >(PUBLISH_BSFF, { variables: { id: bsff.id } });

    expect(errors).toBeUndefined();

    expect(data.publishBsff.isDraft).toEqual(false);
  });
});
