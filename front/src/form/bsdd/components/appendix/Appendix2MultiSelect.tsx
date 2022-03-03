import { gql, useQuery } from "@apollo/client";
import { InlineError } from "common/components/Error";
import { formatDate } from "common/datetime";
import { FieldArray, useFormikContext } from "formik";
import { Form, Query, QueryAppendixFormsArgs } from "generated/graphql/types";
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
      signedAt
      quantityReceived
      processingOperationDone
    }
  }
`;

export default function Appendix2MultiSelect() {
  const [wasteCodeFilter, setWasteCodeFilter] = useState("");
  const { values, setFieldValue, getFieldMeta } = useFormikContext<Form>();
  const meta = getFieldMeta<Form[]>("appendix2Forms");
  const [hasChanged, setHasChanged] = useState(false);

  const { loading, error, data } = useQuery<
    Pick<Query, "appendixForms">,
    QueryAppendixFormsArgs
  >(APPENDIX2_FORMS, {
    variables: {
      siret: values.emitter?.company?.siret ?? "",
    },
    skip: !values.emitter?.company?.siret,
    fetchPolicy: "network-only",
  });

  // because { query { appendix2Forms } } does not return forms that
  // have already been appended to a BSDD, we need to keep track of
  // initial value of form.appendix2Forms when updating a BSDD
  const appendix2Candidates = useMemo(() => {
    const appendix2Forms = data?.appendixForms ?? [];
    return [...(meta.initialValue ?? []), ...appendix2Forms].filter(f => {
      return wasteCodeFilter?.length
        ? f.wasteDetails?.code?.includes(wasteCodeFilter)
        : true;
    });
  }, [data, meta.initialValue, wasteCodeFilter]);

  const appendix2Selected = useMemo(() => values.appendix2Forms ?? [], [
    values.appendix2Forms,
  ]);

  useEffect(() => {
    // avoid overwriting values on first render when updating a BSDD
    if (!values.id || hasChanged) {
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

      setFieldValue("wasteDetails.quantity", totalQuantity);
      setFieldValue("wasteDetails.packagingInfos", totalPackagings);
    }
  }, [appendix2Selected, values.id, hasChanged, setFieldValue]);

  function onSelectAll() {
    if (appendix2Selected.length === appendix2Candidates.length) {
      setFieldValue("appendix2Forms", []);
    } else {
      setFieldValue("appendix2Forms", appendix2Candidates);
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
                    appendix2Selected.length === appendix2Candidates.length
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
          <FieldArray
            name="appendix2Forms"
            render={({ push, remove }) => (
              <>
                {appendix2Candidates.map((form, index) => (
                  <tr key={form.id} className="td-table__tr">
                    <td>
                      <input
                        type="checkbox"
                        className="td-checkbox"
                        name={`appendix2Forms[${index}].id`}
                        value={form.id}
                        checked={appendix2Selected
                          .map(f => f.id)
                          .includes(form.id)}
                        onChange={e => {
                          setHasChanged(true);
                          if (e.target.checked) {
                            push(form);
                          } else {
                            const idx = appendix2Selected
                              .map(f => f.id)
                              .indexOf(form.id);
                            remove(idx);
                          }
                        }}
                      />
                    </td>
                    <td>{form.readableId}</td>
                    <td>
                      {form.wasteDetails?.code} - {form.wasteDetails?.name}
                    </td>
                    <td>{form.emitter?.company?.name}</td>
                    <td>{formatDate(form.signedAt!)}</td>
                    <td>{form.quantityReceived} tonnes</td>
                    <td>{form.processingOperationDone}</td>
                  </tr>
                ))}
              </>
            )}
          />
          {appendix2Candidates.length === 0 && (
            <tr>
              <td colSpan={100}>
                Aucun bordereau éligible au regroupement. Vérifiez que vous avez
                bien sélectionné le bon émetteur.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {error && <InlineError apolloError={error} />}
      {loading && <div>Chargement</div>}
    </>
  );
}
