import { groupBy } from "../utils";

describe("groupBy", () => {
  it("should group an array by key", () => {
    const arr = [
      {
        email: "john.snow@trackdechets.fr",
        siret: "siret1",
        role: "MEMBER"
      },
      {
        email: "john.snow@trackdechets.fr",
        siret: "siret2",
        role: "ADMIN"
      },
      {
        email: "arya.stark@trackdechets.fr",
        siret: "siret3",
        role: "MEMBER"
      }
    ];
    const expected = {
      "john.snow@trackdechets.fr": [arr[0], arr[1]],
      "arya.stark@trackdechets.fr": [arr[2]]
    };
    expect(groupBy("email", arr)).toEqual(expected);
  });
});
