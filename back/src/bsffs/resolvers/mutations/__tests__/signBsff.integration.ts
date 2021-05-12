import { UserRole } from ".prisma/client";
import getReadableId, { ReadableIdPrefix } from "../../../../forms/readableId";
import {
  Mutation,
  MutationSignBsffArgs
} from "../../../../generated/graphql/types";
import prisma from "../../../../prisma";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

const SIGN = `
  mutation Sign($id: ID!, $type: BsffSignatureType!, $signature: SignatureInput!, $securityCode: Int) {
    signBsff(id: $id, type: $type, signature: $signature, securityCode: $securityCode) {
      id
    }
  }
`;

describe("Mutation.signBsff", () => {
  it("should allow emitter to sign a bsff", async () => {
    const { user, company } = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await prisma.bsff.create({
      data: {
        id: getReadableId(ReadableIdPrefix.FF),
        emitterCompanySiret: company.siret
      }
    });

    const { mutate } = makeClient(user);
    const { data } = await mutate<
      Pick<Mutation, "signBsff">,
      MutationSignBsffArgs
    >(SIGN, {
      variables: {
        id: bsff.id,
        type: "EMITTER",
        signature: {
          date: new Date().toISOString() as any,
          author: user.name
        }
      }
    });

    expect(data.signBsff.id).toBeTruthy();
  });

  it("should disallow unauthenticated user from signing a bsff", async () => {
    const { mutate } = makeClient();
    const { errors } = await mutate<
      Pick<Mutation, "signBsff">,
      MutationSignBsffArgs
    >(SIGN, {
      variables: {
        id: "123",
        type: "EMITTER",
        signature: {
          date: new Date().toISOString() as any,
          author: "Jeanne Dupont"
        }
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

  it("should throw an error if the bsff being signed doesn't exist", async () => {
    const { user } = await userWithCompanyFactory(UserRole.ADMIN);

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "signBsff">,
      MutationSignBsffArgs
    >(SIGN, {
      variables: {
        id: "123",
        type: "EMITTER",
        signature: {
          date: new Date().toISOString() as any,
          author: user.name
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Le bordereau de fluides frigorigènes n°123 n'existe pas."
      })
    ]);
  });

  it("should allow the transporter to sign for the emitter with the security code", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await prisma.bsff.create({
      data: {
        id: getReadableId(ReadableIdPrefix.FF),
        emitterCompanySiret: emitter.company.siret,
        transporterCompanySiret: transporter.company.siret
      }
    });

    const { mutate } = makeClient(transporter.user);
    const { data } = await mutate<
      Pick<Mutation, "signBsff">,
      MutationSignBsffArgs
    >(SIGN, {
      variables: {
        id: bsff.id,
        type: "EMITTER",
        signature: {
          date: new Date().toISOString() as any,
          author: emitter.user.name
        },
        securityCode: emitter.company.securityCode
      }
    });

    expect(data.signBsff.id).toBeTruthy();
  });

  it("should disallow the transporter to sign for the emitter without the security code", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await prisma.bsff.create({
      data: {
        id: getReadableId(ReadableIdPrefix.FF),
        emitterCompanySiret: emitter.company.siret,
        transporterCompanySiret: transporter.company.siret
      }
    });

    const { mutate } = makeClient(transporter.user);
    const { errors } = await mutate<
      Pick<Mutation, "signBsff">,
      MutationSignBsffArgs
    >(SIGN, {
      variables: {
        id: bsff.id,
        type: "EMITTER",
        signature: {
          date: new Date().toISOString() as any,
          author: emitter.user.name
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous n'êtes pas autorisé à signer pour cet acteur."
      })
    ]);
  });

  it("should disallow the transporter to sign for the emitter with a wrong security code", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await prisma.bsff.create({
      data: {
        id: getReadableId(ReadableIdPrefix.FF),
        emitterCompanySiret: emitter.company.siret,
        transporterCompanySiret: transporter.company.siret
      }
    });

    const { mutate } = makeClient(transporter.user);
    const { errors } = await mutate<
      Pick<Mutation, "signBsff">,
      MutationSignBsffArgs
    >(SIGN, {
      variables: {
        id: bsff.id,
        type: "EMITTER",
        signature: {
          date: new Date().toISOString() as any,
          author: emitter.user.name
        },
        securityCode: 1
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Le code de sécurité est incorrect."
      })
    ]);
  });

  it("should throw an error when the emitter tries to sign twice", async () => {
    const { user, company } = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await prisma.bsff.create({
      data: {
        id: getReadableId(ReadableIdPrefix.FF),
        emitterCompanySiret: company.siret,
        emitterEmissionSignatureDate: new Date().toISOString()
      }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "signBsff">,
      MutationSignBsffArgs
    >(SIGN, {
      variables: {
        id: bsff.id,
        type: "EMITTER",
        signature: {
          date: new Date().toISOString() as any,
          author: user.name
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: "L'émetteur de ce bordereau a déjà signé."
      })
    ]);
  });

  it("should throw an error if the transporter tries to sign without the emitter's signature", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await prisma.bsff.create({
      data: {
        id: getReadableId(ReadableIdPrefix.FF),
        emitterCompanySiret: emitter.company.siret,
        transporterCompanySiret: transporter.company.siret
      }
    });

    const { mutate } = makeClient(transporter.user);
    const { errors } = await mutate<
      Pick<Mutation, "signBsff">,
      MutationSignBsffArgs
    >(SIGN, {
      variables: {
        id: bsff.id,
        type: "TRANSPORTER",
        signature: {
          date: new Date().toISOString() as any,
          author: transporter.user.name
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Le transporteur ne peut pas signer l'enlèvement avant que l'émetteur ait signé le bordereau."
      })
    ]);
  });

  it("should allow the transporter to sign after the emitter", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await prisma.bsff.create({
      data: {
        id: getReadableId(ReadableIdPrefix.FF),
        emitterCompanySiret: emitter.company.siret,
        emitterEmissionSignatureDate: new Date().toISOString(),
        transporterCompanySiret: transporter.company.siret
      }
    });

    const { mutate } = makeClient(transporter.user);
    const { data } = await mutate<
      Pick<Mutation, "signBsff">,
      MutationSignBsffArgs
    >(SIGN, {
      variables: {
        id: bsff.id,
        type: "TRANSPORTER",
        signature: {
          date: new Date().toISOString() as any,
          author: transporter.user.name
        }
      }
    });

    expect(data.signBsff.id).toBeTruthy();
  });
});
