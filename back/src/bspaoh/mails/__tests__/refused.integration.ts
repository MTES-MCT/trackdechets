import { Status, UserRole, WasteAcceptationStatus } from "@td/prisma";
import { userWithCompanyFactory } from "../../../__tests__/factories";
import { renderBspaohRefusedEmail } from "../refused";
import { buildPdfAsBase64 } from "../../pdf/generator";
import { resetDatabase } from "../../../../integration-tests/helper";
import { bspaohFactory } from "../../__tests__/factories";

jest.mock("../../pdf/generator");
(buildPdfAsBase64 as jest.Mock).mockResolvedValue("");

describe("renderBspaohRefusedEmail", () => {
  afterAll(resetDatabase);

  test("when the bspaoh is refused by the destination", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);

    const bspaoh = await bspaohFactory({
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
        destinationReceptionWasteRefusalReason: "Parce que !!",
        destinationReceptionWasteReceivedWeightValue: 10,
        destinationReceptionWasteRefusedWeightValue: 10,
        destinationReceptionWasteAcceptedWeightValue: 0
      }
    });
    const email = await renderBspaohRefusedEmail(bspaoh);
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
    <li>Numéro du BSD: ${bspaoh.id}</li>
    <li>Appellation du déchet : Pièce anatomique d&#39;origine humaine</li>
    <li>Code déchet : ${bspaoh.wasteCode}</li>
    <li>Quantité réelle présentée nette : 0.01 tonnes</li>
    <li>Quantité refusée nette : 0.01 tonnes</li>
    <li>Quantité acceptée nette : 0 tonnes</li>
    <li>
      Motif de refus :
      <span>${bspaoh.destinationReceptionWasteRefusalReason}</span>`);
  });

  test("when the bspaoh is partially refused by the destination", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);

    const bspaoh = await bspaohFactory({
      opt: {
        emitterCompanySiret: emitter.company.siret,
        emitterCompanyName: emitter.company.name,
        emitterCompanyAddress: emitter.company.address,
        destinationCompanySiret: destination.company.siret,
        destinationCompanyName: destination.company.name,
        destinationCompanyAddress: destination.company.address,
        emitterEmissionSignatureDate: new Date("2024-01-01"),
        destinationReceptionDate: new Date("2024-01-02"),
        status: Status.PROCESSED,
        destinationReceptionAcceptationStatus:
          WasteAcceptationStatus.PARTIALLY_REFUSED,
        destinationReceptionWasteRefusalReason: "Parce que !!",
        destinationReceptionWasteReceivedWeightValue: 50,
        destinationReceptionWasteAcceptedWeightValue: 20,
        destinationReceptionWasteRefusedWeightValue: 30
      }
    });
    const email = await renderBspaohRefusedEmail(bspaoh);
    expect(email!.to).toEqual([
      { email: emitter.user.email, name: emitter.user.name }
    ]);
    expect(email!.cc).toEqual([
      { email: destination.user.email, name: destination.user.name }
    ]);
    expect(email!.body).toContain(`<p>
  Nous vous informons que la société ${bspaoh.destinationCompanyName}
  (${bspaoh.destinationCompanySiret}) a refusé partiellement le 2 janvier 2024,
  le déchet de la société suivante :
</p>
<br />
<ul>
  <li>
    ${bspaoh.emitterCompanyName} (${bspaoh.emitterCompanySiret}) -
    ${bspaoh.emitterCompanyAddress}
  </li>
  <li>Informations relatives aux déchets refusés :</li>
  <ul>
    <li>Numéro du BSD : ${bspaoh.id}</li>
    <li>Appellation du déchet : Pièce anatomique d&#39;origine humaine</li>
    <li>Code déchet : ${bspaoh.wasteCode}</li>
    <li>Quantité réelle présentée nette : 0.05 tonnes</li>
    <li>Quantité refusée nette : 0.03 tonnes</li>
    <li>Quantité acceptée nette : 0.02 tonnes</li>
    <li>
      Motif de refus :
      <span>${bspaoh.destinationReceptionWasteRefusalReason}</span>`);
  });
});
