import { UserRole } from "@prisma/client";
import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  Mutation,
  MutationCreateBsffArgs
} from "../../../../generated/graphql/types";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { WASTE_CODES } from "../../../constants";

const CREATE_BSFF = `
  mutation CreateBsff($input: BsffInput!) {
    createBsff(input: $input) {
      id
    }
  }
`;

describe("Mutation.createBsff", () => {
  afterEach(resetDatabase);

  it("should allow user to create a bsff", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
    const { mutate } = makeClient(emitter.user);
    const { data, errors } = await mutate<
      Pick<Mutation, "createBsff">,
      MutationCreateBsffArgs
    >(CREATE_BSFF, {
      variables: {
        input: {
          emitter: {
            company: {
              name: emitter.company.name,
              siret: emitter.company.siret,
              address: emitter.company.address,
              contact: emitter.user.name,
              mail: emitter.user.email,
              phone: emitter.company.contactPhone
            }
          },
          transporter: {
            company: {
              name: transporter.company.name,
              siret: transporter.company.siret,
              address: transporter.company.address,
              contact: transporter.user.name,
              mail: transporter.user.email,
              phone: transporter.company.contactPhone
            }
          },
          destination: {
            company: {
              name: destination.company.name,
              siret: destination.company.siret,
              address: destination.company.address,
              contact: destination.user.name,
              mail: destination.user.email,
              phone: destination.company.contactPhone
            }
          },
          waste: {
            code: WASTE_CODES[0],
            adr: "Mention ADR",
            description: "R410"
          },
          weight: {
            value: 1,
            isEstimate: true
          },
          packagings: [
            {
              name: "BOUTEILLE",
              numero: "123",
              weight: 1
            }
          ]
        }
      }
    });

    expect(errors).toBeUndefined();
    expect(data.createBsff.id).toBeTruthy();
  });

  it("should disallow unauthenticated user from creating a bsff", async () => {
    const { mutate } = makeClient();
    const { errors } = await mutate<
      Pick<Mutation, "createBsff">,
      MutationCreateBsffArgs
    >(CREATE_BSFF, {
      variables: {
        input: {}
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        extensions: {
          code: "UNAUTHENTICATED"
        }
      })
    ]);
  });

  it("should disallow user that is not a contributor on the bsff", async () => {
    const { user } = await userWithCompanyFactory(UserRole.ADMIN);
    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "createBsff">,
      MutationCreateBsffArgs
    >(CREATE_BSFF, {
      variables: {
        input: {
          emitter: {
            company: {
              name: "Clim' Clean",
              siret: "1".repeat(14),
              address: "12 rue de Laval 69000",
              contact: "Marco Polo",
              mail: "marco.polo@gmail.com"
            }
          }
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Vous ne pouvez pas éditer un bordereau sur lequel le SIRET de votre entreprise n'apparaît pas."
      })
    ]);
  });
});
