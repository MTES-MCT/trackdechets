import { FormFlattened } from "../types";
import { formatRow } from "../columns";

describe("formatRow", () => {
  const form: FormFlattened = {
    wasteDetailsQuantity: 22.5,
    emitterCompanyName: "WASTE PRODUCER",
    emitterWorkSiteAddress: "",
    emitterWorkSiteName: "",
    wasteDetailsCode: "06 01 01*",
    recipientCompanyAddress: "16 rue Jean Jaurès 92400 Courbevoie",
    isAccepted: null,
    customId: null,
    emitterCompanyAddress: "20 Avenue de la 1ère Dfl 13000 Marseille",
    recipientCompanySiret: "5678",
    receivedAt: null,
    sentAt: new Date("2020-03-01T00:00:00.000Z"),
    transporterNumberPlate: "aa22",
    transporterIsExemptedOfReceipt: true,
    recipientProcessingOperation: "D 6",
    emitterCompanyContact: "Marc Martin",
    recipientCompanyMail: "recipient@td.io",
    emitterCompanySiret: "1234",
    readableId: "TD-8865a853b7da51b9789db6ada3ef8bee",
    recipientCompanyName: "WASTE COMPANY",
    ecoOrganismeName: ""
  };

  test("useLabelAsKey = false", () => {
    const formatted = formatRow(form, false);

    // it should sort and format values
    const expected = {
      readableId: form.readableId,
      customId: "",
      ecoOrganismeName: "",
      emitterCompanySiret: form.emitterCompanySiret,
      emitterCompanyName: form.emitterCompanyName,
      emitterCompanyContact: form.emitterCompanyContact,
      emitterCompanyAddress: form.emitterCompanyAddress,
      emitterWorkSiteName: "",
      emitterWorkSiteAddress: "",
      recipientCompanySiret: form.recipientCompanySiret,
      recipientCompanyName: form.recipientCompanyName,
      recipientCompanyAddress: form.recipientCompanyAddress,
      recipientCompanyMail: form.recipientCompanyMail,
      recipientProcessingOperation: form.recipientProcessingOperation,
      wasteDetailsCode: form.wasteDetailsCode,
      wasteDetailsQuantity: form.wasteDetailsQuantity,
      transporterIsExemptedOfReceipt: "O",
      transporterNumberPlate: form.transporterNumberPlate,
      sentAt: "2020-03-01",
      receivedAt: "",
      isAccepted: ""
    };

    expect(formatted).toEqual(expected);
  });

  test("useLabelAsKey = true", () => {
    const formatted = formatRow(form, true);

    // it should sort, format values and use label as key
    const expected = {
      "N° de bordereau": form.readableId,
      "Identifiant secondaire": "",
      "Émetteur siret": form.emitterCompanySiret,
      "Émetteur nom": form.emitterCompanyName,
      "Émetteur contact": form.emitterCompanyContact,
      "Émetteur adresse": form.emitterCompanyAddress,
      "Chantier nom": "",
      "Chantier adresse": "",
      "Destination siret": form.recipientCompanySiret,
      "Destination nom": form.recipientCompanyName,
      "Destination adresse": form.recipientCompanyAddress,
      "Destination email": form.recipientCompanyMail,
      "Opération prévue D/R": form.recipientProcessingOperation,
      "Déchet rubrique": form.wasteDetailsCode,
      "Déchet quantité estimée (en tonnes)": form.wasteDetailsQuantity,
      "Transporteur exemption de récépissé": "O",
      "Transporteur immatriculation": form.transporterNumberPlate,
      "Éco-organisme nom": "",
      "Date de prise en charge": "2020-03-01",
      "Date de présentation": "",
      "Lot accepté": ""
    };

    expect(formatted).toEqual(expected);
  });
});
