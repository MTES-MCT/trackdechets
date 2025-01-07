import {
  BsffStatus,
  BsffType,
  OperationMode,
  TransporterReceipt,
  TransportMode,
  UserRole,
  WasteAcceptationStatus
} from "@prisma/client";
import { gql } from "graphql-tag";
import { resetDatabase } from "../../../../../integration-tests/helper";
import type {
  Mutation,
  MutationSignBsffArgs,
  MutationUpdateBsffArgs
} from "@td/codegen-back";
import { prisma } from "@td/prisma";
import {
  UserWithCompany,
  transporterReceiptFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { OPERATION } from "../../../constants";
import {
  createBsffBeforeEmission,
  createBsffAfterEmission,
  createBsffBeforeTransport,
  createBsffBeforeReception,
  createBsffBeforeRefusal,
  createBsffBeforeOperation,
  createBsffAfterOperation,
  createBsffBeforeAcceptation,
  createBsffAfterReception,
  createBsffPackaging,
  createBsffAfterTransport,
  addBsffTransporter
} from "../../../__tests__/factories";
import { operationHooksQueue } from "../../../../queue/producers/operationHook";
import { getTransportersSync } from "../../../database";
import { UPDATE_BSFF } from "./updateBsff.integration";

const SIGN = gql`
  mutation Sign($id: ID!, $input: BsffSignatureInput!) {
    signBsff(id: $id, input: $input) {
      id
      transporter {
        recepisse {
          number
          department
          validityLimit
        }
      }
    }
  }
`;

describe("Mutation.signBsff", () => {
  afterEach(resetDatabase);

  let emitter: UserWithCompany;
  let transporter: UserWithCompany;
  let destination: UserWithCompany;
  let receipt: TransporterReceipt;

  beforeEach(async () => {
    emitter = await userWithCompanyFactory(UserRole.ADMIN, {
      address: "12 rue de la Grue, 69000 Lyon",
      contactPhone: "06",
      contactEmail: "contact@gmail.com"
    });
    transporter = await userWithCompanyFactory(UserRole.ADMIN, {
      address: "12 rue de la Grue, 69000 Lyon",
      contactPhone: "06",
      contactEmail: "contact@gmail.com"
    });
    receipt = await transporterReceiptFactory({ company: transporter.company });
    destination = await userWithCompanyFactory(UserRole.ADMIN, {
      address: "12 rue de la Grue, 69000 Lyon",
      contactPhone: "06",
      contactEmail: "contact@gmail.com"
    });
  });

  it("should disallow unauthenticated user from signing a bsff", async () => {
    const { mutate } = makeClient();
    const { errors } = await mutate<
      Pick<Mutation, "signBsff">,
      MutationSignBsffArgs
    >(SIGN, {
      variables: {
        id: "123",
        input: {
          type: "EMISSION",
          date: new Date().toISOString() as any,
          author: "Jeanne Dupont"
        }
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

  it("should throw an error if the bsff being signed doesn't exist", async () => {
    const { mutate } = makeClient(emitter.user);
    const { errors } = await mutate<
      Pick<Mutation, "signBsff">,
      MutationSignBsffArgs
    >(SIGN, {
      variables: {
        id: "123",
        input: {
          type: "EMISSION",
          date: new Date().toISOString() as any,
          author: emitter.user.name
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Le BSFF n°123 n'existe pas."
      })
    ]);
  });

  describe("EMISSION", () => {
    it("should allow emitter to sign", async () => {
      const bsff = await createBsffBeforeEmission({
        emitter,
        transporter,
        destination
      });

      const { mutate } = makeClient(emitter.user);
      const { data, errors } = await mutate<
        Pick<Mutation, "signBsff">,
        MutationSignBsffArgs
      >(SIGN, {
        variables: {
          id: bsff.id,
          input: {
            type: "EMISSION",
            date: new Date().toISOString() as any,
            author: emitter.user.name
          }
        }
      });

      expect(errors).toBeUndefined();
      expect(data.signBsff.id).toBeTruthy();
    });

    it("should allow the transporter to sign for the emitter with the security code", async () => {
      const bsff = await createBsffBeforeEmission({
        emitter,
        transporter,
        destination
      });

      const { mutate } = makeClient(transporter.user);
      const { data, errors } = await mutate<
        Pick<Mutation, "signBsff">,
        MutationSignBsffArgs
      >(SIGN, {
        variables: {
          id: bsff.id,
          input: {
            type: "EMISSION",
            date: new Date().toISOString() as any,
            author: emitter.user.name,
            securityCode: emitter.company.securityCode
          }
        }
      });

      expect(errors).toBeUndefined();
      expect(data.signBsff.id).toBeTruthy();
    });

    it("should disallow the transporter to sign for the emitter without the security code", async () => {
      const bsff = await createBsffBeforeEmission({
        emitter,
        transporter,
        destination
      });

      const { mutate } = makeClient(transporter.user);
      const { errors } = await mutate<
        Pick<Mutation, "signBsff">,
        MutationSignBsffArgs
      >(SIGN, {
        variables: {
          id: bsff.id,
          input: {
            type: "EMISSION",
            date: new Date().toISOString() as any,
            author: emitter.user.name
          }
        }
      });

      expect(errors).toEqual([
        expect.objectContaining({
          message: "Vous ne pouvez pas signer ce bordereau"
        })
      ]);
    });

    it("should disallow the transporter to sign for the emitter with a wrong security code", async () => {
      const bsff = await createBsffBeforeEmission({
        emitter,
        transporter,
        destination
      });

      const { mutate } = makeClient(transporter.user);
      const { errors } = await mutate<
        Pick<Mutation, "signBsff">,
        MutationSignBsffArgs
      >(SIGN, {
        variables: {
          id: bsff.id,
          input: {
            type: "EMISSION",
            date: new Date().toISOString() as any,
            author: emitter.user.name,
            securityCode: 1
          }
        }
      });

      expect(errors).toEqual([
        expect.objectContaining({
          message: "Le code de signature est invalide."
        })
      ]);
    });

    it("should throw an error when the emitter tries to sign twice", async () => {
      const bsff = await createBsffAfterEmission({
        emitter,
        transporter,
        destination
      });

      const { mutate } = makeClient(emitter.user);
      const { errors } = await mutate<
        Pick<Mutation, "signBsff">,
        MutationSignBsffArgs
      >(SIGN, {
        variables: {
          id: bsff.id,
          input: {
            type: "EMISSION",
            date: new Date().toISOString() as any,
            author: emitter.user.name
          }
        }
      });

      expect(errors).toEqual([
        expect.objectContaining({
          message: "L'entreprise émettrice a déjà signé ce bordereau"
        })
      ]);
    });

    it("should throw an error if the transporter tries to sign without the emitter's signature", async () => {
      const bsff = await createBsffBeforeTransport(
        { emitter, transporter, destination },
        {
          data: {
            emitterEmissionSignatureDate: null,
            emitterEmissionSignatureAuthor: null
          }
        }
      );

      const { mutate } = makeClient(transporter.user);
      const { errors } = await mutate<
        Pick<Mutation, "signBsff">,
        MutationSignBsffArgs
      >(SIGN, {
        variables: {
          id: bsff.id,
          input: {
            type: "TRANSPORT",
            date: new Date().toISOString() as any,
            author: transporter.user.name
          }
        }
      });

      expect(errors).toEqual([
        expect.objectContaining({
          message:
            "L'auteur de la signature émetteur est un champ requis. Le transporteur ne peut pas signer l'enlèvement avant que l'émetteur ait signé le bordereau\n" +
            "La date de signature de l'émetteur est un champ requis. Le transporteur ne peut pas signer l'enlèvement avant que l'émetteur ait signé le bordereau"
        })
      ]);
    });

    it("should throw an error if the transporter tries to sign without receipt", async () => {
      const transportWithoutReceipt = await userWithCompanyFactory("MEMBER");
      const bsff = await createBsffBeforeTransport({
        emitter,
        transporter: transportWithoutReceipt,
        destination
      });

      const { mutate } = makeClient(transportWithoutReceipt.user);
      const { errors } = await mutate<
        Pick<Mutation, "signBsff">,
        MutationSignBsffArgs
      >(SIGN, {
        variables: {
          id: bsff.id,
          input: {
            type: "TRANSPORT",
            date: new Date().toISOString() as any,
            author: transporter.user.name
          }
        }
      });

      expect(errors).toEqual([
        expect.objectContaining({
          message:
            "Le numéro de récépissé du transporteur n° 1 est obligatoire. L'établissement doit renseigner son récépissé dans Trackdéchets\n" +
            "Le département de récépissé du transporteur n° 1 est obligatoire. L'établissement doit renseigner son récépissé dans Trackdéchets\n" +
            "La date de validité du récépissé du transporteur n° 1 est obligatoire. L'établissement doit renseigner son récépissé dans Trackdéchets"
        })
      ]);
    });

    it("should update transporter receipt if it changes before signature", async () => {
      const transporterWithReceipt = await userWithCompanyFactory("MEMBER", {
        transporterReceipt: {
          create: {
            receiptNumber: "receipt 1",
            department: "07",
            validityLimit: new Date()
          }
        }
      });
      const bsff = await createBsffBeforeTransport({
        emitter,
        transporter: transporterWithReceipt,
        destination
      });

      await prisma.company.update({
        where: { orgId: transporterWithReceipt.company.orgId },
        data: {
          transporterReceipt: {
            update: { data: { receiptNumber: "receipt 2" } }
          }
        }
      });

      const { mutate } = makeClient(transporterWithReceipt.user);
      await mutate<Pick<Mutation, "signBsff">, MutationSignBsffArgs>(SIGN, {
        variables: {
          id: bsff.id,
          input: {
            type: "TRANSPORT",
            date: new Date().toISOString() as any,
            author: transporter.user.name
          }
        }
      });

      const signedBsff = await prisma.bsff.findUniqueOrThrow({
        where: { id: bsff.id },
        include: { transporters: true }
      });

      expect(signedBsff.transporters[0].transporterRecepisseNumber).toEqual(
        "receipt 2"
      );
    });

    it("should be possible for the emitter to sign a BSFF where the transporter is not yet specified", async () => {
      const bsff = await createBsffBeforeEmission(
        { emitter, destination },
        {
          data: {
            emitterEmissionSignatureDate: null,
            emitterEmissionSignatureAuthor: null
          }
        }
      );

      const { mutate } = makeClient(emitter.user);
      const { errors } = await mutate<
        Pick<Mutation, "signBsff">,
        MutationSignBsffArgs
      >(SIGN, {
        variables: {
          id: bsff.id,
          input: {
            type: "EMISSION",
            date: new Date().toISOString() as any,
            author: transporter.user.name
          }
        }
      });

      expect(errors).toBeUndefined();

      const signedBsff = await prisma.bsff.findUniqueOrThrow({
        where: { id: bsff.id }
      });

      expect(signedBsff.status).toEqual("SIGNED_BY_EMITTER");
    });
  });

  describe("TRANSPORT", () => {
    it("should allow transporter to sign transport while autocompleting the transporter receipt", async () => {
      const bsff = await createBsffBeforeTransport({
        emitter,
        transporter,
        destination
      });

      const { mutate } = makeClient(transporter.user);
      const { data, errors } = await mutate<
        Pick<Mutation, "signBsff">,
        MutationSignBsffArgs
      >(SIGN, {
        variables: {
          id: bsff.id,
          input: {
            type: "TRANSPORT",
            date: new Date().toISOString() as any,
            author: transporter.user.name
          }
        }
      });

      expect(errors).toBeUndefined();
      expect(data.signBsff.id).toBeTruthy();
      expect(data.signBsff.transporter?.recepisse?.department).toBe(
        receipt.department
      );
      expect(data.signBsff.transporter?.recepisse?.validityLimit).toBe(
        receipt.validityLimit.toISOString()
      );
      expect(data.signBsff.transporter?.recepisse?.number).toBe(
        receipt.receiptNumber
      );
    });

    it("should disallow transporter to sign transport when required data is missing", async () => {
      const bsff = await createBsffAfterEmission({
        emitter,
        transporter,
        destination
      });

      const { mutate } = makeClient(transporter.user);
      const { errors } = await mutate<
        Pick<Mutation, "signBsff">,
        MutationSignBsffArgs
      >(SIGN, {
        variables: {
          id: bsff.id,
          input: {
            type: "TRANSPORT",
            date: new Date().toISOString() as any,
            author: transporter.user.name
          }
        }
      });

      expect(errors).toEqual([
        expect.objectContaining({
          message: "L'immatriculation du transporteur n° 1 est obligatoire."
        })
      ]);
    });

    it("should sign transport for transporter N", async () => {
      const emitter = await userWithCompanyFactory("ADMIN");
      const destination = await userWithCompanyFactory("ADMIN");
      const transporter1 = await userWithCompanyFactory("ADMIN");
      const transporter2 = await userWithCompanyFactory("ADMIN");
      await transporterReceiptFactory({ company: transporter1.company });
      await transporterReceiptFactory({ company: transporter2.company });

      // Crée un BSFF avec la signature du premier transporteur
      const bsff = await createBsffAfterTransport({
        emitter,
        transporter: transporter1,
        destination
      });

      const bsffTransporter2 = await addBsffTransporter({
        bsffId: bsff.id,
        transporter: transporter2
      });

      const transporterTransportSignatureDate2 = new Date(
        "2018-12-13T00:00:00.000Z"
      );
      const { mutate } = makeClient(transporter2.user);
      const { errors } = await mutate<
        Pick<Mutation, "signBsff">,
        MutationSignBsffArgs
      >(SIGN, {
        variables: {
          id: bsff.id,
          input: {
            type: "TRANSPORT",
            date: transporterTransportSignatureDate2.toISOString() as any,
            author: "Transporteur n°2"
          }
        }
      });

      expect(errors).toBeUndefined();

      const updatedBsff = await prisma.bsff.findFirstOrThrow({
        where: { id: bsff.id },
        include: { transporters: true }
      });

      // Le statut ne doit pas être modifié
      expect(updatedBsff.status).toEqual("SENT");

      const transporters = getTransportersSync(updatedBsff);

      expect(transporters[1].id).toEqual(bsffTransporter2.id);
      expect(transporters[1].transporterTransportSignatureDate).toEqual(
        transporterTransportSignatureDate2
      );
    });

    it("should not be possible for transporter N+1 to sign if transporter N has not signed", async () => {
      const emitter = await userWithCompanyFactory("ADMIN");
      const destination = await userWithCompanyFactory("ADMIN");
      const transporter1 = await userWithCompanyFactory("ADMIN");
      const transporter2 = await userWithCompanyFactory("ADMIN");
      const transporter3 = await userWithCompanyFactory("ADMIN");

      await transporterReceiptFactory({ company: transporter1.company });
      await transporterReceiptFactory({ company: transporter2.company });

      // Crée un BSFF avec un la signature du premier transporteur
      const bsff = await createBsffAfterTransport({
        emitter,
        transporter: transporter1,
        destination
      });

      // Ajoute un second transporteur qui n'a pas signé
      await addBsffTransporter({
        bsffId: bsff.id,
        transporter: transporter2
      });

      // Ajoute un troisième transporteur
      await addBsffTransporter({
        bsffId: bsff.id,
        transporter: transporter3
      });

      // tente de signer pour le 3ème transporteur
      const { mutate } = makeClient(transporter3.user);
      const { errors } = await mutate<
        Pick<Mutation, "signBsff">,
        MutationSignBsffArgs
      >(SIGN, {
        variables: {
          id: bsff.id,
          input: {
            type: "TRANSPORT",
            author: "Transporteur n°3"
          }
        }
      });
      expect(errors).toEqual([
        expect.objectContaining({
          message: "Vous ne pouvez pas signer ce bordereau"
        })
      ]);
    });

    // Transport mode is now required at transporter signature step
    describe("transporterTransportMode", () => {
      const prepareBsdffAndSignTransport = async (
        transporterOpt,
        updateOpt?
      ) => {
        // Create BSFF
        const bsff = await createBsffBeforeTransport(
          {
            emitter,
            transporter,
            destination
          },
          {
            transporterData: {
              transporterTransportMode: null,
              ...transporterOpt
            }
          }
        );

        // Update BSFF?
        const { mutate } = makeClient(transporter.user);
        if (updateOpt) {
          await mutate<Pick<Mutation, "updateBsff">, MutationUpdateBsffArgs>(
            UPDATE_BSFF,
            {
              variables: {
                id: bsff.id,
                input: {
                  ...updateOpt
                }
              }
            }
          );
        }

        // Sign BSFF
        const { errors } = await mutate<
          Pick<Mutation, "signBsff">,
          MutationSignBsffArgs
        >(SIGN, {
          variables: {
            id: bsff.id,
            input: {
              type: "TRANSPORT",
              date: new Date().toISOString() as any,
              author: transporter.user.name
            }
          }
        });

        const updatedBsff = await prisma.bsff.findFirst({
          where: { id: bsff.id },
          include: { transporters: true }
        });

        return { errors, bsff: updatedBsff };
      };

      it("should throw error if transport mode is not defined", async () => {
        // When
        const { errors } = await prepareBsdffAndSignTransport({});

        // Then
        expect(errors).not.toBeUndefined();
        expect(errors[0].message).toBe(
          "Le mode de transport n° 1 est obligatoire."
        );
      });

      it("should work if transport mode is in initial BSD", async () => {
        // When
        const { errors, bsff } = await prepareBsdffAndSignTransport({
          transporterTransportMode: TransportMode.ROAD
        });

        // Then
        expect(errors).toBeUndefined();
        expect(bsff?.transporters[0].transporterTransportMode).toBe(
          TransportMode.ROAD
        );
      });

      it("should work if transport mode is given before transporter signature", async () => {
        // When
        const { errors, bsff } = await prepareBsdffAndSignTransport(
          {},
          {
            transporter: {
              transport: {
                mode: TransportMode.ROAD
              }
            }
          }
        );

        // Then
        expect(errors).toBeUndefined();
        expect(bsff?.transporters[0].transporterTransportMode).toBe(
          TransportMode.ROAD
        );
      });

      it("should throw error if transport mode is unset before signature", async () => {
        // When
        const { errors } = await prepareBsdffAndSignTransport(
          {
            transporterTransportMode: TransportMode.AIR
          },
          {
            transporter: {
              transport: {
                mode: null
              }
            }
          }
        );

        // Then
        expect(errors).not.toBeUndefined();
        expect(errors[0].message).toBe(
          "Le mode de transport n° 1 est obligatoire."
        );
      });
    });
  });

  describe("RECEPTION", () => {
    it("should allow destination to sign reception", async () => {
      const bsff = await createBsffBeforeReception({
        emitter,
        transporter,
        destination
      });

      const { mutate } = makeClient(destination.user);
      const { data, errors } = await mutate<
        Pick<Mutation, "signBsff">,
        MutationSignBsffArgs
      >(SIGN, {
        variables: {
          id: bsff.id,
          input: {
            type: "RECEPTION",
            date: new Date().toISOString() as any,
            author: destination.user.name
          }
        }
      });

      expect(errors).toBeUndefined();
      expect(data.signBsff.id).toBeTruthy();
    });

    it("should be possible to sign operation even if the last transporter multi-modal has not signed", async () => {
      const emitter = await userWithCompanyFactory("ADMIN");
      const destination = await userWithCompanyFactory("ADMIN");
      const transporter1 = await userWithCompanyFactory("ADMIN");
      const transporter2 = await userWithCompanyFactory("ADMIN");

      await transporterReceiptFactory({ company: transporter1.company });
      await transporterReceiptFactory({ company: transporter2.company });

      const bsff = await createBsffBeforeReception({
        emitter,
        transporter: transporter1,
        destination
      });

      // Ajoute un second transporteur qui n'a pas signé
      await addBsffTransporter({
        bsffId: bsff.id,
        transporter: transporter2
      });

      const { mutate } = makeClient(destination.user);
      const { data, errors } = await mutate<
        Pick<Mutation, "signBsff">,
        MutationSignBsffArgs
      >(SIGN, {
        variables: {
          id: bsff.id,
          input: {
            type: "RECEPTION",
            date: new Date().toISOString() as any,
            author: destination.user.name
          }
        }
      });

      expect(errors).toBeUndefined();
      expect(data.signBsff.id).toBeTruthy();

      const updatedBsff = await prisma.bsff.findUniqueOrThrow({
        where: { id: bsff.id },
        include: { transporters: true }
      });

      expect(updatedBsff.status).toEqual("RECEIVED");

      // le second transporteur qui n'a pas signé ne doit plus apparaitre sur le bordereau
      expect(updatedBsff.transporters).toHaveLength(1);
      expect(updatedBsff.transporters[0].transporterCompanySiret).toEqual(
        transporter1.company.siret
      );
      expect(
        updatedBsff.transporters[0].transporterTransportSignatureDate
      ).not.toBeNull();
    });
  });

  describe("ACCEPTATION", () => {
    it("should allow destination to sign refusal", async () => {
      const bsff = await createBsffBeforeRefusal({
        emitter,
        transporter,
        destination
      });

      const { mutate } = makeClient(destination.user);
      const { data, errors } = await mutate<
        Pick<Mutation, "signBsff">,
        MutationSignBsffArgs
      >(SIGN, {
        variables: {
          id: bsff.id,
          input: {
            type: "ACCEPTATION",
            date: new Date().toISOString() as any,
            author: destination.user.name
          }
        }
      });

      expect(errors).toBeUndefined();
      expect(data.signBsff.id).toBeTruthy();
    });

    it("should disallow destination to sign acceptation when required data is missing", async () => {
      const bsff = await createBsffAfterReception(
        {
          emitter,
          transporter,
          destination
        },
        {
          packagingData: {
            acceptationDate: null,
            acceptationStatus: null,
            acceptationWeight: null,
            acceptationWasteDescription: null
          }
        }
      );

      const { mutate } = makeClient(destination.user);
      const { errors } = await mutate<
        Pick<Mutation, "signBsff">,
        MutationSignBsffArgs
      >(SIGN, {
        variables: {
          id: bsff.id,
          input: {
            type: "ACCEPTATION",
            date: new Date().toISOString() as any,
            author: destination.user.name
          }
        }
      });

      expect(errors).toEqual([
        expect.objectContaining({
          message:
            "Le champ acceptationDate est obligatoire.\n" +
            "Le champ acceptationStatus est obligatoire.\n" +
            "Le champ acceptationWeight est obligatoire.\n" +
            "Le champ acceptationWasteDescription est obligatoire."
        })
      ]);
    });

    it("should disconnect previous packagings when refused", async () => {
      const ttr = await userWithCompanyFactory(UserRole.ADMIN);

      const bsff = await createBsffAfterOperation(
        { emitter, transporter, destination: ttr },
        {
          data: {
            status: BsffStatus.INTERMEDIATELY_PROCESSED
          },
          packagingData: { operationCode: OPERATION.R13.code }
        }
      );

      const nextBsff = await createBsffBeforeRefusal(
        {
          emitter: ttr,
          transporter,
          destination
        },
        {
          previousPackagings: bsff.packagings
        }
      );

      const { mutate } = makeClient(destination.user);
      await mutate<Pick<Mutation, "signBsff">, MutationSignBsffArgs>(SIGN, {
        variables: {
          id: nextBsff.id,
          input: {
            type: "ACCEPTATION",
            date: new Date().toISOString() as any,
            author: destination.user.name
          }
        }
      });

      const updatedBsff = await prisma.bsff.findUniqueOrThrow({
        where: { id: bsff.id },
        include: { packagings: true }
      });
      expect(updatedBsff.status).toEqual(BsffStatus.INTERMEDIATELY_PROCESSED);
      for (const packaging of updatedBsff.packagings) {
        expect(packaging.nextPackagingId).toEqual(null);
      }
    });

    it("should disconnect previous packagings when refused and signing for a specific packaging", async () => {
      const ttr = await userWithCompanyFactory(UserRole.ADMIN);

      const bsff1 = await createBsffAfterOperation(
        { emitter, transporter, destination: ttr },
        {
          data: { status: BsffStatus.INTERMEDIATELY_PROCESSED },
          packagingData: { operationCode: OPERATION.R12.code }
        }
      );

      const bsff2 = await createBsffBeforeOperation(
        { emitter, transporter, destination: ttr },
        {
          data: { status: BsffStatus.INTERMEDIATELY_PROCESSED },
          packagingData: { operationCode: OPERATION.R12.code }
        }
      );

      const beforeRefusalData = {
        acceptationWeight: 0,
        acceptationStatus: WasteAcceptationStatus.REFUSED,
        acceptationRefusalReason: "parce que",
        acceptationWasteCode: "14 06 01*",
        acceptationWasteDescription: "fluide",
        acceptationDate: new Date()
      };

      const beforeAcceptationData = {
        acceptationWeight: 1,
        acceptationStatus: WasteAcceptationStatus.ACCEPTED,
        acceptationWasteCode: "14 06 01*",
        acceptationWasteDescription: "fluide",
        acceptationDate: new Date()
      };

      // [bsff1, bsff2] => bsff3
      const nextBsff = await createBsffBeforeRefusal(
        {
          emitter: ttr,
          transporter,
          destination
        },
        {
          data: {
            type: BsffType.GROUPEMENT,
            packagings: {
              create: [
                createBsffPackaging(beforeRefusalData, bsff1.packagings),
                createBsffPackaging(beforeAcceptationData, bsff2.packagings)
              ]
            }
          }
        }
      );

      const { mutate } = makeClient(destination.user);

      // Sign refusal for first packaging
      await mutate<Pick<Mutation, "signBsff">, MutationSignBsffArgs>(SIGN, {
        variables: {
          id: nextBsff.id,
          input: {
            packagingId: nextBsff.packagings[0].id,
            type: "ACCEPTATION",
            date: new Date().toISOString() as any,
            author: destination.user.name
          }
        }
      });

      // Sign acceptation for second packaging
      await mutate<Pick<Mutation, "signBsff">, MutationSignBsffArgs>(SIGN, {
        variables: {
          id: nextBsff.id,
          input: {
            packagingId: nextBsff.packagings[1].id,
            type: "ACCEPTATION",
            date: new Date().toISOString() as any,
            author: destination.user.name
          }
        }
      });

      const updatedBsff1 = await prisma.bsff.findUniqueOrThrow({
        where: { id: bsff1.id },
        include: { packagings: true }
      });
      expect(updatedBsff1.status).toEqual(BsffStatus.INTERMEDIATELY_PROCESSED);
      // the previous packagings of the refused packaging should be disconnected
      expect(updatedBsff1.packagings[0].nextPackagingId).toBeNull();

      const updatedBsff2 = await prisma.bsff.findUniqueOrThrow({
        where: { id: bsff2.id },
        include: { packagings: true }
      });
      expect(updatedBsff2.status).toEqual(BsffStatus.INTERMEDIATELY_PROCESSED);
      // the previous packagings of the accepted packaging should still be present
      expect(updatedBsff2.packagings[0].nextPackagingId).toEqual(
        nextBsff.packagings[1].id
      );
    });

    it(
      "should set acceptationWasteCode to default value when not set explicitly" +
        " (in case of signature for all packagings)",
      async () => {
        const bsff = await createBsffBeforeAcceptation(
          {
            emitter,
            transporter,
            destination
          },
          { data: { wasteCode: "14 06 01*" } }
        );

        // make sure packaging acceptation waste code is not defined
        await prisma.bsffPackaging.update({
          where: { id: bsff.packagings[0].id },
          data: { acceptationWasteCode: null }
        });

        const { mutate } = makeClient(destination.user);
        const { errors } = await mutate<
          Pick<Mutation, "signBsff">,
          MutationSignBsffArgs
        >(SIGN, {
          variables: {
            id: bsff.id,
            input: {
              type: "ACCEPTATION",
              date: new Date().toISOString() as any,
              author: destination.user.name
            }
          }
        });
        expect(errors).toBeUndefined();

        const acceptedBsffPackaging =
          await prisma.bsffPackaging.findUniqueOrThrow({
            where: { id: bsff.packagings[0].id }
          });

        expect(acceptedBsffPackaging.acceptationWasteCode).toEqual("14 06 01*");
      }
    );

    it(
      "should set acceptationWasteCode to default value when not set explicitly" +
        " (in case of signature for a specific packaging)",
      async () => {
        const bsff = await createBsffBeforeAcceptation(
          {
            emitter,
            transporter,
            destination
          },
          { data: { wasteCode: "14 06 01*" } }
        );

        // make sure packaging acceptation waste code is not defined
        await prisma.bsffPackaging.update({
          where: { id: bsff.packagings[0].id },
          data: { acceptationWasteCode: null }
        });

        const { id, previousPackagings, ...packagingData } = bsff.packagings[0];
        await prisma.bsffPackaging.create({
          data: { ...packagingData, acceptationWasteCode: "14 06 02*" }
        });

        const packagings = await prisma.bsff
          .findUniqueOrThrow({ where: { id: bsff.id } })
          .packagings();

        const { mutate } = makeClient(destination.user);
        await mutate<Pick<Mutation, "signBsff">, MutationSignBsffArgs>(SIGN, {
          variables: {
            id: bsff.id,
            input: {
              packagingId: packagings[0].id,
              type: "ACCEPTATION",
              date: new Date().toISOString() as any,
              author: destination.user.name
            }
          }
        });

        await mutate<Pick<Mutation, "signBsff">, MutationSignBsffArgs>(SIGN, {
          variables: {
            id: bsff.id,
            input: {
              packagingId: packagings[1].id,
              type: "ACCEPTATION",
              date: new Date().toISOString() as any,
              author: destination.user.name
            }
          }
        });

        const acceptedBsffPackagings = await prisma.bsff
          .findUniqueOrThrow({
            where: { id: bsff.id }
          })
          .packagings();

        expect(acceptedBsffPackagings[0].acceptationWasteCode).toEqual(
          "14 06 01*"
        );
        expect(acceptedBsffPackagings[1].acceptationWasteCode).toEqual(
          "14 06 02*"
        );
      }
    );
  });

  describe("OPERATION", () => {
    it("should allow destination to sign operation", async () => {
      const bsff = await createBsffBeforeOperation({
        emitter,
        transporter,
        destination
      });

      const { mutate } = makeClient(destination.user);
      const { data, errors } = await mutate<
        Pick<Mutation, "signBsff">,
        MutationSignBsffArgs
      >(SIGN, {
        variables: {
          id: bsff.id,
          input: {
            type: "OPERATION",
            date: new Date().toISOString() as any,
            author: destination.user.name
          }
        }
      });

      expect(errors).toBeUndefined();
      expect(data.signBsff.id).toBeTruthy();

      await new Promise(resolve => {
        operationHooksQueue.once("global:drained", () => resolve(true));
      });

      const signedBsff = await prisma.bsff.findUniqueOrThrow({
        where: { id: data.signBsff.id },
        include: { packagings: { include: { finalOperations: true } } }
      });

      // final operation should be set
      expect(signedBsff.packagings[0].finalOperations).toHaveLength(1);
    });

    it("should allow destination to sign operation for a specific packaging", async () => {
      const bsff = await createBsffBeforeOperation({
        emitter,
        transporter,
        destination
      });

      const { mutate } = makeClient(destination.user);
      const { data, errors } = await mutate<
        Pick<Mutation, "signBsff">,
        MutationSignBsffArgs
      >(SIGN, {
        variables: {
          id: bsff.id,
          input: {
            type: "OPERATION",
            date: new Date().toISOString() as any,
            author: destination.user.name,
            packagingId: bsff.packagings[0].id
          }
        }
      });

      expect(errors).toBeUndefined();
      expect(data.signBsff.id).toBeTruthy();

      await new Promise(resolve => {
        operationHooksQueue.once("global:drained", () => resolve(true));
      });

      const signedBsff = await prisma.bsff.findUniqueOrThrow({
        where: { id: data.signBsff.id },
        include: { packagings: { include: { finalOperations: true } } }
      });

      // final operation should be set
      expect(signedBsff.packagings[0].finalOperations).toHaveLength(1);
    });

    it("should allow signing a bsff for reexpedition", async () => {
      const bsff = await createBsffBeforeOperation(
        {
          emitter,
          transporter,
          destination
        },
        {
          packagingData: {
            operationCode: OPERATION.R13.code,
            operationMode: null,
            operationNextDestinationCompanyName: "ACME INC",
            operationNextDestinationPlannedOperationCode: "R2",
            operationNextDestinationCap: "cap",
            operationNextDestinationCompanySiret: null,
            operationNextDestinationCompanyVatNumber: "IE9513674T",
            operationNextDestinationCompanyAddress: "Quelque part",
            operationNextDestinationCompanyContact: "Mr Déchet",
            operationNextDestinationCompanyPhone: "01 00 00 00 00",
            operationNextDestinationCompanyMail: "contact@trackdechets.fr"
          }
        }
      );

      const { mutate } = makeClient(destination.user);
      const { data, errors } = await mutate<
        Pick<Mutation, "signBsff">,
        MutationSignBsffArgs
      >(SIGN, {
        variables: {
          id: bsff.id,
          input: {
            type: "OPERATION",
            date: new Date().toISOString() as any,
            author: destination.user.name
          }
        }
      });

      expect(errors).toBeUndefined();
      expect(data.signBsff.id).toBeTruthy();
    });

    it("should mark all BSFFs in the history as PROCESSED after a reexpedition", async () => {
      const ttr1 = await userWithCompanyFactory(UserRole.ADMIN);
      const ttr2 = await userWithCompanyFactory(UserRole.ADMIN);

      const bsff1 = await createBsffAfterOperation(
        { emitter, transporter, destination: ttr1 },
        {
          data: {
            status: BsffStatus.INTERMEDIATELY_PROCESSED
          },
          packagingData: { operationCode: OPERATION.R13.code }
        }
      );

      // bsff1 => bsff2
      const bsff2 = await createBsffAfterOperation(
        {
          emitter: ttr1,
          transporter,
          destination: ttr2
        },
        {
          previousPackagings: bsff1.packagings,
          data: {
            type: BsffType.REEXPEDITION,
            status: BsffStatus.INTERMEDIATELY_PROCESSED
          },
          packagingData: { operationCode: OPERATION.R13.code }
        }
      );

      // bsff1 => bsff2 => bsff3
      const bsff3 = await createBsffBeforeOperation(
        {
          emitter: ttr2,
          transporter,
          destination
        },
        {
          previousPackagings: bsff2.packagings,
          data: { type: BsffType.REEXPEDITION },
          packagingData: { operationCode: OPERATION.R2.code }
        }
      );

      const { mutate } = makeClient(destination.user);
      const { data, errors } = await mutate<
        Pick<Mutation, "signBsff">,
        MutationSignBsffArgs
      >(SIGN, {
        variables: {
          id: bsff3.id,
          input: {
            type: "OPERATION",
            date: new Date().toISOString() as any,
            author: destination.user.name
          }
        }
      });

      expect(errors).toBeUndefined();
      expect(data.signBsff.id).toBeTruthy();

      const newBsff1 = await prisma.bsff.findUniqueOrThrow({
        where: { id: bsff1.id }
      });
      expect(newBsff1.status).toEqual(BsffStatus.PROCESSED);

      const newBsff2 = await prisma.bsff.findUniqueOrThrow({
        where: { id: bsff2.id }
      });
      expect(newBsff2.status).toEqual(BsffStatus.PROCESSED);
    });

    it(
      "should mark all BSFFs in the history as PROCESSED after a groupement " +
        "when signing all packagings at once",
      async () => {
        const ttr1 = await userWithCompanyFactory(UserRole.ADMIN);

        const bsff1 = await createBsffAfterOperation(
          { emitter, transporter, destination: ttr1 },
          {
            data: {
              status: BsffStatus.INTERMEDIATELY_PROCESSED
            },
            packagingData: { operationCode: OPERATION.R12.code }
          }
        );

        const bsff2 = await createBsffAfterOperation(
          { emitter, transporter, destination: ttr1 },
          {
            data: {
              status: BsffStatus.INTERMEDIATELY_PROCESSED
            },
            packagingData: { operationCode: OPERATION.R12.code }
          }
        );

        const beforeOperationData = {
          acceptationWeight: 1,
          acceptationStatus: WasteAcceptationStatus.ACCEPTED,
          acceptationWasteCode: "14 06 01*",
          acceptationWasteDescription: "fluide",
          acceptationDate: new Date(),
          operationMode: OperationMode.REUTILISATION,
          operationDate: new Date(),
          operationDescription: "réutilisation",
          acceptationSignatureAuthor: "Juste Leblanc",
          acceptationSignatureDate: new Date().toISOString(),
          operationCode: OPERATION.R2.code
        };

        // [bsff1, bsff2] => bsff3
        const bsff3 = await createBsffBeforeOperation(
          {
            emitter: ttr1,
            transporter,
            destination
          },
          {
            data: {
              type: BsffType.GROUPEMENT,
              packagings: {
                create: [
                  createBsffPackaging(beforeOperationData, bsff1.packagings),
                  createBsffPackaging(beforeOperationData, bsff2.packagings)
                ]
              }
            }
          }
        );

        expect(bsff1.status).toEqual(BsffStatus.INTERMEDIATELY_PROCESSED);

        const { mutate } = makeClient(destination.user);
        const { data, errors } = await mutate<
          Pick<Mutation, "signBsff">,
          MutationSignBsffArgs
        >(SIGN, {
          variables: {
            id: bsff3.id,
            input: {
              type: "OPERATION",
              date: new Date().toISOString() as any,
              author: destination.user.name
            }
          }
        });

        expect(errors).toBeUndefined();
        expect(data.signBsff.id).toBeTruthy();

        const newBsff1 = await prisma.bsff.findUniqueOrThrow({
          where: { id: bsff1.id }
        });
        expect(newBsff1.status).toEqual(BsffStatus.PROCESSED);

        const newBsff2 = await prisma.bsff.findUniqueOrThrow({
          where: { id: bsff2.id }
        });
        expect(newBsff2.status).toEqual(BsffStatus.PROCESSED);
      }
    );

    it(
      "should mark all BSFFs in the history as PROCESSED after a groupement " +
        "when signing packagings one by one",
      async () => {
        const ttr1 = await userWithCompanyFactory(UserRole.ADMIN);

        const bsff1 = await createBsffAfterOperation(
          { emitter, transporter, destination: ttr1 },
          {
            data: {
              status: BsffStatus.INTERMEDIATELY_PROCESSED
            },
            packagingData: { operationCode: OPERATION.R12.code }
          }
        );

        const bsff2 = await createBsffAfterOperation(
          { emitter, transporter, destination: ttr1 },
          {
            data: {
              status: BsffStatus.INTERMEDIATELY_PROCESSED
            },
            packagingData: { operationCode: OPERATION.R12.code }
          }
        );

        const beforeOperationData = {
          acceptationWeight: 1,
          acceptationStatus: WasteAcceptationStatus.ACCEPTED,
          acceptationWasteCode: "14 06 01*",
          acceptationWasteDescription: "fluide",
          acceptationDate: new Date(),
          operationMode: OperationMode.REUTILISATION,
          operationDate: new Date(),
          operationDescription: "réutilisation",
          acceptationSignatureAuthor: "Juste Leblanc",
          acceptationSignatureDate: new Date().toISOString(),
          operationCode: OPERATION.R2.code
        };

        // [bsff1, bsff2] => bsff3
        const bsff3 = await createBsffBeforeOperation(
          {
            emitter: ttr1,
            transporter,
            destination
          },
          {
            data: {
              type: BsffType.GROUPEMENT,
              packagings: {
                create: [
                  createBsffPackaging(beforeOperationData, bsff1.packagings),
                  createBsffPackaging(beforeOperationData, bsff2.packagings)
                ]
              }
            }
          }
        );

        expect(bsff1.status).toEqual(BsffStatus.INTERMEDIATELY_PROCESSED);

        const { mutate } = makeClient(destination.user);
        await mutate<Pick<Mutation, "signBsff">, MutationSignBsffArgs>(SIGN, {
          variables: {
            id: bsff3.id,
            input: {
              type: "OPERATION",
              date: new Date().toISOString() as any,
              author: destination.user.name,
              packagingId: bsff3.packagings[0].id
            }
          }
        });

        const newBsff1 = await prisma.bsff.findUniqueOrThrow({
          where: { id: bsff1.id }
        });
        expect(newBsff1.status).toEqual(BsffStatus.PROCESSED);

        let newBsff2 = await prisma.bsff.findUniqueOrThrow({
          where: { id: bsff2.id }
        });

        expect(newBsff2.status).toEqual(BsffStatus.INTERMEDIATELY_PROCESSED);

        await mutate<Pick<Mutation, "signBsff">, MutationSignBsffArgs>(SIGN, {
          variables: {
            id: bsff3.id,
            input: {
              type: "OPERATION",
              date: new Date().toISOString() as any,
              author: destination.user.name,
              packagingId: bsff3.packagings[1].id
            }
          }
        });

        newBsff2 = await prisma.bsff.findUniqueOrThrow({
          where: { id: bsff2.id }
        });

        expect(newBsff2.status).toEqual(BsffStatus.PROCESSED);
      }
    );
  });
});
