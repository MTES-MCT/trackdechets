import { Form } from "../../generated/prisma-client";

type ColumnDetail = {
  key: string;
  label: string;
  getter: (form: Form) => string | number;
};

/**
 * Format a date as fr format
 * @param {string } datestr - a date iso-formatted
 * @returns {string} - date formatted as dd/mm/YYYY
 */
const dateFmt = datestr => {
  if (!datestr) {
    return "";
  }
  const date = new Date(datestr);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const fmtDay = day < 10 ? `0${day}` : `${day}`;
  const fmtMonth = month < 10 ? `0${month}` : `${month}`;

  return `${fmtDay}/${fmtMonth}/${year}`;
};

export const EXPORT_COLUMNS: {
  [key: string]: ColumnDetail;
} = {
  number: { key: "number", label: "Numéro de BSD", getter: f => f.readableId },
  customNumber: {
    key: "customNumber",
    label: "Numéro libre",
    getter: f => f.customId
  },
  wasteCode: {
    key: "wasteCode",
    label: "Code déchet",
    getter: f => f.wasteDetailsCode
  },
  wasteName: {
    key: "wasteName",
    label: "Désignation usuelle du déchet",
    getter: f => f.wasteDetailsName
  },
  wasteConsistence: {
    key: "wasteConsistence",
    label: "Consistance du déchet",
    getter: f => f.wasteDetailsConsistence
  },
  capNumber: {
    key: "capNumber",
    label: "Numéro de CAP",
    getter: f => f.recipientCap
  },
  estimatedQuantity: {
    key: "estimatedQuantity",
    label: "Quantité estimée (en tonnes)",
    getter: f => f.wasteDetailsQuantity
  },
  quantity: {
    key: "quantity",
    label: "Quantité réelle (en tonnes)",
    getter: f => f.quantityReceived
  },
  numberOfPackages: {
    key: "numberOfPackages",
    label: "Nombre de colis",
    getter: f => f.wasteDetailsNumberOfPackages
  },
  onuCode: {
    key: "onuCode",
    label: "Code ADR",
    getter: f => f.wasteDetailsOnuCode
  },
  date: {
    key: "date",
    label: "Date d'expédition du déchet",
    getter: f => dateFmt(f.processedAt)
  },
  emitterCompanyName: {
    key: "emitterCompanyName",
    label: "Nom de l'émetteur",
    getter: f => f.emitterCompanyName
  },
  emitterCompanyAddress: {
    key: "emitterCompanyAddress",
    label: "Adresse de l'émetteur",
    getter: f => f.emitterCompanyAddress
  },
  emitterCompanySiret: {
    key: "emitterCompanySiret",
    label: "Siret de l'émetteur",
    getter: f => f.emitterCompanySiret
  },
  recipientCompanyName: {
    key: "recipientCompanyName",
    label: "Nom du destinataire",
    getter: f => f.recipientCompanyName
  },
  recipientCompanyAddress: {
    key: "recipientCompanyAddress",
    label: "Adresse du destinataire",
    getter: f => f.recipientCompanyAddress
  },
  recipientCompanySiret: {
    key: "recipientCompanySiret",
    label: "Siret du destinataire",
    getter: f => f.recipientCompanySiret
  },
  transporterCompanyName: {
    key: "transporterCompanyName",
    label: "Nom du transporteur",
    getter: f => f.transporterCompanyName
  },
  transporterCompanySiret: {
    key: "transporterCompanySiret",
    label: "Siret du transporteur",
    getter: f => f.transporterCompanySiret
  },
  transporterCompanyAddress: {
    key: "transporterCompanyAddress",
    label: "Adresse du transporteur",
    getter: f => f.transporterCompanyAddress
  },
  transporterReceipt: {
    key: "transporterReceipt",
    label: "Numéro de récépissé transporteur",
    getter: f => f.transporterReceipt
  },
  processingCode: {
    key: "processingCode",
    label: "Code de traitement",
    getter: f => f.processingOperationDone
  },
  processedAt: {
    key: "processedAt",
    label: "Date du traitement",
    getter: f => dateFmt(f.processedAt)
  },
  processedBy: {
    key: "processedBy",
    label: "Nom de l'opérateur de traitement",
    getter: f => f.processedBy
  }
};

export function getExport(forms: Form[], columns: ColumnDetail[]) {
  const headers = columns.reduce((prev, cur) => {
    prev[cur.key] = cur.label;
    return prev;
  }, {});

  const values = forms.map(form =>
    columns.reduce((prev, cur) => {
      prev[cur.key] = cur.getter(form);
      return prev;
    }, {})
  );

  return [headers, ...values];
}
