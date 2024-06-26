import { BsdSubType, IncomingWaste } from "../../generated/graphql/types";
import { CUSTOM_WASTE_COLUMNS, formatRow, formatSubType } from "../columns";

describe("formatRow", () => {
  it("should format waste", () => {
    const waste: IncomingWaste = {
      bsdType: "BSDA",
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
      status: "DRAFT",
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
      transporterRecepisseIsExempted: true,
      transporterTransportMode: "ROAD",
      wasteCode: "01 01 01*",
      wasteDescription: "déchets dangereux",
      destinationPlannedOperationCode: "R10"
    };
    const formatted = formatRow(waste);
    // Fields in the waste object + custom fields added for user convenience
    expect(Object.keys(waste).length + CUSTOM_WASTE_COLUMNS.length).toEqual(
      Object.keys(formatted).length
    );
    expect(formatted).toEqual({
      bsdType: "BSDA",
      id: waste.id,
      wasteDescription: "déchets dangereux",
      wasteCode: "01 01 01*",
      pop: "O",
      status: "DRAFT",
      statusLabel: "Brouillon",
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
      transporterRecepisseIsExempted: "O",
      transporterTransportMode: "Route",
      destinationOperationCode: "R10",
      destinationOperationMode: "RECYCLAGE",
      destinationReceptionDate: "2021-01-01",
      destinationReceptionWeight: 1.2,
      destinationPlannedOperationCode: "R10"
    });
    const formattedWithLabels = formatRow(waste, true);
    expect(formattedWithLabels).toEqual({
      "Type de bordereau": "BSDA",
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
      "Statut du bordereau (code)": "DRAFT",
      "Statut du bordereau": "Brouillon",
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
      "Transporteur SIRET ou n° de TVA intracommunautaire": "transporter siret",
      "Transporteur récépissé": "transporter recepisse",
      "Transporteur exemption de récépissé": "O",
      "Transporteur mode de transport": "Route",
      "Code opération réalisé": "R10",
      "Code opération prévu": "R10",
      "Mode de traitement réalisé": "RECYCLAGE",
      "Date de réception": "2021-01-01",
      "Quantité de déchet entrant (t)": 1.2
    });
    expect(Object.keys(formattedWithLabels).length).toEqual(
      Object.keys(waste).length + CUSTOM_WASTE_COLUMNS.length
    );
  });
});

describe("formatSubType", () => {
  it.each([
    [null, ""],
    [undefined, ""],
    ["", ""],
    ["NOT_A_BSD_SUBTYPE", ""],
    ["INITIAL", "Initial"],
    ["TOURNEE", "Tournée dédiée"],
    ["APPENDIX1", "Annexe 1"],
    ["APPENDIX2", "Annexe 2"],
    ["TEMP_STORED", "Entreposage provisoire"],
    ["COLLECTION_2710", "Collecte en déchetterie"],
    ["GATHERING", "Groupement"],
    ["GROUPEMENT", "Regroupement"],
    ["RESHIPMENT", "Réexpédition"],
    ["RECONDITIONNEMENT", "Reconditionnement"],
    ["SYNTHESIS", "Synthèse"]
  ])("%p should return %p", (input, expected) => {
    // When
    const result = formatSubType(input as BsdSubType);

    // Then
    expect(result).toEqual(expected);
  });
});
