import type { CreateApplicationInput } from "@td/codegen-back";
import { applicationSchema } from "../validation";

const application: CreateApplicationInput = {
  name: "Waste Manager",
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
    await expect(shouldThrow()).rejects.toThrow(
      "Vous devez préciser au moins une URL de redirection"
    );
  });

  test("invalid redirect URI", async () => {
    const shouldThrow = () =>
      applicationSchema.validate({
        ...application,
        redirectUris: ["ceci n'est pas une URL"]
      });
    await expect(shouldThrow()).rejects.toThrow(
      "URL de redirection non sécurisée ou invalide"
    );
  });
});
