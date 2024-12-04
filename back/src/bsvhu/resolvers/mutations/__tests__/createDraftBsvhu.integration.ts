import { resetDatabase } from "../../../../../integration-tests/helper";
import { ErrorCode } from "../../../../common/errors";
import { Mutation } from "../../../../generated/graphql/types";
import {
  companyFactory,
  siretify,
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { BsvhuIdentificationType } from "@prisma/client";

const CREATE_VHU_FORM = `
mutation CreateVhuForm($input: BsvhuInput!) {
  createDraftBsvhu(input: $input) {
    id
    customId
    destination {
      company {
          siret
      }
    }
    emitter {
      company {
          siret
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
    }
    weight {
      value
    }
  }
}
`;

describe("Mutation.Vhu.createDraft", () => {
  afterEach(async () => {
    await resetDatabase();
  });

  it("should disallow unauthenticated user", async () => {
    const { mutate } = makeClient();
    const { errors } = await mutate<Pick<Mutation, "createDraftBsvhu">>(
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
    const { errors } = await mutate<Pick<Mutation, "createDraftBsvhu">>(
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
        message: "Votre établissement doit être visé sur le bordereau",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });

  it("create a form with an emitter and a destination", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const destination = await companyFactory({
      companyTypes: ["WASTE_VEHICLES"]
    });

    const input = {
      emitter: {
        company: {
          siret: company.siret
        }
      },
      destination: {
        company: {
          siret: destination.siret
        }
      }
    };
    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createDraftBsvhu">>(
      CREATE_VHU_FORM,
      {
        variables: {
          input
        }
      }
    );

    expect(data.createDraftBsvhu.destination!.company).toMatchObject(
      input.destination.company
    );
  });

  it("create a form with a customid", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const destination = await companyFactory({
      companyTypes: ["WASTE_VEHICLES"]
    });

    const input = {
      customId: "my custom id",
      emitter: {
        company: {
          siret: company.siret
        }
      },
      destination: {
        company: {
          siret: destination.siret
        }
      }
    };
    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createDraftBsvhu">>(
      CREATE_VHU_FORM,
      {
        variables: {
          input
        }
      }
    );

    expect(data.createDraftBsvhu.customId).toEqual("my custom id");
  });

  it("should fail when deprecated identificationType is used", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const destinationCompany = await companyFactory({
      companyTypes: ["WASTE_VEHICLES"],
      wasteVehiclesTypes: ["BROYEUR", "DEMOLISSEUR"]
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
        type: "NUMERO_ORDRE_LOTS_SORTANTS"
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
    const { errors } = await mutate<Pick<Mutation, "createDraftBsvhu">>(
      CREATE_VHU_FORM,
      {
        variables: {
          input
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "identificationType : La valeur du type d'identification est dépréciée",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it("should fail when packaging is LOT and identificationType is not null", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const destinationCompany = await companyFactory({
      companyTypes: ["WASTE_VEHICLES"],
      wasteVehiclesTypes: ["BROYEUR", "DEMOLISSEUR"]
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
      packaging: "LOT",
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
    const { errors } = await mutate<Pick<Mutation, "createDraftBsvhu">>(
      CREATE_VHU_FORM,
      {
        variables: {
          input
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "identificationType : Le type d'identification doit être null quand le conditionnement est en lot",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it("should succeed when packaging is LOT and identificationType is null", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const destinationCompany = await companyFactory({
      companyTypes: ["WASTE_VEHICLES"],
      wasteVehiclesTypes: ["BROYEUR", "DEMOLISSEUR"]
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
      packaging: "LOT",
      identification: {
        numbers: ["123", "456"],
        type: null
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
    const { data } = await mutate<Pick<Mutation, "createDraftBsvhu">>(
      CREATE_VHU_FORM,
      {
        variables: {
          input
        }
      }
    );

    expect(data.createDraftBsvhu.id).toBeTruthy();
  });

  it("should fail when packaging is UNITE and identificationType is null", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const destinationCompany = await companyFactory({
      companyTypes: ["WASTE_VEHICLES"],
      wasteVehiclesTypes: ["BROYEUR", "DEMOLISSEUR"]
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
        type: null
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
    const { errors } = await mutate<Pick<Mutation, "createDraftBsvhu">>(
      CREATE_VHU_FORM,
      {
        variables: {
          input
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "identificationType : Le type d'identification est obligatoire quand le conditionnement est en unité",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it.each([
    BsvhuIdentificationType.NUMERO_ORDRE_REGISTRE_POLICE,
    BsvhuIdentificationType.NUMERO_IMMATRICULATION
  ])(
    "when packaging is UNITE and identificationType is %p",
    async identificationType => {
      const { user, company } = await userWithCompanyFactory("MEMBER");
      const destinationCompany = await companyFactory({
        companyTypes: ["WASTE_VEHICLES"],
        wasteVehiclesTypes: ["BROYEUR", "DEMOLISSEUR"]
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
          type: identificationType
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
      const { data } = await mutate<Pick<Mutation, "createDraftBsvhu">>(
        CREATE_VHU_FORM,
        {
          variables: {
            input
          }
        }
      );

      expect(data.createDraftBsvhu.id).toBeTruthy();
    }
  );
});
