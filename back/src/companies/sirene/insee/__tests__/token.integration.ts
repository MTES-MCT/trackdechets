import axios from "axios";
import { authorizedAxiosGet, getToken, INSEE_TOKEN_KEY } from "../token";
import { resetCache } from "../../../../../integration-tests/helper";
import { setInCache } from "../../../../common/redis";
import { siretify } from "../../../../__tests__/factories";
import { aesEncrypt } from "../../../../utils";
import { prisma } from "@td/prisma";

jest.mock("axios");

describe("authorizedAxiosGet", () => {
  const originalEnv = {
    INSEE_CLIENT_ID: process.env.INSEE_CLIENT_ID,
    INSEE_CLIENT_SECRET: process.env.INSEE_CLIENT_SECRET,
    INSEE_USERNAME: process.env.INSEE_USERNAME
  };

  beforeEach(async () => {
    process.env.INSEE_CLIENT_ID = "test-client-id";
    process.env.INSEE_CLIENT_SECRET = "test-client-secret";
    process.env.INSEE_USERNAME = "test-user";

    await prisma.inseePasswordCredential.upsert({
      where: { key: "insee_password" },
      create: {
        key: "insee_password",
        encryptedPassword: aesEncrypt("TestPassword123!"),
        passwordChangedAt: new Date()
      },
      update: {
        encryptedPassword: aesEncrypt("TestPassword123!"),
        passwordChangedAt: new Date()
      }
    });
  });

  afterEach(async () => {
    (axios.get as jest.Mock).mockReset();
    (axios.post as jest.Mock).mockReset();
    process.env.INSEE_CLIENT_ID = originalEnv.INSEE_CLIENT_ID;
    process.env.INSEE_CLIENT_SECRET = originalEnv.INSEE_CLIENT_SECRET;
    process.env.INSEE_USERNAME = originalEnv.INSEE_USERNAME;
    await resetCache();
  });

  it("should renew token when no initial token is set", async () => {
    // check there is no initial token saved
    const initialToken = await getToken();
    expect(initialToken).toBeNull();

    const siret = siretify(1);
    const url = `/siret/${siret}`;
    const validToken = "valid_token";

    // mock POST /token
    (axios.post as jest.Mock).mockResolvedValueOnce({
      status: 200,
      data: {
        access_token: validToken
      }
    });

    // mock GET url
    (axios.get as jest.Mock).mockResolvedValueOnce({
      status: 200,
      data: {
        siret
      }
    });

    // patched will retrieve a token
    // before making the actual call
    const response = await authorizedAxiosGet<{ siret: string }>(url);

    // check it returns the data
    expect(response.data.siret).toEqual(siret);

    // check the token has been saved to redis
    const token = await getToken();
    expect(token).toEqual(validToken);

    // check axios has been called with authorization header
    expect(axios.get as jest.Mock).toHaveBeenCalledWith(url, {
      headers: { Authorization: `Bearer ${validToken}` }
    });
  });

  it("should renew token when an expired token is set", async () => {
    const invalidToken = "invalid_token";
    await setInCache(INSEE_TOKEN_KEY, invalidToken);

    // check initial token is invalid
    const initialToken = await getToken();
    expect(initialToken).toEqual(invalidToken);

    const siret = siretify(1);
    const url = `/siret/${siret}`;
    const validToken = "valid_token";

    // mock GET url returns 401
    (axios.get as jest.Mock).mockRejectedValueOnce({
      response: {
        status: 401
      }
    });

    // mock POST /token
    (axios.post as jest.Mock).mockResolvedValueOnce({
      status: 200,
      data: {
        access_token: validToken
      }
    });

    // mock GET url return 200 and data
    (axios.get as jest.Mock).mockResolvedValueOnce({
      status: 200,
      data: {
        siret
      }
    });

    // patched axios get should try a first time and get 401
    // then renew the token, then retry and get 200
    const response = await authorizedAxiosGet<{ siret: string }>(url);

    // check it returns the data
    expect(response.data.siret).toEqual(siret);

    // check the token has been saved to redis
    const token = await getToken();
    expect(token).toEqual(validToken);

    // check axios has been called first with invalidToken and
    // then with validToken
    expect((axios.get as jest.Mock).mock.calls).toEqual([
      [url, { headers: { Authorization: `Bearer ${invalidToken}` } }],
      [url, { headers: { Authorization: `Bearer ${validToken}` } }]
    ]);
  });
});
