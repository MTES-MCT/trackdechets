import { resetDatabase } from "../../../../../integration-tests/helper";
import { ErrorCode } from "../../../../common/errors";
import {
  userFactory,
  userWithCompanyFactory,
  companyFactory
} from "../../../../__tests__/factories";
import { CompanyType } from "@prisma/client";
import makeClient from "../../../../__tests__/testClient";
import { Mutation } from "../../../../generated/graphql/types";
import { fullBsdasriFragment } from "../../../fragments";
import { gql } from "apollo-server-express";

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
                siret: "9999"
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

    const input = {
      emitter: {
        company: {
          siret: company.siret
        }
      },
      destination: {
        company: {
          siret: "11111111111111"
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
    expect(data.createDraftBsdasri.destination.company).toMatchObject(
      input.destination.company
    );
  });

  it.each(["R12", "D12"])(
    "should disallow R12 & D12 for non waste processor destination ",
    async code => {
      // both R12 & D12 operation codes require the destination to be a COLLECTOR

      const { user, company } = await userWithCompanyFactory("MEMBER");

      const destinationCompany = await companyFactory({
        companyTypes: {
          set: [CompanyType.WASTE_CENTER]
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
                  code
                }
              }
            }
          }
        }
      );

      expect(errors).toEqual([
        expect.objectContaining({
          message:
            "Les codes R12 et D12 sont réservés aux installations de tri transit regroupement",
          extensions: expect.objectContaining({
            code: ErrorCode.BAD_USER_INPUT
          })
        })
      ]);
    }
  );
  it.each(["R12", "D12"])(
    "should allow R12 & D12 for waste processor ",
    async code => {
      // both R12 & D12 operation codes require the destination to be a COLLECTOR

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
                  code
                }
              }
            }
          }
        }
      );

      expect(data.createDraftBsdasri.isDraft).toBe(true);
    }
  );
});
