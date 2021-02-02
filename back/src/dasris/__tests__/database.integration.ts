import { userFactory } from "../../__tests__/factories";
import { dasriFactory } from "./factories";
import { getDasriOrDasriNotFound } from "../database";
import { resetDatabase } from "../../../integration-tests/helper";
import { ErrorCode } from "../../common/errors";

describe("getDasriOrDasriNotFound", () => {
  afterAll(resetDatabase);

  afterEach(resetDatabase);

  it("should get a dasri by id", async () => {
    const user = await userFactory();
    const created = await dasriFactory({ ownerId: user.id });
    const retrieved = await getDasriOrDasriNotFound({ id: created.id });
    expect(created.id).toEqual(retrieved.id);
  });

  it("should get a dasri by readableId", async () => {
    const user = await userFactory();
    const created = await dasriFactory({ ownerId: user.id });

    const retrieved = await getDasriOrDasriNotFound({
      readableId: created.readableId
    });
    expect(retrieved.id).toEqual(created.id);
  });

  it("should throw DasriNotFound exception if dasri is deleted", async () => {
    expect.assertions(2);
    const user = await userFactory();
    const dasri = await dasriFactory({
      ownerId: user.id,
      opt: { isDeleted: true }
    });
    try {
      await getDasriOrDasriNotFound({ id: dasri.id });
    } catch (err) {
      expect(err.extensions.code).toEqual(ErrorCode.BAD_USER_INPUT);
      expect(err.message).toEqual(
        `Le bordereau avec l'identifiant "${dasri.id}" n'existe pas.`
      );
    }
  });

  it("should throw DasriNotFound exception if id is not found", async () => {
    expect.assertions(2);
    const id = "inconnu";
    try {
      await getDasriOrDasriNotFound({ id });
    } catch (err) {
      expect(err.extensions.code).toEqual(ErrorCode.BAD_USER_INPUT);
      expect(err.message).toEqual(
        `Le bordereau avec l'identifiant "${id}" n'existe pas.`
      );
    }
  });

  it("should throw FormNotFound exception if readableId is not found", async () => {
    expect.assertions(2);
    const readableId = "inconnu";
    try {
      await getDasriOrDasriNotFound({ readableId });
    } catch (err) {
      expect(err.extensions.code).toEqual(ErrorCode.BAD_USER_INPUT);
      expect(err.message).toEqual(
        `Le bordereau avec l'identifiant "${readableId}" n'existe pas.`
      );
    }
  });
});
