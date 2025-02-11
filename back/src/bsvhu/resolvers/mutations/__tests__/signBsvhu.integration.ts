import { resetDatabase } from "../../../../../integration-tests/helper";
import { ErrorCode } from "../../../../common/errors";
import type {
  BsvhuInput,
  Mutation,
  SignatureTypeInput
} from "@td/codegen-back";
import {
  siretify,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { bsvhuFactory } from "../../../__tests__/factories.vhu";
import {
  companyFactory,
  transporterReceiptFactory
} from "../../../../__tests__/factories";
import { prisma } from "@td/prisma";
import { TransportMode, User } from "@prisma/client";
import gql from "graphql-tag";

const SIGN_VHU = gql`
  mutation SignVhu($id: ID!, $input: BsvhuSignatureInput!) {
    signBsvhu(id: $id, input: $input) {
      id
      status
      emitter {
        emission {
          signature {
            author
            date
          }
        }
      }
      transporter {
        transport {
          signature {
            author
            date
          }
        }
      }
      destination {
        reception {
          signature {
            author
            date
          }
        }
      }
    }
  }
`;

const UPDATE_VHU = gql`
  mutation UpdateVhu($id: ID!, $input: BsvhuInput!) {
    updateBsvhu(id: $id, input: $input) {
      id
    }
  }
`;

describe("Mutation.Vhu.sign", () => {
  describe("", () => {
    afterEach(resetDatabase);

    it("should disallow unauthenticated user", async () => {
      const { mutate } = makeClient();
      const { errors } = await mutate(SIGN_VHU, {
        variables: {
          id: 1,
          input: { type: "EMISSION", author: "The Ghost" }
        }
      });

      expect(errors).toEqual([
        expect.objectContaining({
          message: "Vous n'êtes pas connecté.",
          extensions: expect.objectContaining({
            code: ErrorCode.UNAUTHENTICATED
          })
        })
      ]);
    });

    it("should set a default signature date if none is given", async () => {
      const { user, company } = await userWithCompanyFactory("MEMBER");
      const bsvhu = await bsvhuFactory({
        opt: {
          emitterCompanySiret: company.siret
        }
      });

      const { mutate } = makeClient(user);
      const { data } = await mutate<Pick<Mutation, "signBsvhu">>(SIGN_VHU, {
        variables: {
          id: bsvhu.id,
          input: { type: "EMISSION", author: user.name }
        }
      });

      expect(data.signBsvhu.emitter!.emission!.signature!.author).toBe(
        user.name
      );
      expect(data.signBsvhu.emitter!.emission!.signature!.date).not.toBeNull();
    });
    it("should forbid another company to sign EMISSION  when security code is not provided", async () => {
      const { company: emitterCompany } = await userWithCompanyFactory(
        "MEMBER",
        {
          securityCode: 9421
        }
      );
      const { user, company } = await userWithCompanyFactory("MEMBER");
      const bsvhu = await bsvhuFactory({
        opt: {
          emitterCompanySiret: emitterCompany.siret,
          destinationCompanySiret: company.siret
        }
      });

      const { mutate } = makeClient(user);
      const { errors } = await mutate<Pick<Mutation, "signBsvhu">>(SIGN_VHU, {
        variables: {
          id: bsvhu.id,
          input: { type: "EMISSION", author: user.name }
        }
      });
      expect(errors).toEqual([
        expect.objectContaining({
          message: "Vous ne pouvez pas signer ce bordereau",
          extensions: expect.objectContaining({
            code: ErrorCode.FORBIDDEN
          })
        })
      ]);
    });

    it("should forbid another company to sign EMISSION when security code is wrong", async () => {
      const { company: emitterCompany } = await userWithCompanyFactory(
        "MEMBER",
        {
          securityCode: 9421
        }
      );
      const { user, company } = await userWithCompanyFactory("MEMBER");
      const bsvhu = await bsvhuFactory({
        opt: {
          emitterCompanySiret: emitterCompany.siret,
          destinationCompanySiret: company.siret
        }
      });

      const { mutate } = makeClient(user);
      const { errors } = await mutate<Pick<Mutation, "signBsvhu">>(SIGN_VHU, {
        variables: {
          id: bsvhu.id,
          input: { type: "EMISSION", author: user.name, securityCode: 5555 }
        }
      });
      expect(errors).toEqual([
        expect.objectContaining({
          message: "Le code de signature est invalide.",
          extensions: expect.objectContaining({
            code: ErrorCode.FORBIDDEN
          })
        })
      ]);
    });

    it("should allow another company to sign EMISSION when security code is provided", async () => {
      const { company: emitterCompany } = await userWithCompanyFactory(
        "MEMBER",
        {
          securityCode: 9421
        }
      );
      const { user, company } = await userWithCompanyFactory("MEMBER", {
        companyTypes: ["WASTE_VEHICLES"],
        wasteVehiclesTypes: ["BROYEUR", "DEMOLISSEUR"]
      });
      const bsvhu = await bsvhuFactory({
        opt: {
          emitterCompanySiret: emitterCompany.siret,
          destinationCompanySiret: company.siret
        }
      });

      const { mutate } = makeClient(user);
      const { data } = await mutate<Pick<Mutation, "signBsvhu">>(SIGN_VHU, {
        variables: {
          id: bsvhu.id,
          input: { type: "EMISSION", author: user.name, securityCode: 9421 }
        }
      });

      expect(data.signBsvhu.emitter!.emission!.signature!.author).toBe(
        user.name
      );
      expect(data.signBsvhu.emitter!.emission!.signature!.date).not.toBeNull();
    });

    it("should forbid another company to sign TRANSPORT when security code is not provided", async () => {
      const { user: emitter, company: emitterCompany } =
        await userWithCompanyFactory("MEMBER");
      const { company: transporterCompany } = await userWithCompanyFactory(
        "MEMBER",
        {
          companyTypes: ["TRANSPORTER"],
          securityCode: 9421
        }
      );

      await transporterReceiptFactory({ company: transporterCompany });
      const bsvhu = await bsvhuFactory({
        opt: {
          emitterCompanySiret: emitterCompany.siret,
          transporterCompanySiret: transporterCompany.siret,
          status: "SIGNED_BY_PRODUCER"
        }
      });

      const { mutate } = makeClient(emitter);
      const { errors } = await mutate<Pick<Mutation, "signBsvhu">>(SIGN_VHU, {
        variables: {
          id: bsvhu.id,
          input: { type: "TRANSPORT", author: emitter.name }
        }
      });

      const signedBsvhu = await prisma.bsvhu.findUnique({
        where: { id: bsvhu.id }
      });
      expect(signedBsvhu?.status).toEqual("SIGNED_BY_PRODUCER");

      expect(errors).toEqual([
        expect.objectContaining({
          message: "Vous ne pouvez pas signer ce bordereau",
          extensions: expect.objectContaining({
            code: ErrorCode.FORBIDDEN
          })
        })
      ]);
    });

    it("should forbid another company to sign TRANSPORT when security code is wrong", async () => {
      const { user: emitter, company: emitterCompany } =
        await userWithCompanyFactory("MEMBER");
      const { company: transporterCompany } = await userWithCompanyFactory(
        "MEMBER",
        {
          companyTypes: ["TRANSPORTER"],
          securityCode: 9421
        }
      );

      await transporterReceiptFactory({ company: transporterCompany });
      const bsvhu = await bsvhuFactory({
        opt: {
          emitterCompanySiret: emitterCompany.siret,
          transporterCompanySiret: transporterCompany.siret,
          status: "SIGNED_BY_PRODUCER"
        }
      });

      const { mutate } = makeClient(emitter);
      const { errors } = await mutate<Pick<Mutation, "signBsvhu">>(SIGN_VHU, {
        variables: {
          id: bsvhu.id,
          input: { type: "TRANSPORT", author: emitter.name, securityCode: 3333 }
        }
      });

      const signedBsvhu = await prisma.bsvhu.findUnique({
        where: { id: bsvhu.id }
      });
      expect(signedBsvhu?.status).toEqual("SIGNED_BY_PRODUCER");

      expect(errors).toEqual([
        expect.objectContaining({
          message: "Le code de signature est invalide.",
          extensions: expect.objectContaining({
            code: ErrorCode.FORBIDDEN
          })
        })
      ]);
    });

    it("should allow another company to sign TRANSPORT when security code is provided", async () => {
      const { user: emitter, company: emitterCompany } =
        await userWithCompanyFactory("MEMBER", {});
      const { company: transporterCompany } = await userWithCompanyFactory(
        "MEMBER",
        {
          companyTypes: ["TRANSPORTER"],
          securityCode: 9421
        }
      );

      await transporterReceiptFactory({ company: transporterCompany });
      const bsvhu = await bsvhuFactory({
        opt: {
          emitterCompanySiret: emitterCompany.siret,
          transporterCompanySiret: transporterCompany.siret,
          status: "SIGNED_BY_PRODUCER",
          transporterTransportPlates: ["XY-23-TR"]
        }
      });

      const { mutate } = makeClient(emitter);
      const { data } = await mutate<Pick<Mutation, "signBsvhu">>(SIGN_VHU, {
        variables: {
          id: bsvhu.id,
          input: { type: "TRANSPORT", author: emitter.name, securityCode: 9421 }
        }
      });

      const signedBsvhu = await prisma.bsvhu.findUnique({
        where: { id: bsvhu.id }
      });
      expect(signedBsvhu?.status).toEqual("SENT");

      expect(data.signBsvhu.transporter!.transport!.signature!.author).toBe(
        emitter.name
      );
      expect(
        data.signBsvhu.transporter!.transport!.signature!.date
      ).not.toBeNull();
    });

    it("should use the provided date for the signature if  given", async () => {
      const { user, company } = await userWithCompanyFactory("MEMBER");
      const bsvhu = await bsvhuFactory({
        opt: {
          emitterCompanySiret: company.siret
        }
      });

      const date = new Date().toISOString();
      const { mutate } = makeClient(user);
      const { data } = await mutate<Pick<Mutation, "signBsvhu">>(SIGN_VHU, {
        variables: {
          id: bsvhu.id,
          input: { type: "EMISSION", author: user.name, date }
        }
      });

      expect(data.signBsvhu.emitter!.emission!.signature!.author).toBe(
        user.name
      );
      expect(data.signBsvhu.emitter!.emission!.signature!.date).toBe(date);
    });

    it("should require emitter signature if the emitter is on TD and situation is not irregular", async () => {
      const emitterCompany = await companyFactory();
      const { user, company } = await userWithCompanyFactory("MEMBER", {
        companyTypes: ["TRANSPORTER"]
      });

      const bsvhu = await bsvhuFactory({
        opt: {
          emitterCompanySiret: emitterCompany.siret,
          transporterCompanySiret: company.siret,
          transporterRecepisseIsExempted: true,
          transporterTransportPlates: ["XY-23-TR"]
        }
      });

      const date = new Date().toISOString();
      const { mutate } = makeClient(user);
      const { errors } = await mutate<Pick<Mutation, "signBsvhu">>(SIGN_VHU, {
        variables: {
          id: bsvhu.id,
          input: { type: "TRANSPORT", author: user.name, date }
        }
      });
      expect(errors).toEqual([
        expect.objectContaining({
          message:
            "Vous ne pouvez pas apposer cette signature sur le bordereau.",
          extensions: expect.objectContaining({
            code: ErrorCode.BAD_USER_INPUT
          })
        })
      ]);
    });

    it("should require transporter plates when transport mode is ROAD", async () => {
      const emitterCompany = await companyFactory();
      const { user, company } = await userWithCompanyFactory("MEMBER", {
        companyTypes: ["TRANSPORTER"]
      });

      const bsvhu = await bsvhuFactory({
        opt: {
          emitterCompanySiret: emitterCompany.siret,
          transporterCompanySiret: company.siret,
          transporterRecepisseIsExempted: true,
          status: "SIGNED_BY_PRODUCER"
        }
      });

      const date = new Date().toISOString();
      const { mutate } = makeClient(user);
      const { errors } = await mutate<Pick<Mutation, "signBsvhu">>(SIGN_VHU, {
        variables: {
          id: bsvhu.id,
          input: { type: "TRANSPORT", author: user.name, date }
        }
      });
      expect(errors).toEqual([
        expect.objectContaining({
          message: "L'immatriculation du transporteur est un champ requis.",
          extensions: expect.objectContaining({
            code: ErrorCode.BAD_USER_INPUT
          })
        })
      ]);
    });

    it("should not require transporter plates when transport mode is ROAD and bsvhu was created before release date", async () => {
      const emitterCompany = await companyFactory();
      const { user, company } = await userWithCompanyFactory("MEMBER", {
        companyTypes: ["TRANSPORTER"]
      });

      const bsvhu = await bsvhuFactory({
        opt: {
          createdAt: new Date("2024-12-26:00:00.000Z"), // before v20250101
          emitterCompanySiret: emitterCompany.siret,
          transporterCompanySiret: company.siret,
          transporterRecepisseIsExempted: true,
          status: "SIGNED_BY_PRODUCER"
        }
      });

      const date = new Date().toISOString();
      const { mutate } = makeClient(user);
      const { errors } = await mutate<Pick<Mutation, "signBsvhu">>(SIGN_VHU, {
        variables: {
          id: bsvhu.id,
          input: { type: "TRANSPORT", author: user.name, date }
        }
      });
      expect(errors).toBeUndefined(); // plates are not required
    });

    it.each([
      TransportMode.RAIL,
      TransportMode.AIR,
      TransportMode.RIVER,
      TransportMode.SEA,
      TransportMode.OTHER
    ])(
      "should require not transporter plates when transport mode is %p",
      async mode => {
        const emitterCompany = await companyFactory();
        const { user, company } = await userWithCompanyFactory("MEMBER", {
          companyTypes: ["TRANSPORTER"]
        });

        const bsvhu = await bsvhuFactory({
          opt: {
            emitterCompanySiret: emitterCompany.siret,
            transporterCompanySiret: company.siret,
            transporterRecepisseIsExempted: true,
            transporterTransportMode: mode,
            status: "SIGNED_BY_PRODUCER"
          }
        });

        const date = new Date().toISOString();
        const { mutate } = makeClient(user);
        const { errors, data } = await mutate<Pick<Mutation, "signBsvhu">>(
          SIGN_VHU,
          {
            variables: {
              id: bsvhu.id,
              input: { type: "TRANSPORT", author: user.name, date }
            }
          }
        );
        expect(errors).toBeUndefined();

        expect(data.signBsvhu.transporter!.transport!.signature!.author).toBe(
          user.name
        );
        expect(data.signBsvhu.transporter!.transport!.signature!.date).toBe(
          date
        );
      }
    );

    it("should require emitter signature if the emitter is on TD and situation is irregular", async () => {
      const emitterCompany = await companyFactory();
      const { user, company } = await userWithCompanyFactory("MEMBER", {
        companyTypes: ["TRANSPORTER"]
      });

      const bsvhu = await bsvhuFactory({
        opt: {
          emitterIrregularSituation: true,
          emitterCompanySiret: emitterCompany.siret,
          transporterCompanySiret: company.siret,
          transporterRecepisseIsExempted: true,
          transporterTransportPlates: ["XY-23-TR"]
        }
      });

      const date = new Date().toISOString();
      const { mutate } = makeClient(user);
      const { errors } = await mutate<Pick<Mutation, "signBsvhu">>(SIGN_VHU, {
        variables: {
          id: bsvhu.id,
          input: { type: "TRANSPORT", author: user.name, date }
        }
      });
      expect(errors).toEqual([
        expect.objectContaining({
          message:
            "Vous ne pouvez pas apposer cette signature sur le bordereau.",
          extensions: expect.objectContaining({
            code: ErrorCode.BAD_USER_INPUT
          })
        })
      ]);
    });

    it("should not require emitter signature if the emitter is not on TD and situation is irregular", async () => {
      const { user, company } = await userWithCompanyFactory("MEMBER", {
        companyTypes: ["TRANSPORTER"]
      });

      const bsvhu = await bsvhuFactory({
        opt: {
          emitterIrregularSituation: true,
          emitterCompanySiret: siretify(45345),
          transporterCompanySiret: company.siret,
          transporterRecepisseIsExempted: true,
          transporterTransportPlates: ["XY-23-TR"]
        }
      });

      const date = new Date().toISOString();
      const { mutate } = makeClient(user);
      const { data } = await mutate<Pick<Mutation, "signBsvhu">>(SIGN_VHU, {
        variables: {
          id: bsvhu.id,
          input: { type: "TRANSPORT", author: user.name, date }
        }
      });
      expect(data.signBsvhu.transporter!.transport!.signature!.author).toBe(
        user.name
      );
      expect(data.signBsvhu.transporter!.transport!.signature!.date).toBe(date);
    });

    it("should not require emitter signature if the emitter doesn't have a SIRET and situation is irregular", async () => {
      const { user, company } = await userWithCompanyFactory("MEMBER", {
        companyTypes: ["TRANSPORTER"]
      });

      const bsvhu = await bsvhuFactory({
        opt: {
          emitterIrregularSituation: true,
          emitterNoSiret: true,
          emitterCompanySiret: null,
          transporterCompanySiret: company.siret,
          transporterRecepisseIsExempted: true,
          transporterTransportPlates: ["XY-23-TR"]
        }
      });

      const date = new Date().toISOString();
      const { mutate } = makeClient(user);
      const { data } = await mutate<Pick<Mutation, "signBsvhu">>(SIGN_VHU, {
        variables: {
          id: bsvhu.id,
          input: { type: "TRANSPORT", author: user.name, date }
        }
      });

      expect(data.signBsvhu.transporter!.transport!.signature!.author).toBe(
        user.name
      );
      expect(data.signBsvhu.transporter!.transport!.signature!.date).toBe(date);
    });
  });

  // New signature step "RECEPTION".
  // As it is a non-breaking change, it is optional and can be skipped.
  describe("RECEPTION", () => {
    const SIGNATURE_DATE = new Date().toISOString();

    let emitterUser;
    let emitterCompany;
    let destinationUser;
    let destinationCompany;

    beforeAll(async () => {
      await resetDatabase();

      // Emitter
      const emitter = await userWithCompanyFactory("MEMBER", {
        companyTypes: ["PRODUCER"]
      });
      emitterUser = emitter.user;
      emitterCompany = emitter.company;

      // Destination
      const destination = await userWithCompanyFactory("MEMBER", {
        companyTypes: ["WASTE_VEHICLES"],
        wasteVehiclesTypes: ["BROYEUR", "DEMOLISSEUR"]
      });
      destinationUser = destination.user;
      destinationCompany = destination.company;
    });

    afterAll(resetDatabase);

    const signVhu = async (
      user: User,
      bsvhuId: string,
      signatureType: SignatureTypeInput
    ) => {
      const { mutate } = makeClient(user);
      return mutate<Pick<Mutation, "signBsvhu">>(SIGN_VHU, {
        variables: {
          id: bsvhuId,
          input: {
            type: signatureType,
            author: user.name,
            date: SIGNATURE_DATE
          }
        }
      });
    };

    const updateVhu = async (
      user: User,
      bsvhuId: string,
      input: BsvhuInput
    ) => {
      const { mutate } = makeClient(user);
      return mutate<Pick<Mutation, "updateBsvhu">>(UPDATE_VHU, {
        variables: {
          id: bsvhuId,
          input
        }
      });
    };

    it("should be able to sign reception after transport", async () => {
      // Given
      const bsvhu = await bsvhuFactory({
        opt: {
          status: "SENT",
          emitterCompanySiret: emitterCompany.siret,
          destinationCompanySiret: destinationCompany.siret,
          transporterTransportSignatureAuthor: "Transporter",
          transporterTransportSignatureDate: new Date(),
          transporterTransportPlates: ["XY-23-TR"]
        }
      });

      // When

      // Step 1: update with required reception data
      const { errors: updateErrors } = await updateVhu(
        destinationUser,
        bsvhu.id,
        {
          // Reception data
          destination: {
            reception: {
              acceptationStatus: "ACCEPTED",
              weight: 20,
              date: new Date().toISOString() as any
            }
          }
        }
      );
      expect(updateErrors).toBeUndefined();

      // Step 2: sign reception
      const { errors, data } = await signVhu(
        destinationUser,
        bsvhu.id,
        "RECEPTION"
      );

      // Then
      expect(errors).toBeUndefined();
      expect(data.signBsvhu.destination?.reception?.signature?.author).toBe(
        destinationUser.name
      );
      expect(data.signBsvhu.destination?.reception?.signature?.date).toBe(
        SIGNATURE_DATE
      );
      expect(data.signBsvhu.status).toBe("RECEIVED");
    });

    it("if signing reception after transport with status = REFUSED > new BSD status should be REFUSED", async () => {
      // Given
      const bsvhu = await bsvhuFactory({
        opt: {
          status: "SENT",
          emitterCompanySiret: emitterCompany.siret,
          destinationCompanySiret: destinationCompany.siret,
          transporterTransportSignatureAuthor: "Transporter",
          transporterTransportSignatureDate: new Date(),
          transporterTransportPlates: ["XY-23-TR"]
        }
      });

      // When

      // Step 1: update with required reception data
      const { errors: updateErrors } = await updateVhu(
        destinationUser,
        bsvhu.id,
        {
          // Reception data
          destination: {
            reception: {
              acceptationStatus: "REFUSED",
              weight: 0,
              refusalReason: "Not good enough mate",
              date: new Date().toISOString() as any
            }
          }
        }
      );
      expect(updateErrors).toBeUndefined();

      // Step 2: sign reception
      const { errors, data } = await signVhu(
        destinationUser,
        bsvhu.id,
        "RECEPTION"
      );

      // Then
      expect(errors).toBeUndefined();
      expect(data.signBsvhu.destination?.reception?.signature?.author).toBe(
        destinationUser.name
      );
      expect(data.signBsvhu.destination?.reception?.signature?.date).toBe(
        SIGNATURE_DATE
      );
      expect(data.signBsvhu.status).toBe("REFUSED");
    });

    it("should not be able to sign OPERATION if RECEPTION was REFUSED", async () => {
      // Given
      const bsvhu = await bsvhuFactory({
        opt: {
          status: "SENT",
          emitterCompanySiret: emitterCompany.siret,
          destinationCompanySiret: destinationCompany.siret,
          transporterTransportSignatureAuthor: "Transporter",
          transporterTransportSignatureDate: new Date(),
          transporterTransportPlates: ["XY-23-TR"]
        }
      });

      // When

      // Step 1: update with required reception data
      const { errors: updateErrors } = await updateVhu(
        destinationUser,
        bsvhu.id,
        {
          // Reception data
          destination: {
            reception: {
              acceptationStatus: "REFUSED",
              weight: 0,
              refusalReason: "Not good enough mate",
              date: new Date().toISOString() as any
            }
          }
        }
      );
      expect(updateErrors).toBeUndefined();

      // Step 2: sign reception
      const { errors: receptionErrors, data: receptionData } = await signVhu(
        destinationUser,
        bsvhu.id,
        "RECEPTION"
      );

      // Then
      expect(receptionErrors).toBeUndefined();
      expect(
        receptionData.signBsvhu.destination?.reception?.signature?.author
      ).toBe(destinationUser.name);
      expect(
        receptionData.signBsvhu.destination?.reception?.signature?.date
      ).toBe(SIGNATURE_DATE);
      expect(receptionData.signBsvhu.status).toBe("REFUSED");

      // Step 3: sign operation
      const { errors: operationErrors } = await signVhu(
        destinationUser,
        bsvhu.id,
        "OPERATION"
      );
      expect(operationErrors).not.toBeUndefined();
      expect(operationErrors[0].message).toBe(
        "Vous ne pouvez pas apposer cette signature sur le bordereau."
      );
    });

    it("should return error if trying to sign RECEPTION and reception params are not filled", async () => {
      // Given
      const bsvhu = await bsvhuFactory({
        opt: {
          status: "SENT",
          emitterCompanySiret: emitterCompany.siret,
          destinationCompanySiret: destinationCompany.siret,
          transporterTransportSignatureAuthor: "Transporter",
          transporterTransportSignatureDate: new Date(),
          transporterTransportPlates: ["XY-23-TR"],
          // Reception data
          destinationReceptionAcceptationStatus: null, // Missing param
          destinationReceptionWeight: null, // Missing param
          destinationReceptionDate: null // Missing param
        }
      });

      // When
      const { errors } = await signVhu(destinationUser, bsvhu.id, "RECEPTION");

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe(
        "Le statut d'acceptation du destinataire est un champ requis.\n" +
          "Le poids réel reçu est un champ requis.\n" +
          "La date de réception est un champ requis."
      );
    });

    it("should be able to sign operation after transport, skipping reception", async () => {
      // Given
      const bsvhu = await bsvhuFactory({
        opt: {
          status: "SENT",
          emitterCompanySiret: emitterCompany.siret,
          destinationCompanySiret: destinationCompany.siret,
          transporterTransportSignatureAuthor: "Transporter",
          transporterTransportSignatureDate: new Date(),
          transporterTransportPlates: ["XY-23-TR"]
        }
      });

      // When

      // Step 1: update with required reception data & operation data
      const { errors: updateErrors } = await updateVhu(
        destinationUser,
        bsvhu.id,
        {
          // Reception data
          destination: {
            reception: {
              acceptationStatus: "ACCEPTED",
              weight: 20
              // date: null, // Not required!
            },
            operation: {
              code: "R 5",
              date: new Date().toISOString() as any,
              mode: "REUTILISATION"
            }
          }
        }
      );
      expect(updateErrors).toBeUndefined();

      // Step 2: sign operation
      const { errors, data } = await signVhu(
        destinationUser,
        bsvhu.id,
        "OPERATION"
      );

      // Then
      expect(errors).toBeUndefined();
      expect(data.signBsvhu.destination?.reception?.signature?.author).toBe(
        undefined
      );
      expect(data.signBsvhu.destination?.reception?.signature?.date).toBe(
        undefined
      );
      expect(data.signBsvhu.status).toBe("PROCESSED");
    });

    it("should be able to REFUSE vhu at operation step, skipping reception", async () => {
      // Given
      const bsvhu = await bsvhuFactory({
        opt: {
          status: "SENT",
          emitterCompanySiret: emitterCompany.siret,
          destinationCompanySiret: destinationCompany.siret,
          transporterTransportSignatureAuthor: "Transporter",
          transporterTransportSignatureDate: new Date(),
          transporterTransportPlates: ["XY-23-TR"]
        }
      });

      // When

      // Step 1: update with required reception data
      const { errors: updateErrors } = await updateVhu(
        destinationUser,
        bsvhu.id,
        {
          // Reception data
          destination: {
            reception: {
              acceptationStatus: "REFUSED",
              refusalReason: "Not good enough",
              weight: 0
              // date: null, // Not required!
            }
          }
        }
      );
      expect(updateErrors).toBeUndefined();

      // Step 2: sign operation
      const { errors, data } = await signVhu(
        destinationUser,
        bsvhu.id,
        "OPERATION"
      );

      // Then
      expect(errors).toBeUndefined();
      expect(data.signBsvhu.destination?.reception?.signature?.author).toBe(
        undefined
      );
      expect(data.signBsvhu.destination?.reception?.signature?.date).toBe(
        undefined
      );
      expect(data.signBsvhu.status).toBe("REFUSED");
    });

    it("should not be able to sign operation after transport, skipping reception, if missing reception params", async () => {
      // Given
      const bsvhu = await bsvhuFactory({
        opt: {
          status: "SENT",
          emitterCompanySiret: emitterCompany.siret,
          destinationCompanySiret: destinationCompany.siret,
          transporterTransportSignatureAuthor: "Transporter",
          transporterTransportSignatureDate: new Date(),
          transporterTransportPlates: ["XY-23-TR"],
          // Missing reception data!
          destinationReceptionAcceptationStatus: null, // Missing param
          destinationReceptionWeight: null, // Missing param
          destinationReceptionDate: null, // Not required!
          // Operation data
          destinationOperationCode: "R 5",
          destinationOperationDate: new Date(),
          destinationOperationMode: "REUTILISATION"
        }
      });

      // When
      const { errors } = await signVhu(destinationUser, bsvhu.id, "OPERATION");

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe(
        "Le statut d'acceptation du destinataire est un champ requis.\n" +
          "Le poids réel reçu est un champ requis."
      );
    });

    it("should fail if VHU has already been received", async () => {
      // Given
      const bsvhu = await bsvhuFactory({
        opt: {
          status: "RECEIVED",
          emitterCompanySiret: emitterCompany.siret,
          destinationCompanySiret: destinationCompany.siret,
          transporterTransportSignatureAuthor: "Transporter",
          transporterTransportSignatureDate: new Date(),
          transporterTransportPlates: ["XY-23-TR"],
          // Reception data
          destinationReceptionAcceptationStatus: "ACCEPTED",
          destinationReceptionWeight: 20,
          destinationReceptionDate: new Date(),
          destinationReceptionSignatureAuthor: destinationUser.name,
          destinationReceptionSignatureDate: new Date()
        }
      });

      // When
      const { errors } = await signVhu(destinationUser, bsvhu.id, "RECEPTION");

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe("Cette signature a déjà été apposée.");
    });

    it("should fail if VHU has already been processed", async () => {
      // Given
      const bsvhu = await bsvhuFactory({
        opt: {
          status: "PROCESSED",
          emitterCompanySiret: emitterCompany.siret,
          destinationCompanySiret: destinationCompany.siret,
          transporterTransportSignatureAuthor: "Transporter",
          transporterTransportSignatureDate: new Date(),
          transporterTransportPlates: ["XY-23-TR"],
          // Reception data
          destinationReceptionAcceptationStatus: "ACCEPTED",
          destinationReceptionWeight: 20,
          destinationReceptionDate: new Date(),
          // Operation data
          destinationOperationCode: "R 5",
          destinationOperationDate: new Date(),
          destinationOperationMode: "REUTILISATION"
        }
      });

      // When
      const { errors } = await signVhu(destinationUser, bsvhu.id, "RECEPTION");

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe(
        "Vous ne pouvez pas apposer cette signature sur le bordereau."
      );
    });

    it("should fail if VHU hasn't been sent yet", async () => {
      // Given
      const bsvhu = await bsvhuFactory({
        opt: {
          status: "INITIAL",
          emitterCompanySiret: emitterCompany.siret,
          destinationCompanySiret: destinationCompany.siret,
          transporterTransportPlates: ["XY-23-TR"],
          // Reception data
          destinationReceptionAcceptationStatus: "ACCEPTED",
          destinationReceptionWeight: 20,
          destinationReceptionDate: new Date()
        }
      });

      // When
      const { errors } = await signVhu(destinationUser, bsvhu.id, "RECEPTION");

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe(
        "Vous ne pouvez pas apposer cette signature sur le bordereau."
      );
    });

    it("should return an error if not signed by destination", async () => {
      // Given
      const bsvhu = await bsvhuFactory({
        opt: {
          status: "SENT",
          emitterCompanySiret: emitterCompany.siret,
          destinationCompanySiret: destinationCompany.siret,
          transporterTransportSignatureAuthor: "Transporter",
          transporterTransportSignatureDate: new Date(),
          // Reception data
          destinationReceptionAcceptationStatus: "ACCEPTED",
          destinationReceptionWeight: 20,
          destinationReceptionDate: null
        }
      });

      // When
      const { errors } = await signVhu(emitterUser, bsvhu.id, "RECEPTION"); // Signed by emitter!

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe("Vous ne pouvez pas signer ce bordereau");
    });

    it("can NOT override reception data once reception has been signed", async () => {
      // Given
      const bsvhu = await bsvhuFactory({
        opt: {
          status: "RECEIVED", // Reception is signed!
          emitterCompanySiret: emitterCompany.siret,
          destinationCompanySiret: destinationCompany.siret,
          transporterTransportSignatureAuthor: "Transporter",
          transporterTransportSignatureDate: new Date(),
          transporterTransportPlates: ["XY-23-TR"],
          // Reception data
          destinationReceptionAcceptationStatus: "ACCEPTED",
          destinationReceptionWeight: 20,
          destinationReceptionDate: null, // Not required!
          destinationReceptionSignatureAuthor: destinationUser.name,
          destinationReceptionSignatureDate: new Date()
        }
      });

      // When: try to update reception data, but it's too late!
      // Reception has been signed already!
      const { errors } = await updateVhu(destinationUser, bsvhu.id, {
        destination: {
          reception: {
            acceptationStatus: "PARTIALLY_REFUSED",
            refusalReason: "Not enough weight",
            weight: 20,
            date: new Date().toISOString() as any
          }
        }
      });

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe(
        "Des champs ont été verrouillés via signature et ne peuvent" +
          " plus être modifiés : Le statut d'acceptation du destinataire, La raison du refus par le " +
          "destinataire, Le poids réel reçu, La date de réception"
      );
    });
  });
});
