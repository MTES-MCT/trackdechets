import { BsdSubType, AllWaste } from "../../generated/graphql/types";
import { CUSTOM_WASTE_COLUMNS, formatRow, formatSubType } from "../columns";

describe("formatRow", () => {
  it("should format waste", () => {
    const waste: AllWaste = {
      bsdType: "BSDA",
      brokerCompanyName: "broker",
      brokerCompanySiret: "broker_siret",
      brokerRecepisseNumber: "broker_recepisse",
      destinationOperationCode: "R10",
      destinationOperationMode: "RECYCLAGE",
      destinationReceptionDate: new Date("2021-01-01"),
      ecoOrganismeName: null,
      ecoOrganismeSiren: null,
      emitterCompanyAddress: "1 RUE DE L'HOTEL DE VILLE",
      emitterCompanyPostalCode: "17000",
      emitterCompanyCity: "LA ROCHELLE",
      emitterCompanyCountry: "FR",
      emitterCompanyName: "emitter name",
      emitterCompanySiret: "emitter siret",
      emitterPickupsiteAddress: "2 RUE PIERRE BROSSOLETTE",
      emitterPickupsitePostalCode: "64000",
      emitterPickupsiteCity: "PAU",
      emitterPickupsiteCountry: "FR",
      status: "DRAFT",
      id: "id",
      initialEmitterCompanyAddress: "34 ROUTE DE BRESSUIRE",
      initialEmitterCompanyPostalCode: "79200",
      initialEmitterCompanyCity: "CHATILLON-SUR-THOUET",
      initialEmitterCompanyCountry: "FR",
      initialEmitterCompanyName: "initial emitter company name",
      initialEmitterCompanySiret: "initial emitter company siret",
      pop: true,
      traderCompanyName: "trader name",
      traderCompanySiret: "trader siret",
      traderRecepisseNumber: "trader recepisse",
      transporterCompanyAddress: "VIA TRATTATO DI SCHENGEN 5",
      transporterCompanyPostalCode: "15067",
      transporterCompanyCity: "NOVI LIGURE AL",
      transporterCompanyCountry: "IT",
      transporterCompanyName: "transporter name",
      transporterCompanySiret: "transporter siret",
      transporterRecepisseNumber: "transporter recepisse",
      transporterRecepisseIsExempted: true,
      transporterTransportMode: "ROAD",
      wasteCode: "01 01 01*",
      wasteDescription: "déchets dangereux",
      destinationPlannedOperationCode: "R10",
      weight: 10.5,
      destinationReceptionWeight: 1.2,
      destinationFinalOperationCodes: ["R1", "R2"],
      destinationFinalOperationWeights: [1.24, 2.78],
      destinationFinalOperationCompanySirets: [
        "85001946400021",
        "88792840600024"
      ]
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
      initialEmitterCompanyAddress: "34 ROUTE DE BRESSUIRE",
      initialEmitterCompanyPostalCode: "79200",
      initialEmitterCompanyCity: "CHATILLON-SUR-THOUET",
      initialEmitterCompanyCountry: "FR",
      emitterCompanyName: "emitter name",
      emitterCompanySiret: "emitter siret",
      emitterCompanyAddress: "1 RUE DE L'HOTEL DE VILLE",
      emitterCompanyPostalCode: "17000",
      emitterCompanyCity: "LA ROCHELLE",
      emitterCompanyCountry: "FR",
      emitterPickupsiteAddress: "2 RUE PIERRE BROSSOLETTE",
      emitterPickupsitePostalCode: "64000",
      emitterPickupsiteCity: "PAU",
      emitterPickupsiteCountry: "FR",
      ecoOrganismeName: "",
      ecoOrganismeSiren: "",
      traderCompanyName: "trader name",
      traderCompanySiret: "trader siret",
      traderRecepisseNumber: "trader recepisse",
      brokerCompanyName: "broker",
      brokerCompanySiret: "broker_siret",
      brokerRecepisseNumber: "broker_recepisse",
      transporterCompanyAddress: "VIA TRATTATO DI SCHENGEN 5",
      transporterCompanyPostalCode: "15067",
      transporterCompanyCity: "NOVI LIGURE AL",
      transporterCompanyCountry: "IT",
      transporterCompanyName: "transporter name",
      transporterCompanySiret: "transporter siret",
      transporterRecepisseNumber: "transporter recepisse",
      transporterRecepisseIsExempted: "O",
      transporterTransportMode: "Route",
      destinationOperationCode: "R10",
      destinationOperationMode: "RECYCLAGE",
      destinationReceptionDate: "2021-01-01",
      destinationReceptionWeight: 1.2,
      destinationPlannedOperationCode: "R10",
      weight: 10.5,
      destinationFinalOperationCodes: "R1,R2",
      destinationFinalOperationWeights: "1,24 - 2,78",
      destinationFinalOperationCompanySirets: "85001946400021,88792840600024"
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
      "Producteur initial Code postal": "79200",
      "Producteur initial adresse": "34 ROUTE DE BRESSUIRE",
      "Producteur initial Commune": "CHATILLON-SUR-THOUET",
      "Producteur initial Pays": "FR",
      "Expéditeur raison sociale": "emitter name",
      "Expéditeur SIRET": "emitter siret",
      "Expéditeur Adresse": "1 RUE DE L'HOTEL DE VILLE",
      "Expéditeur Code postal": "17000",
      "Expéditeur Commune": "LA ROCHELLE",
      "Expéditeur Pays": "FR",
      "Statut du bordereau (code)": "DRAFT",
      "Statut du bordereau": "Brouillon",
      "Prise en charge Code postal": "64000",
      "Prise en charge Commune": "PAU",
      "Prise en charge Pays": "FR",
      "Prise en charge adresse": "2 RUE PIERRE BROSSOLETTE",
      "Éco-organisme raison sociale": "",
      "Éco-organisme SIREN": "",
      "Négociant raison sociale": "trader name",
      "Négociant SIRET": "trader siret",
      "Négociant récépissé ": "trader recepisse",
      "Courtier raison sociale": "broker",
      "Courtier SIRET": "broker_siret",
      "Courtier N°récepissé": "broker_recepisse",
      "Transporteur adresse": "VIA TRATTATO DI SCHENGEN 5",
      "Transporteur Code postal": "15067",
      "Transporteur Commune": "NOVI LIGURE AL",
      "Transporteur Pays": "IT",
      "Transporteur raison sociale": "transporter name",
      "Transporteur SIRET ou n° de TVA intracommunautaire": "transporter siret",
      "Transporteur récépissé": "transporter recepisse",
      "Transporteur exemption de récépissé": "O",
      "Transporteur mode de transport": "Route",
      "Code opération réalisé": "R10",
      "Code opération prévu": "R10",
      "Mode de traitement réalisé": "RECYCLAGE",
      "Date de réception": "2021-01-01",
      "Quantité réceptionnée nette (tonnes)": 1.2,
      "Quantité de déchet": 10.5,
      "Code opération finale réalisée": "R1,R2",
      "Quantité finale (tonnes)": "1,24 - 2,78",
      "SIRET de la destination finale": "85001946400021,88792840600024"
    });
    expect(Object.keys(formattedWithLabels).length).toEqual(
      Object.keys(waste).length + CUSTOM_WASTE_COLUMNS.length
    );
  });

  it("should contain received, refused & accepted quantities", () => {
    const waste: AllWaste = {
      destinationReceptionWeight: 11.7,
      destinationReceptionRefusedWeight: 11.7,
      destinationReceptionAcceptedWeight: 0
    };

    const formattedWithLabels = formatRow(waste, true);
    expect(formattedWithLabels).toEqual(
      expect.objectContaining({
        "Quantité réceptionnée nette (tonnes)": 11.7,
        "Quantité refusée nette (tonnes)": 11.7,
        "Quantité acceptée / traitée nette (tonnes)": 0
      })
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
