import {
  Bsda,
  BsdaTransporter,
  Bsdasri,
  BsddTransporter,
  Bsff,
  BsffFicheIntervention,
  BsffTransporter,
  Bspaoh,
  BspaohTransporter,
  Bsvhu,
  Form,
  IntermediaryFormAssociation,
  Prisma
} from "@prisma/client";
import { logger } from "@td/logger";
import { prisma } from "@td/prisma";
import { searchCompanyFailFast } from "../../companies/sirenify";
import { Job } from "bull";
import { CompanySearchResult } from "../../companies/types";

type SirenifyOpts<Bsd, BsdInput> = {
  getter: (bsd: Bsd) => string | null;
  setter: (data: BsdInput, company: CompanySearchResult) => BsdInput;
};

async function sirenify<Bsd, BsdInput>(
  bsd: Bsd,
  accessors: SirenifyOpts<Bsd, BsdInput>[]
) {
  let sirenified = {} as BsdInput;
  for (const accessor of accessors) {
    const { getter, setter } = accessor;
    const siret = getter(bsd);
    try {
      if (siret) {
        const company = await searchCompanyFailFast(siret);
        if (company) {
          sirenified = setter(sirenified, company);
        }
      }
    } catch (err) {
      logger.error(err);
    }
  }
  return sirenified;
}

export async function sirenifyBsdd(readableId: string) {
  const form = await prisma.form.findUniqueOrThrow({
    where: { readableId },
    include: { transporters: true, intermediaries: true }
  });

  const sirenifyOpts: SirenifyOpts<Form, Prisma.FormUpdateInput>[] = [
    {
      getter: bsd => bsd.emitterCompanySiret,
      setter: (data, company) => ({
        ...data,
        emitterCompanyName: company.name,
        emitterCompanyAddress: company.address
      })
    },
    {
      getter: bsd => bsd.recipientCompanySiret,
      setter: (data, company) => ({
        ...data,
        recipientCompanyName: company.name,
        recipientCompanyAddress: company.address
      })
    },
    {
      getter: bsd => bsd.traderCompanySiret,
      setter: (data, company) => ({
        ...data,
        traderCompanyName: company.name,
        traderCompanyAddress: company.address
      })
    },
    {
      getter: bsd => bsd.brokerCompanySiret,
      setter: (data, company) => ({
        ...data,
        brokerCompanyName: company.name,
        brokerCompanyAddress: company.address
      })
    }
  ];

  const transporterSirenifyOpts: SirenifyOpts<
    BsddTransporter,
    Prisma.BsddTransporterUpdateInput
  >[] = [
    {
      getter: transporter => transporter.transporterCompanySiret,
      setter: (data, company) => ({
        ...data,
        transporterCompanyName: company.name,
        transporterCompanyAddress: company.address
      })
    }
  ];

  const intermediarySirenifyOpts: SirenifyOpts<
    IntermediaryFormAssociation,
    Prisma.IntermediaryFormAssociationUpdateInput
  >[] = [
    {
      getter: intermediary => intermediary.siret,
      setter: (data, company) => ({
        ...data,
        name: company.name ?? data.name,
        address: company.address
      })
    }
  ];

  const data = await sirenify(form, sirenifyOpts);

  await prisma.form.update({ data, where: { readableId } });

  for (const transporter of form.transporters) {
    const transporterData = await sirenify(
      transporter,
      transporterSirenifyOpts
    );
    await prisma.bsddTransporter.update({
      where: { id: transporter.id },
      data: transporterData
    });
  }

  for (const intermediary of form.intermediaries) {
    const intermediaryData = await sirenify(
      intermediary,
      intermediarySirenifyOpts
    );
    await prisma.intermediaryFormAssociation.update({
      where: { id: intermediary.id },
      data: intermediaryData
    });
  }
}

export async function sirenifyBsda(id: string) {
  const bsda = await prisma.bsda.findUniqueOrThrow({
    where: { id },
    include: { transporters: true }
  });

  const sirenifyOpts: SirenifyOpts<Bsda, Prisma.BsdaUpdateInput>[] = [
    {
      getter: bsda => bsda.emitterCompanySiret,
      setter: (data, company) => ({
        ...data,
        emitterCompanyName: company.name,
        emitterCompanyAddress: company.address
      })
    },
    {
      getter: bsda => bsda.workerCompanySiret,
      setter: (data, company) => ({
        ...data,
        workerCompanyName: company.name,
        workerCompanyAddress: company.address
      })
    },
    {
      getter: bsda => bsda.destinationCompanySiret,
      setter: (data, company) => ({
        ...data,
        destinationCompanyName: company.name,
        destinationCompanyAddress: company.address
      })
    }
  ];

  const transporterSirenifyOpts: SirenifyOpts<
    BsdaTransporter,
    Prisma.BsdaTransporterUpdateInput
  >[] = [
    {
      getter: transporter => transporter.transporterCompanySiret,
      setter: (data, company) => ({
        ...data,
        transporterCompanyName: company.name,
        transporterCompanyAddress: company.address
      })
    }
  ];

  const data = await sirenify(bsda, sirenifyOpts);

  await prisma.bsda.update({ data, where: { id } });

  for (const transporter of bsda.transporters) {
    const transporterData = await sirenify(
      transporter,
      transporterSirenifyOpts
    );
    await prisma.bsdaTransporter.update({
      where: { id: transporter.id },
      data: transporterData
    });
  }
}

export async function sirenifyBsdasri(id: string) {
  const bsdasri = await prisma.bsdasri.findUniqueOrThrow({
    where: { id }
  });

  const sirenifyOpts: SirenifyOpts<Bsdasri, Prisma.BsdasriUpdateInput>[] = [
    {
      getter: bsdasri => bsdasri.emitterCompanySiret,
      setter: (data, company) => ({
        ...data,
        emitterCompanyName: company.name,
        emitterCompanyAddress: company.address
      })
    },
    {
      getter: bsdasri => bsdasri.transporterCompanySiret,
      setter: (data, company) => ({
        ...data,
        transporterCompanyName: company.name,
        transporterCompanyAddress: company.address
      })
    },
    {
      getter: bsdasri => bsdasri.destinationCompanySiret,
      setter: (data, company) => ({
        ...data,
        destinationCompanyName: company.name,
        destinationCompanyAddress: company.address
      })
    }
  ];

  const data = await sirenify(bsdasri, sirenifyOpts);

  await prisma.bsdasri.update({ data, where: { id } });
}

export async function sirenifyBsff(id: string) {
  const bsff = await prisma.bsff.findUniqueOrThrow({
    where: { id },
    include: { ficheInterventions: true, transporters: true }
  });

  const sirenifyOpts: SirenifyOpts<Bsff, Prisma.BsffUpdateInput>[] = [
    {
      getter: bsff => bsff.emitterCompanySiret,
      setter: (data, company) => ({
        ...data,
        emitterCompanyName: company.name,
        emitterCompanyAddress: company.address
      })
    },
    {
      getter: bsff => bsff.destinationCompanySiret,
      setter: (data, company) => ({
        ...data,
        destinationCompanyName: company.name,
        destinationCompanyAddress: company.address
      })
    }
  ];

  const transporterSirenifyOpts: SirenifyOpts<
    BsffTransporter,
    Prisma.BsffTransporterUpdateInput
  >[] = [
    {
      getter: transporter => transporter.transporterCompanySiret,
      setter: (data, company) => ({
        ...data,
        transporterCompanyName: company.name,
        transporterCompanyAddress: company.address
      })
    }
  ];

  const ficheInterventionsSirenifyOpts: SirenifyOpts<
    BsffFicheIntervention,
    Prisma.BsffFicheInterventionUpdateInput
  >[] = [
    {
      getter: ficheIntervention => ficheIntervention.detenteurCompanySiret,
      setter: (data, company) => ({
        ...data,
        detenteurCompanyName: company.name ?? data.detenteurCompanyName,
        detenteurCompanyAddress: company.address ?? data.detenteurCompanyAddress
      })
    },
    {
      getter: ficheIntervention => ficheIntervention.operateurCompanySiret,
      setter: (data, company) => ({
        ...data,
        operateurCompanyName: company.name ?? data.operateurCompanyName,
        operateurCompanyAddress: company.address ?? data.operateurCompanyAddress
      })
    }
  ];

  const data = await sirenify(bsff, sirenifyOpts);

  for (const ficheIntervention of bsff.ficheInterventions) {
    const ficheInterventionData = await sirenify(
      ficheIntervention,
      ficheInterventionsSirenifyOpts
    );
    await prisma.bsffFicheIntervention.update({
      where: { id: ficheIntervention.id },
      data: ficheInterventionData
    });

    for (const transporter of bsff.transporters) {
      const transporterData = await sirenify(
        transporter,
        transporterSirenifyOpts
      );
      await prisma.bsffTransporter.update({
        where: { id: transporter.id },
        data: transporterData
      });
    }
  }

  await prisma.bsff.update({ data, where: { id } });
}

async function sirenifyBsvhu(id: string) {
  const bsvhu = await prisma.bsvhu.findUniqueOrThrow({
    where: { id }
  });

  const sirenifyOpts: SirenifyOpts<Bsvhu, Prisma.BsvhuUpdateInput>[] = [
    {
      getter: bsvhu => bsvhu.emitterCompanySiret,
      setter: (data, company) => ({
        ...data,
        emitterCompanyName: company.name,
        emitterCompanyAddress: company.address
      })
    },
    {
      getter: bsvhu => bsvhu.transporterCompanySiret,
      setter: (data, company) => ({
        ...data,
        transporterCompanyName: company.name,
        transporterCompanyAddress: company.address
      })
    },
    {
      getter: bsvhu => bsvhu.destinationCompanySiret,
      setter: (data, company) => ({
        ...data,
        destinationCompanyName: company.name,
        destinationCompanyAddress: company.address
      })
    }
  ];

  const data = await sirenify(bsvhu, sirenifyOpts);

  await prisma.bsvhu.update({ data, where: { id } });
}

export async function sirenifyBspaoh(id: string) {
  const bspaoh = await prisma.bspaoh.findUniqueOrThrow({
    where: { id },
    include: { transporters: true }
  });

  const sirenifyOpts: SirenifyOpts<Bspaoh, Prisma.BspaohUpdateInput>[] = [
    {
      getter: bsda => bsda.emitterCompanySiret,
      setter: (data, company) => ({
        ...data,
        emitterCompanyName: company.name,
        emitterCompanyAddress: company.address
      })
    },
    {
      getter: bsda => bsda.destinationCompanySiret,
      setter: (data, company) => ({
        ...data,
        destinationCompanyName: company.name,
        destinationCompanyAddress: company.address
      })
    }
  ];

  const transporterSirenifyOpts: SirenifyOpts<
    BspaohTransporter,
    Prisma.BspaohTransporterUpdateInput
  >[] = [
    {
      getter: transporter => transporter.transporterCompanySiret,
      setter: (data, company) => ({
        ...data,
        transporterCompanyName: company.name,
        transporterCompanyAddress: company.address
      })
    }
  ];

  const data = await sirenify(bspaoh, sirenifyOpts);

  await prisma.bspaoh.update({ data, where: { id } });

  for (const transporter of bspaoh.transporters) {
    const transporterData = await sirenify(
      transporter,
      transporterSirenifyOpts
    );
    await prisma.bspaohTransporter.update({
      where: { id: transporter.id },
      data: transporterData
    });
  }
}

export async function sirenifyBsdJob(job: Job<string>): Promise<string> {
  const bsdId = job.data;

  if (bsdId.startsWith("BSDA-")) {
    await sirenifyBsda(bsdId);
    return bsdId;
  }
  if (bsdId.startsWith("BSD-") || bsdId.startsWith("TD-")) {
    await sirenifyBsdd(bsdId);
    return bsdId;
  }

  if (bsdId.startsWith("DASRI-")) {
    await sirenifyBsdasri(bsdId);
    return bsdId;
  }

  if (bsdId.startsWith("VHU-")) {
    await sirenifyBsvhu(bsdId);
    return bsdId;
  }

  if (bsdId.startsWith("FF-")) {
    await sirenifyBsff(bsdId);
    return bsdId;
  }

  if (bsdId.startsWith("PAOH-")) {
    await sirenifyBspaoh(bsdId);
    return bsdId;
  }

  throw new Error(
    "Sirenifying this type of BSD is not handled by this worker."
  );
}
