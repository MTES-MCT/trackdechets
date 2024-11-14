import { UserRole, BspaohStatus } from "@prisma/client";
import { gql } from "graphql-tag";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { Query } from "../../../../generated/graphql/types";
import {
  userWithCompanyFactory,
  userFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { fullBspaoh } from "../../../fragments";
import { bspaohFactory } from "../../../__tests__/factories";
import { ErrorCode } from "../../../../common/errors";

const GET_BSPAOH = gql`
  query GetBpaoh($id: ID!) {
    bspaoh(id: $id) {
      ...FullBspaoh
    }
  }
  ${fullBspaoh}
`;

describe("Query.Bspaoh", () => {
  afterEach(resetDatabase);

  it("should deny unauthenticated user", async () => {
    const bsd = await bspaohFactory({});

    const { query } = makeClient();

    const { errors } = await query<Pick<Query, "bspaoh">>(GET_BSPAOH, {
      variables: { id: bsd.id }
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

  it("should forbid access to user not on the bspaoh", async () => {
    const user = await userFactory();
    const bsd = await bspaohFactory({});

    const { query } = makeClient(user);

    const { errors } = await query<Pick<Query, "bspaoh">>(GET_BSPAOH, {
      variables: { id: bsd.id }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous n'êtes pas autorisé à accéder à ce bordereau",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });

  it("should allow access to admin user not on the bsd", async () => {
    const paoh = await bspaohFactory({});
    const { user: otherUser } = await userWithCompanyFactory(
      "MEMBER",
      {},
      { isAdmin: true }
    );

    const { query } = makeClient(otherUser);
    const { data } = await query<Pick<Query, "bspaoh">>(GET_BSPAOH, {
      variables: { id: paoh.id }
    });
    expect(data.bspaoh.id).toBe(paoh.id);
  });

  it("should get a draft bspaoh if user siret belongs to allowed draft sirets", async () => {
    const { user, company } = await userWithCompanyFactory(UserRole.ADMIN);
    const bsd = await bspaohFactory({
      opt: {
        status: BspaohStatus.DRAFT,
        emitterCompanySiret: company.siret,
        canAccessDraftSirets: [company.siret as string]
      }
    });

    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "bspaoh">>(GET_BSPAOH, {
      variables: { id: bsd.id }
    });

    expect(data.bspaoh.id).toBe(bsd.id);
    // check transporter is populated
    expect(data.bspaoh.transporter?.company?.siret).toBeTruthy();
  });

  it("should not get a draft bspaoh if user siret does not belong to allowed draft sirets", async () => {
    const { user, company } = await userWithCompanyFactory(UserRole.ADMIN);
    const bsd = await bspaohFactory({
      opt: {
        status: BspaohStatus.DRAFT,
        emitterCompanySiret: company.siret,
        canAccessDraftSirets: ["1234"]
      }
    });

    const { query } = makeClient(user);

    const { errors } = await query<Pick<Query, "bspaoh">>(GET_BSPAOH, {
      variables: { id: bsd.id }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous n'êtes pas autorisé à accéder à ce bordereau",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });

  it.each([
    BspaohStatus.INITIAL,
    BspaohStatus.SIGNED_BY_PRODUCER,
    BspaohStatus.SENT,
    BspaohStatus.RECEIVED,
    BspaohStatus.REFUSED,
    BspaohStatus.PARTIALLY_REFUSED
  ])("should get a bspaoh by id", async status => {
    const { user, company } = await userWithCompanyFactory(UserRole.ADMIN);
    const bsd = await bspaohFactory({
      opt: {
        status,
        emitterCompanySiret: company.siret
      }
    });

    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "bspaoh">>(GET_BSPAOH, {
      variables: { id: bsd.id }
    });

    expect(data.bspaoh.id).toBe(bsd.id);
  });

  it.each([
    BspaohStatus.INITIAL,
    BspaohStatus.SIGNED_BY_PRODUCER,
    BspaohStatus.SENT,
    BspaohStatus.RECEIVED,
    BspaohStatus.PROCESSED,
    BspaohStatus.REFUSED,
    BspaohStatus.PARTIALLY_REFUSED
  ])("should forbid access to a deleted bspaoh", async status => {
    const { user, company } = await userWithCompanyFactory(UserRole.ADMIN);
    const bsd = await bspaohFactory({
      opt: {
        status,
        isDeleted: true,
        emitterCompanySiret: company.siret
      }
    });

    const { query } = makeClient(user);

    const { errors } = await query<Pick<Query, "bspaoh">>(GET_BSPAOH, {
      variables: { id: bsd.id }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: `Le bordereau avec l'identifiant "${bsd.id}" n'existe pas.`,
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it("should return packaging acceptation statuses merged in waste packagings", async () => {
    const { user, company } = await userWithCompanyFactory(UserRole.ADMIN);
    const bsd = await bspaohFactory({
      opt: {
        destinationReceptionWastePackagingsAcceptation: [
          { id: "packaging_2", acceptation: "REFUSED" },
          { id: "packaging_1", acceptation: "ACCEPTED" }
        ],
        emitterCompanySiret: company.siret
      }
    });

    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "bspaoh">>(GET_BSPAOH, {
      variables: { id: bsd.id }
    });

    expect(data.bspaoh.id).toBe(bsd.id);

    const packagings = data.bspaoh.waste?.packagings;
    // we check acceptation statuses are merged in waste.packagings
    expect(packagings).toEqual([
      {
        id: "packaging_1",
        type: "LITTLE_BOX",
        volume: 10,
        containerNumber: "abcd123",
        quantity: 1,
        consistence: "SOLIDE",
        identificationCodes: ["xyz", "efg"],
        acceptation: "ACCEPTED"
      },
      {
        id: "packaging_2",
        type: "LITTLE_BOX",
        volume: 29,
        containerNumber: "abcd123",
        quantity: 1,
        consistence: "SOLIDE",
        identificationCodes: ["ggg", "dfh"],
        acceptation: "REFUSED"
      }
    ]);
  });

  it("should fail to retrieve a deleted bspaoh", async () => {
    const { user, company } = await userWithCompanyFactory(UserRole.ADMIN);
    const bsd = await bspaohFactory({
      opt: {
        status: BspaohStatus.INITIAL,
        emitterCompanySiret: company.siret,
        isDeleted: true
      }
    });

    const { query } = makeClient(user);

    const { errors } = await query<Pick<Query, "bspaoh">>(GET_BSPAOH, {
      variables: { id: bsd.id }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: `Le bordereau avec l'identifiant "${bsd.id}" n'existe pas.`,
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });
});
