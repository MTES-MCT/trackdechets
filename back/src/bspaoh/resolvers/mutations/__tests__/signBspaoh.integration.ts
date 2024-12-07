import { UserRole } from "@prisma/client";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { ErrorCode } from "../../../../common/errors";
import type { Mutation, MutationSignBspaohArgs } from "@td/codegen-back";

import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

import { gql } from "graphql-tag";
import { fullBspaoh } from "../../../fragments";
import { buildPdfAsBase64 } from "../../../pdf/generator";

jest.mock("../../../pdf/generator");
(buildPdfAsBase64 as jest.Mock).mockResolvedValue("");

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

  it("should disallow unauthenticated user", async () => {
    const { mutate } = makeClient();
    const { errors } = await mutate(SIGN_BSPAOH, {
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

  it("should throw an error if the bspaoh being signed doesn't exist", async () => {
    const { user } = await userWithCompanyFactory(UserRole.ADMIN);

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "signBspaoh">,
      MutationSignBspaohArgs
    >(SIGN_BSPAOH, {
      variables: {
        id: "123",
        input: {
          author: user.name,
          type: "EMISSION"
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Le bordereau avec l'identifiant \"123\" n'existe pas."
      })
    ]);
  });
});
