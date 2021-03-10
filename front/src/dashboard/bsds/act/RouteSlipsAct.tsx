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
import SlipsHeaderActions from "../SlipsHeaderActions";
import { ACT_TAB_FORMS } from "../queries";
import illustration from "./assets/blankslateAct.svg";

export function RouteSlipsAct() {
  const { siret } = useParams<{ siret: string }>();
  const { data, loading, fetchMore, refetch } = useQuery<
    Pick<Query, "forms">,
    Partial<QueryFormsArgs>
  >(ACT_TAB_FORMS, {
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
        <BreadcrumbItem>Pour Action</BreadcrumbItem>
      </Breadcrumb>

      <SlipsHeaderActions refetch={refetch} />

      <BSDList
        loading={loading}
        siret={siret}
        forms={forms}
        fetchMore={fetchMore}
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
