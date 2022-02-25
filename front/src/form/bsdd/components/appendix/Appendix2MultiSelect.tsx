import { gql, useQuery } from "@apollo/client";
import { InlineError } from "common/components/Error";
import { formatDate } from "common/datetime";
import useDebounce from "common/hooks/use-debounce";
import { Field, useFormikContext } from "formik";
import {
  CreateFormInput,
  Query,
  QueryAppendixFormsArgs,
} from "generated/graphql/types";
import React, { useEffect, useMemo, useState } from "react";

const APPENDIX2_FORMS = gql`
  query AppendixForms($siret: String!, $wasteCode: String) {
    appendixForms(siret: $siret, wasteCode: $wasteCode) {
      id
      readableId
      emitter {
        company {
          name
        }
      }
      wasteDetails {
        code
        name
        quantity
        packagingInfos {
          type
          other
          quantity
        }
      }
      receivedAt
      quantityReceived
      processingOperationDone
    }
  }
`;

export default function Appendix2MultiSelect() {
  const [wasteCodeFilter, setWasteCodeFilter] = useState("");
  const debouncedWasteCodeFilter = useDebounce(wasteCodeFilter, 500);
  const { values, setFieldValue } = useFormikContext<
    Pick<CreateFormInput, "emitter"> & { appendix2Forms: string[] }
  >();

  const { loading, error, data } = useQuery<
    Pick<Query, "appendixForms">,
    QueryAppendixFormsArgs
  >(APPENDIX2_FORMS, {
    variables: {
      ...(debouncedWasteCodeFilter && debouncedWasteCodeFilter !== ""
        ? { wasteCode: debouncedWasteCodeFilter }
        : {}),
      siret: values.emitter?.company?.siret ?? "",
    },
    skip: !values.emitter?.company?.siret,
    fetchPolicy: "network-only",
    onCompleted: data => {
      if (values.appendix2Forms?.length > 0) {
        setFieldValue(
          "appendix2Forms",
          values.appendix2Forms.filter(id =>
            data.appendixForms.map(f => f.id).includes(id)
          )
        );
      }
    },
  });

  const appendix2Candidates = useMemo(() => data?.appendixForms ?? [], [data]);
  const appendix2Selected = useMemo(() => {
    return appendix2Candidates.filter(f =>
      values.appendix2Forms.includes(f.id)
    );
  }, [appendix2Candidates, values.appendix2Forms]);

  useEffect(() => {
    // Computes sum of quantities of appendix2
    const totalQuantity = appendix2Selected.reduce((q, f) => {
      if (!f.wasteDetails?.quantity) {
        return q;
      }
      return q + f.wasteDetails?.quantity;
    }, 0);

    // Computes the sum of packagingsInfos of appendix2
    const totalPackagings = (() => {
      const quantityByType = appendix2Selected.reduce((acc1, form) => {
        if (!form.wasteDetails?.packagingInfos) {
          return acc1;
        }
        return form.wasteDetails.packagingInfos.reduce(
          (acc2, packagingInfo) => {
            if (!acc2[packagingInfo.type]) {
              return {
                ...acc2,
                [packagingInfo.type]: packagingInfo.quantity,
              };
            }
            return {
              ...acc2,
              [packagingInfo.type]:
                packagingInfo.quantity + acc2[packagingInfo.type],
            };
          },
          acc1
        );
      }, {});
      return Object.keys(quantityByType).map(type => ({
        type,
        other: "",
        quantity: quantityByType[type],
      }));
    })();

    setFieldValue("wasteDetails.quantity", totalQuantity || null);
    setFieldValue("wasteDetails.packagingInfos", totalPackagings);
  }, [appendix2Selected, setFieldValue]);

  // set default value for the quantity of the groupement BSD
  // useEffect(() => {}, [totalQuantity, setFieldValue]);

  // useEffect(() => {}, [totalPackagings, setFieldValue]);

  if (loading) return <p>Chargement...</p>;
  if (error) return <InlineError apolloError={error} />;

  function onSelectAll() {
    if (values?.appendix2Forms?.length) {
      setFieldValue("appendix2Forms", []);
    } else {
      setFieldValue(
        "appendix2Forms",
        appendix2Candidates.map(f => f.id)
      );
    }
  }

  return (
    <>
      <table className="td-table" style={{ display: "table-cell" }}>
        <thead>
          <tr className="td-table__head-tr">
            <th>
              {appendix2Candidates.length > 0 && (
                <input
                  type="checkbox"
                  className="td-checkbox"
                  checked={
                    values.appendix2Forms?.length === appendix2Candidates.length
                  }
                  onChange={onSelectAll}
                />
              )}
            </th>
            <th>Numéro</th>
            <th>
              <div>Code déchet</div>
              <input
                type="text"
                className="td-input"
                value={wasteCodeFilter}
                placeholder="Filtrer..."
                onChange={e => {
                  setWasteCodeFilter(e.target.value);
                }}
              ></input>
            </th>
            <th>Expéditeur initial</th>
            <th>Date de réception</th>
            <th>Quantité</th>
            <th>Opération réalisée</th>
          </tr>
        </thead>
        <tbody>
          {appendix2Candidates.map(form => (
            <tr key={form.id} className="td-table__tr">
              <td>
                <Field
                  type="checkbox"
                  className="td-checkbox"
                  name="appendix2Forms"
                  value={form.id}
                />
              </td>
              <td>{form.readableId}</td>
              <td>
                {form.wasteDetails?.code} - {form.wasteDetails?.name}
              </td>
              <td>{form.emitter?.company?.name}</td>
              <td>{formatDate(form.receivedAt!)}</td>
              <td>{form.quantityReceived} tonnes</td>
              <td>{form.processingOperationDone}</td>
            </tr>
          ))}
          {appendix2Candidates.length === 0 && (
            <tr>
              <td colSpan={100}>
                Aucun bordereau éligible au regroupement. Vérifiez que vous avez
                bien sélectionné le bon émetteur
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}
