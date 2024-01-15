import { Updater, registerUpdater } from "./helper/helper";
import { prisma } from "@td/prisma";

@registerUpdater(
  "Clean Transporter SIRET when it's a copy of VAT",
  "Clean Transporter SIRET after enforcing SIRET validation",
  false
)
export class FixTransporterSiretIsVatUpdater implements Updater {
  async run() {
    try {
      await prisma.$queryRaw`update default$default."Form" set "transporterCompanySiret" = NULL where "transporterCompanySiret" = "transporterCompanyVatNumber" and "transporterCompanySiret" ~ '\\w\\w' and "transporterCompanyVatNumber" != '';`;
    } catch (err) {
      console.error(
        "☠ Something went wrong during the UPDATE of Form.transporterCompanySiret",
        err
      );
      throw new Error();
    }
    try {
      await prisma.$queryRaw`update default$default."Bsvhu" set "transporterCompanySiret" = NULL where "transporterCompanySiret" = "transporterCompanyVatNumber" and "transporterCompanySiret" ~ '\\w\\w' and "transporterCompanyVatNumber" != '';`;
    } catch (err) {
      console.error(
        "☠ Something went wrong during the UPDATE of Bsvhu.transporterCompanySiret",
        err
      );
      throw new Error();
    }
    try {
      await prisma.$queryRaw`update default$default."Bsdasri" set "transporterCompanySiret" = NULL where "transporterCompanySiret" = "transporterCompanyVatNumber" and "transporterCompanySiret" ~ '\\w\\w' and "transporterCompanyVatNumber" != '';`;
    } catch (err) {
      console.error(
        "☠ Something went wrong during the UPDATE of Bsdasri.transporterCompanySiret",
        err
      );
      throw new Error();
    }
    try {
      await prisma.$queryRaw`update default$default."Bsff" set "transporterCompanySiret" = NULL where "transporterCompanySiret" = "transporterCompanyVatNumber" and "transporterCompanySiret" ~ '\\w\\w' and "transporterCompanyVatNumber" != '';`;
    } catch (err) {
      console.error(
        "☠ Something went wrong during the UPDATE of Bsff.transporterCompanySiret",
        err
      );
      throw new Error();
    }
    try {
      await prisma.$queryRaw`update default$default."Bsda" set "transporterCompanySiret" = NULL where "transporterCompanySiret" = "transporterCompanyVatNumber" and "transporterCompanySiret" ~ '\\w\\w' and "transporterCompanyVatNumber" != '';`;
    } catch (err) {
      console.error(
        "☠ Something went wrong during the UPDATE of Bsda.transporterCompanySiret",
        err
      );
      throw new Error();
    }
  }
}
