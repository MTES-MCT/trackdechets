import { BsffPackagingType, UserRole } from "@prisma/client";
import { gql } from "graphql-tag";
import { resetDatabase } from "../../../../../integration-tests/helper";
import getReadableId, { ReadableIdPrefix } from "../../../../forms/readableId";
import {
  Mutation,
  MutationPublishBsffArgs
} from "../../../../generated/graphql/types";
import { prisma } from "@td/prisma";
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
          "Le champ emitterCompanyName est obligatoire.\n" +
          "Le champ emitterCompanyAddress est obligatoire.\n" +
          "Le champ emitterCompanyContact est obligatoire.\n" +
          "Le champ emitterCompanyPhone est obligatoire.\n" +
          "Le champ emitterCompanyMail est obligatoire.\n" +
          "Le champ wasteCode est obligatoire.\n" +
          "Le champ wasteDescription est obligatoire.\n" +
          "Le champ wasteAdr est obligatoire.\n" +
          "Le champ weightValue est obligatoire.\n" +
          "Le champ destinationCompanyName est obligatoire.\n" +
          "Le champ destinationCompanySiret est obligatoire.\n" +
          "Le champ destinationCompanyAddress est obligatoire.\n" +
          "Le champ destinationCompanyContact est obligatoire.\n" +
          "Le champ destinationCompanyPhone est obligatoire.\n" +
          "Le champ destinationPlannedOperationCode est obligatoire.\n" +
          "Le champ destinationCompanyMail est obligatoire.\n" +
          "Le champ packagings est obligatoire."
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
