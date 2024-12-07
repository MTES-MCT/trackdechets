import { BspaohStatus, TransportMode, UserRole } from "@prisma/client";
import { resetDatabase } from "../../../../../integration-tests/helper";

import type {
  Mutation,
  MutationSignBspaohArgs,
  MutationUpdateBspaohArgs
} from "@td/codegen-back";

import {
  transporterReceiptFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { bspaohFactory } from "../../../__tests__/factories";

import { gql } from "graphql-tag";
import { fullBspaoh } from "../../../fragments";
import { prisma } from "@td/prisma";

const SIGN_BSPAOH = gql`
  mutation SignBspaoh($id: ID!, $input: BspaohSignatureInput!) {
    signBspaoh(id: $id, input: $input) {
      ...FullBspaoh
    }
  }
  ${fullBspaoh}
`;

const UPDATE_BSPAOH = gql`
  mutation UpdateBspaoh($id: ID!, $input: BspaohInput!) {
    updateBspaoh(id: $id, input: $input) {
      ...FullBspaoh
    }
  }
  ${fullBspaoh}
`;

describe("Mutation.Bspaoh.sign", () => {
  afterEach(resetDatabase);

  describe("TRANSPORT", () => {
    it("should allow transporter to sign transport when exempted of receipt", async () => {
      const transporter = await userWithCompanyFactory(UserRole.ADMIN);

      const bspaoh = await bspaohFactory({
        opt: {
          status: BspaohStatus.SIGNED_BY_PRODUCER,
          emitterEmissionSignatureAuthor: "Emetteur",
          emitterEmissionSignatureDate: new Date(),

          transporters: {
            create: {
              transporterCompanySiret: transporter.company.siret,
              transporterRecepisseIsExempted: true,
              transporterTransportMode: "ROAD",
              transporterTransportPlates: ["AA-00-XX"],
              transporterTakenOverAt: new Date(),
              number: 1
            }
          }
        }
      });

      const { mutate } = makeClient(transporter.user);
      const { data } = await mutate<
        Pick<Mutation, "signBspaoh">,
        MutationSignBspaohArgs
      >(SIGN_BSPAOH, {
        variables: {
          id: bspaoh.id,
          input: {
            type: "TRANSPORT",
            author: transporter.user.name
          }
        }
      });

      expect(data.signBspaoh.id).toBeTruthy();
    });

    it("should allow transporter to sign transport and auto-complete the receipt", async () => {
      const transporter = await userWithCompanyFactory(UserRole.ADMIN);
      const receipt = await transporterReceiptFactory({
        company: transporter.company
      });

      const bspaoh = await bspaohFactory({
        opt: {
          status: BspaohStatus.SIGNED_BY_PRODUCER,
          emitterEmissionSignatureAuthor: "Emetteur",
          emitterEmissionSignatureDate: new Date(),

          transporters: {
            create: {
              transporterRecepisseIsExempted: true,
              transporterCompanySiret: transporter.company.siret,
              transporterTransportMode: "ROAD",
              transporterTransportPlates: ["AA-00-XX"],
              transporterTakenOverAt: new Date(),
              number: 1
            }
          }
        }
      });
      const { mutate } = makeClient(transporter.user);
      const { data } = await mutate<
        Pick<Mutation, "signBspaoh">,
        MutationSignBspaohArgs
      >(SIGN_BSPAOH, {
        variables: {
          id: bspaoh.id,
          input: {
            type: "TRANSPORT",
            author: transporter.user.name
          }
        }
      });

      expect(data.signBspaoh.id).toBeTruthy();
      expect(data.signBspaoh.transporter?.recepisse?.department).toBe(
        receipt.department
      );
      expect(data.signBspaoh.transporter?.recepisse?.number).toBe(
        receipt.receiptNumber
      );
      expect(data.signBspaoh.transporter?.recepisse?.validityLimit).toBe(
        receipt.validityLimit.toISOString()
      );
    });
    it("should disallow transporter to sign transport if plates are missing and mode is ROAD", async () => {
      const transporter = await userWithCompanyFactory(UserRole.ADMIN);
      await transporterReceiptFactory({
        company: transporter.company
      });

      const bspaoh = await bspaohFactory({
        opt: {
          status: BspaohStatus.SIGNED_BY_PRODUCER,
          emitterEmissionSignatureAuthor: "Emetteur",
          emitterEmissionSignatureDate: new Date(),

          transporters: {
            create: {
              transporterRecepisseIsExempted: true,
              transporterCompanySiret: transporter.company.siret,
              transporterTransportMode: "ROAD",
              transporterTransportPlates: [],
              transporterTakenOverAt: new Date(),
              number: 1
            }
          }
        }
      });
      const { mutate } = makeClient(transporter.user);
      const { errors } = await mutate<
        Pick<Mutation, "signBspaoh">,
        MutationSignBspaohArgs
      >(SIGN_BSPAOH, {
        variables: {
          id: bspaoh.id,
          input: {
            type: "TRANSPORT",
            author: transporter.user.name
          }
        }
      });

      expect(errors).toEqual([
        expect.objectContaining({
          message: expect.stringContaining(
            "La plaque d'immatriculation est requise"
          )
        })
      ]);
    });

    it("should disallow transporter to sign transport when recepisse is missing", async () => {
      const transporter = await userWithCompanyFactory(UserRole.ADMIN);

      const bspaoh = await bspaohFactory({
        opt: {
          status: BspaohStatus.SIGNED_BY_PRODUCER,
          emitterEmissionSignatureAuthor: "Emetteur",
          emitterEmissionSignatureDate: new Date(),

          transporters: {
            create: {
              transporterRecepisseIsExempted: null,
              transporterCompanySiret: transporter.company.siret,
              transporterTransportMode: "ROAD",
              transporterTransportPlates: ["AA-00-XX"],
              transporterRecepisseNumber: null,
              transporterTakenOverAt: new Date(),
              number: 1
            }
          }
        }
      });
      const { mutate } = makeClient(transporter.user);
      const { errors } = await mutate<
        Pick<Mutation, "signBspaoh">,
        MutationSignBspaohArgs
      >(SIGN_BSPAOH, {
        variables: {
          id: bspaoh.id,
          input: {
            type: "TRANSPORT",
            author: transporter.user.name
          }
        }
      });

      expect(errors).toEqual([
        expect.objectContaining({
          message: expect.stringContaining(
            "Le numéro de récépissé du transporteur est obligatoire. L'établissement doit renseigner son récépissé dans Trackdéchets"
          )
        })
      ]);
    });

    it("should disallow transporter to sign transport when required data is missing", async () => {
      const transporter = await userWithCompanyFactory(UserRole.ADMIN);

      const bspaoh = await bspaohFactory({
        opt: {
          status: BspaohStatus.SIGNED_BY_PRODUCER,
          emitterEmissionSignatureAuthor: "Emetteur",
          emitterEmissionSignatureDate: new Date(),

          transporters: {
            create: {
              transporterRecepisseIsExempted: null,
              transporterCompanySiret: transporter.company.siret,
              transporterTransportMode: "ROAD",
              transporterTransportPlates: ["AA-00-XX"],
              transporterRecepisseNumber: null, // Missing recepisse and not exempted
              transporterTakenOverAt: new Date(),
              number: 1
            }
          }
        }
      });

      const { mutate } = makeClient(transporter.user);
      const { errors } = await mutate<
        Pick<Mutation, "signBspaoh">,
        MutationSignBspaohArgs
      >(SIGN_BSPAOH, {
        variables: {
          id: bspaoh.id,
          input: {
            type: "TRANSPORT",
            author: transporter.user.name
          }
        }
      });

      expect(errors).toEqual([
        expect.objectContaining({
          extensions: expect.objectContaining({
            code: "BAD_USER_INPUT"
          })
        })
      ]);
    });

    it("should disallow transporter to sign transport when bspaoh is not SIGNED_BY_PRODUCER", async () => {
      const transporter = await userWithCompanyFactory(UserRole.ADMIN);
      const transporterReceipt = await transporterReceiptFactory({
        company: transporter.company
      });

      const bspaoh = await bspaohFactory({
        opt: {
          status: BspaohStatus.INITIAL,

          transporters: {
            create: {
              transporterRecepisseIsExempted: null,
              transporterCompanySiret: transporter.company.siret,
              transporterTransportMode: "ROAD",
              transporterTransportPlates: ["AA-00-XX"],
              transporterRecepisseNumber: transporterReceipt.receiptNumber,
              transporterRecepisseDepartment: transporterReceipt.department,
              transporterRecepisseValidityLimit:
                transporterReceipt.validityLimit,
              transporterTakenOverAt: new Date(),
              number: 1
            }
          }
        }
      });
      const { mutate } = makeClient(transporter.user);
      const { errors } = await mutate<
        Pick<Mutation, "signBspaoh">,
        MutationSignBspaohArgs
      >(SIGN_BSPAOH, {
        variables: {
          id: bspaoh.id,
          input: {
            type: "TRANSPORT",
            author: transporter.user.name
          }
        }
      });

      expect(errors).toEqual([
        expect.objectContaining({
          message:
            "Vous ne pouvez pas apposer cette signature sur le bordereau.",
          extensions: {
            code: "BAD_USER_INPUT"
          }
        })
      ]);
    });
  });

  // Transport mode is now required at transporter signature step
  describe("transporterTransportMode", () => {
    const prepareBspaohAndSignTransport = async (
      transporterOpt,
      updateOpt?
    ) => {
      // Create PAOH
      const transporter = await userWithCompanyFactory(UserRole.ADMIN);
      const bspaoh = await bspaohFactory({
        opt: {
          status: BspaohStatus.SIGNED_BY_PRODUCER,
          emitterEmissionSignatureAuthor: "Emetteur",
          emitterEmissionSignatureDate: new Date(),
          transporters: {
            create: {
              transporterCompanySiret: transporter.company.siret,
              transporterRecepisseIsExempted: true,
              transporterTransportMode: null,
              transporterTransportPlates: ["AA-00-XX"],
              transporterTakenOverAt: new Date(),
              ...transporterOpt,
              number: 1
            }
          }
        }
      });

      // Update ?
      const { mutate } = makeClient(transporter.user);
      if (updateOpt) {
        if (updateOpt) {
          await mutate<
            Pick<Mutation, "updateBspaoh">,
            MutationUpdateBspaohArgs
          >(UPDATE_BSPAOH, {
            variables: {
              id: bspaoh.id,
              input: {
                ...updateOpt
              }
            }
          });
        }
      }

      // Sign transport
      const { errors } = await mutate<
        Pick<Mutation, "signBspaoh">,
        MutationSignBspaohArgs
      >(SIGN_BSPAOH, {
        variables: {
          id: bspaoh.id,
          input: {
            type: "TRANSPORT",
            author: transporter.user.name
          }
        }
      });

      const updatedBspaoh = await prisma.bspaoh.findFirst({
        where: { id: bspaoh.id },
        include: { transporters: true }
      });

      return { errors, bspaoh: updatedBspaoh };
    };

    it("should throw error if transport mode is not defined", async () => {
      // When
      const { errors } = await prepareBspaohAndSignTransport({});

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe("Le mode de transport est obligatoire.");
    });

    it("should work if transport mode is in initial BSD", async () => {
      // When
      const { errors, bspaoh } = await prepareBspaohAndSignTransport({
        transporterTransportMode: TransportMode.ROAD
      });

      // Then
      expect(errors).toBeUndefined();
      expect(bspaoh?.transporters[0].transporterTransportMode).toBe(
        TransportMode.ROAD
      );
    });

    it("should work if transport mode is given before transporter signature", async () => {
      // When
      const { errors, bspaoh } = await prepareBspaohAndSignTransport(
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
      expect(bspaoh?.transporters[0].transporterTransportMode).toBe(
        TransportMode.ROAD
      );
    });

    it("should throw error if transport mode is unset before signature", async () => {
      // When
      const { errors } = await prepareBspaohAndSignTransport(
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
      expect(errors[0].message).toBe("Le mode de transport est obligatoire.");
    });
  });
});
