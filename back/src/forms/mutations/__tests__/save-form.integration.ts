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
        pickupSite: {
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
            pickupSite {
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

    expect(data.saveForm.emitter.pickupSite.name).toBe(
      payload.emitter.pickupSite.name
    );
    expect(data.saveForm.emitter.pickupSite.address).toBe(
      payload.emitter.pickupSite.address
    );
    expect(data.saveForm.emitter.pickupSite.city).toBe(
      payload.emitter.pickupSite.city
    );
    expect(data.saveForm.emitter.pickupSite.postalCode).toBe(
      payload.emitter.pickupSite.postalCode
    );
    expect(data.saveForm.emitter.pickupSite.infos).toBe(
      payload.emitter.pickupSite.infos
    );
  });
});
