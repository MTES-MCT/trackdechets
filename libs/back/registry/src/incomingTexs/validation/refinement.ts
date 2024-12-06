import { refineActorOrgId } from "../../shared/refinement";
import { ParsedZodIncomingTexsItem } from "./schema";

export const producerRefinement = refineActorOrgId<ParsedZodIncomingTexsItem>({
  typeKey: "producerType",
  orgIdKey: "producerOrgId"
});

export const senderRefinement = refineActorOrgId<ParsedZodIncomingTexsItem>({
  typeKey: "senderType",
  orgIdKey: "senderOrgId"
});

export const transporter1Refinement =
  refineActorOrgId<ParsedZodIncomingTexsItem>({
    typeKey: "transporter1Type",
    orgIdKey: "transporter1OrgId"
  });

export const transporter2Refinement =
  refineActorOrgId<ParsedZodIncomingTexsItem>({
    typeKey: "transporter2Type",
    orgIdKey: "transporter2OrgId"
  });

export const transporter3Refinement =
  refineActorOrgId<ParsedZodIncomingTexsItem>({
    typeKey: "transporter3Type",
    orgIdKey: "transporter3OrgId"
  });

export const transporter4Refinement =
  refineActorOrgId<ParsedZodIncomingTexsItem>({
    typeKey: "transporter4Type",
    orgIdKey: "transporter4OrgId"
  });

export const transporter5Refinement =
  refineActorOrgId<ParsedZodIncomingTexsItem>({
    typeKey: "transporter5Type",
    orgIdKey: "transporter5OrgId"
  });
