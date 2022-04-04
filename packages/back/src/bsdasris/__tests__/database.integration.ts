import { bsdasriFactory } from "./factories";
import { getBsdasriOrNotFound } from "../database";
import { resetDatabase } from "../../../integration-tests/helper";
import { ErrorCode } from "../../common/errors";

describe("getBsdasriOrNotFound", () => {
  afterEach(resetDatabase);

  it("should get a dasri by id", async () => {
    const created = await bsdasriFactory({});
    const retrieved = await getBsdasriOrNotFound({ id: created.id });
    expect(created.id).toEqual(retrieved.id);
  });

  it("should throw BsdasriNotFound exception if dasri is deleted", async () => {
    expect.assertions(2);

    const dasri = await bsdasriFactory({
      opt: { isDeleted: true }
    });
    try {
      await getBsdasriOrNotFound({ id: dasri.id });
    } catch (err) {
      expect(err.extensions.code).toEqual(ErrorCode.BAD_USER_INPUT);
      expect(err.message).toEqual(
        `Le bordereau avec l'identifiant "${dasri.id}" n'existe pas.`
      );
    }
  });

  it("should throw BsdasriNotFound exception if id is not found", async () => {
    expect.assertions(2);
    const id = "inconnu";
    try {
      await getBsdasriOrNotFound({ id });
    } catch (err) {
      expect(err.extensions.code).toEqual(ErrorCode.BAD_USER_INPUT);
      expect(err.message).toEqual(
        `Le bordereau avec l'identifiant "${id}" n'existe pas.`
      );
    }
  });
});
