import { format } from "date-fns";
import { resetDatabase } from "../../../../../integration-tests/helper";
import prisma from "../../../../prisma";
import { ErrorCode } from "../../../../common/errors";
import {
  companyFactory,
  formFactory,
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { allowedFormats } from "../../../../common/dates";
import { Mutation } from "../../../../generated/graphql/types";
import { Status } from ".prisma/client";

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
        siret
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
      trader {
        company {
          siret
          name
          address
          contact
          mail
          phone
        }
        receipt
        department
        validityLimit
      }
      wasteDetails {
        packagingInfos {
          type
          other
          quantity
        }
      }
      appendix2Forms {
        id
      }
    }
  }
`;

describe("Mutation.createForm", () => {
  afterEach(resetDatabase);

  it("should disallow unauthenticated user", async () => {
    const { mutate } = makeClient();
    const { errors } = await mutate<Pick<Mutation, "createForm">>(CREATE_FORM, {
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
    const { errors } = await mutate<Pick<Mutation, "createForm">>(CREATE_FORM, {
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
          "Vous ne pouvez pas créer un bordereau sur lequel votre entreprise n'apparait pas",
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
      const { data } = await mutate<Pick<Mutation, "createForm">>(CREATE_FORM, {
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
    const { user, company: eo } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["ECO_ORGANISME"]
      }
    });
    await prisma.ecoOrganisme.create({
      data: {
        address: "",
        siret: eo.siret,
        name: eo.name
      }
    });

    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createForm">>(CREATE_FORM, {
      variables: {
        createFormInput: {
          ecoOrganisme: {
            name: eo.name,
            siret: eo.siret
          }
        }
      }
    });

    expect(data.createForm.ecoOrganisme.siret).toBe(eo.siret);
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
        name: "",
        siret: "does_not_exist"
      }
    };
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createForm">>(CREATE_FORM, {
      variables: {
        createFormInput
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: `L'éco-organisme avec le siret "${createFormInput.ecoOrganisme.siret}" n'est pas reconnu.`,
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
    const { data } = await mutate<Pick<Mutation, "createForm">>(CREATE_FORM, {
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
    const { data } = await mutate<Pick<Mutation, "createForm">>(CREATE_FORM, {
      variables: { createFormInput }
    });

    expect(data.createForm.temporaryStorageDetail.destination).toMatchObject(
      createFormInput.temporaryStorageDetail.destination
    );
  });

  it("should create a form with an empty temporary storage detail", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createForm">>(CREATE_FORM, {
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
    const { errors } = await mutate<Pick<Mutation, "createForm">>(CREATE_FORM, {
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
    const { data } = await mutate<Pick<Mutation, "createForm">>(CREATE_FORM, {
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
      const { errors } = await mutate<Pick<Mutation, "createForm">>(
        CREATE_FORM,
        {
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
        }
      );

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
    const { data, errors } = await mutate<Pick<Mutation, "createForm">>(
      CREATE_FORM,
      {
        variables: {
          createFormInput
        }
      }
    );

    expect(errors).toEqual(undefined);
    expect(data.createForm.transporter).toMatchObject(
      createFormInput.transporter
    );
  });

  test.each(allowedFormats)(
    "%p should be a valid format for transporter and trader receipt validity limit",
    async f => {
      const { user, company } = await userWithCompanyFactory("MEMBER");

      const validityLimit = new Date("2040-01-01");
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
          validityLimit: format(validityLimit, f),
          numberPlate: "AX-123-69",
          customInfo: "T-456"
        },
        trader: {
          company: {
            siret: "12345678901234",
            name: "Trader",
            address: "123 Wall Street, NY",
            contact: "Jane Doe",
            mail: "janedoe@trader.com",
            phone: "06"
          },
          validityLimit: format(validityLimit, f),
          receipt: "8043",
          department: "07"
        }
      };
      const { mutate } = makeClient(user);
      const { data } = await mutate<Pick<Mutation, "createForm">>(CREATE_FORM, {
        variables: {
          createFormInput
        }
      });
      const form = await prisma.form.findUnique({
        where: { id: data.createForm.id }
      });
      expect(form.transporterValidityLimit).toEqual(validityLimit);
      expect(form.traderValidityLimit).toEqual(validityLimit);
    }
  );

  it("should create a form from deprecated packagings fields", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const createFormInput = {
      emitter: {
        company: {
          siret: company.siret
        }
      },
      wasteDetails: {
        packagings: ["FUT", "AUTRE"],
        otherPackaging: "Contenant",
        numberOfPackages: 2
      }
    };
    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createForm">>(CREATE_FORM, {
      variables: { createFormInput }
    });

    const expectedPackagingInfos = [
      { type: "FUT", other: null, quantity: 1 },
      { type: "AUTRE", other: "Contenant", quantity: 1 }
    ];
    expect(data.createForm.wasteDetails.packagingInfos).toMatchObject(
      expectedPackagingInfos
    );
  });

  it(`should disallow a form with more than two "citernes"`, async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const createFormInput = {
      emitter: {
        company: {
          siret: company.siret
        }
      },
      wasteDetails: {
        packagingInfos: [{ type: "CITERNE", quantity: 3 }]
      }
    };
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createForm">>(CREATE_FORM, {
      variables: { createFormInput }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Le nombre de benne ou de citerne ne peut être supérieur à 2.",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it(`should disallow a form with more than two "bennes"`, async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const createFormInput = {
      emitter: {
        company: {
          siret: company.siret
        }
      },
      wasteDetails: {
        packagingInfos: [{ type: "BENNE", quantity: 3 }]
      }
    };
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createForm">>(CREATE_FORM, {
      variables: { createFormInput }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Le nombre de benne ou de citerne ne peut être supérieur à 2.",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it("should allow creating a form with an appendix 2", async () => {
    const { user, company: ttr } = await userWithCompanyFactory("ADMIN");

    const appendix2 = await formFactory({
      ownerId: user.id,
      opt: {
        status: "AWAITING_GROUP",
        recipientCompanySiret: ttr.siret
      }
    });

    const createFormInput = {
      emitter: {
        company: {
          siret: ttr.siret
        }
      },
      appendix2Forms: [{ id: appendix2.id }]
    };
    const { mutate } = makeClient(user);
    const { data, errors } = await mutate<Pick<Mutation, "createForm">>(
      CREATE_FORM,
      {
        variables: { createFormInput }
      }
    );

    expect(errors).toEqual(undefined);
    expect(data.createForm.appendix2Forms[0].id).toBe(appendix2.id);
  });

  it("should disallow creating a form with an appendix 2 if the appendix2 form is already part of another appendix", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");

    const appendix2 = await formFactory({
      ownerId: user.id,
      opt: {
        status: "AWAITING_GROUP"
      }
    });
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        recipientCompanyName: company.name,
        recipientCompanySiret: company.siret
      }
    });
    await prisma.form.update({
      where: { id: form.id },
      data: { appendix2Forms: { connect: [{ id: appendix2.id }] } }
    });

    const createFormInput = {
      emitter: {
        company: {
          siret: company.siret
        }
      },
      appendix2Forms: [{ id: appendix2.id }]
    };
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createForm">>(CREATE_FORM, {
      variables: { createFormInput }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: `Le bordereau ${appendix2.id} est déjà associé à un autre bordereau dans le cadre d'un regroupement avec annexe 2`,
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it("should disallow linking an appendix 2 form if the emitter of the regroupement form is not the recipient of the initial form", async () => {
    const appendix2 = await formFactory({
      ownerId: (await userFactory()).id,
      opt: { status: Status.AWAITING_GROUP }
    });
    const { user, company: ttr } = await userWithCompanyFactory("MEMBER");

    const createFormInput = {
      emitter: {
        company: {
          siret: ttr.siret
        }
      },
      appendix2Forms: [{ id: appendix2.id }]
    };
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createForm">>(CREATE_FORM, {
      variables: { createFormInput }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: `Le bordereau ${appendix2.id} n'est pas en possession du nouvel émetteur`
      })
    ]);
  });

  it("should disallow linking an appendix2 form that is not awaiting groupement", async () => {
    const { user, company: ttr } = await userWithCompanyFactory("MEMBER");
    const appendix2 = await formFactory({
      ownerId: user.id,
      opt: { status: Status.SENT, recipientCompanySiret: ttr.siret }
    });

    const createFormInput = {
      emitter: {
        company: {
          siret: ttr.siret
        }
      },
      appendix2Forms: [{ id: appendix2.id }]
    };
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createForm">>(CREATE_FORM, {
      variables: { createFormInput }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: `Le bordereau ${appendix2.id} n'est pas en attente de regroupement`
      })
    ]);
  });
});
