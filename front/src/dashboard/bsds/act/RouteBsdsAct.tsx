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
import illustration from "./assets/blankslateAct.svg";

export function RouteBsdsAct() {
  const { siret } = useParams<{ siret: string }>();
  const defaultWhere = React.useMemo(
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
