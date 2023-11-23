import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import { Breadcrumb, BreadcrumbItem } from "../../../common/components";
import {
  Blankslate,
  BlankslateImg,
  BlankslateTitle,
  BlankslateDescription
} from "../../../Apps/common/Components";
import { BSDList } from "../../components/BSDList";
import illustration from "./assets/blankslateHistory.svg";

export function RouteBsdsHistory() {
  const { siret } = useParams<{ siret: string }>();
  const defaultWhere = useMemo(
    () => ({
      isArchivedFor: [siret!]
    }),
    [siret]
  );

  return (
    <>
      <Breadcrumb>
        <BreadcrumbItem>Mes Bordereaux</BreadcrumbItem>
        <BreadcrumbItem>Archives</BreadcrumbItem>
      </Breadcrumb>

      <BSDList
        key={siret}
        siret={siret!}
        defaultWhere={defaultWhere}
        blankslate={
          <Blankslate>
            <BlankslateImg src={illustration} alt="" />
            <BlankslateTitle>
              Il n'y a aucun bordereau en archive
            </BlankslateTitle>
            <BlankslateDescription>
              Des bordereaux apparaissent dans cet onglet lorsqu'ils ont terminé
              leur cycle de vie. Ils sont alors disponibles en lecture seule
              pour consultation.
            </BlankslateDescription>
          </Blankslate>
        }
      />
    </>
  );
}
