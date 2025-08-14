import { resetDatabase } from "../../../../../integration-tests/helper";
import { ErrorCode } from "../../../../common/errors";
import {
  userFactory,
  userWithCompanyFactory,
  companyFactory,
  siretify
} from "../../../../__tests__/factories";
import { CompanyType } from "@prisma/client";
import makeClient from "../../../../__tests__/testClient";
import type { Mutation } from "@td/codegen-back";
import { fullBsdasriFragment } from "../../../fragments";
import { gql } from "graphql-tag";
import { prisma } from "@td/prisma";

const CREATE_DRAFT_DASRI = gql`
  ${fullBsdasriFragment}
  mutation DasriCreate($input: BsdasriInput!) {
    createDraftBsdasri(input: $input) {
      ...FullBsdasriFragment
    }
  }
`;
describe("Mutation.createDraftBsdasri", () => {
  afterEach(async () => {
    await resetDatabase();
  });

  it("should disallow unauthenticated user", async () => {
    const { mutate } = makeClient();
    const { errors } = await mutate<Pick<Mutation, "createDraftBsdasri">>(
      CREATE_DRAFT_DASRI,
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
    const { errors } = await mutate<Pick<Mutation, "createDraftBsdasri">>(
      CREATE_DRAFT_DASRI,
      {
        variables: {
          input: {
            emitter: {
              company: {
                siret: siretify(9)
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

  it("create a draft dasri with an emitter and a destination", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const destination = await companyFactory();

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
    const { data } = await mutate<Pick<Mutation, "createDraftBsdasri">>(
      CREATE_DRAFT_DASRI,
      {
        variables: {
          input
        }
      }
    );

    expect(data.createDraftBsdasri.isDraft).toBe(true);
    expect(data.createDraftBsdasri.status).toBe("INITIAL");
    expect(data.createDraftBsdasri.type).toBe("SIMPLE");
    expect(data.createDraftBsdasri.destination!.company).toMatchObject(
      input.destination.company
    );
  });

  it("create a draft dasri with intermediaries", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const destination = await companyFactory();
    const intermediary1 = await companyFactory();
    const intermediary2 = await companyFactory();
    const intermediary3 = await companyFactory();

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
      },
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
    const { data, errors } = await mutate<Pick<Mutation, "createDraftBsdasri">>(
      CREATE_DRAFT_DASRI,
      {
        variables: {
          input
        }
      }
    );

    expect(errors).toBeUndefined();

    const { intermediaries } = data.createDraftBsdasri;
    expect(intermediaries?.length).toBe(3);
  });

  it("create a draft dasri (trader)", async () => {
    const { user, company: trader } = await userWithCompanyFactory("MEMBER");
    const emitter = await companyFactory();
    const destination = await companyFactory();

    const input = {
      emitter: {
        company: {
          siret: emitter.siret
        }
      },
      destination: {
        company: {
          siret: destination.siret
        }
      },
      trader: {
        company: {
          siret: trader.siret
        }
      }
    };
    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createDraftBsdasri">>(
      CREATE_DRAFT_DASRI,
      {
        variables: {
          input
        }
      }
    );

    expect(data.createDraftBsdasri.isDraft).toBe(true);
    expect(data.createDraftBsdasri.status).toBe("INITIAL");
    expect(data.createDraftBsdasri.type).toBe("SIMPLE");
    expect(data.createDraftBsdasri.destination!.company).toMatchObject(
      input.destination.company
    );
    expect(data.createDraftBsdasri.trader!.company).toMatchObject(
      input.trader.company
    );

    const created = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: data.createDraftBsdasri.id }
    });
    expect(created.canAccessDraftOrgIds).toEqual([trader.siret]);
  });

  it("won't create a draft dasri (trader) if company has not expected profile", async () => {
    const { user, company: trader } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["PRODUCER", "TRANSPORTER", "WASTEPROCESSOR"]
      }
    });
    const emitter = await companyFactory();
    const destination = await companyFactory();

    const input = {
      emitter: {
        company: {
          siret: emitter.siret
        }
      },
      destination: {
        company: {
          siret: destination.siret
        }
      },
      trader: {
        company: {
          siret: trader.siret
        }
      }
    };
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createDraftBsdasri">>(
      CREATE_DRAFT_DASRI,
      {
        variables: {
          input
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Cet établissement n'a pas le profil Négociant.",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it("create a draft dasri (broker)", async () => {
    const { user, company: broker } = await userWithCompanyFactory("MEMBER");
    const emitter = await companyFactory();
    const destination = await companyFactory();

    const input = {
      emitter: {
        company: {
          siret: emitter.siret
        }
      },
      destination: {
        company: {
          siret: destination.siret
        }
      },
      broker: {
        company: {
          siret: broker.siret
        }
      }
    };
    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createDraftBsdasri">>(
      CREATE_DRAFT_DASRI,
      {
        variables: {
          input
        }
      }
    );

    expect(data.createDraftBsdasri.isDraft).toBe(true);
    expect(data.createDraftBsdasri.status).toBe("INITIAL");
    expect(data.createDraftBsdasri.type).toBe("SIMPLE");
    expect(data.createDraftBsdasri.destination!.company).toMatchObject(
      input.destination.company
    );
    expect(data.createDraftBsdasri.broker!.company).toMatchObject(
      input.broker.company
    );

    const created = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: data.createDraftBsdasri.id }
    });
    expect(created.canAccessDraftOrgIds).toEqual([broker.siret]);
  });

  it("won't create a draft dasri (broker) if company has not expected profile", async () => {
    const { user, company: trader } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["PRODUCER", "TRANSPORTER", "WASTEPROCESSOR"]
      }
    });
    const emitter = await companyFactory();
    const destination = await companyFactory();

    const input = {
      emitter: {
        company: {
          siret: emitter.siret
        }
      },
      destination: {
        company: {
          siret: destination.siret
        }
      },
      broker: {
        company: {
          siret: trader.siret
        }
      }
    };
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createDraftBsdasri">>(
      CREATE_DRAFT_DASRI,
      {
        variables: {
          input
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Cet établissement n'a pas le profil Courtier.",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it.each([
    ["R12", undefined],
    ["D13", undefined]
  ])(
    "should disallow R12 & D13 for non collector or waste center destinations",
    async (code, mode) => {
      // both R12 & D13 operation codes require the destination to be a COLLECTOR or WASTE_CENTER

      const { user, company } = await userWithCompanyFactory("MEMBER");

      const destinationCompany = await companyFactory({
        companyTypes: {
          set: [CompanyType.WASTEPROCESSOR]
        }
      });
      const { mutate } = makeClient(user);
      const { errors } = await mutate<Pick<Mutation, "createDraftBsdasri">>(
        CREATE_DRAFT_DASRI,
        {
          variables: {
            input: {
              emitter: {
                company: {
                  siret: company.siret
                }
              },
              destination: {
                company: {
                  siret: destinationCompany.siret
                },
                operation: {
                  code,
                  mode
                }
              }
            }
          }
        }
      );

      expect(errors).toEqual([
        expect.objectContaining({
          message:
            "Les codes R12 et D13 sont réservés aux installations de tri transit regroupement",
          extensions: expect.objectContaining({
            code: ErrorCode.BAD_USER_INPUT
          })
        })
      ]);
    }
  );
  it.each([
    ["R12", undefined],
    ["D13", undefined]
  ])("should allow R12 & D13 for collector", async (code, mode) => {
    // both R12 & D13 operation codes require the destination to be a COLLECTOR or WASTE_CENTER

    const { user, company } = await userWithCompanyFactory("MEMBER");

    const destinationCompany = await companyFactory({
      companyTypes: {
        set: [CompanyType.COLLECTOR]
      }
    });
    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createDraftBsdasri">>(
      CREATE_DRAFT_DASRI,
      {
        variables: {
          input: {
            emitter: {
              company: {
                siret: company.siret
              }
            },
            destination: {
              company: {
                siret: destinationCompany.siret
              },
              operation: {
                code,
                mode
              }
            }
          }
        }
      }
    );

    expect(data.createDraftBsdasri.isDraft).toBe(true);
  });
  it.each([
    ["R12", undefined],
    ["D13", undefined]
  ])("should allow R12 & D13 for waste center", async (code, mode) => {
    // both R12 & D13 operation codes require the destination to be a COLLECTOR or WASTE_CENTER

    const { user, company } = await userWithCompanyFactory("MEMBER");

    const destinationCompany = await companyFactory({
      companyTypes: {
        set: [CompanyType.WASTE_CENTER]
      }
    });
    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createDraftBsdasri">>(
      CREATE_DRAFT_DASRI,
      {
        variables: {
          input: {
            emitter: {
              company: {
                siret: company.siret
              }
            },
            destination: {
              company: {
                siret: destinationCompany.siret
              },
              operation: {
                code,
                mode
              }
            }
          }
        }
      }
    );

    expect(data.createDraftBsdasri.isDraft).toBe(true);
  });
});
