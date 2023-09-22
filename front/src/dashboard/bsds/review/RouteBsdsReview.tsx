import { Breadcrumb, BreadcrumbItem } from "../../../common/components";
import { BsdaRevisionRequestList } from "../../components/RevisionRequestList/bsda";
import { BsddRevisionRequestList } from "../../components/RevisionRequestList/bsdd";
import React from "react";

export function RouteBsdsReview() {
  return (
    <>
      <Breadcrumb>
        <BreadcrumbItem>Mes Bordereaux</BreadcrumbItem>
        <BreadcrumbItem>Révisions</BreadcrumbItem>
      </Breadcrumb>

      <div className="tw-p-4">
        <h4 className="h4">BSDD</h4>
        <BsddRevisionRequestList />

        <h4 className="h4 tw-pt-4">BSDA</h4>
        <BsdaRevisionRequestList />
      </div>
    </>
  );
}
