import { resetDatabase } from "../../../../../integration-tests/helper";
import { ErrorCode } from "../../../../common/errors";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { bspaohFactory } from "../../../__tests__/factories";
import { Mutation } from "../../../../generated/graphql/types";
import { BspaohStatus } from "@prisma/client";
import { fullBspaoh } from "../../../fragments";
import { gql } from "graphql-tag";

const PUBLISH_BSPAOH = gql`
  ${fullBspaoh}
  mutation PublishBspaoh($id: ID!) {
    publishBspaoh(id: $id) {
      ...FullBspaoh
    }
  }
`;
describe("Mutation.publishBspaoh", () => {
  afterEach(resetDatabase);

  it("should disallow unauthenticated user", async () => {
    const { company } = await userWithCompanyFactory("MEMBER");
    const bspaoh = await bspaohFactory({
      opt: {
        status: BspaohStatus.DRAFT,
        emitterCompanySiret: company.siret
      }
    });
    const { mutate } = makeClient(); // unauthenticated user
    const { errors } = await mutate<Pick<Mutation, "publishBspaoh">>(
      PUBLISH_BSPAOH,
      {
        variables: {
          id: bspaoh.id
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous n'êtes pas connecté.",
        extensions: expect.objectContaining({
          code: ErrorCode.UNAUTHENTICATED
        })
      })
    ]);
  });

  it("should publish a draft bspaoh", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const bspaoh = await bspaohFactory({
      opt: {
        status: BspaohStatus.DRAFT,
        emitterCompanySiret: company.siret,
        canAccessDraftSirets: [company.siret as string]
      }
    });

    const { mutate } = makeClient(user); // emitter

    const { data } = await mutate<Pick<Mutation, "publishBspaoh">>(
      PUBLISH_BSPAOH,
      {
        variables: {
          id: bspaoh.id
        }
      }
    );

    expect(data.publishBspaoh.status).toBe("INITIAL");
    expect(data.publishBspaoh.isDraft).toBe(false);
    // check transporter is populated
    expect(data.publishBspaoh?.transporter?.company?.siret).toBeTruthy();
  });

  it("should not publish a draft bspaoh if required packagings infos are not complete", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const bspaoh = await bspaohFactory({
      opt: {
        status: BspaohStatus.DRAFT,
        emitterCompanySiret: company.siret,
        canAccessDraftSirets: [company.siret as string],
        wastePackagings: [
          {
            id: "packaging_1",
            type: "LITTLE_BOX",
            volume: 10,
            containerNumber: "abcd123",
            quantity: 1,
            consistence: "SOLIDE",
            identificationCodes: [] // empty codes forbidden
          }
        ]
      }
    });

    const { mutate } = makeClient(user); // emitter

    const { errors } = await mutate<Pick<Mutation, "publishBspaoh">>(
      PUBLISH_BSPAOH,
      {
        variables: {
          id: bspaoh.id
        }
      }
    );
    expect(errors).toEqual([
      expect.objectContaining({
        message: "Au moins un code est requis",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it("should forbid users other than inital creator to publish a draft bspaoh", async () => {
    const { company } = await userWithCompanyFactory("MEMBER");
    const { user: destinationUser, company: destinationCompany } =
      await userWithCompanyFactory("MEMBER");

    const bspaoh = await bspaohFactory({
      opt: {
        status: BspaohStatus.DRAFT,
        emitterCompanySiret: company.siret,
        destinationCompanySiret: destinationCompany.siret,
        canAccessDraftSirets: [company.siret as string]
      }
    });

    const { mutate } = makeClient(destinationUser); // is not paoh creator thus forbidden to publish

    const { errors } = await mutate<Pick<Mutation, "publishBspaoh">>(
      PUBLISH_BSPAOH,
      {
        variables: {
          id: bspaoh.id
        }
      }
    );
    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Vous ne pouvez pas modifier un bordereau sur lequel votre entreprise n'apparait pas",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });

  it("should not publish an already published bspaoh", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const bspaoh = await bspaohFactory({
      opt: {
        status: BspaohStatus.INITIAL,
        emitterCompanySiret: company.siret,
        canAccessDraftSirets: [company.siret as string]
      }
    });

    const { mutate } = makeClient(user); // emitter

    const { errors } = await mutate<Pick<Mutation, "publishBspaoh">>(
      PUBLISH_BSPAOH,
      {
        variables: {
          id: bspaoh.id
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Impossible de publier un bordereau qui n'est pas un brouillon.",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });

  it("should not publish a draft bspaoh if mandatory fields are not filled", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const bspaoh = await bspaohFactory({
      opt: {
        status: BspaohStatus.DRAFT,
        emitterCompanySiret: company.siret,
        destinationCompanyAddress: null,
        canAccessDraftSirets: [company.siret as string]
      }
    });
    const { mutate } = makeClient(user);

    const { errors } = await mutate<Pick<Mutation, "publishBspaoh">>(
      PUBLISH_BSPAOH,
      {
        variables: {
          id: bspaoh.id
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message: `L'adresse de l'entreprise de destination est obligatoire.`,
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });
});
