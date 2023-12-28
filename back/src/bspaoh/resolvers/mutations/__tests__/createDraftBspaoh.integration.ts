import { resetDatabase } from "../../../../../integration-tests/helper";
import { ErrorCode } from "../../../../common/errors";
import {
  userFactory,
  userWithCompanyFactory,
  companyAssociatedToExistingUserFactory,
  companyFactory,
  siretify
} from "../../../../__tests__/factories";
import { UserRole } from "@prisma/client";
import makeClient from "../../../../__tests__/testClient";
import { Mutation } from "../../../../generated/graphql/types";
import { fullBspaoh } from "../../../fragments";
import { gql } from "graphql-tag";
import prisma from "../../../../prisma";
import { sirenify as sirenifyBspaohInput } from "../../../validation/sirenify";

jest.mock("../../../validation/sirenify");
(sirenifyBspaohInput as jest.Mock).mockImplementation(input =>
  Promise.resolve(input)
);

const CREATE_DRAFT_BSPAOH = gql`
  mutation CreateDraftBspaoh($input: BspaohInput!) {
    createDraftBspaoh(input: $input) {
      ...FullBspaoh
    }
  }
  ${fullBspaoh}
`;

describe("Mutation.createDraftBspaoh", () => {
  afterEach(async () => {
    await resetDatabase();
    (sirenifyBspaohInput as jest.Mock).mockClear();
  });

  it("should disallow unauthenticated user", async () => {
    const { mutate } = makeClient();
    const { errors } = await mutate<Pick<Mutation, "createDraftBspaoh">>(
      CREATE_DRAFT_BSPAOH,
      {
        variables: { input: {} }
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

  it("should disallow a user to create a bspaoh they are not part of", async () => {
    const user = await userFactory();

    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createDraftBspaoh">>(
      CREATE_DRAFT_BSPAOH,
      {
        variables: {
          input: {
            emitter: {
              company: {
                siret: siretify(9)
              }
            }
          }
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Vous ne pouvez pas créer un bordereau sur lequel votre entreprise n'apparaît pas",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });

  it("create a draft bspaoh with an emitter and a destination", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const destination = await companyFactory();

    const input = {
      emitter: {
        company: {
          siret: company.siret
        }
      },
      destination: {
        company: {
          siret: destination.siret
        }
      }
    };
    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createDraftBspaoh">>(
      CREATE_DRAFT_BSPAOH,
      {
        variables: {
          input
        }
      }
    );

    expect(data.createDraftBspaoh.isDraft).toBe(true);
    expect(data.createDraftBspaoh.status).toBe("INITIAL");

    expect(data.createDraftBspaoh.destination!.company).toMatchObject(
      input.destination.company
    );
    // check input is sirenified
    expect(sirenifyBspaohInput as jest.Mock).toHaveBeenCalledTimes(1);
  });

  it("persists unique relevant creator siret in canAccessDraftSirets field", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    // user has a second company, not on the paoh, not expected in `canAccessDraftSirets`
    await companyAssociatedToExistingUserFactory(user, UserRole.MEMBER);
    const destination = await companyFactory();

    const input = {
      emitter: {
        company: {
          siret: company.siret
        }
      },
      destination: {
        company: {
          siret: destination.siret
        }
      }
    };
    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createDraftBspaoh">>(
      CREATE_DRAFT_BSPAOH,
      {
        variables: {
          input
        }
      }
    );

    expect(data.createDraftBspaoh.isDraft).toBe(true);
    expect(data.createDraftBspaoh.status).toBe("INITIAL");

    expect(data.createDraftBspaoh.destination!.company).toMatchObject(
      input.destination.company
    );

    const created = await prisma.bspaoh.findUnique({
      where: { id: data.createDraftBspaoh.id }
    });

    expect(created?.canAccessDraftSirets).toEqual([company.siret]);
    // check input is sirenified
    expect(sirenifyBspaohInput as jest.Mock).toHaveBeenCalledTimes(1);
  });

  it("persists several creator sirets in canAccessDraftSirets field", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    // user has a second company, present on the paoh, expected in `canAccessDraftSirets`

    const destination = await companyAssociatedToExistingUserFactory(
      user,
      UserRole.MEMBER
    );

    const input = {
      emitter: {
        company: {
          siret: company.siret
        }
      },
      destination: {
        company: {
          siret: destination.siret
        }
      }
    };
    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createDraftBspaoh">>(
      CREATE_DRAFT_BSPAOH,
      {
        variables: {
          input
        }
      }
    );

    expect(data.createDraftBspaoh.isDraft).toBe(true);
    expect(data.createDraftBspaoh.status).toBe("INITIAL");

    expect(data.createDraftBspaoh.destination!.company).toMatchObject(
      input.destination.company
    );

    const created = await prisma.bspaoh.findUnique({
      where: { id: data.createDraftBspaoh.id }
    });
    expect(created?.canAccessDraftSirets).toEqual([
      company.siret,
      destination.siret
    ]);
    // check input is sirenified
    expect(sirenifyBspaohInput as jest.Mock).toHaveBeenCalledTimes(1);
  });
});
