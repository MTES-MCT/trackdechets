import { UserRole } from ".prisma/client";
import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  Mutation,
  MutationSignBsffArgs
} from "../../../../generated/graphql/types";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import {
  createBsff,
  createBsffBeforeEmission,
  createBsffAfterEmission,
  createBsffBeforeTransport
} from "../../../__tests__/factories";

const SIGN = `
  mutation Sign($id: ID!, $type: BsffSignatureType!, $signature: SignatureInput!, $securityCode: Int) {
    signBsff(id: $id, type: $type, signature: $signature, securityCode: $securityCode) {
      id
    }
  }
`;

describe("Mutation.signBsff", () => {
  afterEach(resetDatabase);

  it("should allow emitter to sign a bsff", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN, {
      address: "12 rue de la Grue, 69000 Lyon",
      contactPhone: "06",
      contactEmail: "contact@gmail.com"
    });
    const bsff = await createBsffBeforeEmission({ emitter });

    const { mutate } = makeClient(emitter.user);
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
        }
      }
    });

    expect(data.signBsff.id).toBeTruthy();
  });

  it("should throw an error if the bsff is missing required data when the emitter tries to sign", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN, {
      address: "12 rue de la Grue, 69000 Lyon",
      contactPhone: "06",
      contactEmail: "contact@gmail.com"
    });
    const bsff = await createBsff({ emitter });

    const { mutate } = makeClient(emitter.user);
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
        extensions: {
          code: "BAD_USER_INPUT"
        }
      })
    ]);
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
    const emitter = await userWithCompanyFactory(UserRole.ADMIN, {
      address: "12 rue de la Grue, 69000 Lyon",
      contactPhone: "06",
      contactEmail: "contact@gmail.com"
    });
    const transporter = await userWithCompanyFactory(UserRole.ADMIN, {
      address: "12 rue de la Grue, 69000 Lyon",
      contactPhone: "06",
      contactEmail: "contact@gmail.com"
    });
    const bsff = await createBsffBeforeEmission({ emitter, transporter });

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
    const emitter = await userWithCompanyFactory(UserRole.ADMIN, {
      address: "12 rue de la Grue, 69000 Lyon",
      contactPhone: "06",
      contactEmail: "contact@gmail.com"
    });
    const transporter = await userWithCompanyFactory(UserRole.ADMIN, {
      address: "12 rue de la Grue, 69000 Lyon",
      contactPhone: "06",
      contactEmail: "contact@gmail.com"
    });
    const bsff = await createBsffBeforeEmission({ emitter, transporter });

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
    const emitter = await userWithCompanyFactory(UserRole.ADMIN, {
      address: "12 rue de la Grue, 69000 Lyon",
      contactPhone: "06",
      contactEmail: "contact@gmail.com"
    });
    const transporter = await userWithCompanyFactory(UserRole.ADMIN, {
      address: "12 rue de la Grue, 69000 Lyon",
      contactPhone: "06",
      contactEmail: "contact@gmail.com"
    });
    const bsff = await createBsffBeforeEmission({ emitter, transporter });

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
    const emitter = await userWithCompanyFactory(UserRole.ADMIN, {
      address: "12 rue de la Grue, 69000 Lyon",
      contactPhone: "06",
      contactEmail: "contact@gmail.com"
    });
    const bsff = await createBsffAfterEmission({ emitter });

    const { mutate } = makeClient(emitter.user);
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
        message: "L'entreprise émettrice a déjà signé ce bordereau"
      })
    ]);
  });

  it("should throw an error if the transporter tries to sign without the emitter's signature", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN, {
      address: "12 rue de la Grue, 69000 Lyon",
      contactPhone: "06",
      contactEmail: "contact@gmail.com"
    });
    const transporter = await userWithCompanyFactory(UserRole.ADMIN, {
      address: "12 rue de la Grue, 69000 Lyon",
      contactPhone: "06",
      contactEmail: "contact@gmail.com"
    });
    const bsff = await createBsffBeforeTransport(
      { emitter, transporter },
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
          "Le transporteur ne peut pas signer l'enlèvement avant que l'émetteur ait signé le bordereau"
      })
    ]);
  });

  it("should allow the transporter to sign after the emitter", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN, {
      address: "12 rue de la Grue, 69000 Lyon",
      contactPhone: "06",
      contactEmail: "contact@gmail.com"
    });
    const transporter = await userWithCompanyFactory(UserRole.ADMIN, {
      address: "12 rue de la Grue, 69000 Lyon",
      contactPhone: "06",
      contactEmail: "contact@gmail.com"
    });
    const bsff = await createBsffBeforeTransport({ emitter, transporter });

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

  it("should throw an error if the bsff is missing required data when the transporter tries to sign", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN, {
      address: "12 rue de la Grue, 69000 Lyon",
      contactPhone: "06",
      contactEmail: "contact@gmail.com"
    });
    const transporter = await userWithCompanyFactory(UserRole.ADMIN, {
      address: "12 rue de la Grue, 69000 Lyon",
      contactPhone: "06",
      contactEmail: "contact@gmail.com"
    });
    const bsff = await createBsffAfterEmission({ emitter, transporter });

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
        extensions: {
          code: "BAD_USER_INPUT"
        }
      })
    ]);
  });
});
