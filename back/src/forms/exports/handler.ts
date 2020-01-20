import { prisma, Form } from "../../generated/prisma-client";
import { getExport, EXPORT_COLUMNS } from "./columns";

const SEPARATOR = ";";

enum ExportType {
  INCOMING = "INCOMING",
  OUTGOING = "OUTGOING"
}

export async function downloadCsvExport(res, { sirets, exportType }) {
  if (!sirets?.length || !exportType) {
    return res.status(500).send("Paramètres invalides.");
  }

  try {
    const csv = await getCsvExport(sirets, exportType);
    res.setHeader("Content-disposition", "attachment; filename=export.csv");
    res.set("Content-Type", "text/csv");
    res.status(200).send(csv);
  } catch (e) {
    res.status(500).send(e.message);
  }
}

async function getCsvExport(sirets: string[], exportType: ExportType) {
  const data = await getExportData(sirets, exportType);

  const exportContent = getExport(
    data,
    Object.keys(EXPORT_COLUMNS).map(key => EXPORT_COLUMNS[key])
  );

  return exportContent
    .map(f =>
      Object.keys(f)
        .map(k => f[k])
        .join(SEPARATOR)
    )
    .join("\n");
}

async function getExportData(
  sirets: string[],
  exportType: ExportType
): Promise<Form[]> {
  switch (exportType) {
    case ExportType.INCOMING:
      return prisma.forms({
        where: {
          status_in: [
            "RECEIVED",
            "PROCESSED",
            "AWAITING_GROUP",
            "GROUPED",
            "NO_TRACEABILITY"
          ],
          recipientCompanySiret_in: sirets
        }
      });

    case ExportType.OUTGOING:
      return prisma.forms({
        where: {
          status_in: [
            "SENT",
            "RECEIVED",
            "PROCESSED",
            "AWAITING_GROUP",
            "GROUPED",
            "NO_TRACEABILITY"
          ],
          emitterCompanySiret_in: sirets
        }
      });

    default:
      throw new Error("Invalid export type.");
  }
}
