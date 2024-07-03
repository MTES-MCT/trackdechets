import { Bsd } from "@td/codegen-ui";
import React from "react";
import BsdaDetailContent from "../../dashboard/detail/bsda/BsdaDetailContent";
import BsdasriDetailContent from "../../dashboard/detail/bsdasri/BsdasriDetailContent";
import BSDDetailContent from "../../dashboard/detail/bsdd/BSDDetailContent";
import { BsffDetailContent } from "../../dashboard/detail/bsff/BsffDetailContent";
import BspaohDetailContent from "../../dashboard/detail/bspaoh/BspaohDetailContent";
import { BsvhuDetailContent } from "../../dashboard/detail/bsvhu/BsvhuDetailContent";

export function PreviewModal({ bsd }: { bsd: Bsd }) {
  if (bsd.__typename === "Bsda") {
    return <BsdaDetailContent form={bsd} />;
  }
  if (bsd.__typename === "Form") {
    return <BSDDetailContent form={bsd} />;
  }
  if (bsd.__typename === "Bsvhu") {
    return <BsvhuDetailContent form={bsd} />;
  }
  if (bsd.__typename === "Bsdasri") {
    return <BsdasriDetailContent form={bsd} />;
  }
  if (bsd.__typename === "Bsff") {
    return <BsffDetailContent form={bsd} />;
  }
  if (bsd.__typename === "Bspaoh") {
    return <BspaohDetailContent form={bsd} />;
  }
}
