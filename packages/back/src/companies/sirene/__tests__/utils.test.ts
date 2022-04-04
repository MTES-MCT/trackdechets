import { buildAddress, libelleFromCodeNaf, removeDiacritics } from "../utils";

test("removeDiacritics", () => {
  const str = "Anaïs aime la crème brulée";
  expect(removeDiacritics(str)).toEqual("Anais aime la creme brulee");
});

describe("buildAdress", () => {
  test("all address components are defined", () => {
    const address = buildAddress([
      "4",
      "boulevard",
      "Longchamp",
      "13001",
      "Marseille"
    ]);
    expect(address).toEqual("4 boulevard Longchamp 13001 Marseille");
  });
  test("some address components are null or empty", () => {
    const address = buildAddress([
      "",
      "boulevard",
      "Longchamp",
      null,
      "Marseille"
    ]);
    expect(address).toEqual("boulevard Longchamp Marseille");
  });
});

describe("libelleFromCodeNaf", () => {
  it("should return libelle from code naf", () => {
    const programmation = "Programmation informatique";
    expect(libelleFromCodeNaf("62.01Z")).toEqual(programmation);
    expect(libelleFromCodeNaf("6201Z")).toEqual(programmation);
    expect(libelleFromCodeNaf("62-01Z")).toEqual(programmation);
  });
  it("should return empty string if code naf was not found", () => {
    expect(libelleFromCodeNaf("123")).toEqual("");
  });
});
