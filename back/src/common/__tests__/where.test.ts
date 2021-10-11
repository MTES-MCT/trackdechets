import { Prisma } from ".prisma/client";
import { safeInput } from "../../forms/form-converter";
import { BsffWhere } from "../../generated/graphql/types";
import {
  NestingWhereError,
  toPrismaDateFilter,
  toPrismaIdFilter,
  toPrismaNestedWhereInput
} from "../where";

describe("toPrismaNestedWhereInput", () => {
  function toPrismaWhereInput(where) {
    return safeInput({
      isDraft: where.isDraft,
      id: toPrismaIdFilter(where.id),
      createdAt: toPrismaDateFilter(where.createdAt),
      updatedAt: toPrismaDateFilter(where.updatedAt)
    });
  }

  it("should nest where inputs", () => {
    const where: BsffWhere = {
      isDraft: false,
      _or: [
        { id: { _eq: "id" } },
        { createdAt: { _eq: new Date("2021-01-01") } }
      ]
    };
    const prismaWhereInput: Prisma.BsffWhereInput = toPrismaNestedWhereInput(
      where,
      toPrismaWhereInput
    );
    const expected: Prisma.BsffWhereInput = {
      isDraft: false,
      OR: [
        { id: { equals: "id" } },
        { createdAt: { equals: new Date("2021-01-01") } }
      ]
    };
    expect(prismaWhereInput).toEqual(expected);
  });

  it("should raise exception when nesting more than depthLimit", () => {
    const where: BsffWhere = {
      _and: [
        {
          isDraft: false,
          _or: [{ id: { _eq: "id" } }]
        }
      ]
    };
    expect(() =>
      toPrismaNestedWhereInput(where, toPrismaWhereInput)
    ).toThrowError(new NestingWhereError());
  });
});
