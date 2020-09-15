import { formFactory, userFactory } from "../../__tests__/factories";
import { getFormOrFormNotFound, getEcoOrganismeOrNotFound } from "../database";
import { resetDatabase } from "../../../integration-tests/helper";
import { ErrorCode } from "../../common/errors";
import { User, prisma } from "../../generated/prisma-client";

let user: User = null;

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

describe("getEcoOrganismeOrNotFound", () => {
  afterAll(resetDatabase);

  it("should get an EO by id", async () => {
    const eo = await prisma.createEcoOrganisme({
      siret: "12569854785964",
      name: "EO",
      address: "Somewhere"
    });
    const eo2 = await getEcoOrganismeOrNotFound({ id: eo.id });
    expect(eo2.id).toEqual(eo.id);
  });

  it("should throw error if EO does not exists", () => {
    const getEO = () => getEcoOrganismeOrNotFound({ id: "does_not_exist" });
    expect(getEO).rejects.toThrow(
      "L'éco-organisme avec l'identifiant \"does_not_exist\" n'existe pas."
    );
  });
});
