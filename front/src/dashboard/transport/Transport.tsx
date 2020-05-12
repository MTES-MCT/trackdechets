import gql from "graphql-tag";
import React from "react";
import "./Transport.scss";
import TransportSignature from "./TransportSignature";
import TransporterInfoEdit from "./TransporterInfoEdit";
import DownloadPdf from "../slips/slips-actions/DownloadPdf";
import { useQuery } from "@apollo/react-hooks";
import { useFormsTable } from "../slips/use-forms-table";
import { FaSync, FaSort } from "react-icons/fa";
import { useState } from "react";
import useLocalStorage from "./hooks";
import { fullFormFragment } from "../../common/fragments";
import {
  User,
  Form,
  Query,
  QueryFormsArgs,
  FormType,
  FormStatus,
} from "../../generated/graphql/types";

type Props = {
  me: User;
  siret: string;
};
export const GET_TRANSPORT_SLIPS = gql`
  query GetSlips($siret: String, $type: FormType) {
    forms(siret: $siret, type: $type) {
      ...FullForm
    }
  }
  ${fullFormFragment}
`;
const Table = ({ forms, displayActions }) => {
  const [sortedForms, sortBy, filter] = useFormsTable(forms);

  return (
    <table className="table transport-table">
      <thead>
        <tr>
          <th className="sortable" onClick={() => sortBy("readableId")}>
            Numéro{" "}
            <small>
              <FaSort />
            </small>
          </th>
          <th
            className="sortable"
            onClick={() => sortBy("emitter.company.name")}
          >
            Emetteur{" "}
            <small>
              <FaSort />
            </small>
          </th>
          <th
            className="sortable hide-on-mobile"
            onClick={() => sortBy("stateSummary.recipient.name")}
          >
            Destinataire{" "}
            <small>
              <FaSort />
            </small>
          </th>

          <th>Déchet</th>
          <th className="hide-on-mobile">Quantité estimée</th>
          <th colSpan={2}>Champ libre</th>
          <th colSpan={2}>Plaque d'immatriculation</th>

          {displayActions ? <th>Action</th> : null}
        </tr>
        <tr>
          <th>
            <input
              type="text"
              onChange={(e) => filter("readableId", e.target.value)}
              placeholder="Filtrer..."
            />
          </th>
          <th>
            <input
              type="text"
              onChange={(e) => filter("emitter.company.name", e.target.value)}
              placeholder="Filtrer..."
            />
          </th>
          <th className="hide-on-mobile">
            <input
              type="text"
              onChange={(e) =>
                filter("stateSummary.recipient.name", e.target.value)
              }
              placeholder="Filtrer..."
            />
          </th>
          <th>
            <input
              type="text"
              onChange={(e) => filter("wasteDetails.name", e.target.value)}
              placeholder="Filtrer..."
            />
          </th>
          <th className="hide-on-mobile"></th>
          <th colSpan={2}></th>
          <th colSpan={2}></th>
          {displayActions ? <th></th> : null}
        </tr>
      </thead>
      <tbody>
        {sortedForms.map((form) => (
          <tr key={form.id}>
            <td className="readable-id">
              {form.readableId}
              <DownloadPdf formId={form.id} />
            </td>
            <td>{form.stateSummary?.emitter?.name}</td>
            <td className="hide-on-mobile">
              {form.stateSummary?.recipient?.name}
            </td>
            <td>
              <div>{form.wasteDetails?.name}</div>
            </td>
            <td className="hide-on-mobile">
              {form.stateSummary?.quantity} tonnes
            </td>

            <td>{form.stateSummary?.transporterCustomInfo}</td>
            <td style={{ paddingLeft: 0, paddingRight: 0 }}>
              {
                <TransporterInfoEdit
                  form={form}
                  fieldName="customInfo"
                  title={"Modifier le champ libre"}
                />
              }
            </td>
            <td>{form.stateSummary?.transporterNumberPlate}</td>
            <td style={{ paddingLeft: 0 }}>
              {
                <TransporterInfoEdit
                  form={form}
                  fieldName="numberPlate"
                  title={"Modifier la plaque d'immatriculation"}
                />
              }
            </td>
            {displayActions ? (
              <td>{<TransportSignature form={getTransportInfos(form)} />}</td>
            ) : null}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
const TRANSPORTER_FILTER_STORAGE_KEY = "TRANSPORTER_FILTER_STORAGE_KEY";
export default function Transport({ siret }: Props & any) {
  const [filterStatus, setFilterStatus] = useState([
    FormStatus.Sealed,
    FormStatus.Resealed,
  ]);
  const [persistentFilter, setPersistentFilter] = useLocalStorage(
    TRANSPORTER_FILTER_STORAGE_KEY
  );
  const { loading, error, data, refetch } = useQuery<
    Pick<Query, "forms">,
    QueryFormsArgs
  >(GET_TRANSPORT_SLIPS, {
    variables: { siret, type: FormType.Transporter },
  });
  if (loading) return <div>loading</div>;
  if (error) return <div>error</div>;

  const filterAgainstPersistenFilter = (field, filterParam) => {
    field = !field ? "" : field;
    return field.toLowerCase().indexOf(filterParam.toLowerCase()) > -1;
  };

  // filter forms by status and concatenate waste code and name to ease searching
  const filteredForms = data
    ? data.forms
        .filter(
          (f) =>
            filterStatus.includes(f.status) &&
            filterAgainstPersistenFilter(
              f.stateSummary?.transporterCustomInfo,
              persistentFilter
            )
        )
        .map((f) => ({
          ...f,
          wasteDetails: {
            ...f.wasteDetails,
            name: `${f.wasteDetails?.code} ${f.wasteDetails?.name} `,
          },
        }))
    : [];
  return (
    <div>
      <div className="header-content">
        <h2>Déchets à transporter</h2>
      </div>

      <div className="transport-menu">
        <button
          onClick={() =>
            setFilterStatus([FormStatus.Sealed, FormStatus.Resealed])
          }
          className={`link ${
            filterStatus.includes(FormStatus.Sealed) ? "active" : ""
          }`}
        >
          Déchets à collecter
        </button>
        <button
          onClick={() => setFilterStatus([FormStatus.Sent, FormStatus.Resent])}
          className={`link ${
            filterStatus.includes(FormStatus.Sent) ? "active" : ""
          }`}
        >
          Déchets chargés, en attente de réception
        </button>
        <button
          className="button button-primary transport-refresh"
          onClick={() => refetch({ siret, type: FormType.Transporter })}
        >
          <FaSync /> Rafraîchir
        </button>
      </div>

      <div className="transporter-permanent-filter form__group">
        <input
          type="text"
          placeholder="Filtre champ libre…"
          value={persistentFilter}
          onChange={(e) => setPersistentFilter(e.target.value)}
        />

        {persistentFilter && (
          <button
            className="button-outline warning"
            onClick={(e) => setPersistentFilter("")}
          >
            Afficher tous les bordereaux
          </button>
        )}
      </div>

      <Table
        forms={filteredForms}
        displayActions={filterStatus.includes(FormStatus.Sealed)}
      />
    </div>
  );
}

function getTransportInfos(form: Form) {
  if (!form.temporaryStorageDetail) {
    return form;
  }

  return {
    ...form,
    emitter: {
      ...form.emitter,
      ...form.recipient,
    },
    recipient: {
      ...form.recipient,
      ...form.temporaryStorageDetail.destination,
    },
    wasteDetails: {
      ...form.wasteDetails,
      ...(form.temporaryStorageDetail?.wasteDetails?.quantity &&
        form.temporaryStorageDetail.wasteDetails),
    },
  };
}
