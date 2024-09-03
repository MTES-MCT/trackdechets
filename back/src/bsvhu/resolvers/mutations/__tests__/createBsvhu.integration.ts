import { resetDatabase } from "../../../../../integration-tests/helper";
import { ErrorCode } from "../../../../common/errors";
import { BsvhuInput, Mutation } from "../../../../generated/graphql/types";
import {
  companyFactory,
  siretify,
  userFactory,
  userWithCompanyFactory,
  transporterReceiptFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

const CREATE_VHU_FORM = `
mutation CreateVhuForm($input: BsvhuInput!) {
  createBsvhu(input: $input) {
    id
    destination {
      company {
          siret
      }
    }
    emitter {
      company {
          siret
          name
          address
          contact
      }
    }
    transporter {
      company {
        siret
        name
        address
        contact
        mail
        phone
      }
      recepisse {
        number
        department
        validityLimit
      }
    }
    weight {
      value
    }
  }
}
`;

describe("Mutation.Vhu.create", () => {
  afterEach(async () => {
    await resetDatabase();
  });

  it("should disallow unauthenticated user", async () => {
    const { mutate } = makeClient();
    const { errors } = await mutate<Pick<Mutation, "createBsvhu">>(
      CREATE_VHU_FORM,
      {
        variables: { input: {} }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous n'êtes pas connecté.",
        extensions: expect.objectContaining({
          code: ErrorCode.UNAUTHENTICATED
        })
      })
    ]);
  });

  it("should disallow a user to create a form they are not part of", async () => {
    const user = await userFactory();

    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createBsvhu">>(
      CREATE_VHU_FORM,
      {
        variables: {
          input: {
            emitter: {
              company: {
                siret: siretify(7)
              }
            }
          }
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Vous ne pouvez pas créer un bordereau sur lequel votre entreprise n'apparait pas",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });

  it("should allow creating a valid form for the producer signature", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const destinationCompany = await companyFactory({
      companyTypes: ["WASTE_VEHICLES"]
    });

    const input = {
      emitter: {
        company: {
          siret: company.siret,
          name: "The crusher",
          address: "Rue de la carcasse",
          contact: "Un centre VHU",
          phone: "0101010101",
          mail: "emitter@mail.com"
        },
        agrementNumber: "1234"
      },
      wasteCode: "16 01 06",
      packaging: "UNITE",
      identification: {
        numbers: ["123", "456"],
        type: "NUMERO_ORDRE_REGISTRE_POLICE"
      },
      quantity: 2,
      weight: {
        isEstimate: false,
        value: 1.3
      },
      destination: {
        type: "BROYEUR",
        plannedOperationCode: "R 12",
        company: {
          siret: destinationCompany.siret,
          name: "destination",
          address: "address",
          contact: "contactEmail",
          phone: "contactPhone",
          mail: "contactEmail@mail.com"
        },
        agrementNumber: "9876"
      }
    };
    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createBsvhu">>(
      CREATE_VHU_FORM,
      {
        variables: {
          input
        }
      }
    );

    expect(data.createBsvhu.id).toMatch(
      new RegExp(`^VHU-[0-9]{8}-[A-Z0-9]{9}$`)
    );
    expect(data.createBsvhu.destination!.company!.siret).toBe(
      input.destination.company.siret
    );
  });

  it("should create a bsvhu and autocomplete transporter recepisse", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const destinationCompany = await companyFactory({
      companyTypes: ["WASTE_VEHICLES"]
    });

    const transporter = await companyFactory({
      companyTypes: ["TRANSPORTER"]
    });
    await transporterReceiptFactory({
      company: transporter
    });
    const input = {
      emitter: {
        company: {
          siret: company.siret,
          name: "The crusher",
          address: "Rue de la carcasse",
          contact: "Un centre VHU",
          phone: "0101010101",
          mail: "emitter@mail.com"
        },
        agrementNumber: "1234"
      },
      wasteCode: "16 01 06",
      packaging: "UNITE",
      identification: {
        numbers: ["123", "456"],
        type: "NUMERO_ORDRE_REGISTRE_POLICE"
      },
      quantity: 2,
      weight: {
        isEstimate: false,
        value: 1.3
      },
      destination: {
        type: "BROYEUR",
        plannedOperationCode: "R 12",
        company: {
          siret: destinationCompany.siret,
          name: "destination",
          address: "address",
          contact: "contactEmail",
          phone: "contactPhone",
          mail: "contactEmail@mail.com"
        },
        agrementNumber: "9876"
      },
      transporter: { company: { siret: transporter.siret } }
    };
    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createBsvhu">>(
      CREATE_VHU_FORM,
      {
        variables: {
          input
        }
      }
    );
    expect(data.createBsvhu.transporter!.recepisse!.number).toEqual(
      "the number"
    );
    expect(data.createBsvhu.transporter!.recepisse!.department).toEqual("83");
    expect(data.createBsvhu.transporter!.recepisse!.validityLimit).toEqual(
      "2055-01-01T00:00:00.000Z"
    );
  });

  it("should create a bsvhu and ignore recepisse input", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const destinationCompany = await companyFactory({
      companyTypes: ["WASTE_VEHICLES"]
    });

    const transporter = await companyFactory({
      companyTypes: ["TRANSPORTER"]
    });
    await transporterReceiptFactory({
      company: transporter
    });
    const input = {
      emitter: {
        company: {
          siret: company.siret,
          name: "The crusher",
          address: "Rue de la carcasse",
          contact: "Un centre VHU",
          phone: "0101010101",
          mail: "emitter@mail.com"
        },
        agrementNumber: "1234"
      },
      wasteCode: "16 01 06",
      packaging: "UNITE",
      identification: {
        numbers: ["123", "456"],
        type: "NUMERO_ORDRE_REGISTRE_POLICE"
      },
      quantity: 2,
      weight: {
        isEstimate: false,
        value: 1.3
      },
      destination: {
        type: "BROYEUR",
        plannedOperationCode: "R 12",
        company: {
          siret: destinationCompany.siret,
          name: "destination",
          address: "address",
          contact: "contactEmail",
          phone: "contactPhone",
          mail: "contactEmail@mail.com"
        },
        agrementNumber: "9876"
      },
      transporter: {
        company: { siret: transporter.siret },
        recepisse: {
          department: "83",
          number: "N°99999",
          validityLimit: "2022-06-06T22:00:00"
        }
      }
    };
    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createBsvhu">>(
      CREATE_VHU_FORM,
      {
        variables: {
          input
        }
      }
    );
    expect(data.createBsvhu.transporter!.recepisse!.number).toEqual(
      "the number"
    );
    expect(data.createBsvhu.transporter!.recepisse!.department).toEqual("83");
    expect(data.createBsvhu.transporter!.recepisse!.validityLimit).toEqual(
      "2055-01-01T00:00:00.000Z"
    );
  });

  it("should fail if a required field like the recipient agrement is missing", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const destinationCompany = await companyFactory({
      companyTypes: ["WASTE_VEHICLES"]
    });

    const input = {
      emitter: {
        company: {
          siret: company.siret,
          name: "The crusher",
          address: "Rue de la carcasse",
          contact: "Un centre VHU",
          phone: "0101010101",
          mail: "emitter@mail.com"
        },
        agrementNumber: "1234"
      },
      wasteCode: "16 01 06",
      packaging: "UNITE",
      identification: {
        numbers: ["123", "456"],
        type: "NUMERO_ORDRE_REGISTRE_POLICE"
      },
      quantity: 2,
      weight: {
        isEstimate: false,
        value: 1.3
      },
      destination: {
        type: "BROYEUR",
        plannedOperationCode: "R 12",
        company: {
          siret: destinationCompany.siret,
          name: "destination",
          address: "address",
          contact: "contactEmail",
          phone: "contactPhone",
          mail: "contactEmail@mail.com"
        }
      }
    };
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createBsvhu">>(
      CREATE_VHU_FORM,
      {
        variables: {
          input
        }
      }
    );

    expect(errors[0].message).toBe(
      "Le N° d'agrément du destinataire est un champ requis."
    );
    expect(errors[0].extensions!.issues![0].path).toStrictEqual([
      "destination",
      "agrementNumber"
    ]);
  });

  it("should create a bsvhu with split address input and get a composite address output", async () => {
    const { user, company: transporter } = await userWithCompanyFactory(
      "MEMBER",
      {
        companyTypes: ["TRANSPORTER"]
      }
    );
    const destinationCompany = await companyFactory({
      companyTypes: ["WASTE_VEHICLES"]
    });

    await transporterReceiptFactory({
      company: transporter
    });
    const input: BsvhuInput = {
      emitter: {
        irregularSituation: true,
        noSiret: true,
        company: {
          name: "The crusher",
          street: "34 Rue de la carcasse",
          city: "Lyon",
          postalCode: "69004",
          contact: "Irène Gular",
          phone: "0101010101",
          mail: "emitter@mail.com"
        }
      },
      wasteCode: "16 01 06",
      packaging: "UNITE",
      identification: {
        numbers: ["123", "456"],
        type: "NUMERO_ORDRE_REGISTRE_POLICE"
      },
      quantity: 2,
      weight: {
        isEstimate: false,
        value: 1.3
      },
      destination: {
        type: "BROYEUR",
        plannedOperationCode: "R 12",
        company: {
          siret: destinationCompany.siret,
          name: "destination",
          address: "address",
          contact: "contactEmail",
          phone: "contactPhone",
          mail: "contactEmail@mail.com"
        },
        agrementNumber: "9876"
      },
      transporter: { company: { siret: transporter.siret } }
    };
    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createBsvhu">>(
      CREATE_VHU_FORM,
      {
        variables: {
          input
        }
      }
    );
    expect(data.createBsvhu.emitter!.company!.address).toEqual(
      "34 Rue de la carcasse 69004 Lyon"
    );
  });

  it("should create a bsvhu without emitter email and phone if situation is irregular", async () => {
    const { user, company: transporter } = await userWithCompanyFactory(
      "MEMBER",
      {
        companyTypes: ["TRANSPORTER"]
      }
    );
    const destinationCompany = await companyFactory({
      companyTypes: ["WASTE_VEHICLES"]
    });

    await transporterReceiptFactory({
      company: transporter
    });
    const input: BsvhuInput = {
      emitter: {
        irregularSituation: true,
        noSiret: false,
        company: {
          siret: siretify(8),
          name: "The crusher",
          street: "34 Rue de la carcasse",
          city: "Lyon",
          postalCode: "69004",
          contact: "Irène Gular"
        }
      },
      wasteCode: "16 01 06",
      packaging: "UNITE",
      identification: {
        numbers: ["123", "456"],
        type: "NUMERO_ORDRE_REGISTRE_POLICE"
      },
      quantity: 2,
      weight: {
        isEstimate: false,
        value: 1.3
      },
      destination: {
        type: "BROYEUR",
        plannedOperationCode: "R 12",
        company: {
          siret: destinationCompany.siret,
          name: "destination",
          address: "address",
          contact: "contactEmail",
          phone: "contactPhone",
          mail: "contactEmail@mail.com"
        },
        agrementNumber: "9876"
      },
      transporter: { company: { siret: transporter.siret } }
    };
    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createBsvhu">>(
      CREATE_VHU_FORM,
      {
        variables: {
          input
        }
      }
    );
    expect(data.createBsvhu.emitter!.company!.contact).toEqual("Irène Gular");
  });

  it("should create a bsvhu without emitter contact if situation is irregular and there is no SIRET", async () => {
    const { user, company: transporter } = await userWithCompanyFactory(
      "MEMBER",
      {
        companyTypes: ["TRANSPORTER"]
      }
    );
    const destinationCompany = await companyFactory({
      companyTypes: ["WASTE_VEHICLES"]
    });

    await transporterReceiptFactory({
      company: transporter
    });
    const input: BsvhuInput = {
      emitter: {
        irregularSituation: true,
        noSiret: true,
        company: {
          name: "The crusher",
          street: "34 Rue de la carcasse",
          city: "Lyon",
          postalCode: "69004"
        }
      },
      wasteCode: "16 01 06",
      packaging: "UNITE",
      identification: {
        numbers: ["123", "456"],
        type: "NUMERO_ORDRE_REGISTRE_POLICE"
      },
      quantity: 2,
      weight: {
        isEstimate: false,
        value: 1.3
      },
      destination: {
        type: "BROYEUR",
        plannedOperationCode: "R 12",
        company: {
          siret: destinationCompany.siret,
          name: "destination",
          address: "address",
          contact: "contactEmail",
          phone: "contactPhone",
          mail: "contactEmail@mail.com"
        },
        agrementNumber: "9876"
      },
      transporter: { company: { siret: transporter.siret } }
    };
    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createBsvhu">>(
      CREATE_VHU_FORM,
      {
        variables: {
          input
        }
      }
    );
    expect(data.createBsvhu.emitter!.company!.name).toEqual("The crusher");
  });
});
