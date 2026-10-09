import {
  completeInitialDetenteurs,
  getDetenteurKey,
  uniqueDetenteurs
} from "../detenteurs";

const company = (siret: string, name = "Entreprise") => ({
  company: { siret, name, address: "1 rue de Paris" },
  isPrivateIndividual: false
});

describe("completeInitialDetenteurs", () => {
  it("checks ownership against holders on the other grouped containers too", () => {
    const incomplete = particulier("Jean", "");
    const known = particulier("Jean", "Paris");
    expect(
      completeInitialDetenteurs([incomplete], [known], [incomplete, known])[0]
    ).toEqual(incomplete);
  });
  it("does not select the first of two compatible historical namesakes", () => {
    const initial = particulier("Jean", "");
    expect(
      completeInitialDetenteurs(
        [initial],
        [particulier("Jean", "Paris"), particulier("Jean", "Lyon")]
      )
    ).toEqual([initial]);
  });

  it("does not complete an anonymous holder using the submitted array position", () => {
    const initial = { company: {}, isPrivateIndividual: true };
    expect(
      completeInitialDetenteurs([initial], [particulier("Jean", "Paris")])
    ).toEqual([initial]);
  });

  it("does not reuse another source holder's completion for a partial identity", () => {
    const incomplete = particulier("Jean", "");
    const known = particulier("Jean", "Paris");
    expect(completeInitialDetenteurs([incomplete, known], [known])[0]).toEqual(
      incomplete
    );
  });
  it("keeps prefilled values and persists missing historical contact fields", () => {
    const source = {
      ...company("11111111111111", "A"),
      company: {
        ...company("11111111111111", "A").company,
        contact: "Alice",
        mail: null
      }
    };
    const result = completeInitialDetenteurs(
      [source],
      [
        {
          isPrivateIndividual: true,
          company: {
            ...source.company,
            name: "Modified",
            contact: "Modified",
            mail: "completed@example.org"
          }
        }
      ]
    );
    expect(result[0].company?.contact).toBe("Alice");
    expect(result[0].company?.name).toBe("A");
    expect(result[0].company?.mail).toBe("completed@example.org");
    expect(result[0].isPrivateIndividual).toBe(false);
    expect(source.company.mail).toBeNull();
  });

  it("completes a private individual's missing address without changing their identity", () => {
    const result = completeInitialDetenteurs(
      [particulier("Jean", "")],
      [particulier("Jean", "3 rue des Lilas")]
    );
    expect(result[0].company?.address).toBe("3 rue des Lilas");
    expect(result[0].company?.siret).toBeNull();
  });

  it("ignores unrelated submitted holders", () => {
    expect(
      completeInitialDetenteurs(
        [company("11111111111111")],
        [company("22222222222222")]
      )
    ).toEqual([company("11111111111111")]);
  });
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
