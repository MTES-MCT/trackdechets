import { prisma, Form } from "../generated/prisma-client";
import { getUserId } from "../utils";

enum ExportType {
  INCOMING = "INCOMING",
  OUTGOING = "OUTGOING"
}

const SEPARATOR = ";";

export const csvExportHandler = async (req, res) => {
  const { siret, exportType } = req.query;

  try {
    const csv = await getCsvExport(siret, exportType);
    res.setHeader("Content-disposition", "attachment; filename=export.csv");
    res.set("Content-Type", "text/csv");
    res.status(200).send(csv);
  } catch (e) {
    res.status(500).send(e.message);
  }
};

async function getCsvExport(siret: string, exportType: ExportType) {
  const data = await getExportData(siret, exportType);

  return data
    .map(f =>
      Object.keys(f)
        .map(k => f[k])
        .join(SEPARATOR)
    )
    .join("\n");
}

async function getExportData(
  siret: string,
  exportType: ExportType
): Promise<object[]> {
  switch (exportType) {
    case ExportType.INCOMING:
      return getExportDataForIncomingForms(siret);

    case ExportType.OUTGOING:
      return getExportDataForOutgoingForms(siret);

    default:
      throw new Error("Invalid export type.");
  }
}

async function getExportDataForIncomingForms(siret: string) {
  const forms = await prisma.forms({
    where: { status: "PROCESSED", recipientCompanySiret: siret }
  });

  const headers = {
    date: "Date de réception du déchet",
    wasteCode: "Détail du déchet entrant",
    quantity: "Quantité (en tonne)",
    to: "Installation d'ou vient le déchet",
    transporter: "Transporteur",
    number: "Numéro de BSD",
    code: "Code de traitement"
  };

  const data = forms.map(f => ({
    date: f.receivedAt,
    wasteCode: f.wasteDetailsCode,
    quantity: f.quantityReceived,
    to: `${f.emitterCompanyName}, ${f.emitterCompanyAddress}`,
    transporter: `${f.transporterCompanyName}, ${f.transporterCompanyAddress}`,
    number: f.readableId,
    code: f.processingOperationDone
  }));

  return [headers, ...data];
}

async function getExportDataForOutgoingForms(siret: string) {
  const forms = await prisma.forms({
    where: { status: "PROCESSED", emitterCompanySiret: siret }
  });

  const headers = {
    date: "Date d'expédition du déchet",
    wasteCode: "Détail du déchet sortant",
    quantity: "Quantité (en tonne)",
    to: "Installation vers laquelle le déchet est expédié",
    transporter: "Transporteur",
    number: "Numéro de BSD",
    code: "Code de traitement"
  };

  const data = forms.map(f => ({
    date: f.sentAt,
    wasteCode: f.wasteDetailsCode,
    quantity: f.quantityReceived,
    to: `${f.recipientCompanyName} - ${f.recipientCompanyAddress}`,
    transporter: `${f.transporterCompanyName} - ${f.transporterCompanyAddress}`,
    number: f.readableId,
    code: f.processingOperationDone
  }));

  return [headers, ...data];
}
