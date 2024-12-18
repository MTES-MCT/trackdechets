import { Refinement } from "zod";
import { refineActorOrgId } from "../../shared/refinement";
import { ParsedZodIncomingTexsItem } from "./schema";

export const initialEmitterRefinement = refineActorOrgId<ParsedZodIncomingTexsItem>({
  typeKey: "initialEmitterCompanyType",
  orgIdKey: "initialEmitterCompanyOrgId"
});

export const parcelRefinement: Refinement<ParsedZodIncomingTexsItem> = (
  item,
  { addIssue }
) => {
  if (!item.parcelCoordinates && !item.parcelNumbers) {
    addIssue({
      code: "custom",
      message:
        "Vous devez renseigner soit les numéros de parcelles, soit les coordonnées de parcelles",
      path: ["parcelCoordinates"]
    });
  }

  if (
    item.isUpcycled &&
    !item.destinationParcelCoordinates &&
    !item.destinationParcelNumbers
  ) {
    addIssue({
      code: "custom",
      message:
        "Vous devez renseigner soit les numéros de parcelles de destination, soit les coordonnées de parcelles de destination",
      path: ["destinationParcelCoordinates"]
    });
  }
};

export const emitterRefinement = refineActorOrgId<ParsedZodIncomingTexsItem>({
  typeKey: "emitterCompanyType",
  orgIdKey: "emitterCompanyOrgId"
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
