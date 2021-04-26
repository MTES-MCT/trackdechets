import { resetDatabase } from "../../../../../integration-tests/helper";
import { ErrorCode } from "../../../../common/errors";
import {
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

const CREATE_DASRI = `
mutation DasriCreate($input: BsdasriCreateInput!) {
  createBsdasri(bsdasriCreateInput: $input)  {
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
    const { errors } = await mutate(CREATE_DASRI, {
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

  it("should disallow a user to create a dasri they are not part of", async () => {
    const user = await userFactory();

    const { mutate } = makeClient(user);
    const { errors } = await mutate(CREATE_DASRI, {
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
          "Vous ne pouvez pas créer un bordereau sur lequel votre entreprise n'apparaît pas",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });
  it("denies dasri creation if data does not validate", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    console.log(user, company);
    const input = {
      emitter: {
        company: {
          //missing mail
          name: "hopital blanc",
          siret: company.siret,
          contact: "jean durand",
          phone: "06 18 76 02 00",
          address: "avenue de la mer"
        }
      },
      emission: {
        wasteDetails: {
          quantity: 23, //missing waste code
          quantityType: "REAL",
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
    const { errors } = await mutate(CREATE_DASRI, {
      variables: {
        input
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "wasteDetailsCode est un champ requis et doit avoir une valeur\n" +
          "emitterCompanyMail est un champ requis et doit avoir une valeur",
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
          mail: "emitter@test.fr",
          address: "avenue de la mer"
        }
      },
      emission: {
        wasteCode: "18 01 03*",
        wasteDetails: {
          quantity: 23,
          quantityType: "REAL",
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
    const { data } = await mutate(CREATE_DASRI, {
      variables: {
        input
      }
    });
    expect(data.createBsdasri.isDraft).toEqual(false);
    expect(data.createBsdasri.status).toEqual("INITIAL");

    expect(data.createBsdasri.emitter.company.siret).toEqual(company.siret);
  });
});
