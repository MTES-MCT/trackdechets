import { gql, useQuery } from "@apollo/client";
import { InlineError } from "../../../../Apps/common/Components/Error/Error";
import { formatDate } from "../../../../common/datetime";
import { FieldArray, useFormikContext } from "formik";
import {
  Form,
  InitialFormFraction,
  Query,
  QueryAppendixFormsArgs,
  Packagings
} from "@td/codegen-ui";
import React, { useEffect, useMemo, useState } from "react";
import { Decimal } from "decimal.js";

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
      quantityGrouped
      processingOperationDone
    }
  }
`;

export default function Appendix2MultiSelect() {
  const [wasteCodeFilter, setWasteCodeFilter] = useState("");
  const { values, setFieldValue, getFieldMeta } = useFormikContext<Form>();
  const meta = getFieldMeta<InitialFormFraction[]>("grouping");
  const [hasChanged, setHasChanged] = useState(false);

  const { loading, error, data } = useQuery<
    Pick<Query, "appendixForms">,
    QueryAppendixFormsArgs
  >(APPENDIX2_FORMS, {
    variables: {
      siret: values.emitter?.company?.siret ?? ""
    },
    skip: !values.emitter?.company?.siret,
    fetchPolicy: "network-only"
  });

  const [quantitesToGroup, setQuantitiesToGroup] = useState({});

  // because { query { appendixForms } } does not return forms that
  // have already been appended to a BSDD, we need to keep track of
  // initial value of form.grouping when updating a BSDD
  const appendix2Candidates = useMemo(() => {
    const initialValue = (meta.initialValue ?? []).filter(g => {
      return (
        g.form.recipient?.company?.siret === values.emitter?.company?.siret
      );
    });
    const appendix2Forms =
      data?.appendixForms?.filter(
        form => !initialValue.map(({ form }) => form.id).includes(form.id)
      ) ?? [];
    return [
      ...initialValue.map(({ form, quantity }) => ({
        form,
        quantity: new Decimal(quantity)
      })),
      ...appendix2Forms.map(f => ({
        form: f,
        quantity: new Decimal(f.quantityReceived!).minus(f.quantityGrouped ?? 0)
      }))
    ].filter(({ form }) => {
      return wasteCodeFilter?.length
        ? form.wasteDetails?.code?.includes(wasteCodeFilter)
        : true;
    });
  }, [data, meta.initialValue, wasteCodeFilter, values.emitter]);

  const appendix2Selected = useMemo(
    () => values.grouping ?? [],
    [values.grouping]
  );

  useEffect(() => {
    const quantites = appendix2Selected.reduce((qs, { form, quantity }) => {
      return { ...qs, [form.id]: quantity };
    }, {});
    setQuantitiesToGroup(prevState => ({ ...prevState, ...quantites }));
  }, [appendix2Selected]);

  useEffect(() => {
    // avoid overwriting values on first render when updating a BSDD
    if (!values.id || hasChanged) {
      // Computes sum of quantities of appendix2
      const totalQuantity = appendix2Selected
        .reduce((q, { quantity }) => {
          if (!quantity) {
            return q;
          }
          return q.plus(quantity);
        }, new Decimal(0))
        .toNumber();

      // Computes the sum of packagingsInfos of appendix2
      const totalPackagings = (() => {
        const quantityByType = appendix2Selected.reduce((acc1, { form }) => {
          if (!form.wasteDetails?.packagingInfos) {
            return acc1;
          }

          return form.wasteDetails.packagingInfos.reduce(
            (acc2, packagingInfo) => {
              if (!acc2[packagingInfo.type]) {
                return {
                  ...acc2,
                  [packagingInfo.type]: packagingInfo.quantity
                };
              }
              return {
                ...acc2,
                [packagingInfo.type]: [
                  Packagings.Benne,
                  Packagings.Citerne
                ].includes(packagingInfo.type)
                  ? Math.min(
                      packagingInfo.quantity + acc2[packagingInfo.type],
                      2
                    )
                  : packagingInfo.quantity + acc2[packagingInfo.type]
              };
            },
            acc1
          );
        }, {});
        return Object.keys(quantityByType).map(type => ({
          type,
          other: "",
          quantity: quantityByType[type]
        }));
      })();

      setFieldValue("wasteDetails.quantity", totalQuantity);
      setFieldValue("wasteDetails.packagingInfos", totalPackagings);
    }
  }, [appendix2Selected, values.id, hasChanged, setFieldValue]);

  function onSelectAll() {
    if (appendix2Selected.length === appendix2Candidates.length) {
      setFieldValue("grouping", []);
    } else {
      setFieldValue(
        "grouping",
        appendix2Candidates.map(candidate => ({
          form: candidate.form,
          quantity: candidate.quantity.toNumber()
        }))
      );
    }
  }

  if (loading) {
    return <div>Chargement...</div>;
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
            <th>Quantité reçue</th>
            <th>Quantité restante</th>
            <th>Quantité à regrouper</th>
            <th>Opération réalisée</th>
          </tr>
        </thead>
        <tbody>
          <FieldArray
            name="grouping"
            render={({ push, remove, replace }) => (
              <>
                {appendix2Candidates.map(
                  ({ form, quantity: defaultQuantity }, index) => {
                    const quantitySet = quantitesToGroup[form.id];
                    let quantityLeft = new Decimal(
                      form.quantityReceived!
                    ).minus(form.quantityGrouped ?? 0);

                    if (values.id) {
                      quantityLeft = quantityLeft.plus(defaultQuantity);
                    }

                    return (
                      <tr key={form.id} className="td-table__tr">
                        <td>
                          <input
                            type="checkbox"
                            className="td-checkbox"
                            name={`grouping[${index}].id`}
                            value={form.id}
                            checked={appendix2Selected
                              .map(({ form: f }) => f.id)
                              .includes(form.id)}
                            onChange={e => {
                              if (e.target.checked) {
                                push({
                                  form,
                                  quantity:
                                    quantitySet !== undefined
                                      ? quantitySet
                                      : defaultQuantity.toNumber()
                                });
                              } else {
                                const idx = appendix2Selected
                                  .map(({ form: f }) => f.id)
                                  .indexOf(form.id);
                                remove(idx);
                              }
                              setHasChanged(true);
                            }}
                          />
                        </td>
                        <td>{form.readableId}</td>
                        <td>
                          {form.wasteDetails?.code} - {form.wasteDetails?.name}
                        </td>
                        <td>{form.emitter?.company?.name}</td>
                        <td>{formatDate(form.signedAt!)}</td>
                        <td>{form.quantityReceived} T</td>
                        <td>{quantityLeft.toNumber()} T</td>
                        <td>
                          <input
                            className="td-input td-input--small"
                            type="number"
                            min={0}
                            step={0.0001} // increment kg
                            disabled={
                              !appendix2Selected
                                .map(({ form: f }) => f.id)
                                .includes(form.id)
                            }
                            onChange={e => {
                              const idx = appendix2Selected
                                .map(({ form: f }) => f.id)
                                .indexOf(form.id);
                              replace(idx, {
                                form,
                                quantity: e.target.value
                                  ? parseFloat(e.target.value)
                                  : 0
                              });
                              setHasChanged(true);
                            }}
                            max={quantityLeft.toNumber()}
                            defaultValue={
                              quantitySet ?? defaultQuantity.toNumber()
                            }
                          ></input>
                          {!!quantitySet &&
                            quantityLeft.lessThan(quantitySet) && (
                              <div className="error-message">
                                Vous ne pouvez pas regrouper une quantité
                                supérieure à la quantité restante sur ce
                                bordereau qui est de {quantityLeft.toNumber()} T
                              </div>
                            )}
                          {quantitySet < 0 && (
                            <div className="error-message">
                              La quantité doit être un nombre supérieur à 0
                            </div>
                          )}
                        </td>
                        <td>{form.processingOperationDone}</td>
                      </tr>
                    );
                  }
                )}
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
    </>
  );
}
