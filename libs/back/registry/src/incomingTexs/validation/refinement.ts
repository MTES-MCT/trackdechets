import { Refinement } from "zod";
import { refineActorOrgId } from "../../shared/refinement";
import { ParsedZodIncomingTexsItem } from "./schema";

export const initialEmitterRefinement =
  refineActorOrgId<ParsedZodIncomingTexsItem>({
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
    typeKey: "transporter1CompanyType",
    orgIdKey: "transporter1CompanyOrgId"
  });

export const transporter2Refinement =
  refineActorOrgId<ParsedZodIncomingTexsItem>({
    typeKey: "transporter2CompanyType",
    orgIdKey: "transporter2CompanyOrgId"
  });

export const transporter3Refinement =
  refineActorOrgId<ParsedZodIncomingTexsItem>({
    typeKey: "transporter3CompanyType",
    orgIdKey: "transporter3CompanyOrgId"
  });

export const transporter4Refinement =
  refineActorOrgId<ParsedZodIncomingTexsItem>({
    typeKey: "transporter4CompanyType",
    orgIdKey: "transporter4CompanyOrgId"
  });

export const transporter5Refinement =
  refineActorOrgId<ParsedZodIncomingTexsItem>({
    typeKey: "transporter5CompanyType",
    orgIdKey: "transporter5CompanyOrgId"
  });
