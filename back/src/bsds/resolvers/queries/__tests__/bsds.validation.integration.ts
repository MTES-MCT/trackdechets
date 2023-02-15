import { UserRole } from "@prisma/client";
import { Query, QueryBsdsArgs } from "../../../../generated/graphql/types";
import { resetDatabase } from "../../../../../integration-tests/helper";
import makeClient from "../../../../__tests__/testClient";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import { ErrorCode } from "../../../../common/errors";

const GET_BSDS = `
  query GetBsds($where: BsdWhere) {
    bsds(where: $where) {
      edges {
        node {
          ... on Form {
            id
          }
        }
      }
    }
  }
`;
describe("Query.bsds validation", () => {
  afterAll(resetDatabase);

  it.each([
    "isArchivedFor",
    "isDraftFor",
    "isFollowFor",
    "isToCollectFor",
    "isForActionFor",
    "isCollectedFor"
  ])("should block long search terms on %p", async term => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });

    const { query } = makeClient(emitter.user);

    const tooLong = "a very very long search param which is a bit too long";

    const { errors } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
      GET_BSDS,
      {
        variables: {
          where: {
            [term]: [tooLong]
          }
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "La Longueur maximale de ce paramètre de recherche est de 50 caractères",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it.each(["recipient", "emitter"])(
    "should block long search terms on %p",
    async term => {
      const emitter = await userWithCompanyFactory(UserRole.ADMIN, {
        companyTypes: {
          set: ["PRODUCER"]
        }
      });

      const { query } = makeClient(emitter.user);

      const tooLong = "a very very long search param which is a bit too long";

      const { errors } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
        GET_BSDS,
        {
          variables: {
            where: {
              [term]: tooLong
            }
          }
        }
      );

      expect(errors).toEqual([
        expect.objectContaining({
          message:
            "La Longueur maximale de ce paramètre de recherche est de 50 caractères",
          extensions: expect.objectContaining({
            code: ErrorCode.BAD_USER_INPUT
          })
        })
      ]);
    }
  );

  it("should block long search terms on readableId", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });

    const { query } = makeClient(emitter.user);

    const tooLong = "BSD-1234567890-ABCDEFG";

    const { errors } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
      GET_BSDS,
      {
        variables: {
          where: {
            readableId: tooLong
          }
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "La Longueur maximale de ce paramètre de recherche est de 20 caractères",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it("should block long search terms on waste", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });

    const { query } = makeClient(emitter.user);

    const tooLong = "un type dechet dont le nom est bien long";

    const { errors } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
      GET_BSDS,
      {
        variables: {
          where: {
            waste: tooLong
          }
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "La Longueur maximale de ce paramètre de recherche est de 30 caractères",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it("should block long search terms on transporterCustomInfo", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });

    const { query } = makeClient(emitter.user);

    const tooLong = "une recherche sur le champ custom mais un peu longue";

    const { errors } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
      GET_BSDS,
      {
        variables: {
          where: {
            transporterCustomInfo: tooLong
          }
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "La Longueur maximale de ce paramètre de recherche est de 20 caractères",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it("should block long search terms on transporterNumberPlate", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });

    const { query } = makeClient(emitter.user);

    const tooLong = "WYZ-123-UYR-654-HJK-861";

    const { errors } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
      GET_BSDS,
      {
        variables: {
          where: {
            transporterNumberPlate: tooLong
          }
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "La Longueur maximale de ce paramètre de recherche est de 20 caractères",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });
});
