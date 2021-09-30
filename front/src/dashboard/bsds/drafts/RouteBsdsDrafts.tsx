import React, { useMemo } from "react";
import { IconDuplicateFile } from "common/components/Icons";
import { generatePath, Link, useParams } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  Blankslate,
  BlankslateImg,
  BlankslateTitle,
  BlankslateDescription,
} from "common/components";
import routes from "common/routes";
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
              Si vous le souhaitez, vous pouvez{" "}
              <Link to={generatePath(routes.dashboard.bsdds.create, { siret })}>
                <button className="btn btn--outline-primary btn--medium-text">
                  Créer un bordereau
                </button>{" "}
              </Link>
              ou dupliquer un bordereau déjà existant dans un autre onglet grâce
              à l'icône{" "}
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
