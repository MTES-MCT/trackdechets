import { BsffFormTransporterInput } from "form/bsff/utils/initial-state";
import { Transporter, BsdaTransporter } from "generated/graphql/types";

/**
 * Universal Receipt exemption detection
 */
export const isExemptedOfReceiptFn = transporter => () =>
  !!(transporter as Transporter)?.isExemptedOfReceipt
    ? (transporter as Transporter).isExemptedOfReceipt
    : !!(transporter as BsdaTransporter)?.recepisse?.isExempted
    ? (transporter as BsdaTransporter)?.recepisse?.isExempted
    : // BSFF form as specific values
    !!(transporter as BsffFormTransporterInput)?.isExemptedOfRecepisse
    ? (transporter as BsffFormTransporterInput)?.isExemptedOfRecepisse
    : !!transporter?.company?.orgId && transporter?.recepisse === null
    ? true
    : false;
