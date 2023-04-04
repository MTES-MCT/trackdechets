import { resetDatabase } from "../../../../../integration-tests/helper";
import { ErrorCode } from "../../../../common/errors";
import {
  userFactory,
  userWithCompanyFactory,
  companyFactory,
  siretify,
  getDestinationInfo
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { Mutation } from "../../../../generated/graphql/types";
import { fullGroupingBsdasriFragment } from "../../../fragments";
import { gql } from "apollo-server-express";
import prisma from "../../../../prisma";
import * as sirenify from "../../../sirenify";

const sirenifyMock = jest
  .spyOn(sirenify, "default")
  .mockImplementation(input => Promise.resolve(input));

const CREATE_DASRI = gql`
  ${fullGroupingBsdasriFragment}
  mutation DasriCreate($input: BsdasriInput!) {
    createBsdasri(input: $input) {
      ...FullGroupingBsdasriFragment
    }
  }
`;

describe("Mutation.createDasri", () => {
  afterEach(async () => {
    await resetDatabase();
    sirenifyMock.mockClear();
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
                siret: siretify(6)
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
      waste: {
        adr: "xyz 33" //missing waste code
      },
      emitter: {
        company: {
          name: "hopital blanc",
          siret: company.siret,
          //missing contact
          phone: "06 18 76 02 00",
          address: "avenue de la mer"
        },
        emission: {
          weight: { value: 23, isEstimate: false },

          packagings: [
            {
              type: "BOITE_CARTON",
              volume: 22,
              quantity: 3
            }
          ]
        }
      },
      ...(await getDestinationInfo())
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
      waste: { adr: "xyz 33", code: "18 01 03*" },
      emitter: {
        company: {
          name: "hopital blanc",
          siret: company.siret,
          contact: "jean durand",
          phone: "06 18 76 02 00",
          // email not required
          address: "avenue de la mer"
        },
        emission: {
          weight: { value: 23.2, isEstimate: false },

          packagings: [
            {
              type: "BOITE_CARTON",
              volume: 22,
              quantity: 3
            }
          ]
        }
      },
      ...(await getDestinationInfo())
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
    expect(data.createBsdasri.type).toEqual("SIMPLE");

    expect(data.createBsdasri.emitter!.company!.siret).toEqual(company.siret);
    const created = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: data.createBsdasri.id }
    });
    expect(created.synthesisEmitterSirets).toEqual([]);
    // check input is sirenified
    expect(sirenifyMock).toHaveBeenCalledTimes(1);
  });

  it("create a dasri with a default transport mode", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const input = {
      waste: { adr: "xyz 33", code: "18 01 03*" },
      transporter: {
        company: {
          address: "5, route du dasri",
          contact: "-",
          mail: "_@email.indisponible",
          name: "Transporteur de dasris",
          phone: "-",
          siret: company.siret
        },
        customInfo: null,
        recepisse: {
          department: "26",
          number: "N°99999",
          validityLimit: "2022-06-06T22:00:00"
        },
        transport: {
          acceptation: null,
          handedOverAt: null,
          mode: null,
          packagings: [],
          plates: [],
          takenOverAt: null,
          weight: {}
        }
      },
      emitter: {
        company: {
          name: "hopital blanc",
          siret: company.siret,
          contact: "jean durand",
          phone: "06 18 76 02 00",
          // email not required
          address: "avenue de la mer"
        },
        emission: {
          weight: { value: 23.2, isEstimate: false },

          packagings: [
            {
              type: "BOITE_CARTON",
              volume: 22,
              quantity: 3
            }
          ]
        }
      },
      ...(await getDestinationInfo())
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
    expect(data.createBsdasri.type).toEqual("SIMPLE");

    expect(data.createBsdasri.emitter!.company!.siret).toEqual(company.siret);
  });
});

describe("Mutation.createDasri validation scenarii", () => {
  afterEach(async () => {
    await resetDatabase();
  });

  it("Emitter weight isEstimate is required when value is provided", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const input = {
      waste: { adr: "xyz 33", code: "18 01 03*" },
      emitter: {
        company: {
          mail: "emitter@test.fr",
          name: "hopital blanc",
          siret: company.siret,
          contact: "jean durand",
          phone: "06 18 76 02 00",
          address: "avenue de la mer"
        },
        emission: {
          weight: { value: 15 }, // isEstimate not provided

          packagings: [
            {
              type: "BOITE_CARTON",
              volume: 22,
              quantity: 3
            }
          ]
        }
      },
      ...(await getDestinationInfo())
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
          "Le type de pesée (réelle ou estimée) doit être précisé si vous renseignez un poids de déchets émis",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });
  it("Emitter weight value is required when isEstimate is provided", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const input = {
      waste: { adr: "xyz 33", code: "18 01 03*" },
      emitter: {
        company: {
          mail: "emitter@test.fr",
          name: "hopital blanc",
          siret: company.siret,
          contact: "jean durand",
          phone: "06 18 76 02 00",
          address: "avenue de la mer"
        },
        emission: {
          weight: { isEstimate: true }, // value not provided

          packagings: [
            {
              type: "BOITE_CARTON",
              volume: 22,
              quantity: 3
            }
          ]
        }
      },
      ...(await getDestinationInfo())
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
          "Le poids de déchets émis en kg est obligatoire si vous renseignez le type de pesée",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });
  it("create a dasri without emission weight", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const input = {
      waste: { adr: "xyz 33", code: "18 01 03*" },
      emitter: {
        company: {
          name: "hopital blanc",
          siret: company.siret,
          contact: "jean durand",
          phone: "06 18 76 02 00",
          mail: "emitter@test.fr",
          address: "avenue de la mer"
        },
        emission: {
          packagings: [
            {
              type: "BOITE_CARTON",
              volume: 22,
              quantity: 3
            }
          ]
        }
      },
      ...(await getDestinationInfo())
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

    expect(data.createBsdasri.emitter!.company!.siret).toEqual(company.siret);
  });

  it("Transport weight isEstimate is required when value is provided", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const transporterCompany = await companyFactory();
    const input = {
      waste: { adr: "xyz 33", code: "18 01 03*" },
      emitter: {
        company: {
          mail: "emitter@test.fr",
          name: "hopital blanc",
          siret: company.siret,
          contact: "jean durand",
          phone: "06 18 76 02 00",
          address: "avenue de la mer"
        },
        emission: {
          packagings: [
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
        },
        transport: {
          weight: { value: 22 }, // isEstimate not provided
          packagings: [
            {
              type: "BOITE_CARTON",
              volume: 22,
              quantity: 3
            }
          ]
        }
      },
      ...(await getDestinationInfo())
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
          "Le type de pesée (réelle ou estimée) doit être précisé si vous renseignez un poids de déchets transportés",
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
      waste: { adr: "xyz 33", code: "18 01 03*" },
      emitter: {
        company: {
          mail: "emitter@test.fr",
          name: "hopital blanc",
          siret: company.siret,
          contact: "jean durand",
          phone: "06 18 76 02 00",
          address: "avenue de la mer"
        },
        emission: {
          packagings: [
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
        },
        transport: {
          weight: { isEstimate: true }, // value not provided
          packagings: [
            {
              type: "BOITE_CARTON",
              volume: 22,
              quantity: 3
            }
          ]
        }
      },
      ...(await getDestinationInfo())
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
          "Le poids de déchets transportés en kg est obligatoire si vous renseignez le type de pesée",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });
  it("should allow containers numbers", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const transporterCompany = await companyFactory();

    const input = {
      waste: { adr: "xyz 33", code: "18 01 03*" },
      identification: {
        numbers: ["GRV-XY12345", "GRV-VB45678"]
      },
      emitter: {
        company: {
          name: "hopital blanc",
          siret: company.siret,
          contact: "jean durand",
          phone: "06 18 76 02 00",

          address: "avenue de la mer"
        },
        emission: {
          weight: { value: 23.2, isEstimate: false },

          packagings: [
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
        },
        transport: {
          weight: { value: 22, isEstimate: false },
          packagings: [
            {
              type: "BOITE_CARTON",
              volume: 22,
              quantity: 3
            }
          ]
        }
      },
      ...(await getDestinationInfo())
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
    expect(data.createBsdasri.identification!.numbers).toEqual([
      "GRV-XY12345",
      "GRV-VB45678"
    ]);
  });

  it("should allow up to 2 transporter plates", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const transporterCompany = await companyFactory();

    const input = {
      waste: { adr: "xyz 33", code: "18 01 03*" },
      emitter: {
        company: {
          name: "hopital blanc",
          siret: company.siret,
          contact: "jean durand",
          phone: "06 18 76 02 00",

          address: "avenue de la mer"
        },
        emission: {
          weight: { value: 23.2, isEstimate: false },

          packagings: [
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
        },
        transport: {
          plates: ["AB-44-YU", "CF-43-TT"],
          weight: { value: 22, isEstimate: false },
          packagings: [
            {
              type: "BOITE_CARTON",
              volume: 22,
              quantity: 3
            }
          ]
        }
      },
      ...(await getDestinationInfo())
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
    expect(data.createBsdasri.transporter!.transport!.plates!.length).toEqual(
      2
    );
  });

  it("should fail creating the form if more than 2 plates are submitted", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const transporterCompany = await companyFactory();

    const input = {
      waste: { adr: "xyz 33", code: "18 01 03*" },
      emitter: {
        company: {
          name: "hopital blanc",
          siret: company.siret,
          contact: "jean durand",
          phone: "06 18 76 02 00",

          address: "avenue de la mer"
        },
        emission: {
          weight: { value: 23.2, isEstimate: false },

          packagings: [
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
        },
        transport: {
          plates: ["AB-44-YU", "CF-43-TT", "BG-32-UU"], // 3 plates, only 2 allowed
          weight: { value: 22, isEstimate: false },
          packagings: [
            {
              type: "BOITE_CARTON",
              volume: 22,
              quantity: 3
            }
          ]
        }
      },
      ...(await getDestinationInfo())
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
        message: "Un maximum de 2 plaques d'immatriculation est accepté",
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
      waste: { adr: "xyz 33", code: "18 01 03*" },
      emitter: {
        company: {
          name: "hopital blanc",
          siret: company.siret,
          contact: "jean durand",
          phone: "06 18 76 02 00",
          mail: "emitter@test.fr",
          address: "avenue de la mer"
        },
        emission: {
          packagings: [
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
        },
        transport: {
          packagings: [
            {
              type: "BOITE_CARTON",
              volume: 22,
              quantity: 3
            }
          ]
        }
      },
      ...(await getDestinationInfo())
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

    expect(data.createBsdasri.emitter!.company!.siret).toEqual(company.siret);
  });

  it("should convert 18 01 02* to 18 02 02*", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const input = {
      waste: { adr: "xyz 33", code: "18 01 02*" },
      emitter: {
        company: {
          name: "hopital blanc",
          siret: company.siret,
          contact: "jean durand",
          phone: "06 18 76 02 00",
          address: "avenue de la mer"
        },
        emission: {
          weight: { value: 23.2, isEstimate: false },
          packagings: [
            {
              type: "BOITE_CARTON",
              volume: 22,
              quantity: 3
            }
          ]
        }
      },
      ...(await getDestinationInfo())
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

    expect(data.createBsdasri.waste!.code).toEqual("18 02 02*");
  });

  it("should allow decimal volume", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const input = {
      waste: { adr: "xyz 33", code: "18 01 03*" },
      emitter: {
        company: {
          name: "hopital blanc",
          siret: company.siret,
          contact: "jean durand",
          phone: "06 18 76 02 00",
          // email not required
          address: "avenue de la mer"
        },
        emission: {
          weight: { value: 23.2, isEstimate: false },
          packagings: [
            {
              type: "BOITE_CARTON",
              volume: 0.5,
              quantity: 3
            }
          ]
        }
      },
      ...(await getDestinationInfo())
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
