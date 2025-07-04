import { resetDatabase } from "../../../../../integration-tests/helper";
import { ErrorCode } from "../../../../common/errors";
import {
  userFactory,
  userWithCompanyFactory,
  companyFactory,
  siretify,
  getDestinationCompanyInfo,
  transporterReceiptFactory,
  intermediaryReceiptFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import type { Mutation } from "@td/codegen-back";
import { fullGroupingBsdasriFragment } from "../../../fragments";
import { gql } from "graphql-tag";
import { prisma } from "@td/prisma";

import { CompanyRole } from "../../../../common/validation/zod/schema";

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
      ...(await getDestinationCompanyInfo())
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

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          extensions: expect.objectContaining({
            code: "BAD_USER_INPUT",
            issues: expect.arrayContaining([
              expect.objectContaining({
                code: "custom",
                message:
                  "La personne à contacter chez l'émetteur est un champ requis.",
                path: expect.arrayContaining(["emitter", "company", "contact"])
              }),
              expect.objectContaining({
                code: "custom",
                message: "Le code déchet est un champ requis.",
                path: expect.arrayContaining(["waste", "code"])
              })
            ])
          })
        })
      ])
    );
  });

  it("create a dasri with an emitter, transporter and a recipient", async () => {
    const { user, company: emitter } = await userWithCompanyFactory("MEMBER", {
      name: "PRED-COMPANY",
      address: "PRED-ADDRESS"
    });
    const transporter = await companyFactory({ name: "TRS-NAME" });
    const destination = await companyFactory({ name: "DEST-NAME" });
    const input = {
      waste: { adr: "xyz 33", code: "18 01 03*" },
      emitter: {
        company: {
          siret: emitter.siret,
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
      transporter: {
        company: {
          siret: transporter.siret,
          contact: "jean valjean",
          phone: "06 18 76 02 00"
        }
      },
      destination: {
        company: {
          siret: destination.siret,
          contact: "jean tourloupe",
          phone: "06 18 76 02 00"
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
    expect(data.createBsdasri.type).toEqual("SIMPLE");

    expect(data.createBsdasri.emitter!.company!.siret).toEqual(emitter.siret);
    expect(data.createBsdasri.emitter!.company!.name).toEqual(emitter.name);
    expect(data.createBsdasri.emitter!.company!.address).toEqual(
      emitter.address
    );

    expect(data.createBsdasri.transporter!.company!.siret).toEqual(
      transporter.siret
    );
    expect(data.createBsdasri.transporter!.company!.name).toEqual(
      transporter.name
    );
    expect(data.createBsdasri.transporter!.company!.address).toEqual(
      transporter.address
    );
    expect(data.createBsdasri.destination!.company!.siret).toEqual(
      destination.siret
    );
    expect(data.createBsdasri.destination!.company!.name).toEqual(
      destination.name
    );
    expect(data.createBsdasri.destination!.company!.address).toEqual(
      destination.address
    );
    const created = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: data.createBsdasri.id }
    });
    expect(created.synthesisEmitterSirets).toEqual([]);
    expect(created.groupingEmitterSirets).toEqual([]);
    expect(created.emitterCompanyName).toEqual(emitter.name);
    expect(created.emitterCompanyAddress).toEqual(emitter.address);
  });

  describe("[TRA-16173] Destination CAP", () => {
    it("create a dasri with a destination CAP", async () => {
      // Given
      const { user, company: emitter } = await userWithCompanyFactory(
        "MEMBER",
        {
          name: "PRED-COMPANY",
          address: "PRED-ADDRESS"
        }
      );
      const transporter = await companyFactory({ name: "TRS-NAME" });
      const destination = await companyFactory({ name: "DEST-NAME" });
      const input = {
        waste: { adr: "xyz 33", code: "18 01 03*" },
        emitter: {
          company: {
            siret: emitter.siret,
            name: "Emitter",
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
        transporter: {
          company: {
            siret: transporter.siret,
            name: "Transporter",
            contact: "jean valjean",
            phone: "06 18 76 02 00"
          }
        },
        destination: {
          cap: "DESTINATION-CAP",
          company: {
            siret: destination.siret,
            name: "Destination",
            address: "Destination address",
            contact: "jean tourloupe",
            phone: "06 18 76 02 00"
          }
        }
      };

      // When
      const { mutate } = makeClient(user);
      const { data, errors } = await mutate<Pick<Mutation, "createBsdasri">>(
        CREATE_DASRI,
        {
          variables: {
            input
          }
        }
      );

      // Then
      expect(errors).toBeUndefined();
      expect(data.createBsdasri?.destination?.cap).toEqual("DESTINATION-CAP");

      const dasri = await prisma.bsdasri.findUniqueOrThrow({
        where: { id: data.createBsdasri?.id }
      });

      expect(dasri.destinationCap).toBe("DESTINATION-CAP");
    });

    it("create a dasri without a destination CAP", async () => {
      // Given
      const { user, company: emitter } = await userWithCompanyFactory(
        "MEMBER",
        {
          name: "PRED-COMPANY",
          address: "PRED-ADDRESS"
        }
      );
      const transporter = await companyFactory({ name: "TRS-NAME" });
      const destination = await companyFactory({ name: "DEST-NAME" });
      const input = {
        waste: { adr: "xyz 33", code: "18 01 03*" },
        emitter: {
          company: {
            siret: emitter.siret,
            name: "Emitter",
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
        transporter: {
          company: {
            siret: transporter.siret,
            name: "Transporter",
            contact: "jean valjean",
            phone: "06 18 76 02 00"
          }
        },
        destination: {
          cap: null, // No CAP
          company: {
            siret: destination.siret,
            name: "Destination",
            address: "Destination address",
            contact: "jean tourloupe",
            phone: "06 18 76 02 00"
          }
        }
      };

      // When
      const { mutate } = makeClient(user);
      const { data, errors } = await mutate<Pick<Mutation, "createBsdasri">>(
        CREATE_DASRI,
        {
          variables: {
            input
          }
        }
      );

      // Then
      expect(errors).toBeUndefined();
      expect(data.createBsdasri?.destination?.cap).toBeNull();

      const dasri = await prisma.bsdasri.findUniqueOrThrow({
        where: { id: data.createBsdasri?.id }
      });

      expect(dasri.destinationCap).toBeNull();
    });
  });

  it("packagings needs a positive quantity", async () => {
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
              quantity: 0
            }
          ]
        }
      },
      ...(await getDestinationCompanyInfo())
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
        message: "La quantité doit être un nombre positif",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it("packagings needs a positive volume", async () => {
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
              volume: 0,
              quantity: 1
            }
          ]
        }
      },
      ...(await getDestinationCompanyInfo())
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
        message: "Le volume doit être un nombre positif",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
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
      ...(await getDestinationCompanyInfo())
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

  it("should create a dasri and autocomplete transporter recepisse", async () => {
    const transporter = await companyFactory({
      companyTypes: ["TRANSPORTER"]
    });
    await transporterReceiptFactory({
      number: "my recepisse",
      department: "31",
      company: transporter
    });
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
          siret: transporter.siret
        },
        customInfo: null,
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
      ...(await getDestinationCompanyInfo())
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
    expect(data.createBsdasri.transporter!.recepisse!.number).toEqual(
      "my recepisse"
    );
    expect(data.createBsdasri.transporter!.recepisse!.department).toEqual("31");
    expect(data.createBsdasri.transporter!.recepisse!.validityLimit).toEqual(
      "2055-01-01T00:00:00.000Z"
    );
  });

  it("create a dasri with intermediaries", async () => {
    const { user, company: emitter } = await userWithCompanyFactory("MEMBER");
    const destination = await companyFactory();
    const intermediary1 = await companyFactory();
    const intermediary2 = await companyFactory();
    const intermediary3 = await companyFactory();
    const input = {
      waste: { adr: "xyz 33", code: "18 01 03*" },
      transporter: {
        company: {
          address: "5, route du dasri",
          contact: "-",
          mail: "_@email.indisponible",
          name: "Transporteur de dasris",
          phone: "-",
          siret: destination.siret
        },
        customInfo: null,
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
          siret: emitter.siret,
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
      ...(await getDestinationCompanyInfo()),
      intermediaries: [
        {
          siret: intermediary1.siret,
          name: intermediary1.name,
          address: intermediary1.address,
          contact: intermediary1.contact
        },
        {
          siret: intermediary2.siret,
          name: intermediary2.name,
          address: intermediary2.address,
          contact: intermediary2.contact
        },
        {
          siret: intermediary3.siret,
          name: intermediary3.name,
          address: intermediary3.address,
          contact: intermediary3.contact
        }
      ]
    };

    const { mutate } = makeClient(user);
    const { data, errors } = await mutate<Pick<Mutation, "createBsdasri">>(
      CREATE_DASRI,
      {
        variables: {
          input
        }
      }
    );

    expect(errors).toBeUndefined();

    const { intermediaries } = data.createBsdasri;
    expect(intermediaries?.length).toBe(3);
  });

  it("deny dasri creation with more than 3 intermediaries", async () => {
    const { user, company: emitter } = await userWithCompanyFactory("MEMBER");
    const destination = await companyFactory();
    const intermediary1 = await companyFactory();
    const intermediary2 = await companyFactory();
    const intermediary3 = await companyFactory();
    const intermediary4 = await companyFactory();
    const input = {
      waste: { adr: "xyz 33", code: "18 01 03*" },
      transporter: {
        company: {
          address: "5, route du dasri",
          contact: "-",
          mail: "_@email.indisponible",
          name: "Transporteur de dasris",
          phone: "-",
          siret: destination.siret
        },
        customInfo: null,
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
          siret: emitter.siret,
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
      ...(await getDestinationCompanyInfo()),
      intermediaries: [
        {
          siret: intermediary1.siret,
          name: intermediary1.name,
          address: intermediary1.address,
          contact: intermediary1.contact
        },
        {
          siret: intermediary2.siret,
          name: intermediary2.name,
          address: intermediary2.address,
          contact: intermediary2.contact
        },
        {
          siret: intermediary3.siret,
          name: intermediary3.name,
          address: intermediary3.address,
          contact: intermediary3.contact
        },
        {
          siret: intermediary4.siret,
          name: intermediary4.name,
          address: intermediary4.address,
          contact: intermediary4.contact
        }
      ]
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
          "Intermédiaires: impossible d'ajouter plus de 3 intermédiaires",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it("deny dasri creation by an intermediary", async () => {
    const { user, company: intermediary } = await userWithCompanyFactory(
      "MEMBER"
    );
    const destination = await companyFactory();
    const emitter = await companyFactory();

    const input = {
      waste: { adr: "xyz 33", code: "18 01 03*" },
      transporter: {
        company: {
          address: "5, route du dasri",
          contact: "-",
          mail: "_@email.indisponible",
          name: "Transporteur de dasris",
          phone: "-",
          siret: destination.siret
        },
        customInfo: null,
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
          siret: emitter.siret,
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
      ...(await getDestinationCompanyInfo()),
      intermediaries: [
        {
          siret: intermediary.siret,
          name: intermediary.name,
          address: intermediary.address,
          contact: intermediary.contact
        }
      ]
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
          "Vous ne pouvez pas créer un bordereau sur lequel votre entreprise n'apparaît pas",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });

  it("create a dasri (trader)", async () => {
    const { user, company: trader } = await userWithCompanyFactory("MEMBER");

    await intermediaryReceiptFactory({
      role: CompanyRole.Trader,
      company: trader
    });
    const emitter = await companyFactory();
    const destination = await companyFactory();

    const input = {
      waste: { adr: "xyz 33", code: "18 01 03*" },
      transporter: {
        company: {
          address: "5, route du dasri",
          contact: "-",
          mail: "_@email.indisponible",
          name: "Transporteur de dasris",
          phone: "-",
          siret: destination.siret
        },
        customInfo: null,
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
          siret: emitter.siret,
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
      ...(await getDestinationCompanyInfo()),
      trader: {
        company: {
          siret: trader.siret,
          contact: "-",
          phone: "06 18 76 02 00"
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

    expect(data.createBsdasri.status).toBe("INITIAL");
    expect(data.createBsdasri.type).toBe("SIMPLE");

    expect(data.createBsdasri.trader!.company).toMatchObject(
      input.trader.company
    );
  });

  it("won't create a dasri (trader) if company has not expected profile", async () => {
    const { user, company: trader } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["PRODUCER", "TRANSPORTER", "WASTEPROCESSOR"]
      }
    });
    const emitter = await companyFactory();
    const destination = await companyFactory();

    const input = {
      waste: { adr: "xyz 33", code: "18 01 03*" },
      transporter: {
        company: {
          address: "5, route du dasri",
          contact: "-",
          mail: "_@email.indisponible",
          name: "Transporteur de dasris",
          phone: "-",
          siret: destination.siret
        },
        customInfo: null,
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
          siret: emitter.siret,
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
      ...(await getDestinationCompanyInfo()),
      trader: {
        company: {
          siret: trader.siret,
          contact: "-",
          phone: "06 18 76 02 00"
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

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: expect.stringContaining(
            "Cet établissement n'a pas le profil Négociant."
          ),
          extensions: expect.objectContaining({
            code: ErrorCode.BAD_USER_INPUT
          })
        })
      ])
    );
  });

  it("create a dasri (broker)", async () => {
    const { user, company: broker } = await userWithCompanyFactory("MEMBER");

    await intermediaryReceiptFactory({
      role: CompanyRole.Broker,
      company: broker
    });
    const emitter = await companyFactory();
    const destination = await companyFactory();

    const input = {
      waste: { adr: "xyz 33", code: "18 01 03*" },
      transporter: {
        company: {
          address: "5, route du dasri",
          contact: "-",
          mail: "_@email.indisponible",
          name: "Transporteur de dasris",
          phone: "-",
          siret: destination.siret
        },
        customInfo: null,
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
          siret: emitter.siret,
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
      ...(await getDestinationCompanyInfo()),
      broker: {
        company: {
          siret: broker.siret,
          contact: "-",
          phone: "06 18 76 02 00"
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

    expect(data.createBsdasri.broker!.company).toMatchObject(
      input.broker.company
    );
  });

  it("won't create a dasri (broker) if company has not expected profile", async () => {
    const { user, company: broker } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["PRODUCER", "TRANSPORTER", "WASTEPROCESSOR"]
      }
    });
    const emitter = await companyFactory();
    const destination = await companyFactory();

    const input = {
      waste: { adr: "xyz 33", code: "18 01 03*" },
      transporter: {
        company: {
          address: "5, route du dasri",
          contact: "-",
          mail: "_@email.indisponible",
          name: "Transporteur de dasris",
          phone: "-",
          siret: destination.siret
        },
        customInfo: null,
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
          siret: emitter.siret,
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
      ...(await getDestinationCompanyInfo()),
      broker: {
        company: {
          siret: broker.siret,
          contact: "-",
          phone: "06 18 76 02 00"
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

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: expect.stringContaining(
            "Cet établissement n'a pas le profil Courtier."
          ),
          extensions: expect.objectContaining({
            code: ErrorCode.BAD_USER_INPUT
          })
        })
      ])
    );
  });

  it("create a dasri and ignore recepisse input", async () => {
    // transporter has no recepisse
    const transporter = await companyFactory({
      companyTypes: ["TRANSPORTER"]
    });
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
          siret: transporter.siret
        },
        customInfo: null,
        recepisse: {
          department: "83",
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
      ...(await getDestinationCompanyInfo())
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
    // recepissé input was ignored
    expect(data.createBsdasri.transporter!.recepisse).toEqual(null);
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
          name: "hopital blanc",
          mail: "emitter@test.fr",
          contact: "-",
          siret: company.siret,
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
      ...(await getDestinationCompanyInfo())
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
          "Le type de pesée (réelle ou estimée) doit être précisé si vous renseignez un poids de déchets émis.",
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
      ...(await getDestinationCompanyInfo())
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
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          extensions: expect.objectContaining({
            code: "BAD_USER_INPUT",
            issues: expect.arrayContaining([
              expect.objectContaining({
                code: "custom",
                message:
                  "Le poids de déchets émis en kg est obligatoire si vous renseignez le type de pesée.",
                path: expect.arrayContaining([
                  "emitter",
                  "emission",
                  "weight",
                  "isEstimate"
                ])
              })
            ])
          })
        })
      ])
    );
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
      ...(await getDestinationCompanyInfo())
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
      ...(await getDestinationCompanyInfo())
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
      ...(await getDestinationCompanyInfo())
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
          "Le poids de déchets transportés en kg est obligatoire si vous renseignez le type de pesée.",
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
      ...(await getDestinationCompanyInfo())
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
      ...(await getDestinationCompanyInfo())
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
      ...(await getDestinationCompanyInfo())
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

  it("should fail creating the form if plate numbers are invalid", async () => {
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
          plates: ["AB"], // invalid plate number
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
      ...(await getDestinationCompanyInfo())
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
          "Le numéro d'immatriculation doit faire entre 4 et 12 caractères",
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
      ...(await getDestinationCompanyInfo())
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
      ...(await getDestinationCompanyInfo())
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
      ...(await getDestinationCompanyInfo())
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
