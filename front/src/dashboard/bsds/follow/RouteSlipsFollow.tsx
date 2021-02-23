import { useQuery } from "@apollo/client";
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
import { Query, QueryFormsArgs } from "generated/graphql/types";
import { BSDList } from "../../components/BSDList";
import { FOLLOW_TAB_FORMS } from "../queries";
import SlipsHeaderActions from "../SlipsHeaderActions";
import illustration from "./assets/blankslateFollow.svg";

export function RouteSlipsFollow() {
  const { siret } = useParams<{ siret: string }>();
  const { data, loading, fetchMore, refetch } = useQuery<
    Pick<Query, "forms">,
    Partial<QueryFormsArgs>
  >(FOLLOW_TAB_FORMS, {
    variables: {
      siret,
    },
    notifyOnNetworkStatusChange: true,
  });
  const forms = data?.forms ?? [];

  return (
    <>
      <Breadcrumb>
        <BreadcrumbItem>Mes Bordereaux</BreadcrumbItem>
        <BreadcrumbItem>Suivi</BreadcrumbItem>
      </Breadcrumb>

      <SlipsHeaderActions refetch={refetch} />

      {forms.length > 0 || loading ? (
        <BSDList
          siret={siret}
          forms={forms}
          loading={loading}
          fetchMore={fetchMore}
        />
      ) : (
        <Blankslate>
          <BlankslateImg src={illustration} alt="" />
          <BlankslateTitle>Il n'y a aucun bordereau à suivre</BlankslateTitle>
          <BlankslateDescription>
            Des bordereaux apparaissent dans cet onglet lorsqu'ils sont en
            attente d'une action extérieure. Par exemple lorsqu'en tant que
            producteur vous attendez la réception d'un déchet ou son traitement.
            La colonne <strong>STATUT</strong> vous renseignera sur l'état
            précis du bordereau.
          </BlankslateDescription>
        </Blankslate>
      )}
    </>
  );
}
