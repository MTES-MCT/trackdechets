import prisma from "../../prisma";
import { Company } from "@prisma/client";
import { setWebhookSetting } from "../../common/redis/webhooksettings";

import { getUid, aesEncrypt } from "../../utils";
export const webhookSettingFactory = async ({
  company,
  token,
  endpointUri,
  activated = true
}: {
  company: Company;
  endpointUri: string;
  token?: string;
  activated?: boolean;
}) => {
  const clearToken = token ?? getUid(40);
  const encryptedToken = aesEncrypt(clearToken);
  const webhookSetting = await prisma.webhookSetting.create({
    data: {
      endpointUri,
      token: encryptedToken,
      activated: activated,
      orgId: company.orgId
    }
  });
  if (webhookSetting.activated) {
    await setWebhookSetting(webhookSetting);
  }
  return webhookSetting;
};
