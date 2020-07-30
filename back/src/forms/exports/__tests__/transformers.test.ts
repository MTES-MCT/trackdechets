import { FormFlattened } from "../types";
import { formatForm } from "../transformers";

test("formatForm should sort keys, add label and format values", () => {
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
    sentAt: "2020-03-01T00:00:00.000Z",
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

  const formatted = formatForm(form);

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
    "Déchet quantité (en tonnes)": form.wasteDetailsQuantity,
    "Transporteur exemption de récépissé": "O",
    "Transporteur immatriculation": form.transporterNumberPlate,
    "Date de prise en charge": "2020-03-01",
    "Date de présentation": "",
    "Lot accepté": ""
  };

  expect(formatted).toEqual(expected);
});
