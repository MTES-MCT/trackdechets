import { BsffPackagingType, UserRole } from "@td/prisma";
import { gql } from "graphql-tag";
import { resetDatabase } from "../../../../../integration-tests/helper";
import getReadableId, { ReadableIdPrefix } from "../../../../forms/readableId";
import type { Mutation, MutationPublishBsffArgs } from "@td/codegen-back";
import { prisma } from "@td/prisma";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { createBsff } from "../../../__tests__/factories";
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
        emitterCompanySiret: emitter.company.siret,
        canAccessDraftOrgIds: [emitter.company.siret!]
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
          "La raison sociale de l'émetteur est un champ requis.\n" +
          "L'adresse de l'émetteur est un champ requis.\n" +
          "La personne à contacter chez l'émetteur est un champ requis.\n" +
          "Le N° de téléphone de l'émetteur est un champ requis.\n" +
          "L'adresse e-mail de l'émetteur est un champ requis.\n" +
          "Le code déchet est un champ requis.\n" +
          "La description du déchet est un champ requis.\n" +
          "L'ADR est un champ requis.\n" +
          "La quantité totale est un champ requis.\n" +
          "La raison sociale de l'installation de destination est un champ requis.\n" +
          "Le SIRET de l'installation de destination est un champ requis.\n" +
          "L'adresse de l'installation de destination est un champ requis.\n" +
          "La personne à contacter de l'installation de destination est un champ requis.\n" +
          "Le N° de téléphone de l'installation de destination est un champ requis.\n" +
          "Le code d'opération prévu est un champ requis.\n" +
          "L'adresse e-mail de l'installation de destination est un champ requis.\n" +
          "La liste des contenants est un champ requis."
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
        },
        transporters: {
          create: {
            number: 1,
            transporterCompanySiret: transporter.company.siret,
            transporterCompanyName: transporter.company.name,
            transporterCompanyAddress: transporter.company.address,
            transporterCompanyContact: "John Snow",
            transporterCompanyPhone: "0000000000",
            transporterCompanyMail: "john.snow@trackdechets.fr"
          }
        },
        canAccessDraftOrgIds: [emitter.company.siret!]
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
        },
        canAccessDraftOrgIds: [emitter.company.siret!]
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

  it("should forbid to publish a BSFF when user is not initial creator", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);

    const bsff = await createBsff(
      { emitter, transporter, destination },
      { data: { isDraft: true }, userId: destination.user.id }
    );

    const { mutate } = makeClient(emitter.user);

    const { errors } = await mutate<
      Pick<Mutation, "publishBsff">,
      MutationPublishBsffArgs
    >(PUBLISH_BSFF, { variables: { id: bsff.id } });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Vous ne pouvez pas éditer un bordereau sur lequel le SIRET de votre entreprise n'apparaît pas."
      })
    ]);
  });
});
