import { Breadcrumb, BreadcrumbItem } from "common/components";
import { BsddRevisionRequestList } from "dashboard/components/RevisionRequestList/bsdd";
import React from "react";

export function RouteBsdsReview() {
  return (
    <>
      <Breadcrumb>
        <BreadcrumbItem>Mes Bordereaux</BreadcrumbItem>
        <BreadcrumbItem>Révisions</BreadcrumbItem>
      </Breadcrumb>

      <BsddRevisionRequestList />
    </>
  );
}
