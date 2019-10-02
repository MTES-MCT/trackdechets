import { memoizeRequest } from "../cache";
import axios from "axios";

jest.mock("axios");

const companyInfo = {
  siret: "85001946400013",
  siren: "850019464",
  name: "CODE EN STOCK",
  naf: "6201Z",
  libelleNaf: "Programmation informatique",
  address: "4 Boulevard Longchamp 13001 Marseille",
  longitude: "5.387147",
  latitude: "43.300749"
};

// https://stackoverflow.com/questions/51495473/typescript-and-jest-avoiding-type-errors-on-mocked-functions

describe("memoizeRequest", () => {
  it("should cache value based on siret key", async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({ data: companyInfo });
    let c = await memoizeRequest("85001946400013");
    expect(c).toEqual(companyInfo);
    expect(axios.get as jest.Mock).toHaveBeenCalledTimes(1);

    // Call the function another time and check it is called only once
    await memoizeRequest("85001946400013");
    expect(axios.get as jest.Mock).toHaveBeenCalledTimes(1);
  });

  it("should not cache value if an error is raised", async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce(
      new Error("something went wrong")
    );
    let c = await memoizeRequest("bad siret");
    expect(c).toBeUndefined();
  });
});
