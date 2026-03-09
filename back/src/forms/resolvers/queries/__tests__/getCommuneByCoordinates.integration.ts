import axios from "axios";
import type { Query } from "@td/codegen-back";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { ErrorCode } from "../../../../common/errors";

jest.mock("axios");

const GET_COMMUNE_BY_COORDINATES = `
  query GetCommuneByCoordinates($lat: Float!, $lng: Float!) {
    getCommuneByCoordinates(lat: $lat, lng: $lng) {
      inseeCode
      city
    }
  }
`;

describe("Query.getCommuneByCoordinates", () => {
  afterEach(async () => {
    jest.resetAllMocks();
    await resetDatabase();
  });

  it("should disallow unauthenticated user", async () => {
    const { query } = makeClient();
    const { errors } = await query<Pick<Query, "getCommuneByCoordinates">>(
      GET_COMMUNE_BY_COORDINATES,
      {
        variables: { lat: 48.8566, lng: 2.3522 }
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

  it("should return commune for valid coordinates", async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({
      data: [{ nom: "Paris", code: "75056" }]
    });

    const { user } = await userWithCompanyFactory("MEMBER");

    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "getCommuneByCoordinates">>(
      GET_COMMUNE_BY_COORDINATES,
      {
        variables: { lat: 48.8566, lng: 2.3522 }
      }
    );

    expect(data.getCommuneByCoordinates).toEqual({
      inseeCode: "75056",
      city: "Paris"
    });
    expect(axios.get).toHaveBeenCalledWith(
      "https://geo.api.gouv.fr/communes?lat=48.8566&lon=2.3522&fields=nom,code&limit=1"
    );
  });

  it("should return null when API fails", async () => {
    (axios.get as jest.Mock).mockRejectedValueOnce(new Error("API Error"));

    const { user } = await userWithCompanyFactory("MEMBER");

    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "getCommuneByCoordinates">>(
      GET_COMMUNE_BY_COORDINATES,
      {
        variables: { lat: 48.8566, lng: 2.3522 }
      }
    );

    expect(data.getCommuneByCoordinates).toBeNull();
  });

  it("should return null when no commune found (empty array)", async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({
      data: []
    });

    const { user } = await userWithCompanyFactory("MEMBER");

    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "getCommuneByCoordinates">>(
      GET_COMMUNE_BY_COORDINATES,
      {
        variables: { lat: 0.0, lng: 0.0 }
      }
    );

    expect(data.getCommuneByCoordinates).toBeNull();
  });

  it("should return null when coordinates are outside France", async () => {
    // Coordinates in the Atlantic Ocean
    (axios.get as jest.Mock).mockResolvedValueOnce({
      data: []
    });

    const { user } = await userWithCompanyFactory("MEMBER");

    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "getCommuneByCoordinates">>(
      GET_COMMUNE_BY_COORDINATES,
      {
        variables: { lat: -20.0, lng: -30.0 }
      }
    );

    expect(data.getCommuneByCoordinates).toBeNull();
  });

  it("should reject latitude out of range", async () => {
    const { user } = await userWithCompanyFactory("MEMBER");

    const { query } = makeClient(user);
    const { errors } = await query<Pick<Query, "getCommuneByCoordinates">>(
      GET_COMMUNE_BY_COORDINATES,
      {
        variables: { lat: 100.0, lng: 2.3522 }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message: expect.stringContaining("La latitude doit être comprise entre -90 et 90")
      })
    ]);
  });

  it("should reject longitude out of range", async () => {
    const { user } = await userWithCompanyFactory("MEMBER");

    const { query } = makeClient(user);
    const { errors } = await query<Pick<Query, "getCommuneByCoordinates">>(
      GET_COMMUNE_BY_COORDINATES,
      {
        variables: { lat: 48.8566, lng: 200.0 }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message: expect.stringContaining("La longitude doit être comprise entre -180 et 180")
      })
    ]);
  });
});
