import Alert from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import React, { useMemo, useState } from "react";
import { useFieldArray, type UseFormReturn } from "react-hook-form";
import { formatError } from "../builder/error";
import { SegmentedControl } from "@codegouvfr/react-dsfr/SegmentedControl";
import styles from "./ParcelsVisualizer.module.scss";
import clsx from "clsx";
import { Tag } from "@codegouvfr/react-dsfr/Tag";

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

export function ParcelsVisualizer({ methods, disabled, prefix, title }: Props) {
  const { errors } = methods.formState;
  const [mode, setMode] = useState<Mode>(Mode.CODE);
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
  const inseeCodeValues: { value: string }[] = methods.watch(
    `${prefix}InseeCodes`
  );
  const numberValues: { value: string }[] = methods.watch(`${prefix}Numbers`);
  const coordinatesValues: { value: string }[] = methods.watch(
    `${prefix}Coordinates`
  );
  const tags = useMemo(() => {
    const numberFields = inseeCodeValues.map((field, index) => {
      return {
        value: `${field.value}-${numberValues[index].value}`,
        mode: Mode.CODE
      };
    });
    const coordinatesFields = coordinatesValues.map(field => {
      return {
        value: field.value,
        mode: Mode.GPS
      };
    });
    return [...numberFields, ...coordinatesFields];
  }, [inseeCodeValues, numberValues, coordinatesValues]);

  return (
    <div className="fr-col">
      <h5 className="fr-h5">{title ?? "Parcelles"}</h5>

      <div className="fr-mb-2w">
        <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--bottom">
          <div className={clsx(styles.controls, "fr-col-6")}>
            <SegmentedControl
              hideLegend
              segments={[
                {
                  label: "Cadastre",
                  nativeInputProps: {
                    defaultChecked: true,
                    value: Mode.CODE,
                    onChange: v => setMode(v.currentTarget.value as Mode)
                  }
                },
                {
                  label: "Coordonnées GPS",
                  nativeInputProps: {
                    value: Mode.GPS,
                    onChange: v => setMode(v.currentTarget.value as Mode)
                  }
                }
              ]}
            />
            <Input
              label="Adresse complète"
              className="fr-mt-1w fr-mb-1w"
              hintText="Ex: 21 avenue de Ségur, Paris"
              nativeInputProps={{
                type: "search"
              }}
            />
            <div className={styles.or}>{"ou"}</div>
            {mode === Mode.CODE ? (
              <div className="fr-mt-1w">
                <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--bottom">
                  <div className="fr-col-6">
                    <Input
                      label="Commune"
                      hintText="Code postal ou code INSEE"
                      nativeInputProps={{
                        type: "text",
                        onChange: e => {
                          console.log(e.currentTarget.value);
                        }
                      }}
                    />
                  </div>
                  <div className="fr-col-6">
                    <Input
                      label="Numéro de parcelle"
                      hintText="Ex: 000-AB-125"
                      nativeInputProps={{
                        type: "text",
                        onChange: e => {
                          console.log(e.currentTarget.value);
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="fr-mt-1w">
                  <Button type="button" priority="secondary" onClick={() => {}}>
                    Afficher la parcelle et sélectionner sur la carte
                  </Button>
                </div>
              </div>
            ) : (
              <div className="fr-mt-1w">
                <Input
                  label="Coordonnées GPS"
                  className="fr-mb-1w"
                  hintText="Format: un point pour les décimales, exemple: 48.852197 2.310674"
                  nativeInputProps={{
                    type: "text",
                    onChange: e => {
                      console.log(e.currentTarget.value);
                    }
                  }}
                />
                <div className={styles.gpsButtons}>
                  <Button type="button" priority="secondary" onClick={() => {}}>
                    Afficher les coordonnées
                  </Button>
                  <Button type="button" priority="secondary" onClick={() => {}}>
                    Ajouter le point
                  </Button>
                </div>
              </div>
            )}
            {tags.length > 0 && (
              <div className="fr-mt-1w">
                <div>Parcelles sélectionnées sur la carte</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {tags?.map((parcel, idx) => (
                    <div key={idx}>
                      <Tag
                        className="fr-mb-1v"
                        dismissible={!disabled}
                        nativeButtonProps={{
                          type: "button",
                          disabled,
                          onClick: () => {
                            deleteParcel(parcel.mode, idx);
                          },
                          ...{ "data-testid": "tagsInputTags" }
                        }}
                      >
                        {parcel.value}
                      </Tag>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="fr-col-6"></div>
        </div>
      </div>

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
