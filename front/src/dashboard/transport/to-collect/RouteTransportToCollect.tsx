import * as React from "react";
import { useParams } from "react-router-dom";
import {
  Blankslate,
  BlankslateDescription,
  BlankslateImg,
  BlankslateTitle
} from "../../../Apps/common/Components";
import { Breadcrumb, BreadcrumbItem } from "../../../common/components";
import { BSDList, COLUMNS } from "../../components/BSDList";
import illustration from "./assets/blankslateToCollect.svg";

const TO_COLLECT_COLUMNS = [
  COLUMNS.type,
  COLUMNS.readableId,
  COLUMNS.emitter,
  COLUMNS.recipient,
  COLUMNS.waste,
  COLUMNS.transporterCustomInfo,
  COLUMNS.transporterNumberPlate,
  COLUMNS.status
];

export function RouteTransportToCollect() {
  const { siret } = useParams<{ siret: string }>();
  const defaultWhere = React.useMemo(
    () => ({
      isToCollectFor: [siret]
    }),
    [siret]
  );

  return (
    <>
      <Breadcrumb>
        <BreadcrumbItem>Transport</BreadcrumbItem>
        <BreadcrumbItem>À collecter</BreadcrumbItem>
      </Breadcrumb>

      <BSDList
        key={siret}
        siret={siret}
        defaultWhere={defaultWhere}
        columns={TO_COLLECT_COLUMNS}
        blankslate={
          <Blankslate>
            <BlankslateImg src={illustration} alt="" />
            <BlankslateTitle>
              Il n'y a aucun bordereau à collecter
            </BlankslateTitle>
            <BlankslateDescription>
              Des bordereaux apparaissent dans cet onglet lorsqu'ils sont en
              attente de collecte par votre entreprise.
            </BlankslateDescription>
          </Blankslate>
        }
      />
    </>
  );
}
