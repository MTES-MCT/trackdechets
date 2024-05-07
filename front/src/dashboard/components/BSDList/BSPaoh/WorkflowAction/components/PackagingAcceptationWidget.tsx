import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";

import React, { useEffect, useReducer } from "react";

import {
  getVerbosePackagingType,
  getVerboseConsistence
} from "../../paohUtils";
const SET_ACCEPTATION = "set_acceptation";
const SET_ACCEPTATIONS = "set_acceptations";

function packagingAcceptationReducer(state, action) {
  switch (action.type) {
    case SET_ACCEPTATION: {
      const pck = state.packagings.map(p => ({
        ...p,
        ...(p.id === action.payload.id
          ? { acceptation: action.payload.status }
          : {})
      }));
      return {
        mainCheckboxChecked: pck.every(p => p.acceptation === "ACCEPTED"),
        packagings: pck
      };
    }
    case SET_ACCEPTATIONS: {
      return {
        mainCheckboxChecked: action.payload.status === "ACCEPTED",
        packagings: state.packagings.map(p => ({
          ...p,
          acceptation: action.payload.status
        }))
      };
    }
  }
  throw Error("Unknown action: " + action.type);
}

const displayVolume = (v?: number | string) => {
  if (!v) return "";
  return `${v} l`;
};

export const PackagingAcceptationWidget = ({
  initialPackagings,
  acceptationStatus,
  setValue,
  trigger,
  error
}) => {
  const [store, dispatch] = useReducer(packagingAcceptationReducer, {
    packagings: initialPackagings,
    mainCheckboxChecked: true
  });
  // disable checkboxes when everything is accepted or refused
  const checkboxDisabled = acceptationStatus !== "PARTIALLY_REFUSED";
  // fill initial data from packagings
  useEffect(() => {
    const packagingAcceptation = store.packagings.map(p => ({
      id: p.id,
      acceptation: p.acceptation
    }));

    setValue("packagings", packagingAcceptation);
    trigger("packagings");
  }, [store, setValue, trigger]);
  // check or uncheck everything according to acceptation status
  useEffect(() => {
    dispatch({
      type: SET_ACCEPTATIONS,
      payload: {
        status: ["ACCEPTED", "PARTIALLY_REFUSED"].includes(acceptationStatus)
          ? "ACCEPTED"
          : "REFUSED"
      }
    });
  }, [acceptationStatus]);

  return (
    <div className="fr-table ">
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Volume</th>

            <th>N° de contenant</th>
            <th>Consistance</th>
            <th>Codes d'id.</th>
            <th>
              <Checkbox
                options={[
                  {
                    label: "",
                    nativeInputProps: {
                      name: "checkboxes-a",
                      value: "value1",
                      checked: store.mainCheckboxChecked,
                      disabled: checkboxDisabled,

                      onChange: e => {
                        dispatch({
                          type: SET_ACCEPTATIONS,
                          payload: {
                            status: e.target.checked ? "ACCEPTED" : "REFUSED"
                          }
                        });
                      }
                    }
                  }
                ]}
              />
            </th>
          </tr>
        </thead>
        <tbody>
          {store.packagings.map(p => (
            <tr key={p.id}>
              <td> {getVerbosePackagingType(p.type)}</td>
              <td> {displayVolume(p.volume)}</td>

              <td>{p.containerNumber}</td>
              <td>{getVerboseConsistence(p.consistence)}</td>
              <td>{p.identificationCodes.join(",")}</td>
              <td>
                <Checkbox
                  options={[
                    {
                      label: "",
                      nativeInputProps: {
                        name: "checkboxes-1",
                        value: "value1",
                        checked: p.acceptation === "ACCEPTED",
                        disabled: checkboxDisabled,
                        onChange: () =>
                          dispatch({
                            type: SET_ACCEPTATION,
                            payload: {
                              status:
                                p.acceptation === "ACCEPTED"
                                  ? "REFUSED"
                                  : "ACCEPTED",
                              id: p.id
                            }
                          })
                      }
                    }
                  ]}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {error && <p className="fr-error-text">{error?.message}</p>}
    </div>
  );
};
