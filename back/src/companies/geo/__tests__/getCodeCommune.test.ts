import axios from "axios";
import { ADRESSE_DATA_GOUV_FR_URL, getCodeCommune } from "../getCodeCommune";

jest.mock("axios");

const API_RESPONSE = {
  data: {
    features: [
      {
        properties: {
          citycode: "40109"
        }
      }
    ]
  }
};

describe("getCodeCommune", () => {
  beforeEach(() => {
    (axios.get as jest.Mock).mockClear();
  });

  it("should send correctly formatted request to data gouv API", async () => {
    // Given
    const address = "4 Boulevard Pasteur 44100 Nantes";
    (axios.get as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve(API_RESPONSE)
    );

    // When
    const res = await getCodeCommune(address);

    // Then
    expect(axios.get as jest.Mock).toHaveBeenCalledTimes(1);
    expect(axios.get as jest.Mock).toHaveBeenCalledWith(
      `${ADRESSE_DATA_GOUV_FR_URL}/search/?q=4+Boulevard+Pasteur+44100+Nantes`
    );
    expect(res).toEqual("40109");
  });

  it("API returns null > should return null", async () => {
    // Given
    const address = "4 Boulevard Pasteur 44100 Nantes";
    (axios.get as jest.Mock).mockImplementationOnce(() => Promise.resolve({}));

    // When
    const res = await getCodeCommune(address);

    // Then
    expect(res).toEqual(null);
  });

  it("API returns several results > should return the first one", async () => {
    // Given
    const address = "4 Boulevard Pasteur 44100 Nantes";
    (axios.get as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        data: {
          features: [
            {
              properties: {
                citycode: "40109"
              }
            },
            {
              properties: {
                citycode: "40110"
              }
            }
          ]
        }
      })
    );

    // When
    const res = await getCodeCommune(address);

    // Then
    expect(res).toEqual("40109");
  });

  it("empty string > should not call the API and return null", async () => {
    // Given
    const address = "";
    (axios.get as jest.Mock).mockImplementationOnce(() => Promise.resolve());

    // When
    const res = await getCodeCommune(address);

    // Then
    expect(res).toEqual(null);
    expect(axios.get as jest.Mock).toHaveBeenCalledTimes(0);
  });

  it("empty string after sanitization > should not call the API and return null", async () => {
    // Given
    const address =
      "/[~`!@#$%^&*()+={}[];:'\"<>.,/?_]/[~`!@#$%^&*()+={}[];:'\"<>.,/?_]";
    (axios.get as jest.Mock).mockImplementationOnce(() => Promise.resolve());

    // When
    const res = await getCodeCommune(address);

    // Then
    expect(res).toEqual(null);
    expect(axios.get as jest.Mock).toHaveBeenCalledTimes(0);
  });

  test.each`
    input                                                                        | expected
    ${"2 rue du Commerce 37100 Tours"}                                           | ${"2+rue+du+Commerce+37100+Tours"}
    ${"text"}                                                                    | ${"text"}
    ${"37100"}                                                                   | ${"37100"}
    ${"text with accents éèàçùÉ"}                                                | ${"text+with+accents+éèàçùÉ"}
    ${"30005 SAINT-MAURICE"}                                                     | ${"30005+SAINT-MAURICE"}
    ${"test/[~`!@#$%^&*()+={}[];:'\"<>.,/?_]"}                                   | ${"test"}
    ${"/[~`!@#$%^&*()+={}[];:'\"<>.,/test2?_]/[~`!@#$%^&*()+={}[];:'\"<>.,/?_]"} | ${"test2"}
  `(
    '"$input" > should call API with $expected',
    async ({ input, expected }) => {
      // Given
      (axios.get as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({})
      );

      // When
      const res = await getCodeCommune(input);

      // Then
      expect(axios.get as jest.Mock).toHaveBeenCalledWith(
        `${ADRESSE_DATA_GOUV_FR_URL}/search/?q=${expected}`
      );
    }
  );

  it("extremely long string > should cut it to avoid huge payloads", async () => {
    // Given
    const address =
      "2432 Rue des margoulins de la plage de Saint-Gaçien des prés-en-velay quelque part sur terre Appartement 90 6ème étage ascenceur 4 34001 SAINT-MAURICE-EN-CAMPAGNE CEDEX 113";
    (axios.get as jest.Mock).mockImplementationOnce(() => Promise.resolve());

    // When
    const res = await getCodeCommune(address);

    // Then
    expect(res).toEqual(null);
    expect(axios.get as jest.Mock).toHaveBeenCalledTimes(1);
    expect(axios.get as jest.Mock).toHaveBeenCalledWith(
      `${ADRESSE_DATA_GOUV_FR_URL}/search/?q=2432+Rue+des+margoulins+de+la+plage+de+Saint-Gaçien+des+prés-en-velay+quelque+part+sur+terre+Appartement+90+6ème+étage+ascenceur+4+34001+SAINT-MAURICE`
    );
  });
});
