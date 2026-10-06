import { getDetenteurKey, uniqueDetenteurs } from "../detenteurs";

const company = (siret: string, name = "Entreprise") => ({
  company: { siret, name, address: "1 rue de Paris" },
  isPrivateIndividual: false
});

const particulier = (name: string, address: string) => ({
  company: { siret: null, name, address },
  isPrivateIndividual: true
});

describe("uniqueDetenteurs", () => {
  it("dédoublonne les entreprises par SIRET (exemple du ticket : A deux fois)", () => {
    const result = uniqueDetenteurs([
      company("11111111111111", "A"),
      company("11111111111111", "A"),
      particulier("Jean Dupont", "3 rue des Lilas")
    ]);
    expect(result).toHaveLength(2);
    expect(result[0].company?.name).toBe("A");
    expect(result[1].company?.name).toBe("Jean Dupont");
  });

  it("dédoublonne les particuliers par nom + adresse, sans tenir compte de la casse, des accents ni des espaces", () => {
    const result = uniqueDetenteurs([
      particulier("Jean Dupont", "3 rue des Lilas"),
      particulier("  jean   DUPONT ", "3 rue des lilas"),
      particulier("Jéan Dupont", "3 rue des Lilas")
    ]);
    expect(result).toHaveLength(1);
  });

  it("conserve deux particuliers différents", () => {
    const result = uniqueDetenteurs([
      particulier("Jean Dupont", "3 rue des Lilas"),
      particulier("Jean Dupont", "8 avenue des Roses")
    ]);
    expect(result).toHaveLength(2);
  });

  it("ne confond pas une entreprise et un particulier", () => {
    const result = uniqueDetenteurs([
      company("11111111111111", "Dupont"),
      particulier("Dupont", "1 rue de Paris")
    ]);
    expect(result).toHaveLength(2);
  });

  it("conserve l'ordre et la première occurrence", () => {
    const result = uniqueDetenteurs([
      company("22222222222222", "B"),
      company("11111111111111", "A"),
      company("22222222222222", "B bis")
    ]);
    expect(result.map(d => d.company?.name)).toEqual(["B", "A"]);
  });

  it("ne dédoublonne pas les détenteurs totalement vides", () => {
    expect(getDetenteurKey({ company: null })).toBeNull();
    expect(uniqueDetenteurs([{ company: {} }, { company: {} }])).toHaveLength(
      2
    );
  });
});
