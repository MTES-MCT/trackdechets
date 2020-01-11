import { userMails } from "../mails";
import { Form } from "../../generated/prisma-client";

const formWithTransporter: Form = {
  id: "abcd123",
  readableId: "TD-2019-XYZ",
  createdAt: "2019-01-17T08:44:29+0100",
  updatedAt: "2019-01-17T08:44:29+0100",
  receivedAt: "2019-01-17T10:22:00+0100",
  wasteDetailsCode: "04 01 03*",
  wasteDetailsName: "Chiffonades",
  wasteDetailsQuantity: 32,
  emitterCompanyName: "Producteur*SA/",
  emitterCompanyAddress: "Rue de la Soif, Bretagne",
  recipientCompanyName: "Traitement*SARL/",
  transporterCompanyName: "Jason*Statham/"
};

describe("userMails.formNotAccepted", () => {
  it("should return an email payload", () => {
    const {
      subject,
      title,
      to,
      body,
      attachment
    } = userMails.formNotAccepted(
      "marcel@recyclator.fr",
      "Marcel Dubois",
      formWithTransporter,
      "xyz"
    );
    expect(attachment).toEqual("xyz");
    expect(subject).toEqual("Refus de prise en charge de votre déchet");
    expect(title).toEqual("Refus de prise en charge de votre déchet");
    expect(to[0].email).toEqual("marcel@recyclator.fr");
    expect(to[0].name).toEqual("Marcel Dubois");
    // Check some key content is correctly onserted and formatted
    expect(body).toContain("refusé le 17 janvier 2019");
    expect(body).toContain("Numéro du BSD: TD-2019-XYZ");
    expect(body).toContain("Code déchet : 04 01 03*");
    expect(body).toContain("Quantité : 32 Tonnes refusées");
    expect(body).toContain("société Traitement SARL a refusé");
    expect(body).toContain("Producteur SA - Rue de la Soif, Bretagne");
    expect(body).not.toContain(
      "Exemption relevant de l'article R.541-50 du code de l'Environnement"
    );

    expect(body).toContain("Transporteur : Jason Statham");
  });

  it("should return an email payload with an exemption message", () => {
    const formExemptedOfReceipt = { ...formWithTransporter, transporterIsExemptedOfReceipt: true };
    const {
      subject,
      title,
      to,
      body,
      attachment
    } = userMails.formNotAccepted(
      "marcel@recyclator.fr",
      "Marcel Dubois",
      formExemptedOfReceipt,
      "xyz"
    );

    expect(body).toContain(
      "Exemption relevant de l'article R.541-50 du code de l'Environnement"
    );
    expect(body).not.toContain("Transporteur : Jason Statham");
  });
});
