import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import { Breadcrumb, BreadcrumbItem } from "common/components";
import {
  Blankslate,
  BlankslateImg,
  BlankslateTitle,
  BlankslateDescription,
} from "Apps/common/Components";
import { BSDList } from "../../components/BSDList";
import illustration from "./assets/blankslateAct.svg";

export function RouteBsdsAct() {
  const { siret } = useParams<{ siret: string }>();
  const defaultWhere = useMemo(
    () => ({
      isForActionFor: [siret],
    }),
    [siret]
  );

  return (
    <>
      <Breadcrumb>
        <BreadcrumbItem>Mes Bordereaux</BreadcrumbItem>
        <BreadcrumbItem>Pour Action</BreadcrumbItem>
      </Breadcrumb>

      <BSDList
        key={siret}
        siret={siret}
        defaultWhere={defaultWhere}
        blankslate={
          <Blankslate>
            <BlankslateImg src={illustration} alt="" />
            <BlankslateTitle>Il n'y a aucun bordereau à signer</BlankslateTitle>
            <BlankslateDescription>
              Bonne nouvelle, vous n'avez aucun bordereau à signer ! Des
              bordereaux apparaissent dans cet onglet uniquement lorsque vous
              avez une action à effectuer dans le cadre de leur cycle de vie
              (envoi, réception ou traitement...)
            </BlankslateDescription>
          </Blankslate>
        }
      />
    </>
  );
}
