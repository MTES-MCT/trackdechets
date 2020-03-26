import { resetDatabase } from "../../../../integration-tests/helper";
import { userWithCompanyFactory } from "../../../__tests__/factories";
import makeClient from "../../../__tests__/testClient";
import { prisma } from "../../../generated/prisma-client";
import { EMPTY_FORM } from "../__mocks__/data";

describe("{ mutation { saveForm } }", () => {
  beforeEach(async () => {
    await resetDatabase();
  });
  afterAll(async () => {
    await resetDatabase();
  });
  test("should create a form with a pickup site", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const { mutate } = makeClient(user);
    const payload = { ...EMPTY_FORM };

    payload.emitter.workSite = {
      name: "The name",
      address: "The address",
      city: "The city",
      postalCode: "The postalCode",
      infos: "The infos"
    };
    payload.emitter.company.siret = company.siret;
    payload.emitter.company.name = company.name;

    const mutation = `
      mutation SaveForm($formInput: FormInput!){
        saveForm(formInput: $formInput) {
          id
          emitter {
            workSite {
              name
              address
              city
              postalCode
              infos
            }
          }
        }
      }
    `;

    const { data } = await mutate(mutation, {
      variables: { formInput: payload }
    });

    expect(data.saveForm.emitter.workSite.name).toBe(
      payload.emitter.workSite.name
    );
    expect(data.saveForm.emitter.workSite.address).toBe(
      payload.emitter.workSite.address
    );
    expect(data.saveForm.emitter.workSite.city).toBe(
      payload.emitter.workSite.city
    );
    expect(data.saveForm.emitter.workSite.postalCode).toBe(
      payload.emitter.workSite.postalCode
    );
    expect(data.saveForm.emitter.workSite.infos).toBe(
      payload.emitter.workSite.infos
    );
  });

  test("should create a form with an eco organisme, update it, and then remove it", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const eo = await prisma.createEcoOrganisme({
      address: "an address",
      name: "a name",
      siret: "eo siret"
    });

    const otherEo = await prisma.createEcoOrganisme({
      address: "new address",
      name: "new name",
      siret: "otherEo siret"
    });

    const { mutate } = makeClient(user);
    const payload: typeof EMPTY_FORM & { id?: string } = { ...EMPTY_FORM };

    payload.ecoOrganisme = { id: eo.id };
    payload.emitter.company.siret = company.siret;
    payload.emitter.company.name = company.name;

    const mutation = `
      mutation SaveForm($formInput: FormInput!){
        saveForm(formInput: $formInput) {
          id
        }
      }
    `;

    const { data } = await mutate(mutation, {
      variables: { formInput: payload }
    });

    // First, check that EO gets binded on creation
    const formEcoOrganisme1 = await prisma
      .form({ id: data.saveForm.id })
      .ecoOrganisme();

    expect(formEcoOrganisme1.id).toBe(eo.id);
    payload.id = data.saveForm.id;

    // Then modify it
    payload.ecoOrganisme = { id: otherEo.id };
    await mutate(mutation, {
      variables: { formInput: payload }
    });
    const formEcoOrganisme2 = await prisma
      .form({ id: data.saveForm.id })
      .ecoOrganisme();

    expect(formEcoOrganisme2.id).toBe(otherEo.id);

    // Then delete the EO
    payload.ecoOrganisme = {};
    await mutate(mutation, {
      variables: { formInput: payload }
    });
    const formEcoOrganisme3 = await prisma
      .form({ id: data.saveForm.id })
      .ecoOrganisme();

    expect(formEcoOrganisme3).toBe(null);
  });

  test("should update a form", async () => {
    // prevent ecoOrganisme regression
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const { mutate } = makeClient(user);
    const createPayload = { ...EMPTY_FORM };

    createPayload.emitter.company.siret = company.siret;
    createPayload.emitter.company.name = company.name;

    const mutation = `
      mutation SaveForm($formInput: FormInput!){
        saveForm(formInput: $formInput) {
          id
          emitter {
            workSite {
              name
              address
              city
              postalCode
              infos
            }
          }
          wasteDetails{
            name
          }
        }
      }
    `;

    // create a form
    const {
      data: {
        saveForm: { id }
      }
    } = await mutate(mutation, {
      variables: { formInput: createPayload }
    });

    // update its waste name
    const updatePayload = {
      ...createPayload,
      id,
      wasteDetails: { name: "things" }
    };

    const {
      data: {
        saveForm: {
          wasteDetails: { name }
        }
      }
    } = await mutate(mutation, {
      variables: { formInput: updatePayload }
    });

    expect(name).toBe("things");
  });
});
