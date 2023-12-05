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
import illustration from "./assets/blankslateFollow.svg";

export function RouteBsdsFollow() {
  const { siret } = useParams<{ siret: string }>();
  const defaultWhere = useMemo(
    () => ({
      isFollowFor: [siret!]
    }),
    [siret]
  );

  return (
    <>
      <Breadcrumb>
        <BreadcrumbItem>Mes Bordereaux</BreadcrumbItem>
        <BreadcrumbItem>Suivi</BreadcrumbItem>
      </Breadcrumb>

      <BSDList
        key={siret}
        siret={siret!}
        defaultWhere={defaultWhere}
        blankslate={
          <Blankslate>
            <BlankslateImg src={illustration} alt="" />
            <BlankslateTitle>Il n'y a aucun bordereau à suivre</BlankslateTitle>
            <BlankslateDescription>
              Des bordereaux apparaissent dans cet onglet lorsqu'ils sont en
              attente d'une action extérieure. Par exemple lorsqu'en tant que
              producteur vous attendez la réception d'un déchet ou son
              traitement. La colonne <strong>STATUT</strong> vous renseignera
              sur l'état précis du bordereau.
            </BlankslateDescription>
          </Blankslate>
        }
      />
    </>
  );
}
