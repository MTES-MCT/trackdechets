import { userMails } from "../mails";
import { Form } from "@prisma/client";

const formWithTransporter: Form = {
  id: "abcd123",
  readableId: "TD-2019-XYZ",
  isImportedFromPaper: false,
  status: "REFUSED",
  createdAt: "2019-01-17T08:44:29+0100",
  updatedAt: "2019-01-17T08:44:29+0100",
  receivedAt: "2019-01-17T10:22:00+0100",
  wasteDetailsCode: "04 01 03*",
  wasteDetailsName: "Chiffonades",
  wasteDetailsQuantity: 32,
  emitterCompanyName: "Producteur*SA/",
  emitterCompanyAddress: "Rue de la Soif, Bretagne",
  wasteRefusalReason: "Non conforme",
  recipientCompanyName: "Traitement*SARL/",
  transporterCompanyName: "Jason*Statham/",
  wasteDetailsPop: false
};

describe("userMails.formNotAccepted", () => {
  it("should return an email payload", () => {
    const { subject, title, to, body, attachment } = userMails.formNotAccepted(
      [{ email: "marcel@recyclator.fr", name: "Marcel Dubois" }],
      [],
      formWithTransporter,
      "xyz"
    );
    expect(attachment).toEqual("xyz");
    expect(subject).toEqual("Refus de prise en charge de votre déchet");
    expect(title).toEqual("Refus de prise en charge de votre déchet");
    expect(to[0].email).toEqual("marcel@recyclator.fr");
    expect(to[0].name).toEqual("Marcel Dubois");
    // Check some key content is correctly onserted and formatted
    expect(body).toContain(
      "la société Traitement SARL a refusé le 17 janvier 2019"
    );
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
    const formExemptedOfReceipt = {
      ...formWithTransporter,
      transporterIsExemptedOfReceipt: true
    };
    const { body } = userMails.formNotAccepted(
      [{ email: "marcel@recyclator.fr", name: "Marcel Dubois" }],
      [],
      formExemptedOfReceipt,
      "xyz"
    );

    expect(body).toContain(
      "Exemption relevant de l'article R.541-50 du code de l'Environnement"
    );
    expect(body).not.toContain("Transporteur : Jason Statham");
  });
});

describe("userMails.formPartiallyRefused", () => {
  it("should return an email payload", () => {
    const payload = { ...formWithTransporter, quantityReceived: 21.54 };
    const {
      subject,
      title,
      to,
      body,
      attachment
    } = userMails.formPartiallyRefused(
      [{ email: "marcel@recyclator.fr", name: "Marcel Dubois" }],
      [],
      payload,
      "xyz"
    );
    expect(attachment).toEqual("xyz");
    expect(subject).toEqual("Refus partiel de prise en charge de votre déchet");
    expect(title).toEqual("Refus partiel de prise en charge de votre déchet");
    expect(to[0].email).toEqual("marcel@recyclator.fr");
    expect(to[0].name).toEqual("Marcel Dubois");
    // Check some key content is correctly onserted and formatted
    expect(body).toContain(
      "la société Traitement SARL a refusé partiellement le 17 janvier 2019"
    );
    expect(body).toContain("Numéro du BSD : TD-2019-XYZ");
    expect(body).toContain("Code déchet : 04 01 03*");
    expect(body).toContain("Quantité refusée (estimée): 10.46 Tonnes");
    expect(body).toContain("Quantité acceptée: 21.54 Tonnes");

    expect(body).toContain("Producteur SA - Rue de la Soif, Bretagne");
    expect(body).toContain("Motif de refus : Non conforme");

    expect(body).not.toContain(
      "Exemption relevant de l'article R.541-50 du code de l'Environnement"
    );

    expect(body).toContain("Transporteur : Jason Statham");
  });

  it("should return an email payload with an exemption message", () => {
    const formExemptedOfReceipt = {
      ...formWithTransporter,
      transporterIsExemptedOfReceipt: true
    };
    const { body } = userMails.formPartiallyRefused(
      [{ email: "marcel@recyclator.fr", name: "Marcel Dubois" }],
      [],
      formExemptedOfReceipt,
      "xyz"
    );

    expect(body).toContain(
      "Exemption relevant de l'article R.541-50 du code de l'Environnement"
    );

    expect(body).not.toContain("Transporteur : Jason Statham");
  });
});
