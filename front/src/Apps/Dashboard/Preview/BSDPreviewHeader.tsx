import React from "react";
import { BsdaType, BsdType } from "@td/codegen-ui";
import { PreviewContainer, PreviewContainerRow } from "./BSDPreviewComponents";
import Badge from "../Components/Badge/Badge";
import { TBsdStatusCode } from "../../common/types/bsdTypes";
import {
  displayIconWaste,
  displayIconWasteAlternative
} from "../Components/WasteDetails/WasteDetails";
import "./BSDPreviewHeader.scss";
import { getWorkflowLabel } from "../dashboardServices";

interface BSDPreviewHeaderProps {
  bsdStatus: TBsdStatusCode;
  title: string;
  wasteType: BsdType;
  bsdType?: BsdaType;
  children: React.ReactNode;
}
const BSDPreviewHeader = ({
  bsdStatus,
  title,
  wasteType,
  bsdType,
  children
}: BSDPreviewHeaderProps) => {
  return (
    <PreviewContainer>
      <div
        style={{ display: "flex", alignItems: "center", marginBottom: "2rem" }}
      >
        <div>
          {displayIconWaste(wasteType)}
          <span className="fr-sr-only">
            {displayIconWasteAlternative(wasteType)}
          </span>
        </div>
        <h2 className="fr-h3 fr-mb-0 fr-ml-2w fr-mr-2w">
          {title} {bsdType && `- ${getWorkflowLabel(bsdType)}`}
        </h2>
        <Badge status={bsdStatus} />
      </div>

      <PreviewContainerRow>{children}</PreviewContainerRow>
    </PreviewContainer>
  );
};

export default BSDPreviewHeader;
