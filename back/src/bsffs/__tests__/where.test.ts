import { BsffStatus } from ".prisma/client";
import { BsffWhere } from "../../generated/graphql/types";
import { toPrismaWhereInput } from "../where";

describe("toPrismaWhereInput", () => {
  it("should raise exception when nesting more than one level deep", () => {
    const bsffWhere: BsffWhere = {
      _and: [
        {
          isDraft: false,
          _or: [
            { status: { _in: [BsffStatus.PROCESSED, BsffStatus.RECEIVED] } }
          ]
        }
      ]
    };
    const convert = () => toPrismaWhereInput(bsffWhere);
    expect(convert).toThrowError(
      "Vous ne pouvez pas imbriquer des opérations _and, _or, _not"
    );
  });
});
