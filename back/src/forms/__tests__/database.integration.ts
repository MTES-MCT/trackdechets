import { formFactory, userFactory } from "../../__tests__/factories";
import { getFormOrFormNotFound } from "../database";
import { resetDatabase } from "../../../integration-tests/helper";
import { ErrorCode } from "../../common/errors";
import { User } from "@td/prisma";

let user: User;

describe("getFormOrFormNotFound", () => {
  afterAll(resetDatabase);

  beforeAll(async () => {
    user = await userFactory();
  });

  it("should get a form by id", async () => {
    const form = await formFactory({ ownerId: user.id });
    const getForm = await getFormOrFormNotFound({ id: form.id });
    expect(form.id).toEqual(getForm.id);
  });

  it("should get a form by readableId", async () => {
    const form = await formFactory({ ownerId: user.id });
    const getForm = await getFormOrFormNotFound({
      readableId: form.readableId
    });
    expect(form.id).toEqual(getForm.id);
  });

  it("should throw FormNotFound exception if form is deleted", async () => {
    expect.assertions(2);
    const form = await formFactory({
      ownerId: user.id,
      opt: { isDeleted: true }
    });
    try {
      await getFormOrFormNotFound({ id: form.id });
    } catch (err) {
      expect(err.extensions.code).toEqual(ErrorCode.BAD_USER_INPUT);
      expect(err.message).toEqual(
        `Le bordereau avec l'identifiant "${form.id}" n'existe pas.`
      );
    }
  });

  it("should throw FormNotFound exception if id does not exist", async () => {
    expect.assertions(2);
    const id = "inconnu";
    try {
      await getFormOrFormNotFound({ id });
    } catch (err) {
      expect(err.extensions.code).toEqual(ErrorCode.BAD_USER_INPUT);
      expect(err.message).toEqual(
        `Le bordereau avec l'identifiant "${id}" n'existe pas.`
      );
    }
  });

  it("should throw FormNotFound exception if readableId does not exist", async () => {
    expect.assertions(2);
    const readableId = "inconnu";
    try {
      await getFormOrFormNotFound({ readableId });
    } catch (err) {
      expect(err.extensions.code).toEqual(ErrorCode.BAD_USER_INPUT);
      expect(err.message).toEqual(
        `Le bordereau avec l'identifiant "${readableId}" n'existe pas.`
      );
    }
  });
});
