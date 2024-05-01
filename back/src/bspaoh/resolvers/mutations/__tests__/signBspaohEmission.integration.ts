import { UserRole } from "@prisma/client";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { ErrorCode } from "../../../../common/errors";
import {
  Mutation,
  MutationSignBspaohArgs
} from "../../../../generated/graphql/types";

import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { bspaohFactory } from "../../../__tests__/factories";

import { gql } from "graphql-tag";
import { fullBspaoh } from "../../../fragments";

const SIGN_BSPAOH = gql`
  mutation SignBspaoh($id: ID!, $input: BspaohSignatureInput!) {
    signBspaoh(id: $id, input: $input) {
      ...FullBspaoh
    }
  }
  ${fullBspaoh}
`;

describe("Mutation.Bspaoh.sign", () => {
  afterEach(resetDatabase);

  describe("EMISSION", () => {
    it("should allow emitter to sign", async () => {
      const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
      const bspaoh = await bspaohFactory({
        opt: {
          emitterCompanySiret: company.siret
        }
      });

      const { mutate } = makeClient(user);
      const { data } = await mutate<
        Pick<Mutation, "signBspaoh">,
        MutationSignBspaohArgs
      >(SIGN_BSPAOH, {
        variables: {
          id: bspaoh.id,
          input: {
            author: user.name,
            type: "EMISSION"
          }
        }
      });

      expect(data.signBspaoh.id).toBeTruthy();
      // check transporter is populated
      expect(data.signBspaoh?.transporter?.company?.siret).toBeTruthy();
    });

    it("should throw an error if the bspaoh is missing required data when the emitter tries to sign", async () => {
      const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
      const bspaoh = await bspaohFactory({
        opt: {
          emitterCompanySiret: company.siret,
          wasteCode: null // missing field
        }
      });

      const { mutate } = makeClient(user);
      const { errors } = await mutate<
        Pick<Mutation, "signBspaoh">,
        MutationSignBspaohArgs
      >(SIGN_BSPAOH, {
        variables: {
          id: bspaoh.id,
          input: {
            author: user.name,
            type: "EMISSION"
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

    it("should throw error if the destination (exutoire) is not completed", async () => {
      const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
      const bspaoh = await bspaohFactory({
        opt: {
          emitterCompanySiret: company.siret,
          destinationCompanySiret: null,
          destinationCompanyName: null,
          destinationCompanyAddress: null,
          destinationCompanyContact: null,
          destinationCompanyPhone: null,
          destinationCompanyMail: null,
          destinationCap: null,
          destinationOperationCode: null
        }
      });

      const { mutate } = makeClient(user);
      const { errors } = await mutate<
        Pick<Mutation, "signBspaoh">,
        MutationSignBspaohArgs
      >(SIGN_BSPAOH, {
        variables: {
          id: bspaoh.id,
          input: {
            author: user.name,
            type: "EMISSION"
          }
        }
      });

      expect(errors).toEqual([
        expect.objectContaining({
          message:
            "Le nom de l'entreprise de destination est obligatoire.\n" +
            "Le SIRET de l'entreprise de destination est obligatoire.\n" +
            "L'adresse de l'entreprise de destination est obligatoire.\n" +
            "Le nom de contact de l'entreprise de destination est obligatoire.\n" +
            "Le téléphone de l'entreprise de destination est obligatoire.\n" +
            "L'email de l'entreprise de destination est obligatoire."
        })
      ]);

      expect(errors).toEqual([
        expect.objectContaining({
          extensions: expect.objectContaining({
            code: "BAD_USER_INPUT"
          })
        })
      ]);
    });

    it("should disallow the transporter to sign for the emitter ", async () => {
      const emitter = await userWithCompanyFactory(UserRole.ADMIN);
      const transporter = await userWithCompanyFactory(UserRole.ADMIN);
      const bspaoh = await bspaohFactory({
        opt: {
          emitterCompanySiret: emitter.company.siret,

          transporters: {
            create: {
              transporterCompanySiret: transporter.company.siret,
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
            author: emitter.user.name,
            type: "EMISSION"
          }
        }
      });

      expect(errors).toEqual([
        expect.objectContaining({
          extensions: expect.objectContaining({
            code: ErrorCode.FORBIDDEN
          })
        })
      ]);
    });

    it("should throw an error when the emitter tries to sign twice", async () => {
      const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
      const bspaoh = await bspaohFactory({
        opt: {
          emitterCompanySiret: company.siret,
          status: "SIGNED_BY_PRODUCER",
          emitterEmissionSignatureAuthor: "Emetteur",
          emitterEmissionSignatureDate: new Date()
        }
      });

      const { mutate } = makeClient(user);
      const { errors } = await mutate<
        Pick<Mutation, "signBspaoh">,
        MutationSignBspaohArgs
      >(SIGN_BSPAOH, {
        variables: {
          id: bspaoh.id,
          input: {
            author: user.name,
            type: "EMISSION"
          }
        }
      });

      expect(errors).toEqual([
        expect.objectContaining({
          message: "Cette signature a déjà été apposée."
        })
      ]);
    });

    it("should throw an error if the transporter tries to sign without the emitter's signature", async () => {
      const emitter = await userWithCompanyFactory(UserRole.ADMIN);
      const transporter = await userWithCompanyFactory(UserRole.ADMIN);
      const bspaoh = await bspaohFactory({
        opt: {
          emitterCompanySiret: emitter.company.siret,
          emitterEmissionSignatureDate: null,
          emitterEmissionSignatureAuthor: null,
          transporters: {
            create: {
              transporterCompanySiret: transporter.company.siret,
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
            author: transporter.user.name,
            type: "EMISSION"
          }
        }
      });

      expect(errors).toEqual([
        expect.objectContaining({
          extensions: expect.objectContaining({
            code: ErrorCode.FORBIDDEN
          })
        })
      ]);
    });
  });
});
