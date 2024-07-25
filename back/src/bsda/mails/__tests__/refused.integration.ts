import { Status, UserRole, WasteAcceptationStatus } from "@prisma/client";
import { userWithCompanyFactory } from "../../../__tests__/factories";
import { renderBsdaRefusedEmail } from "../refused";
import { buildPdfAsBase64 } from "../../pdf/generator";
import { resetDatabase } from "../../../../integration-tests/helper";
import { bsdaFactory } from "../../__tests__/factories";

jest.mock("../../pdf/generator");
(buildPdfAsBase64 as jest.Mock).mockResolvedValue("");

describe("renderBsdaRefusedEmail", () => {
  afterAll(resetDatabase);

  test("when the bsda is refused by the destination", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);

    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: emitter.company.siret,
        emitterCompanyName: emitter.company.name,
        emitterCompanyAddress: emitter.company.address,
        destinationCompanySiret: destination.company.siret,
        destinationCompanyName: destination.company.name,
        destinationCompanyAddress: destination.company.address,
        emitterEmissionSignatureDate: new Date("2022-01-01"),
        destinationReceptionDate: new Date("2022-01-02"),
        status: Status.REFUSED,
        destinationReceptionWeight: 10,
        destinationReceptionAcceptationStatus: WasteAcceptationStatus.REFUSED,
        destinationReceptionRefusalReason: "Parce que !!"
      }
    });
    const email = await renderBsdaRefusedEmail(bsda);
    expect(email!.to).toEqual([
      { email: emitter.user.email, name: emitter.user.name }
    ]);
    expect(email!.cc).toEqual([
      { email: destination.user.email, name: destination.user.name }
    ]);
    expect(email!.body).toContain(`<p>
  Nous vous informons que la société ${destination.company.name}
  (${destination.company.siret}) a refusé le 2 janvier 2022, le déchet de
  la société suivante :
</p>
<br />
<ul>
  <li>
    ${emitter.company.name} (${emitter.company.siret}) -
    ${emitter.company.address}
  </li>
  <li>Informations relatives aux déchets refusés :</li>
  <ul>
    <li>Numéro du BSD: ${bsda.id}</li>
    <li>Appellation du déchet : ${bsda.wasteMaterialName}</li>
    <li>Code déchet : ${bsda.wasteCode}</li>
    <li>Quantité réelle présentée nette: ${bsda.destinationReceptionWeight
      ?.dividedBy(1000)
      .toDecimalPlaces(6)
      .toNumber()} tonnes</li>
    <li>Quantité refusée nette: Non renseignée</li>
    <li>Quantité acceptée nette: Non renseignée</li>
    <li>
      Motif de refus :
      <span>${bsda.destinationReceptionRefusalReason}</span>`);
  });

  test("when the bsda is refused by the destination and dreal notification is activated", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);

    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: emitter.company.siret,
        emitterCompanyName: emitter.company.name,
        emitterCompanyAddress: emitter.company.address,
        destinationCompanySiret: destination.company.siret,
        destinationCompanyName: destination.company.name,
        destinationCompanyAddress: destination.company.address,
        emitterEmissionSignatureDate: new Date("2022-01-01"),
        destinationReceptionDate: new Date("2022-01-02"),
        status: Status.REFUSED,
        destinationReceptionAcceptationStatus: WasteAcceptationStatus.REFUSED,
        destinationReceptionRefusalReason: "Parce que !!"
      }
    });
    const email = await renderBsdaRefusedEmail(bsda, true);
    expect(email!.cc).toEqual([
      { email: destination.user.email, name: destination.user.name },
      {
        email: "sric.ud92.drieat-if@developpement-durable.gouv.fr",
        name: "UD75 (Unité Départementale de Paris)"
      }
    ]);
  });

  test("when the bsda is refused by the destination and emitter is private individual", async () => {
    const destination = await userWithCompanyFactory(UserRole.ADMIN);

    const bsda = await bsdaFactory({
      opt: {
        emitterIsPrivateIndividual: true,
        emitterCompanySiret: null,
        emitterCompanyName: "Jean Dupond",
        emitterCompanyAddress: "",
        emitterCompanyMail: "jean.dupond@dupond.fr",
        destinationCompanySiret: destination.company.siret,
        destinationCompanyName: destination.company.name,
        destinationCompanyAddress: destination.company.address,
        emitterEmissionSignatureDate: new Date("2022-01-01"),
        destinationReceptionDate: new Date("2022-01-02"),
        status: Status.REFUSED,
        destinationReceptionAcceptationStatus: WasteAcceptationStatus.REFUSED,
        destinationReceptionRefusalReason: "Parce que !!"
      }
    });
    const email = await renderBsdaRefusedEmail(bsda, true);
    expect(email!.to).toEqual([
      { email: "jean.dupond@dupond.fr", name: "Jean Dupond" }
    ]);
  });

  test("when the bsda is partially refused by the destination", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);

    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: emitter.company.siret,
        emitterCompanyName: emitter.company.name,
        emitterCompanyAddress: emitter.company.address,
        destinationCompanySiret: destination.company.siret,
        destinationCompanyName: destination.company.name,
        destinationCompanyAddress: destination.company.address,
        emitterEmissionSignatureDate: new Date("2022-01-01"),
        destinationReceptionDate: new Date("2022-01-02"),
        status: Status.PROCESSED,
        destinationReceptionAcceptationStatus:
          WasteAcceptationStatus.PARTIALLY_REFUSED,
        destinationReceptionRefusalReason: "Parce que !!",
        destinationReceptionWeight: 10
      }
    });
    const email = await renderBsdaRefusedEmail(bsda);
    expect(email!.to).toEqual([
      { email: emitter.user.email, name: emitter.user.name }
    ]);
    expect(email!.cc).toEqual([
      { email: destination.user.email, name: destination.user.name }
    ]);
    expect(email!.body).toContain(`<p>
  Nous vous informons que la société ${bsda.destinationCompanyName}
  (${bsda.destinationCompanySiret}) a refusé partiellement le 2 janvier 2022,
  le déchet de la société suivante :
</p>
<br />
<ul>
  <li>
    ${bsda.emitterCompanyName} (${bsda.emitterCompanySiret}) -
    ${bsda.emitterCompanyAddress}
  </li>
  <li>Informations relatives aux déchets refusés :</li>
  <ul>
    <li>Numéro du BSD : ${bsda.id}</li>
    <li>Appellation du déchet : ${bsda.wasteMaterialName}</li>
    <li>Code déchet : ${bsda.wasteCode}</li>
    <li>Quantité réelle présentée nette: ${bsda.destinationReceptionWeight
      ?.dividedBy(1000)
      .toDecimalPlaces(6)
      .toNumber()} tonnes</li>
    <li>Quantité refusée nette: Non renseignée</li>
    <li>Quantité acceptée nette: Non renseignée</li>
    <li>
      Motif de refus :
      <span>${bsda.destinationReceptionRefusalReason}</span>`);
  });
});
