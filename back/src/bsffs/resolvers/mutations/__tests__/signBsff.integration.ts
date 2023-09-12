import {
  BsffStatus,
  BsffType,
  TransporterReceipt,
  UserRole
} from "@prisma/client";
import { gql } from "graphql-tag";
import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  Mutation,
  MutationSignBsffArgs
} from "../../../../generated/graphql/types";
import prisma from "../../../../prisma";
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
  createBsffAfterTransport,
  createBsffBeforeOperation,
  createBsffAfterOperation,
  createBsffBeforeAcceptation
} from "../../../__tests__/factories";
import { REQUIRED_RECEIPT_NUMBER } from "../../../../common/validation";

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
          emitterEmissionSignatureDate: null,
          emitterEmissionSignatureAuthor: null
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
            "Le transporteur ne peut pas signer l'enlèvement avant que l'émetteur ait signé le bordereau"
        })
      ]);
    });

    it("should throw an error if the transporter tries to sign without receipt", async () => {
      const bsff = await createBsffBeforeTransport({
        emitter,
        transporter,
        destination
      });
      // remove the receipt
      await prisma.transporterReceipt.delete({ where: { id: receipt.id } });
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
          message: expect.stringContaining(REQUIRED_RECEIPT_NUMBER)
        })
      ]);
      // restore it
      receipt = await transporterReceiptFactory({
        company: transporter.company
      });
    });

    it("should be possible for the emitter to sign a BSFF where the transporter is not yet specified", async () => {
      const bsff = await createBsffBeforeEmission(
        { emitter, destination },
        {
          emitterEmissionSignatureDate: null,
          emitterEmissionSignatureAuthor: null
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
          extensions: {
            code: "BAD_USER_INPUT"
          }
        })
      ]);
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
      const bsff = await createBsffAfterTransport({
        emitter,
        transporter,
        destination
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

      expect(errors).toEqual([
        expect.objectContaining({
          extensions: {
            code: "BAD_USER_INPUT"
          }
        })
      ]);
    });

    it("should disconnect previous packagings when refused", async () => {
      const ttr = await userWithCompanyFactory(UserRole.ADMIN);

      const bsff = await createBsffAfterOperation(
        { emitter, transporter, destination: ttr },
        {
          status: BsffStatus.INTERMEDIATELY_PROCESSED
        },
        { operationCode: OPERATION.R13.code }
      );

      const nextBsff = await createBsffBeforeRefusal({
        emitter: ttr,
        transporter,
        destination,
        previousPackagings: bsff.packagings
      });

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

      const bsff = await createBsffAfterOperation(
        { emitter, transporter, destination: ttr },
        {
          status: BsffStatus.INTERMEDIATELY_PROCESSED
        },
        { operationCode: OPERATION.R13.code }
      );

      const nextBsff = await createBsffBeforeRefusal({
        emitter: ttr,
        transporter,
        destination,
        previousPackagings: bsff.packagings
      });

      const { mutate } = makeClient(destination.user);
      await mutate<Pick<Mutation, "signBsff">, MutationSignBsffArgs>(SIGN, {
        variables: {
          id: nextBsff.id,
          input: {
            packagingId: bsff.packagings[0].id,
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

      const refusedPackaging = await prisma.bsffPackaging.findUniqueOrThrow({
        where: { id: bsff.packagings[0].id },
        include: { previousPackagings: true }
      });

      expect(refusedPackaging.previousPackagings).toEqual([]);
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
          { wasteCode: "14 06 01*" }
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
          { wasteCode: "14 06 01*" }
        );

        // make sure packaging acceptation waste code is not defined
        await prisma.bsffPackaging.update({
          where: { id: bsff.packagings[0].id },
          data: { acceptationWasteCode: null }
        });

        const { id, ...packagingData } = bsff.packagings[0];
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
    });

    it("should allow signing a bsff for reexpedition", async () => {
      const bsff = await createBsffBeforeOperation(
        {
          emitter,
          transporter,
          destination
        },
        {},
        {
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

    it("should mark all BSFFs in the history as PROCESSED", async () => {
      const ttr1 = await userWithCompanyFactory(UserRole.ADMIN);
      const ttr2 = await userWithCompanyFactory(UserRole.ADMIN);

      const bsff1 = await createBsffAfterOperation(
        { emitter, transporter, destination: ttr1 },
        {
          status: BsffStatus.INTERMEDIATELY_PROCESSED
        },
        { operationCode: OPERATION.R13.code }
      );

      // bsff1 => bsff2
      const bsff2 = await createBsffAfterOperation(
        {
          emitter: ttr1,
          transporter,
          destination: ttr2,
          previousPackagings: bsff1.packagings
        },
        {
          type: BsffType.REEXPEDITION,
          status: BsffStatus.INTERMEDIATELY_PROCESSED
        },
        { operationCode: OPERATION.R13.code }
      );

      // bsff1 => bsff2 => bsff3
      const bsff3 = await createBsffBeforeOperation(
        {
          emitter: ttr2,
          transporter,
          destination,
          previousPackagings: bsff2.packagings
        },
        { type: BsffType.REEXPEDITION },
        { operationCode: OPERATION.R2.code }
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
  });
});
