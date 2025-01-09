import { Bsff } from "@prisma/client";
import * as React from "react";
import * as ReactDOMServer from "react-dom/server";
import * as QRCode from "qrcode";

import { generatePdf } from "../../common/pdf";
import { BsffPdf } from "./BsffPdf";
import {
  expandBsffFromDB,
  expandBsffPackagingFromDB,
  expandFicheInterventionBsffFromDB
} from "../converter";
import {
  BsffWithFicheInterventionInclude,
  BsffWithFicheInterventions,
  BsffWithPackagings,
  BsffWithPackagingsInclude,
  BsffWithTransporters,
  BsffWithTransportersInclude
} from "../types";
import { prisma } from "@td/prisma";
import { getReadonlyBsffPackagingRepository } from "../repository";
import { emptyValues } from "../../common/pdf/emptypdf";

export type BsffForBuildPdf = Bsff &
  BsffWithPackagings &
  BsffWithFicheInterventions &
  BsffWithTransporters & {
    previousBsffs: (Bsff & BsffWithPackagings & BsffWithTransporters)[];
  };

export const BsffForBuildPdfInclude = {
  ...BsffWithPackagingsInclude,
  ...BsffWithFicheInterventionInclude,
  ...BsffWithTransportersInclude
};

export async function getBsffForBuildPdf({
  id
}: Pick<Bsff, "id">): Promise<BsffForBuildPdf> {
  const bsff = await prisma.bsff.findUniqueOrThrow({
    where: { id },
    include: BsffForBuildPdfInclude
  });

  const { findPreviousPackagings } = getReadonlyBsffPackagingRepository();

  const previousPackagings = await findPreviousPackagings(
    bsff.packagings.map(p => p.id)
  );
  const previousBsffIds = [...new Set(previousPackagings.map(p => p.bsffId))];
  const previousBsffs = await prisma.bsff.findMany({
    where: { id: { in: previousBsffIds } },
    include: {
      ...BsffWithTransportersInclude,
      // includes only packagings in the dependency graph of the BSFF
      packagings: { where: { id: { in: previousPackagings.map(p => p.id) } } }
    }
  });

  return { ...bsff, previousBsffs };
}

export async function buildPdf(bsff: BsffForBuildPdf, renderEmpty?: boolean) {
  const qrCode = renderEmpty
    ? ""
    : await QRCode.toString(bsff.id, { type: "svg" });

  let bsffForPdf = {
    ...expandBsffFromDB(bsff),
    packagings: bsff.packagings.map(expandBsffPackagingFromDB),
    ficheInterventions: bsff.ficheInterventions.map(
      expandFicheInterventionBsffFromDB
    ),
    previousBsffs: bsff.previousBsffs.map(previous => ({
      ...expandBsffFromDB(previous),
      packagings: previous.packagings.map(expandBsffPackagingFromDB)
    }))
  };

  if (renderEmpty) {
    bsffForPdf = emptyValues(bsffForPdf);
  }
  const html = ReactDOMServer.renderToStaticMarkup(
    <BsffPdf bsff={bsffForPdf} qrCode={qrCode} renderEmpty={renderEmpty} />
  );
  return generatePdf(html);
}
