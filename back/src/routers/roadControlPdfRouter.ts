import prisma from "../prisma";
import { getAPIBaseURL, getUid } from "../utils";
import { setInCache, SetOptions } from "../common/redis";
import { BsdType } from "@prisma/client";

const handlers = {
  [BsdType.BSDD]: "formPdf",
  [BsdType.BSDA]: "bsdaPdf",
  [BsdType.BSDASRI]: "bsdasriPdf",
  [BsdType.BSFF]: "bsffPdf",
  [BsdType.BSVHU]: "bsvhuPdf"
};

export const roadControlPdfHandler = async (req, res) => {
  const existingToken = await prisma.pdfAccessToken.findUnique({
    where: { token: req.params.token }
  });

  if (!existingToken) {
    return res.send("L'autorisation d'accès à ce bordereau n'existe pas.");
  }

  if (existingToken.expiresAt.getTime() < new Date().getTime()) {
    return res.send("L'autorisation d'accès pour ce bordereau a expiré.");
  }

  if (!existingToken.visitedAt) {
    await prisma.pdfAccessToken.update({
      where: { id: existingToken.id },
      data: { visitedAt: new Date() }
    });
  }

  const token = getUid(10);
  const options: SetOptions = {};

  if (process.env.NODE_ENV === "production") {
    options.EX = 10;
  }

  await setInCache(
    token,
    JSON.stringify({
      handler: handlers[existingToken.bsdType],
      params: { id: existingToken.bsdId }
    }),
    options
  );
  const API_BASE_URL = getAPIBaseURL();

  return res.redirect(`${API_BASE_URL}/download?token=${token}`);
};
