import { resetDatabase } from "../../../../integration-tests/helper";
import { userWithCompanyFactory } from "../../../__tests__/factories";
import makeClient from "../../../__tests__/testClient";

describe("{ mutation { saveForm } }", () => {
  afterAll(() => {
    resetDatabase();
  });

  test("should create a form with a pickup site", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const { mutate } = makeClient(user);

    const payload = {
      emitter: {
        type: "PRODUCER",
        workSite: {
          name: "The name",
          address: "The address",
          city: "The city",
          postalCode: "The postalCode",
          infos: "The infos"
        },
        company: {
          siret: company.siret,
          name: company.name,
          address: "",
          contact: "Contact",
          mail: "",
          phone: ""
        }
      },
      recipient: {
        cap: "",
        processingOperation: "",
        company: {
          siret: "",
          name: "",
          address: "",
          contact: "",
          mail: "",
          phone: ""
        }
      },
      transporter: {
        isExemptedOfReceipt: false,
        receipt: "",
        department: "",
        validityLimit: null,
        numberPlate: "",
        company: {
          siret: "",
          name: "",
          address: "",
          contact: "",
          mail: "",
          phone: ""
        }
      },
      trader: {
        receipt: "",
        department: "",
        validityLimit: null,
        company: {
          siret: "",
          name: "",
          address: "",
          contact: "",
          mail: "",
          phone: ""
        }
      },
      wasteDetails: {
        code: "",
        name: "",
        onuCode: "",
        packagings: [],
        otherPackaging: "",
        numberOfPackages: null,
        quantity: null,
        quantityType: "ESTIMATED",
        consistence: "SOLID"
      },
      appendix2Forms: []
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
});
