import { IncomingWaste } from "../../generated/graphql/types";
import { formatRow } from "../columns";

describe("formatRow", () => {
  it("should format waste", () => {
    const waste: IncomingWaste = {
      brokerCompanyName: "broker",
      brokerCompanySiret: "broker_siret",
      brokerRecepisseNumber: "broker_recepisse",
      destinationOperationCode: "R10",
      destinationOperationMode: "RECYCLAGE",
      destinationReceptionDate: new Date("2021-01-01"),
      destinationReceptionWeight: 1.2,
      ecoOrganismeName: null,
      ecoOrganismeSiren: null,
      emitterCompanyAddress: "emitter address",
      emitterCompanyName: "emitter name",
      emitterCompanySiret: "emitter siret",
      emitterPickupsiteAddress: "pickup site address",
      id: "id",
      initialEmitterCompanyAddress: "initial emitter address",
      initialEmitterCompanyName: "initial emitter company name",
      initialEmitterCompanySiret: "initial emitter company siret",
      initialEmitterPostalCodes: ["13001", "13002"],
      pop: true,
      traderCompanyName: "trader name",
      traderCompanySiret: "trader siret",
      traderRecepisseNumber: "trader recepisse",
      transporterCompanyAddress: "transporter address",
      transporterCompanyName: "transporter name",
      transporterCompanySiret: "transporter siret",
      transporterRecepisseNumber: "transporter recepisse",
      wasteCode: "01 01 01*",
      wasteDescription: "déchets dangereux"
    };
    const formatted = formatRow(waste);
    expect(Object.keys(waste).length).toEqual(Object.keys(formatted).length);
    expect(formatted).toEqual({
      id: waste.id,
      wasteDescription: "déchets dangereux",
      wasteCode: "01 01 01*",
      pop: "O",
      initialEmitterCompanyName: "initial emitter company name",
      initialEmitterCompanySiret: "initial emitter company siret",
      initialEmitterPostalCodes: "13001,13002",
      initialEmitterCompanyAddress: "initial emitter address",
      emitterCompanyName: "emitter name",
      emitterCompanySiret: "emitter siret",
      emitterCompanyAddress: "emitter address",
      emitterPickupsiteAddress: "pickup site address",
      ecoOrganismeName: "",
      ecoOrganismeSiren: "",
      traderCompanyName: "trader name",
      traderCompanySiret: "trader siret",
      traderRecepisseNumber: "trader recepisse",
      brokerCompanyName: "broker",
      brokerCompanySiret: "broker_siret",
      brokerRecepisseNumber: "broker_recepisse",
      transporterCompanyAddress: "transporter address",
      transporterCompanyName: "transporter name",
      transporterCompanySiret: "transporter siret",
      transporterRecepisseNumber: "transporter recepisse",
      destinationOperationCode: "R10",
      destinationOperationMode: "RECYCLAGE",
      destinationReceptionDate: "2021-01-01",
      destinationReceptionWeight: 1.2
    });
    const formattedWithLabels = formatRow(waste, true);
    expect(formattedWithLabels).toEqual({
      "N° de bordereau": "id",
      "Dénomination usuelle": "déchets dangereux",
      "Code du déchet": "01 01 01*",
      POP: "O",
      "Producteur initial raison sociale": "initial emitter company name",
      "Producteur initial SIRET": "initial emitter company siret",
      "Producteurs initiaux code postaux": "13001,13002",
      "Producteur initial adresse": "initial emitter address",
      "Expéditeur raison sociale": "emitter name",
      "Expéditeur SIRET": "emitter siret",
      "Expéditeur adresse": "emitter address",
      "Adresse de prise en charge": "pickup site address",
      "Éco-organisme raison sociale": "",
      "Éco-organisme SIREN": "",
      "Négociant raison sociale": "trader name",
      "Négociant SIRET": "trader siret",
      "Négociant récépissé ": "trader recepisse",
      "Courtier raison sociale": "broker",
      "Courtier SIRET": "broker_siret",
      "Courtier N°récepissé": "broker_recepisse",
      "Transporteur adresse": "transporter address",
      "Transporteur raison sociale": "transporter name",
      "Transporteur SIRET ou numéro de TVA le cas échéant": "transporter siret",
      "Transporteur récépissé": "transporter recepisse",
      "Code opération réalisée": "R10",
      "Mode de traitement réalisé": "RECYCLAGE",
      "Date de réception": "2021-01-01",
      "Quantité de déchet entrant (t)": 1.2
    });
    expect(Object.keys(formattedWithLabels).length).toEqual(
      Object.keys(waste).length
    );
  });
});
