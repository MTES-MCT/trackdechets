import { CreateApplicationInput } from "@trackdechets/codegen/src/back.gen";
import { applicationSchema } from "../validation";

const application: CreateApplicationInput = {
  name: "Waste Manager",
  logoUrl: "https://wastemanager.fr/assets/logo.jpg",
  redirectUris: ["https://api.wastemanager.fr/callback"],
  goal: "CLIENTS"
};

describe("applicationSchema", () => {
  test("valid payload", () => {
    expect(applicationSchema.isValidSync(application)).toEqual(true);
  });

  test("0 length redirectUris", async () => {
    const shouldThrow = () =>
      applicationSchema.validate({ ...application, redirectUris: [] });
    await expect(shouldThrow()).rejects.toThrowError(
      "Vous devez préciser au moins une URL de redirection"
    );
  });

  test("invalid redirect URI", async () => {
    const shouldThrow = () =>
      applicationSchema.validate({
        ...application,
        redirectUris: ["ceci n'est pas une URL"]
      });
    await expect(shouldThrow()).rejects.toThrowError("URL invalide");
  });

  test("invalid logoUrl", async () => {
    const shouldThrow = () =>
      applicationSchema.validate({
        ...application,
        logoUrl: "ceci n'est pas une URL"
      });
    await expect(shouldThrow()).rejects.toThrowError("URL invalide");
  });
});
