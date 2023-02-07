import {
  resetDatabase,
  refreshElasticSearch
} from "../../../integration-tests/helper";
import { ErrorCode } from "../../common/errors";
import {
  userFactory,
  userWithCompanyFactory,
  companyFactory,
  siretify
} from "../../__tests__/factories";
import makeClient from "../../__tests__/testClient";
import { Mutation } from "../../generated/graphql/types";
import { webhookSettingFactory } from "./factories";
import {
  getWebhookSettings,
  clearWebhookSetting
} from "../../common/redis/webhooksettings";
import { gql } from "apollo-server-express";
import prisma from "../../prisma";
import * as sendHook from "../../queue/jobs/sendHook";

import axios from "axios";

const mockedAxiosPostSpy = jest.spyOn(sendHook, "axiosPost");
mockedAxiosPostSpy.mockResolvedValue(null);

const mockedAxiosPost = jest.spyOn(axios, "post");
mockedAxiosPost.mockResolvedValue(null);

// import * as sirenify from "../sirenify";

// const sirenifyMock = jest
//   .spyOn(sirenify, "default")
//   .mockImplementation(input => Promise.resolve(input));

const CREATE_DASRI = gql`
  mutation DasriCreate($input: BsdasriInput!) {
    createBsdasri(input: $input) {
      id
    }
  }
`;
describe("Mutation.createDasri", () => {
  // beforeEach(() => {
  //   mockedAxiosPost.mockClear();
  // });
  afterEach(async () => {
    await resetDatabase();
    await clearWebhookSetting();
  });

  it("create a dasri with an emitter and a recipient", async () => {
    // (mockedAxiosPost as jest.Mock<any>).mockImplementationOnce(() =>
    //   Promise.resolve({})
    // );
    const { user, company } = await userWithCompanyFactory("MEMBER");
    await webhookSettingFactory({
      company,
      token: "the_secret",
      endpointUri: "https://td.requestcatcher.com/"
    });
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
    await refreshElasticSearch();
    const created = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: data.createBsdasri.id }
    });
    expect(mockedAxiosPostSpy).toHaveBeenCalledTimes(1);
    expect(mockedAxiosPost as jest.Mock<any>).toHaveBeenCalledTimes(1);

    // expect(mockedAxiosPost).toHaveBeenCalledWith(
    //   "https://td.requestcatcher.com/",
    //   [{ action: "CREATED", id: data.createBsdasri.id }]
    // );
  });
});
