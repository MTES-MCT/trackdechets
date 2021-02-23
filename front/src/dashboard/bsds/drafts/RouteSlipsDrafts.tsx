import { useQuery } from "@apollo/client";
import React from "react";
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
import { Query, QueryFormsArgs } from "generated/graphql/types";
import { BSDList, COLUMNS } from "../../components/BSDList";

import routes from "common/routes";
import { DRAFT_TAB_FORMS } from "../queries";
import SlipsHeaderActions from "../SlipsHeaderActions";
import illustration from "./assets/blankslateDrafts.svg";

const DRAFTS_COLUMNS = [
  COLUMNS.emitter,
  COLUMNS.recipient,
  COLUMNS.waste,
  COLUMNS.quantity,
];

export function RouteSlipsDrafts() {
  const { siret } = useParams<{ siret: string }>();
  const { data, loading, fetchMore, refetch } = useQuery<
    Pick<Query, "forms">,
    Partial<QueryFormsArgs>
  >(DRAFT_TAB_FORMS, {
    variables: { siret },
    notifyOnNetworkStatusChange: true,
  });
  const forms = data?.forms ?? [];

  return (
    <>
      <Breadcrumb>
        <BreadcrumbItem>Mes Bordereaux</BreadcrumbItem>
        <BreadcrumbItem>Brouillons</BreadcrumbItem>
      </Breadcrumb>

      <SlipsHeaderActions refetch={refetch} />

      {forms.length > 0 || loading ? (
        <BSDList
          loading={loading}
          siret={siret}
          forms={forms}
          columns={DRAFTS_COLUMNS}
          fetchMore={fetchMore}
        />
      ) : (
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
            ou dupliquer un bordereau déjà existant dans un autre onglet grâce à
            l'icône{" "}
            <span style={{ display: "inline" }}>
              <IconDuplicateFile color="blueLight" />
            </span>
          </BlankslateDescription>
        </Blankslate>
      )}
    </>
  );
}
