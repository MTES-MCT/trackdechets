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
      return state.map(p => ({
        ...p,
        ...(p.id === action.payload.id
          ? { acceptation: action.payload.status }
          : {})
      }));
    }
    case SET_ACCEPTATIONS: {
      return state.map(p => ({
        ...p,
        acceptation: action.payload.status
      }));
    }
  }
  throw Error("Unknown action: " + action.type);
}

export const PackagingAcceptationWidget = ({
  initialPackagings,
  acceptationStatus,
  setValue
}) => {
  const [packagings, dispatch] = useReducer(
    packagingAcceptationReducer,
    initialPackagings
  );
  // disable checkboxes when everything is accepted or refused
  const checkboxDisabled = acceptationStatus !== "PARTIALLY_REFUSED";
  // fill initial data from packagings
  useEffect(() => {
    const packagingAcceptation = packagings.map(p => ({
      id: p.id,
      acceptation: p.acceptation
    }));

    setValue("packagings", packagingAcceptation);
  }, [packagings, setValue]);
  // check or uncheck everything according to acceptation status
  useEffect(() => {
    if (acceptationStatus === "PARTIALLY_REFUSED") {
      return;
    }
    dispatch({
      type: SET_ACCEPTATIONS,
      payload: {
        status: acceptationStatus === "ACCEPTED" ? "ACCEPTED" : "REFUSED"
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
            <th>Poids</th>
            <th>N° de Contenant</th>
            <th>Consistance</th>
            <th>Codes d'identification</th>
            <th>
              <Checkbox
                options={[
                  {
                    label: "",
                    nativeInputProps: {
                      name: "checkboxes-a",
                      value: "value1",
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
          {packagings.map(p => (
            <tr key={p.id}>
              <td> {getVerbosePackagingType(p.type)}</td>
              <td> {p.volume}</td>
              <td>{p.weight}</td>
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
    </div>
  );
};
