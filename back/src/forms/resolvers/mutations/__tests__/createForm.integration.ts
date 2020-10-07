import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  userWithCompanyFactory,
  companyFactory,
  userFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { prisma } from "../../../../generated/prisma-client";
import { ErrorCode } from "../../../../common/errors";

const CREATE_FORM = `
  mutation CreateForm($createFormInput: CreateFormInput!) {
    createForm(createFormInput: $createFormInput) {
      id
      recipient {
        company {
          siret
        }
      }
      emitter {
        workSite {
          name
          address
          city
          postalCode
          infos
        }
      }
      ecoOrganisme {
        id
      }
      temporaryStorageDetail {
        destination {
          company {
            siret
            name
          }
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
        isExemptedOfReceipt
        receipt
        department
        validityLimit
        numberPlate
        customInfo
      }
    }
  }
`;

describe("Mutation.createForm", () => {
  afterEach(resetDatabase);

  it("should disallow unauthenticated user", async () => {
    const { mutate } = makeClient();
    const { errors } = await mutate(CREATE_FORM, {
      variables: { createFormInput: {} }
    });

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
    const { errors } = await mutate(CREATE_FORM, {
      variables: {
        createFormInput: {
          emitter: {
            company: {
              siret: "siret"
            }
          }
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Vous n'êtes pas autorisé à accéder à un bordereau sur lequel votre entreprise n'apparait pas.",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });

  it.each(["emitter", "trader", "recipient", "transporter"])(
    "should allow %p to create a form",
    async role => {
      const { user, company } = await userWithCompanyFactory("MEMBER");

      const { mutate } = makeClient(user);
      const { data } = await mutate(CREATE_FORM, {
        variables: {
          createFormInput: {
            [role]: {
              company: { siret: company.siret }
            }
          }
        }
      });

      expect(data.createForm.id).toBeTruthy();
    }
  );

  it("should allow an eco-organisme to create a form", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const eo = await prisma.createEcoOrganisme({
      address: "an address",
      name: "a name",
      siret: company.siret
    });

    const { mutate } = makeClient(user);
    const { data } = await mutate(CREATE_FORM, {
      variables: {
        createFormInput: {
          ecoOrganisme: { id: eo.id }
        }
      }
    });

    expect(data.createForm.ecoOrganisme.id).toBe(eo.id);
  });

  it("should return an error when trying to create a form with a non-existing eco-organisme", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const createFormInput = {
      emitter: {
        company: {
          siret: company.siret
        }
      },
      ecoOrganisme: {
        id: "does_not_exist"
      }
    };
    const { mutate } = makeClient(user);
    const { errors } = await mutate(CREATE_FORM, {
      variables: {
        createFormInput
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: `L'éco-organisme avec l'identifiant "${createFormInput.ecoOrganisme.id}" n'existe pas.`,
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it("should create a form with a pickup site", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const createFormInput = {
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
    const { mutate } = makeClient(user);
    const { data } = await mutate(CREATE_FORM, {
      variables: { createFormInput }
    });

    expect(data.createForm.emitter.workSite).toMatchObject(
      createFormInput.emitter.workSite
    );
  });

  it("should create a form with a temporary storage", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const temporaryStorerCompany = await companyFactory();

    const createFormInput = {
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
    const { mutate } = makeClient(user);
    const { data } = await mutate(CREATE_FORM, {
      variables: { createFormInput }
    });

    expect(data.createForm.temporaryStorageDetail.destination).toMatchObject(
      createFormInput.temporaryStorageDetail.destination
    );
  });

  it("should create a form with an empty temporary storage detail", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const { mutate } = makeClient(user);
    const { data } = await mutate(CREATE_FORM, {
      variables: {
        createFormInput: {
          emitter: {
            company: {
              siret: company.siret,
              name: company.name
            }
          },
          recipient: { isTempStorage: true }
        }
      }
    });

    expect(data.createForm.temporaryStorageDetail).toBeTruthy();
  });

  it("should return an error when creating a form with a temporary storage detail but no temp storage flag", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const { mutate } = makeClient(user);
    const { errors } = await mutate(CREATE_FORM, {
      variables: {
        createFormInput: {
          emitter: {
            company: {
              siret: company.siret,
              name: company.name
            }
          },
          temporaryStorageDetail: {}
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: `Le champ recipient.isTempStorage doit être "true" lorsqu'un entreprosage provisoire est précisé.`,
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it("create a form with a recipient", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const createFormInput = {
      emitter: {
        company: {
          siret: company.siret
        }
      },
      recipient: {
        company: {
          siret: "11111111111111"
        }
      }
    };
    const { mutate } = makeClient(user);
    const { data } = await mutate(CREATE_FORM, {
      variables: {
        createFormInput
      }
    });

    expect(data.createForm.recipient.company).toMatchObject(
      createFormInput.recipient.company
    );
  });

  it.each([
    "abc",
    // Code of a category, not a waste
    "01",
    // Code of a sub-category, not a waste
    "01 01"
  ])(
    "should return an error when creating a form with the invalid waste code %p",
    async wasteCode => {
      const { user, company } = await userWithCompanyFactory("MEMBER");

      const { mutate } = makeClient(user);
      const { errors } = await mutate(CREATE_FORM, {
        variables: {
          createFormInput: {
            emitter: {
              company: {
                siret: company.siret
              }
            },
            wasteDetails: {
              code: wasteCode
            }
          }
        }
      });

      expect(errors).toEqual([
        expect.objectContaining({
          message:
            "Le code déchet n'est pas reconnu comme faisant partie de la liste officielle du code de l'environnement.",
          extensions: expect.objectContaining({
            code: ErrorCode.BAD_USER_INPUT
          })
        })
      ]);
    }
  );

  it("should create a form with a transporter", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const createFormInput = {
      emitter: {
        company: {
          siret: company.siret
        }
      },
      transporter: {
        company: {
          siret: "12345678901234",
          name: "Transporter",
          address: "123 whatever street, Somewhere",
          contact: "Jane Doe",
          mail: "janedoe@transporter.com",
          phone: "06"
        },
        isExemptedOfReceipt: false,
        receipt: "8043",
        department: "69",
        validityLimit: "2040-01-01T00:00:00.000Z",
        numberPlate: "AX-123-69",
        customInfo: "T-456"
      }
    };
    const { mutate } = makeClient(user);
    const { data, errors } = await mutate(CREATE_FORM, {
      variables: {
        createFormInput
      }
    });

    expect(errors).toEqual(undefined);
    expect(data.createForm.transporter).toMatchObject(
      createFormInput.transporter
    );
  });
});
