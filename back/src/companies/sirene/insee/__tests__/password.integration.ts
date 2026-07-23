import { generateInseePassword } from "../password";

describe("generateInseePassword", () => {
  it("génère un mot de passe respectant les règles INSEE", () => {
    const password = generateInseePassword();

    expect(password).toHaveLength(24);
    expect(password).toMatch(/[A-Z]/);
    expect(password).toMatch(/[a-z]/);
    expect(password).toMatch(/[0-9]/);
    expect(password).toMatch(/[!@#$%*\-_=+]/);
  });

  it("génère des mots de passe différents", () => {
    expect(generateInseePassword()).not.toBe(generateInseePassword());
  });

  it("refuse une longueur inférieure à 12", () => {
    expect(() => generateInseePassword(11)).toThrow("au moins 12 caractères");
  });
});
