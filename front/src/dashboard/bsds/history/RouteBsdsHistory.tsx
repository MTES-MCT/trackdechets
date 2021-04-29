import React from "react";
import { useParams } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  Blankslate,
  BlankslateImg,
  BlankslateTitle,
  BlankslateDescription,
} from "common/components";
import { BSDList } from "../../components/BSDList";
import illustration from "./assets/blankslateHistory.svg";

export function RouteBsdsHistory() {
  const { siret } = useParams<{ siret: string }>();
  const defaultWhere = React.useMemo(
    () => ({
      isArchivedFor: [siret],
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
        siret={siret}
        defaultWhere={defaultWhere}
        blankslate={
          <Blankslate>
            <BlankslateImg src={illustration} alt="" />
            <BlankslateTitle>
              Il n'y a aucun bordereau en archive
            </BlankslateTitle>
            <BlankslateDescription>
              Des bordereaux apparaissent dans cet onglet lorsqu'ils terminé
              leur cycle de vie. Ils sont alors disponible en lecture seule pour
              consultation.
            </BlankslateDescription>
          </Blankslate>
        }
      />
    </>
  );
}
