import { prisma } from "@td/prisma";
import { addMinutes } from "date-fns";
import type { MutationResolvers } from "@td/codegen-back";
import { ReadableIdPrefix } from "../../../forms/readableId";
import { getUid, getAPIBaseURL } from "../../../utils";
import { checkIsAuthenticated } from "../../../common/permissions";
import { checkCanRead as checkCanReadBsda } from "../../../bsda/permissions";
import { checkCanRead as checkCanReadBsff } from "../../../bsffs/permissions";
import { checkCanRead as checkCanReadBsvhu } from "../../../bsvhu/permissions";
import { checkCanRead as checkCanReadBspaoh } from "../../../bspaoh/permissions";
import { getFormOrFormNotFound } from "../../../forms/database";
import { getBsdasriOrNotFound } from "../../../bsdasris/database";
import { getBsdaOrNotFound } from "../../../bsda/database";
import { getBsffOrNotFound } from "../../../bsffs/database";
import { getBsvhuOrNotFound } from "../../../bsvhu/database";
import { getBspaohOrNotFound } from "../../../bspaoh/database";
import {
  BsdType,
  BsdasriStatus,
  BsffStatus,
  BsvhuStatus,
  BsdaStatus,
  BspaohStatus,
  Status
} from "@prisma/client";
import { ROAD_CONTROL_SLUG } from "@td/constants";
import { checkCanRead as checkCanReadForm } from "../../../forms/permissions";
import { checkCanRead as checkCanReadBsdasri } from "../../../bsdasris/permissions";
import { ForbiddenError } from "../../../common/errors";
import { belongsToIsReturnForTab as formBelongsToIsReturnForTab } from "../../../forms/elasticHelpers";
import { belongsToIsReturnForTab as bsdaBelongsToIsReturnForTab } from "../../../bsda/elastic";
import { belongsToIsReturnForTab as bsdasriBelongsToIsReturnForTab } from "../../../bsdasris/elastic";
import { belongsToIsReturnForTab as bsffBelongsToIsReturnForTab } from "../../../bsffs/elastic";
import { belongsToIsReturnForTab as bsvhuBelongsToIsReturnForTab } from "../../../bsvhu/elastic";
import { belongsToIsReturnForTab as bspaohBelongsToIsReturnForTab } from "../../../bspaoh/elastic";

const accessors = {
  [BsdType.BSDD]: id =>
    getFormOrFormNotFound(
      { id },
      {
        forwardedIn: { include: { transporters: true } },
        transporters: true,
        grouping: { include: { initialForm: true } },
        intermediaries: true
      }
    ),
  [BsdType.BSDA]: id =>
    getBsdaOrNotFound(id, { include: { transporters: true } }),
  [BsdType.BSDASRI]: id => getBsdasriOrNotFound({ id }),
  [BsdType.BSFF]: id => getBsffOrNotFound({ id }),
  [BsdType.BSVHU]: id => getBsvhuOrNotFound(id),
  [BsdType.BSPAOH]: id => getBspaohOrNotFound({ id })
};

const checkStatus = {
  [BsdType.BSDD]: bsd => [Status.SENT, Status.RESENT].includes(bsd.status),
  [BsdType.BSDA]: bsd => bsd.status === BsdaStatus.SENT,
  [BsdType.BSDASRI]: bsd => bsd.status === BsdasriStatus.SENT,
  [BsdType.BSFF]: bsd => bsd.status === BsffStatus.SENT,
  [BsdType.BSVHU]: bsd => bsd.status === BsvhuStatus.SENT,
  [BsdType.BSPAOH]: bsd => bsd.status === BspaohStatus.SENT
};

const checkBelongsToIsReturnForTab = {
  [BsdType.BSDD]: bsd => formBelongsToIsReturnForTab(bsd),
  [BsdType.BSDA]: bsd => bsdaBelongsToIsReturnForTab(bsd),
  [BsdType.BSDASRI]: bsd => bsdasriBelongsToIsReturnForTab(bsd),
  [BsdType.BSFF]: bsd => bsffBelongsToIsReturnForTab(bsd),
  [BsdType.BSVHU]: bsd => bsvhuBelongsToIsReturnForTab(bsd),
  [BsdType.BSPAOH]: bsd => bspaohBelongsToIsReturnForTab(bsd)
};

const permissions = {
  [BsdType.BSDD]: (user, bsdd) => checkCanReadForm(user, bsdd),
  [BsdType.BSDA]: (user, bsda) => checkCanReadBsda(user, bsda),
  [BsdType.BSDASRI]: (user, bsdasri) => checkCanReadBsdasri(user, bsdasri),
  [BsdType.BSFF]: (user, bsff) => checkCanReadBsff(user, bsff),
  [BsdType.BSVHU]: (user, bsvhu) => checkCanReadBsvhu(user, bsvhu),
  [BsdType.BSPAOH]: (user, bspaoh) => checkCanReadBspaoh(user, bspaoh)
};

const getBsdType = (id: string): BsdType => {
  if (id.startsWith(ReadableIdPrefix.DASRI)) {
    return BsdType.BSDASRI;
  }
  if (id.startsWith(ReadableIdPrefix.BSDA)) {
    return BsdType.BSDA;
  }
  if (id.startsWith(ReadableIdPrefix.FF)) {
    return BsdType.BSFF;
  }
  if (id.startsWith(ReadableIdPrefix.VHU)) {
    return BsdType.BSVHU;
  }
  if (id.startsWith(ReadableIdPrefix.PAOH)) {
    return BsdType.BSPAOH;
  }

  return BsdType.BSDD;
};

const createPdfAccessToken: MutationResolvers["createPdfAccessToken"] = async (
  _,
  { input },
  context
) => {
  const user = checkIsAuthenticated(context);

  // find bsd
  const bsdType = getBsdType(input.bsdId);

  const bsd = await accessors[bsdType](input.bsdId);

  // Check status
  if (
    !checkStatus[bsdType](bsd) &&
    !checkBelongsToIsReturnForTab[bsdType](bsd)
  ) {
    throw new ForbiddenError(
      "Seuls les bordereaux pris en charge par un transporteur peuvent être consultés via un accès temporaire."
    );
  }
  // check perms
  await permissions[bsdType](user, bsd);

  const token = await prisma.pdfAccessToken.create({
    data: {
      token: getUid(50),
      bsdType: bsdType,
      bsdId: input.bsdId,
      userId: user.id,
      expiresAt: addMinutes(new Date(), 30)
    }
  });
  const API_BASE_URL = getAPIBaseURL();
  return `${API_BASE_URL}/${ROAD_CONTROL_SLUG}/${token.token}`;
};

export default createPdfAccessToken;
