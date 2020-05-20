import { useQuery } from "@apollo/react-hooks";
import React, { useContext } from "react";
import { InlineError } from "../../../common/Error";
import Loader from "../../../common/Loader";
import {
  FormStatus,
  Query,
  QueryFormsArgs,
} from "../../../generated/graphql/types";
import { SiretContext } from "../../Dashboard";
import { GET_SLIPS } from "../query";
import Slips from "../Slips";
import LoadMore from "./LoadMore";

export default function ActTab() {
  const { siret } = useContext(SiretContext);
  const { loading, error, data, fetchMore } = useQuery<
    Pick<Query, "forms">,
    Partial<QueryFormsArgs>
  >(GET_SLIPS, {
    variables: {
      siret,
      status: [
        FormStatus.Sealed,
        FormStatus.Sent,
        FormStatus.Received,
        FormStatus.TempStored,
        FormStatus.Resealed,
        FormStatus.Resent,
      ],
      hasNextStep: true,
    },
  });

  if (loading) return <Loader />;
  if (error) return <InlineError apolloError={error} />;
  if (!data?.forms?.length)
    return (
      <div className="empty-tab">
        <img src="/illu/illu_sent.svg" alt="" />
        <h4>Il n'y a aucun bordereau à signer</h4>
        <p>
          Bonne nouvelle, vous n'avez aucun bordereau à signer ! Des bordereaux
          apparaissent dans cet onglet uniquement lorsque vous avez une action à
          effectuer dans le cadre de leur cycle de vie (envoi, réception ou
          traitement...)
        </p>
      </div>
    );

  return (
    <>
      <Slips siret={siret} forms={data.forms} dynamicActions={true} />{" "}
      <LoadMore forms={data.forms} fetchMore={fetchMore} />{" "}
    </>
  );
}
