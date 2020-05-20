import { useQuery } from "@apollo/react-hooks";
import React, { useContext } from "react";
import { InlineError } from "../../../common/Error";
import Loader from "../../../common/Loader";
import { GET_SLIPS } from "../query";
import Slips from "../Slips";
import { SiretContext } from "../../Dashboard";
import LoadMore from "./LoadMore";

export default function HistoryTab() {
  const { siret } = useContext(SiretContext);
  const { loading, error, data, fetchMore } = useQuery(GET_SLIPS, {
    variables: { siret, status: ["PROCESSED", "NO_TRACEABILITY", "REFUSED"] },
  });

  if (loading) return <Loader />;
  if (error) return <InlineError apolloError={error} />;
  if (!data?.forms?.length)
    return (
      <div className="empty-tab">
        <img src="/illu/illu_hello.svg" alt="" />
        <h4>Il n'y a aucun bordereau en archive</h4>
        <p>
          Des bordereaux apparaissent dans cet onnglet lorsqu'ils terminé leur
          cycle de vie. Ils sont alors disponible en lecture seule pour
          consultation.
        </p>
      </div>
    );

  return (
    <>
      <Slips siret={siret} forms={data.forms} />
      <LoadMore forms={data.forms} fetchMore={fetchMore} />
    </>
  );
}
