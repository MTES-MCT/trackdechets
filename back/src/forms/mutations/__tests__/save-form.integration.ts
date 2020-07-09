import { resetDatabase } from "../../../../integration-tests/helper";
import {
  userWithCompanyFactory,
  companyFactory,
  userFactory,
  formFactory
} from "../../../__tests__/factories";
import makeClient from "../../../__tests__/testClient";
import { prisma } from "../../../generated/prisma-client";
import { FormInput } from "../../../generated/graphql/types";
import { ErrorCode } from "../../../common/errors";

describe("{ mutation { saveForm } }", () => {
  afterEach(async () => resetDatabase());

  it("should return UNAUTHENTICATED error if user is not authenticated", async () => {
    const { mutate } = makeClient();

    const mutation = `
      mutation SaveForm($formInput: FormInput!){
        saveForm(formInput: $formInput) {
          id
        }
      }
    `;

    const { errors } = await mutate(mutation, {
      variables: { formInput: {} }
    });

    expect(errors.length).toEqual(1);
    expect(errors[0].message).toEqual("Vous n'êtes pas connecté.");
    expect(errors[0].extensions.code).toEqual(ErrorCode.UNAUTHENTICATED);
  });

  it("should return FORBIDDEN error when creating a form the user is not part of", async () => {
    const user = await userFactory();

    const { mutate } = makeClient(user);

    const payload: FormInput = {
      emitter: {
        company: {
          siret: "siret"
        }
      }
    };

    const mutation = `
      mutation SaveForm($formInput: FormInput!){
        saveForm(formInput: $formInput) {
          id
        }
      }
    `;

    const { errors } = await mutate(mutation, {
      variables: { formInput: payload }
    });

    expect(errors.length).toEqual(1);
    expect(errors[0].extensions.code).toEqual(ErrorCode.FORBIDDEN);
    expect(errors[0].message).toEqual(
      "Vous ne pouvez pas modifier un bordereau sur lequel votre entreprise n'apparait pas."
    );
  });

  it("should return FORBIDDEN error when updating a form the user is not part of", async () => {
    const user = await userFactory();
    const form = await formFactory({ ownerId: user.id });

    const { mutate } = makeClient(user);

    const payload: FormInput = {
      id: form.id,
      wasteDetails: {
        code: "06 05 08*"
      }
    };

    const mutation = `
      mutation SaveForm($formInput: FormInput!){
        saveForm(formInput: $formInput) {
          id
        }
      }
    `;

    const { errors } = await mutate(mutation, {
      variables: { formInput: payload }
    });

    expect(errors.length).toEqual(1);
    expect(errors[0].extensions.code).toEqual(ErrorCode.FORBIDDEN);
    expect(errors[0].message).toEqual(
      "Vous ne pouvez pas modifier un bordereau sur lequel votre entreprise n'apparait pas."
    );
  });

  ["emitter", "trader", "recipient", "transporter"].forEach(role => {
    it(`should create a form as ${role}`, async () => {
      const { user, company } = await userWithCompanyFactory("MEMBER");
      const { mutate } = makeClient(user);
      const payload = {
        [role]: {
          company: { siret: company.siret }
        }
      };
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

      expect(data.saveForm.id).not.toBeNull();
      expect(data.saveForm.id).not.toBeUndefined();
      expect(data.saveForm);
    });
  });

  test("should create a form as an eco-organisme", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const eo = await prisma.createEcoOrganisme({
      address: "an address",
      name: "a name",
      siret: company.siret
    });

    const { mutate } = makeClient(user);
    const payload: FormInput = {
      ecoOrganisme: { id: eo.id }
    };

    // Current user is only present as the eco-organisme on the form

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

  ["emitter", "trader", "recipient", "transporter"].forEach(role => {
    it(`should update a form as ${role}`, async () => {
      const { user, company } = await userWithCompanyFactory("MEMBER");
      const { mutate } = makeClient(user);

      const siret = `${role}CompanySiret`;

      let form = await formFactory({
        ownerId: user.id,
        opt: { [siret]: company.siret }
      });

      const payload: FormInput = {
        id: form.id,
        wasteDetails: {
          code: "08 05 06*"
        }
      };
      const mutation = `
        mutation SaveForm($formInput: FormInput!){
          saveForm(formInput: $formInput) {
            wasteDetails {
              code
            }
          }
        }
      `;

      const { data } = await mutate(mutation, {
        variables: { formInput: payload }
      });

      form = await prisma.form({ id: form.id });
      expect(form.wasteDetailsCode).toEqual(payload.wasteDetails.code);

      expect(data.saveForm.wasteDetails.code).toEqual(
        payload.wasteDetails.code
      );
    });
  });

  test("should update a form as an eco-organisme", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const eo = await prisma.createEcoOrganisme({
      address: "an address",
      name: "a name",
      siret: company.siret
    });
    const form = await formFactory({
      ownerId: user.id,
      opt: { ecoOrganisme: { connect: { id: eo.id } } }
    });

    const { mutate } = makeClient(user);
    const payload: FormInput = {
      id: form.id,
      wasteDetails: {
        code: "08 05 06*"
      }
    };

    // Current user is only present as the eco-organisme on the form

    const mutation = `
      mutation SaveForm($formInput: FormInput!){
        saveForm(formInput: $formInput) {
          wasteDetails { code }
        }
      }
    `;

    const { data } = await mutate(mutation, {
      variables: { formInput: payload }
    });

    expect(data.saveForm.wasteDetails.code).toEqual(payload.wasteDetails.code);
  });

  it("should return BAD_USER_INPUT error when trying to edit a form that does not exist", async () => {
    const user = await userFactory();

    const { mutate } = makeClient(user);

    const payload: FormInput = {
      id: "does_not_exist"
    };

    const mutation = `
      mutation SaveForm($formInput: FormInput!){
        saveForm(formInput: $formInput) {
          id
        }
      }
    `;

    const { errors } = await mutate(mutation, {
      variables: { formInput: payload }
    });

    expect(errors.length).toEqual(1);
    expect(errors[0].message).toEqual("Aucun BSD avec l'id does_not_exist");
    expect(errors[0].extensions.code).toEqual(ErrorCode.BAD_USER_INPUT);
  });

  it("should return BAD_USER_INPUT error when trying to add an eco-organisme that does not exist", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const { mutate } = makeClient(user);

    const payload: FormInput = {
      emitter: {
        company: {
          siret: company.siret
        }
      },
      ecoOrganisme: { id: "does_not_exist" }
    };

    const mutation = `
      mutation SaveForm($formInput: FormInput!){
        saveForm(formInput: $formInput) {
          id
        }
      }
    `;

    const { errors } = await mutate(mutation, {
      variables: { formInput: payload }
    });

    expect(errors.length).toEqual(1);
    expect(errors[0].message).toEqual(
      "Aucun eco-organisme avec l'id does_not_exist"
    );
    expect(errors[0].extensions.code).toEqual(ErrorCode.BAD_USER_INPUT);
  });

  test("should create a form with a pickup site", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const { mutate } = makeClient(user);
    const payload: FormInput = {
      emitter: {
        workSite: {
          name: "The name",
          address: "The address",
          city: "The city",
          postalCode: "The postalCode",
          infos: "The infos"
        },
        company: {
          siret: company.siret,
          name: company.name
        }
      }
    };

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
    const payload: FormInput = {
      ecoOrganisme: { id: eo.id },
      emitter: {
        company: {
          siret: company.siret,
          name: company.name
        }
      }
    };

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
    payload.ecoOrganisme = null;
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
    const createPayload: FormInput = {
      emitter: {
        company: {
          siret: company.siret,
          name: company.name
        }
      }
    };

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
    const payload: FormInput = {
      emitter: {
        company: {
          siret: company.siret,
          name: company.name
        }
      },
      recipient: {
        isTempStorage: true
      },
      temporaryStorageDetail: {
        destination: {
          company: {
            siret: temporaryStorerCompany.siret,
            name: temporaryStorerCompany.name
          }
        }
      }
    };

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
    payload.temporaryStorageDetail = null;
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
    const payload: FormInput = {
      emitter: {
        company: {
          siret: company.siret,
          name: company.name
        }
      },
      recipient: {
        isTempStorage: false
      }
    };

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

    payload.temporaryStorageDetail = {
      destination: {
        company: {
          siret: temporaryStorerCompany.siret,
          name: temporaryStorerCompany.name
        }
      }
    };

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
    const payload: FormInput = {
      emitter: {
        company: {
          siret: company.siret,
          name: company.name
        }
      },
      recipient: { isTempStorage: true }
    };

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
    const payload: FormInput = {
      emitter: {
        company: {
          siret: company.siret,
          name: company.name
        }
      },
      recipient: {
        isTempStorage: true
      },
      temporaryStorageDetail: {}
    };

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

  it(
    "should return BAD_USER_INPUT if temporary storage is set" +
      " but recipient.isTempStorage is not true",
    async () => {
      const { user, company } = await userWithCompanyFactory("MEMBER");

      const { mutate } = makeClient(user);
      const payload: FormInput = {
        emitter: {
          company: {
            siret: company.siret,
            name: company.name
          }
        },
        temporaryStorageDetail: {}
      };

      const mutation = `
          mutation SaveForm($formInput: FormInput!){
            saveForm(formInput: $formInput) {
              id
            }
          }
        `;

      const { errors } = await mutate(mutation, {
        variables: { formInput: payload }
      });

      expect(errors).toHaveLength(1);
      expect(errors[0].extensions.code).toEqual(ErrorCode.BAD_USER_INPUT);
      expect(errors[0].message).toEqual(
        "Vous ne pouvez pas préciser d'entreposage provisoire sans spécifier recipient.isTempStorage = true"
      );
    }
  );

  test("create a form with a recipient, and then update it to remove the recipient", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const { mutate } = makeClient(user);

    const mutation = `
      mutation SaveForm($formInput: FormInput!){
        saveForm(formInput: $formInput) {
          id
          recipient {
            company {
              siret
            }
          }
        }
      }
    `;
    // create a form with a recipient payload
    const createPayload: FormInput = {
      emitter: {
        company: {
          siret: company.siret
        }
      },
      recipient: {
        company: { siret: "11111111111111" }
      }
    };

    const {
      data: { saveForm: createForm }
    } = await mutate(mutation, {
      variables: { formInput: createPayload }
    });

    // now edit the form to discard the recipient payload
    const updatePayload: FormInput = {
      id: createForm.id,
      recipient: null
    };

    const {
      data: { saveForm: updateForm }
    } = await mutate(mutation, {
      variables: { formInput: updatePayload }
    });

    const form = await prisma.form({ id: updateForm.id });

    expect(form.recipientCompanySiret).toBeNull();

    expect(updateForm.recipient).toBeNull();
  });
});
