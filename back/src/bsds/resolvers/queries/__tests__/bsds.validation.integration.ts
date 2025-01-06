import { UserRole } from "@prisma/client";
import type { Query, QueryBsdsArgs } from "@td/codegen-back";
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
          "La longueur maximale de ce paramètre de recherche est de 50 caractères",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it.each(["destination", "emitter"])(
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
              [term]: { company: { name: { _match: tooLong } } }
            }
          }
        }
      );

      expect(errors).toEqual([
        expect.objectContaining({
          message: `La longueur maximale du paramètre de recherche ${term}CompanyName est de 50 caractères`,
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

    const tooLong = "BSD-1234567890-ABCDEFG-12345678"; // 31 chars

    const { errors } = await query<Pick<Query, "bsds">, QueryBsdsArgs>(
      GET_BSDS,
      {
        variables: {
          where: {
            readableId: { _eq: tooLong }
          }
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "La longueur maximale du paramètre de recherche readableId est de 30 caractères",
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
            waste: { description: { _match: tooLong } }
          }
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "La longueur maximale du paramètre de recherche wasteDescription est de 30 caractères",
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
            transporter: { customInfo: { _match: tooLong } }
          }
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "La longueur maximale du paramètre de recherche transporterCustomInfo est de 20 caractères",
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
            transporter: { transport: { plates: { _itemContains: tooLong } } }
          }
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "La longueur maximale du paramètre de recherche transporterTransportPlates est de 20 caractères",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });
});
