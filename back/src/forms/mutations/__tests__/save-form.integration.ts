import { resetDatabase } from "../../../../integration-tests/helper";
import {
  userWithCompanyFactory,
  companyFactory
} from "../../../__tests__/factories";
import makeClient from "../../../__tests__/testClient";
import { prisma } from "../../../generated/prisma-client";
import { getEmptyForm } from "../__mocks__/data";

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
    const payload = getEmptyForm();

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

  test("should create a form as an eco-organisme", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const eo = await prisma.createEcoOrganisme({
      address: "an address",
      name: "a name",
      siret: company.siret
    });

    const { mutate } = makeClient(user);
    const payload = getEmptyForm();

    // Current user is only present as the eco-organisme on the form
    payload.ecoOrganisme = { id: eo.id };

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

    expect(data.saveForm.id).toBeDefined();
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
    const payload = getEmptyForm();

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
    const createPayload = getEmptyForm();

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

  test("should create a form with a temporary storage, update it, and then remove it", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const temporaryStorerCompany = await companyFactory();

    const { mutate } = makeClient(user);
    const payload = getEmptyForm();

    payload.emitter.company.siret = company.siret;
    payload.emitter.company.name = company.name;

    payload.recipient.isTempStorage = true;

    payload.temporaryStorageDetail.destination.company.siret =
      temporaryStorerCompany.siret;
    payload.temporaryStorageDetail.destination.company.name =
      temporaryStorerCompany.name;

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

    // First, check that temporaryStorageDetail gets binded on creation
    const temporaryStorageDetail1 = await prisma
      .form({ id: data.saveForm.id })
      .temporaryStorageDetail();

    expect(temporaryStorageDetail1.id).toBeDefined();
    payload.id = data.saveForm.id;

    // Then modify it
    payload.temporaryStorageDetail.destination.cap = "A CAP here";
    await mutate(mutation, {
      variables: { formInput: payload }
    });
    const temporaryStorageDetail2 = await prisma
      .form({ id: data.saveForm.id })
      .temporaryStorageDetail();

    expect(temporaryStorageDetail2.destinationCap).toBe("A CAP here");

    // Then delete the temporary storage step
    payload.recipient.isTempStorage = false;
    await mutate(mutation, {
      variables: { formInput: payload }
    });
    const temporaryStorageDetail3 = await prisma
      .form({ id: data.saveForm.id })
      .temporaryStorageDetail();

    expect(temporaryStorageDetail3).toBe(null);
  });

  test("should create a form without a temporary storage, and then add one", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const { mutate } = makeClient(user);
    const payload = getEmptyForm();

    payload.emitter.company.siret = company.siret;
    payload.emitter.company.name = company.name;

    payload.recipient.isTempStorage = false;

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

    const temporaryStorageDetail1 = await prisma
      .form({ id: data.saveForm.id })
      .temporaryStorageDetail();

    expect(temporaryStorageDetail1).toBeNull();

    // Now edit the form and add a temporary storage
    const temporaryStorerCompany = await companyFactory();

    payload.id = data.saveForm.id;

    payload.recipient.isTempStorage = true;
    payload.temporaryStorageDetail.destination.company.siret =
      temporaryStorerCompany.siret;
    payload.temporaryStorageDetail.destination.company.name =
      temporaryStorerCompany.name;

    await mutate(mutation, {
      variables: { formInput: payload }
    });

    const temporaryStorageDetail2 = await prisma
      .form({ id: data.saveForm.id })
      .temporaryStorageDetail();

    expect(temporaryStorageDetail2.destinationCompanySiret).toBe(
      temporaryStorerCompany.siret
    );
    expect(temporaryStorageDetail2.destinationCompanyName).toBe(
      temporaryStorerCompany.name
    );
  });

  test("should create a form `isTempStorage=true` but no temp storage details and still create the temporaryStorageDetail object", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const { mutate } = makeClient(user);
    const payload = getEmptyForm();

    payload.emitter.company.siret = company.siret;
    payload.emitter.company.name = company.name;

    payload.recipient.isTempStorage = true;
    delete payload.temporaryStorageDetail;

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

    const temporaryStorageDetail = await prisma
      .form({ id: data.saveForm.id })
      .temporaryStorageDetail();

    expect(temporaryStorageDetail).not.toBeNull();
  });

  test("should create a form `isTempStorage=true` with an empty temp storage details and still create the temporaryStorageDetail object", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const { mutate } = makeClient(user);
    const payload = getEmptyForm();

    payload.emitter.company.siret = company.siret;
    payload.emitter.company.name = company.name;

    payload.recipient.isTempStorage = true;

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

    const temporaryStorageDetail = await prisma
      .form({ id: data.saveForm.id })
      .temporaryStorageDetail();

    expect(temporaryStorageDetail).not.toBeNull();
  });
});
