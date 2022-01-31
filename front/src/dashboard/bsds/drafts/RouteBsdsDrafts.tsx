import React, { useMemo } from "react";
import { IconDuplicateFile } from "common/components/Icons";
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
import illustration from "./assets/blankslateDrafts.svg";

export function RouteBsdsDrafts() {
  const { siret } = useParams<{ siret: string }>();
  const defaultWhere = useMemo(
    () => ({
      isDraftFor: [siret],
    }),
    [siret]
  );

  return (
    <>
      <Breadcrumb>
        <BreadcrumbItem>Mes Bordereaux</BreadcrumbItem>
        <BreadcrumbItem>Brouillons</BreadcrumbItem>
      </Breadcrumb>

      <BSDList
        siret={siret}
        defaultWhere={defaultWhere}
        blankslate={
          <Blankslate>
            <BlankslateImg src={illustration} alt="" />
            <BlankslateTitle>
              Il n'y a aucun bordereau en brouillon
            </BlankslateTitle>
            <BlankslateDescription>
              Si vous le souhaitez, vous pouvez créer un bordereau depuis le
              menu de création ci-dessus ou dupliquer un bordereau déjà existant
              dans un autre onglet grâce à l'icône{" "}
              <span className="tw-inline-flex tw-ml-1">
                <IconDuplicateFile color="blueLight" />
              </span>
            </BlankslateDescription>
          </Blankslate>
        }
      />
    </>
  );
}
