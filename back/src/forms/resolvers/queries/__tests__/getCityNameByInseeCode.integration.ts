import axios from "axios";
import type { Query } from "@td/codegen-back";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { ErrorCode } from "../../../../common/errors";

jest.mock("axios");

const GET_CITY_NAME_BY_INSEE_CODE = `
  query GetCityNameByInseeCode($inseeCode: String!) {
    getCityNameByInseeCode(inseeCode: $inseeCode)
  } 
`;

describe("getCityNameByInseeCode", () => {
  afterEach(async () => {
    jest.resetAllMocks();
    await resetDatabase();
  });

  it("should disallow unauthenticated user", async () => {
    const { query } = makeClient();
    const { errors } = await query<Pick<Query, "getCityNameByInseeCode">>(
      GET_CITY_NAME_BY_INSEE_CODE,
      {
        variables: { inseeCode: "75056" }
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

  it("should return city name for valid INSEE code", async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({
      data: { nom: "Paris", code: "75056" }
    });

    const { user } = await userWithCompanyFactory("MEMBER");

    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "getCityNameByInseeCode">>(
      GET_CITY_NAME_BY_INSEE_CODE,
      {
        variables: { inseeCode: "75056" }
      }
    );

    expect(data.getCityNameByInseeCode).toBe("Paris");
    expect(axios.get).toHaveBeenCalledWith(
      "https://geo.api.gouv.fr/communes/75056?fields=nom"
    );
  });

  it("should return empty string when API fails", async () => {
    (axios.get as jest.Mock).mockRejectedValueOnce(new Error("API Error"));

    const { user } = await userWithCompanyFactory("MEMBER");

    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "getCityNameByInseeCode">>(
      GET_CITY_NAME_BY_INSEE_CODE,
      {
        variables: { inseeCode: "99999" }
      }
    );

    expect(data.getCityNameByInseeCode).toBe("");
  });

  it("should return empty string when commune not found", async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({
      data: {}
    });

    const { user } = await userWithCompanyFactory("MEMBER");

    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "getCityNameByInseeCode">>(
      GET_CITY_NAME_BY_INSEE_CODE,
      {
        variables: { inseeCode: "00000" }
      }
    );

    expect(data.getCityNameByInseeCode).toBe("");
  });

  it("should reject invalid INSEE code format (too short)", async () => {
    const { user } = await userWithCompanyFactory("MEMBER");

    const { query } = makeClient(user);
    const { errors } = await query<Pick<Query, "getCityNameByInseeCode">>(
      GET_CITY_NAME_BY_INSEE_CODE,
      {
        variables: { inseeCode: "123" }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message: expect.stringContaining(
          "Le code INSEE doit contenir exactement 5 caractères"
        )
      })
    ]);
  });

  it("should reject invalid INSEE code format (invalid characters)", async () => {
    const { user } = await userWithCompanyFactory("MEMBER");

    const { query } = makeClient(user);
    const { errors } = await query<Pick<Query, "getCityNameByInseeCode">>(
      GET_CITY_NAME_BY_INSEE_CODE,
      {
        variables: { inseeCode: "ABCDE" }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message: expect.stringContaining(
          "Le code INSEE doit être composé de 5 chiffres ou commencer par 2A/2B pour la Corse"
        )
      })
    ]);
  });
});
