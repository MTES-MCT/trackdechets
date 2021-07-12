import { resetDatabase } from "../../../../../integration-tests/helper";
import { ErrorCode } from "../../../../common/errors";
import {
  userFactory,
  userWithCompanyFactory,
  companyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { Mutation } from "../../../../generated/graphql/types";

const CREATE_DASRI = `
mutation DasriCreate($input: BsdasriCreateInput!) {
  createBsdasri(input: $input)  {
    id
    isDraft
    status
    emitter {
      company {
         siret
        }
    }
  }
}
`;
describe("Mutation.createDasri", () => {
  afterEach(async () => {
    await resetDatabase();
  });

  it("should disallow unauthenticated user", async () => {
    const { mutate } = makeClient();
    const { errors } = await mutate<Pick<Mutation, "createBsdasri">>(
      CREATE_DASRI,
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

  it("should disallow a user to create a dasri they are not part of", async () => {
    const user = await userFactory();

    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createBsdasri">>(
      CREATE_DASRI,
      {
        variables: {
          input: {
            emitter: {
              company: {
                siret: "siret"
              }
            }
          }
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Vous ne pouvez pas créer un bordereau sur lequel votre entreprise n'apparaît pas",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });
  it("denies dasri creation if data does not validate", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const input = {
      emitter: {
        company: {
          name: "hopital blanc",
          siret: company.siret,
          //missing contact
          phone: "06 18 76 02 00",
          address: "avenue de la mer"
        }
      },
      emission: {
        wasteDetails: {
          quantity: { value: 23, type: "REAL" }, //missing waste code

          onuCode: "xyz 33",
          packagingInfos: [
            {
              type: "BOITE_CARTON",
              volume: 22,
              quantity: 3
            }
          ]
        }
      }
    };

    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createBsdasri">>(
      CREATE_DASRI,
      {
        variables: {
          input
        }
      }
    );
    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Le code déchet est obligatoire\n" +
          "Émetteur: Le contact dans l'entreprise est obligatoire",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });
  it("create a dasri with an emitter and a recipient", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const input = {
      emitter: {
        company: {
          name: "hopital blanc",
          siret: company.siret,
          contact: "jean durand",
          phone: "06 18 76 02 00",
          // email not required
          address: "avenue de la mer"
        }
      },
      emission: {
        wasteCode: "18 01 03*",
        wasteDetails: {
          quantity: { value: 23.2, type: "REAL" },

          onuCode: "xyz 33",
          packagingInfos: [
            {
              type: "BOITE_CARTON",
              volume: 22,
              quantity: 3
            }
          ]
        }
      }
    };

    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createBsdasri">>(
      CREATE_DASRI,
      {
        variables: {
          input
        }
      }
    );
    expect(data.createBsdasri.isDraft).toEqual(false);
    expect(data.createBsdasri.status).toEqual("INITIAL");

    expect(data.createBsdasri.emitter.company.siret).toEqual(company.siret);
  });
});

describe("Mutation.createDasri validation scenarii", () => {
  afterEach(async () => {
    await resetDatabase();
  });

  it("Emitter quantity type is required when quantity is provided", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const input = {
      emitter: {
        company: {
          mail: "emitter@test.fr",
          name: "hopital blanc",
          siret: company.siret,
          contact: "jean durand",
          phone: "06 18 76 02 00",
          address: "avenue de la mer"
        }
      },
      emission: {
        wasteCode: "18 01 03*",
        wasteDetails: {
          quantity: { value: 15 }, // quantity  value provided, not type

          onuCode: "xyz 33",
          packagingInfos: [
            {
              type: "BOITE_CARTON",
              volume: 22,
              quantity: 3
            }
          ]
        }
      }
    };

    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createBsdasri">>(
      CREATE_DASRI,
      {
        variables: {
          input
        }
      }
    );
    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Le type de quantité (réelle ou estimée) émise doit être précisé si vous renseignez une quantité",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });
  it("Emitter quantity is required when quantity type is provided", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const input = {
      emitter: {
        company: {
          mail: "emitter@test.fr",
          name: "hopital blanc",
          siret: company.siret,
          contact: "jean durand",
          phone: "06 18 76 02 00",
          address: "avenue de la mer"
        }
      },
      emission: {
        wasteCode: "18 01 03*",
        wasteDetails: {
          quantity: { type: "REAL" }, // quantity type provided, not value

          onuCode: "xyz 33",
          packagingInfos: [
            {
              type: "BOITE_CARTON",
              volume: 22,
              quantity: 3
            }
          ]
        }
      }
    };

    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createBsdasri">>(
      CREATE_DASRI,
      {
        variables: {
          input
        }
      }
    );
    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "La quantité du déchet émis en kg est obligatoire si vous renseignez le type de quantité",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });
  it("create a dasri without emission quantity and type", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const input = {
      emitter: {
        company: {
          name: "hopital blanc",
          siret: company.siret,
          contact: "jean durand",
          phone: "06 18 76 02 00",
          mail: "emitter@test.fr",
          address: "avenue de la mer"
        }
      },
      emission: {
        wasteCode: "18 01 03*",
        wasteDetails: {
          onuCode: "xyz 33",
          packagingInfos: [
            {
              type: "BOITE_CARTON",
              volume: 22,
              quantity: 3
            }
          ]
        }
      }
    };

    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createBsdasri">>(
      CREATE_DASRI,
      {
        variables: {
          input
        }
      }
    );
    expect(data.createBsdasri.isDraft).toEqual(false);
    expect(data.createBsdasri.status).toEqual("INITIAL");

    expect(data.createBsdasri.emitter.company.siret).toEqual(company.siret);
  });

  it("Transport quantity type is required when quantity is provided", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const transporterCompany = await companyFactory();
    const input = {
      emitter: {
        company: {
          mail: "emitter@test.fr",
          name: "hopital blanc",
          siret: company.siret,
          contact: "jean durand",
          phone: "06 18 76 02 00",
          address: "avenue de la mer"
        }
      },
      emission: {
        wasteCode: "18 01 03*",
        wasteDetails: {
          onuCode: "xyz 33",
          packagingInfos: [
            {
              type: "BOITE_CARTON",
              volume: 22,
              quantity: 3
            }
          ]
        }
      },
      transporter: {
        company: {
          mail: "trans@test.fr",
          name: "El transporter",
          siret: transporterCompany.siret,
          contact: "Jason Statham",
          phone: "06 18 76 02 00",
          address: "avenue de la mer"
        }
      },
      transport: {
        wasteDetails: {
          quantity: { value: 22 }, // type not provided
          packagingInfos: [
            {
              type: "BOITE_CARTON",
              volume: 22,
              quantity: 3
            }
          ]
        }
      }
    };

    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createBsdasri">>(
      CREATE_DASRI,
      {
        variables: {
          input
        }
      }
    );
    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Le type de quantité (réelle ou estimée) transportée doit être précisé si vous renseignez une quantité",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });
  it("Transport quantity is required when quantity type is provided", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const transporterCompany = await companyFactory();
    const input = {
      emitter: {
        company: {
          mail: "emitter@test.fr",
          name: "hopital blanc",
          siret: company.siret,
          contact: "jean durand",
          phone: "06 18 76 02 00",
          address: "avenue de la mer"
        }
      },
      emission: {
        wasteCode: "18 01 03*",
        wasteDetails: {
          onuCode: "xyz 33",
          packagingInfos: [
            {
              type: "BOITE_CARTON",
              volume: 22,
              quantity: 3
            }
          ]
        }
      },
      transporter: {
        company: {
          mail: "trans@test.fr",
          name: "El transporter",
          siret: transporterCompany.siret,
          contact: "Jason Statham",
          phone: "06 18 76 02 00",
          address: "avenue de la mer"
        }
      },
      transport: {
        wasteDetails: {
          quantity: { type: "ESTIMATED" }, // value not provided
          packagingInfos: [
            {
              type: "BOITE_CARTON",
              volume: 22,
              quantity: 3
            }
          ]
        }
      }
    };

    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createBsdasri">>(
      CREATE_DASRI,
      {
        variables: {
          input
        }
      }
    );
    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "La quantité du déchet transporté en kg est obligatoire si vous renseignez le type de quantité",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it("create a dasri without transport quantity and type", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const transporterCompany = await companyFactory();
    const input = {
      emitter: {
        company: {
          name: "hopital blanc",
          siret: company.siret,
          contact: "jean durand",
          phone: "06 18 76 02 00",
          mail: "emitter@test.fr",
          address: "avenue de la mer"
        }
      },
      emission: {
        wasteCode: "18 01 03*",
        wasteDetails: {
          onuCode: "xyz 33",
          packagingInfos: [
            {
              type: "BOITE_CARTON",
              volume: 22,
              quantity: 3
            }
          ]
        }
      },
      transporter: {
        company: {
          mail: "trans@test.fr",
          name: "El transporter",
          siret: transporterCompany.siret,
          contact: "Jason Statham",
          phone: "06 18 76 02 00",
          address: "avenue de la mer"
        }
      },
      transport: {
        wasteDetails: {
          packagingInfos: [
            {
              type: "BOITE_CARTON",
              volume: 22,
              quantity: 3
            }
          ]
        }
      }
    };

    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createBsdasri">>(
      CREATE_DASRI,
      {
        variables: {
          input
        }
      }
    );
    expect(data.createBsdasri.isDraft).toEqual(false);
    expect(data.createBsdasri.status).toEqual("INITIAL");

    expect(data.createBsdasri.emitter.company.siret).toEqual(company.siret);
  });

  it("Operation quantity is required when operation code is final  ", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const input = {
      emitter: {
        company: {
          mail: "emitter@test.fr",
          name: "hopital blanc",
          siret: company.siret,
          contact: "jean durand",
          phone: "06 18 76 02 00",
          address: "avenue de la mer"
        }
      },
      emission: {
        wasteCode: "18 01 03*",
        wasteDetails: {
          onuCode: "xyz 33",
          packagingInfos: [
            {
              type: "BOITE_CARTON",
              volume: 22,
              quantity: 3
            }
          ]
        }
      },
      operation: {
        processingOperation: "D9" // quantity is expected
      }
    };

    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createBsdasri">>(
      CREATE_DASRI,
      {
        variables: {
          input
        }
      }
    );
    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "La quantité du déchet traité en kg est obligatoire si le code correspond à un traitement final",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it("Operation quantity is not required when operation code is not final  ", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const input = {
      emitter: {
        company: {
          mail: "emitter@test.fr",
          name: "hopital blanc",
          siret: company.siret,
          contact: "jean durand",
          phone: "06 18 76 02 00",
          address: "avenue de la mer"
        }
      },
      emission: {
        wasteCode: "18 01 03*",
        wasteDetails: {
          onuCode: "xyz 33",
          packagingInfos: [
            {
              type: "BOITE_CARTON",
              volume: 22,
              quantity: 3
            }
          ]
        }
      },
      operation: {
        processingOperation: "D12" // quantity is not expected for grouping code
      }
    };

    const { mutate } = makeClient(user);

    const { data } = await mutate<Pick<Mutation, "createBsdasri">>(
      CREATE_DASRI,
      {
        variables: {
          input
        }
      }
    );

    expect(data.createBsdasri.status).toEqual("INITIAL");
  });
});
