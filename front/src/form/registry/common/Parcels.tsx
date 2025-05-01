import Alert from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import React from "react";
import { useFieldArray, type UseFormReturn } from "react-hook-form";
import DropdownMenu from "../../../Apps/common/Components/DropdownMenu/DropdownMenu";
import { formatError } from "../builder/error";

type Props = {
  prefix: string;
  methods: UseFormReturn<any>;
  disabled?: boolean;
  title?: string;
};

enum Mode {
  CODE = "CODE",
  GPS = "GPS"
}

export function Parcels({ methods, disabled, prefix, title }: Props) {
  const { errors } = methods.formState;

  const {
    fields: inseeCodeFields,
    append: appendInseeCode,
    remove: removeInseeCode
  } = useFieldArray({
    control: methods.control,
    name: `${prefix}InseeCodes`
  });

  const { append: appendNumber, remove: removeNumber } = useFieldArray({
    control: methods.control,
    name: `${prefix}Numbers`
  });

  const {
    fields: coordinatesFields,
    append: appendCoordinate,
    remove: removeCoordinate
  } = useFieldArray({
    control: methods.control,
    name: `${prefix}Coordinates`
  });

  function deleteParcel(mode: Mode, index: number) {
    if (mode === Mode.CODE) {
      removeInseeCode(index);
      removeNumber(index);
    }
    if (mode === Mode.GPS) {
      removeCoordinate(index);
    }
  }

  return (
    <div className="fr-col">
      <h4 className="fr-h4">{title ?? "Parcelles"}</h4>

      {inseeCodeFields.length === 0 && coordinatesFields.length === 0 && (
        <p className="fr-text--sm fr-mb-2w">Aucune parcelle renseignée.</p>
      )}

      {inseeCodeFields.length > 0 && (
        <p className="fr-mb-2v tw-text-lg tw-font-bold">
          Parcelles renseignées par code INSEE:
        </p>
      )}
      {inseeCodeFields.map((field, index) => (
        <div key={field.id} className="fr-mb-2w">
          <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--bottom">
            <div className="fr-col-4">
              <Input
                label="Code INSEE"
                nativeInputProps={{
                  type: "text",
                  disabled,
                  ...methods.register(`${prefix}InseeCodes.${index}`)
                }}
              />
            </div>
            <div className="fr-col-4">
              <Input
                label="Numéro de parcelle"
                nativeInputProps={{
                  type: "text",
                  disabled,
                  ...methods.register(`${prefix}Numbers.${index}`)
                }}
              />
            </div>
            <div className="fr-col-3">
              <Button
                type="button"
                className="fr-mt-2v"
                priority="secondary"
                onClick={() => deleteParcel(Mode.CODE, index)}
                disabled={disabled}
              >
                Supprimer
              </Button>
            </div>
          </div>

          {errors?.[`${prefix}InseeCodes`]?.[index] && (
            <Alert
              className="fr-mt-2w"
              description={formatError(
                errors?.[`${prefix}InseeCodes`]?.[index]
              )}
              severity="error"
              small
            />
          )}
          {errors?.[`${prefix}Numbers`]?.[index] && (
            <Alert
              className="fr-mt-2w"
              description={formatError(errors?.[`${prefix}Numbers`]?.[index])}
              severity="error"
              small
            />
          )}
        </div>
      ))}

      {coordinatesFields.length > 0 && (
        <p className="fr-mb-2v tw-text-lg tw-font-bold">
          Parcelles renseignées par coordonnées GPS :
        </p>
      )}
      {coordinatesFields.map((field, index) => (
        <div key={field.id} className="fr-mb-2w">
          <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--bottom">
            <div className="fr-col-4">
              <Input
                label="Coordonnées GPS de la parcelle"
                nativeInputProps={{
                  type: "text",
                  disabled,
                  ...methods.register(`${prefix}Coordinates.${index}`)
                }}
              />
            </div>
            <div className="fr-col-4">
              <Button
                type="button"
                className="fr-mt-2v"
                priority="secondary"
                onClick={() => deleteParcel(Mode.GPS, index)}
                disabled={disabled}
              >
                Supprimer
              </Button>
            </div>
          </div>
        </div>
      ))}

      <DropdownMenu
        links={[
          {
            title: "Identifiée par code INSEE",
            isButton: true,
            handleClick: () => {
              appendInseeCode("");
              appendNumber("");
            }
          },
          {
            title: "Identifiée par ses coordonnées GPS",
            isButton: true,
            handleClick: () => {
              appendCoordinate("");
            }
          }
        ]}
        isDisabled={disabled}
        menuTitle={"Ajouter une parcelle"}
      />

      {errors?.[`${prefix}Coordinates`] && (
        <Alert
          className="fr-mt-2w"
          description={formatError(errors[`${prefix}Coordinates`])}
          severity="error"
          small
        />
      )}
    </div>
  );
}
