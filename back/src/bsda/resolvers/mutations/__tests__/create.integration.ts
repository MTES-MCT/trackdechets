import { resetDatabase } from "../../../../../integration-tests/helper";
import { ErrorCode } from "../../../../common/errors";
import { BsdaInput, Mutation } from "../../../../generated/graphql/types";
import {
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

const CREATE_BSDA = `
mutation CreateBsda($input: BsdaInput!) {
  createBsda(input: $input) {
    id
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
  }
}
`;

describe("Mutation.Bsda.create", () => {
  afterEach(resetDatabase);

  it("should disallow unauthenticated user", async () => {
    const { mutate } = makeClient();
    const { errors } = await mutate<Pick<Mutation, "createBsda">>(CREATE_BSDA, {
      variables: { input: {} }
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
    const { errors } = await mutate<Pick<Mutation, "createBsda">>(CREATE_BSDA, {
      variables: {
        input: {
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

  it("should allow creating a valid form for the producer signature", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const input: BsdaInput = {
      emitter: {
        isPrivateIndividual: false,
        company: {
          siret: company.siret,
          name: "The crusher",
          address: "Rue de la carcasse",
          contact: "Centre amiante",
          phone: "0101010101",
          mail: "emitter@mail.com"
        }
      },
      worker: {
        company: {
          siret: "22222222222222",
          name: "worker",
          address: "address",
          contact: "contactEmail",
          phone: "contactPhone",
          mail: "contactEmail@mail.com"
        }
      },
      waste: {
        code: "16 01 06",
        adr: "ADR",
        consistence: "SOLIDE",
        familyCode: "Code famille",
        materialName: "A material",
        name: "Amiante",
        sealNumbers: ["1", "2"]
      },
      packagings: [{ quantity: 1, type: "PALETTE_FILME" }],
      weight: { isEstimate: true, value: 1.2 },
      destination: {
        cap: "A cap",
        plannedOperationCode: "D 9",
        company: {
          siret: "11111111111111",
          name: "destination",
          address: "address",
          contact: "contactEmail",
          phone: "contactPhone",
          mail: "contactEmail@mail.com"
        }
      }
    };

    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createBsda">>(CREATE_BSDA, {
      variables: {
        input
      }
    });

    expect(data.createBsda.id).toMatch(
      new RegExp(`^BSDA-[0-9]{8}-[A-Z0-9]{9}$`)
    );
    expect(data.createBsda.destination.company.siret).toBe(
      input.destination.company.siret
    );
  });

  it("should fail creating the form if a required field like the waste code is missing", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const input: BsdaInput = {
      emitter: {
        isPrivateIndividual: false,
        company: {
          siret: company.siret,
          name: "The crusher",
          address: "Rue de la carcasse",
          contact: "Centre amiante",
          phone: "0101010101",
          mail: "emitter@mail.com"
        }
      },
      worker: {
        company: {
          siret: "22222222222222",
          name: "worker",
          address: "address",
          contact: "contactEmail",
          phone: "contactPhone",
          mail: "contactEmail@mail.com"
        }
      },
      waste: {
        // code: "16 01 06",
        adr: "ADR",
        consistence: "SOLIDE",
        familyCode: "Code famille",
        materialName: "A material",
        name: "Amiante",
        sealNumbers: ["1", "2"]
      },
      packagings: [{ quantity: 1, type: "PALETTE_FILME" }],
      weight: { isEstimate: true, value: 1.2 },
      destination: {
        cap: "A cap",
        plannedOperationCode: "D 9",
        company: {
          siret: "11111111111111",
          name: "destination",
          address: "address",
          contact: "contactEmail",
          phone: "contactPhone",
          mail: "contactEmail@mail.com"
        }
      }
    };

    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createBsda">>(CREATE_BSDA, {
      variables: {
        input
      }
    });

    expect(errors[0].message).toBe("Le code déchet est obligatoire");
  });
});
