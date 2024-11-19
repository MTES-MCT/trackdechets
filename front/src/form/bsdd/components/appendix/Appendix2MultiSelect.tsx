import React, { useEffect, useMemo, useState } from "react";
import {
  Form,
  InitialForm,
  InitialFormFraction,
  Packagings
} from "@td/codegen-ui";
import {
  FieldArray,
  FieldArrayRenderProps,
  SharedRenderProps,
  useFormikContext
} from "formik";
import Table from "@codegouvfr/react-dsfr/Table";
import { formatDate } from "../../../../common/datetime";
import Input from "@codegouvfr/react-dsfr/Input";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Decimal from "decimal.js";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";

type Appendix2MultiSelectProps = {
  // Résultat de la query `appendixForms` executé
  // dans le composant wrapper parent
  appendixForms: Form[];
  // callback permettant de mettre à jour la quantité totale
  // du bordereau en fonction des annexes 2 sélectionnées
  updateTotalQuantity: (totalQuantity: number) => void;
  // callback permettant de mettre à jour la liste de contenants
  // du bordereau en fonction des annexes 2 sélectionnées
  updatePackagings: (
    packagings: {
      type: string;
      other: string;
      quantity: any;
    }[]
  ) => void;
};

export default function Appendix2MultiSelect({
  appendixForms,
  updateTotalQuantity,
  updatePackagings
}: Appendix2MultiSelectProps) {
  const { values, setFieldValue, getFieldMeta } = useFormikContext<Form>();
  const meta = getFieldMeta<InitialFormFraction[]>("grouping");

  const [readableIdFilter, setReadableIdFilter] = useState("");
  const [wasteCodeFilter, setWasteCodeFilter] = useState("");
  const [emitterSiretFilter, setEmitterSiretFilter] = useState("");

  const [isDirty, setIsDirty] = useState(false);

  // Liste les bordereaux déjà annexés au bordereau de groupement
  // au moment de l'ouverture du formulaire (cas d'une modification du
  // bordereau de groupement)
  const initiallyAnnexedForms = useMemo(
    () => meta.initialValue ?? [],
    [meta.initialValue]
  );

  const initiallyAnnexedFormIds = initiallyAnnexedForms.map(
    ({ form }) => form.id
  );

  // Liste les bordereaux en attente de regroupement qui ne sont pas
  // déjà annexés au bordereau de groupement au moment de l'ouverture du
  // formulaire
  const canBeAnnexedForms = (appendixForms ?? [])
    .filter(f => !initiallyAnnexedFormIds.includes(f.id))
    .map(form => ({ form, quantity: 0 }));

  // Liste tous les bordereaux candidats au regroupement, en commençant
  // par les bordereaux déjà annexés au moment de l'ouverture du formulaire
  const forms = useMemo(
    () => [...initiallyAnnexedForms, ...canBeAnnexedForms],
    [initiallyAnnexedForms, canBeAnnexedForms]
  );

  const filteredForms = useMemo(
    () =>
      forms.filter(({ form }) => {
        let r = true;

        if (readableIdFilter.length > 0) {
          r = r && form.readableId.includes(readableIdFilter);
          if (r === false) return r;
        }

        if (wasteCodeFilter.length > 0) {
          r = r && !!form.wasteDetails?.code?.includes(wasteCodeFilter);
          if (r === false) return r;
        }

        if (emitterSiretFilter.length > 0) {
          r = r && !!form.emitter?.company?.orgId?.includes(emitterSiretFilter);
          if (r === false) return r;
        }

        return r;
      }),
    [forms, readableIdFilter, wasteCodeFilter, emitterSiretFilter]
  );

  // Liste les bordereaux annexés au bordereau de groupement présentement
  const currentlyAnnexedForms = useMemo(
    () => values.grouping ?? [],
    [values.grouping]
  );
  const currentlyAnnexedFormIds = currentlyAnnexedForms.map(
    ({ form }) => form.id
  );
  const quantitiesGrouped: { [key: string]: number | string } =
    currentlyAnnexedForms.reduce((acc, { form, quantity }) => {
      return { ...acc, [form.id]: quantity };
    }, {});

  function getQuantityLeft({
    form,
    quantity: initialQuantity
  }: {
    form: Form | InitialForm;
    quantity: number;
  }) {
    const quantityAccepted = new Decimal(
      form.quantityAccepted ?? form.quantityReceived!
    );

    let quantityLeft = new Decimal(quantityAccepted);
    if (form.quantityGrouped) {
      quantityLeft = quantityLeft
        // retranche la quantité déjà groupée
        .minus(form.quantityGrouped)
        // sauf la quantité déjà groupée sur ce bordereau
        // qui doit apparaitre comme disponible
        .plus(initialQuantity);
    }

    return quantityLeft;
  }

  useEffect(() => {
    if (isDirty) {
      // Auto-complète la quantité totale à partir des annexes 2 sélectionnées
      const totalQuantity = currentlyAnnexedForms
        .reduce((q, { quantity }) => {
          if (!quantity || quantity < 0) {
            return q;
          }
          return q.plus(quantity);
        }, new Decimal(0))
        .toNumber();

      // Auto-complète les contenants à partir des annexes 2 sélectionnés
      const totalPackagings = (() => {
        const quantityByType = currentlyAnnexedForms.reduce(
          (acc1, { form, quantity }) => {
            if (!form.wasteDetails?.packagingInfos || !quantity) {
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
          },
          {}
        );
        return Object.keys(quantityByType).map(type => ({
          type,
          other: "",
          quantity: quantityByType[type]
        }));
      })();

      updateTotalQuantity(totalQuantity);
      updatePackagings(totalPackagings);
    }
  }, [currentlyAnnexedForms, isDirty, updateTotalQuantity, updatePackagings]);

  const renderTable: SharedRenderProps<FieldArrayRenderProps>["render"] = ({
    push,
    remove,
    replace
  }) => {
    const rows = filteredForms.map(({ form, quantity }) => {
      const checked = currentlyAnnexedFormIds.includes(form.id);
      const quantityAccepted = new Decimal(
        form.quantityAccepted ?? form.quantityReceived!
      );

      const quantityLeft = getQuantityLeft({ form, quantity });

      const quantityGrouped = checked
        ? // si le bordereau est sélectionné, `quantityGrouped`
          // est contrôlé par le state Formik
          quantitiesGrouped[form.id]
        : // sinon l'input est disabled et sa valeur par défaut
          // est égale à la quantité restante à regrouper
          quantityLeft;

      return [
        <Checkbox
          options={[
            {
              label: "",
              nativeInputProps: {
                checked,
                onChange: e => {
                  setIsDirty(true);
                  if (e.target.checked) {
                    push({
                      form,
                      quantity: quantityGrouped
                    });
                  } else {
                    const idx = currentlyAnnexedFormIds.indexOf(form.id);
                    remove(idx);
                  }
                }
              }
            }
          ]}
        />,
        form.readableId,
        form.wasteDetails?.code,
        `${form.emitter?.company?.name} (${form.emitter?.company?.orgId})`,
        form.signedAt && formatDate(form.signedAt),
        form.processingOperationDone,
        quantityAccepted.toNumber(),
        quantityLeft.toNumber(),
        <Input
          label=""
          disabled={!checked}
          state={
            Number(quantityGrouped) < 0 ||
            quantityLeft.lessThan(Number(quantityGrouped))
              ? "error"
              : "default"
          }
          stateRelatedMessage={
            Number(quantityGrouped) < 0
              ? "La quantité doit être un nombre supérieur à 0"
              : "Vous ne pouvez pas regrouper une" +
                " quantité supérieure à la quantité restante"
          }
          nativeInputProps={{
            type: "number",
            min: 0,
            max: quantityLeft.toNumber(),
            inputMode: "decimal",
            step: 0.000001, // increment kg
            value: String(quantityGrouped),
            onChange: e => {
              setIsDirty(true);
              const idx = currentlyAnnexedFormIds.indexOf(form.id);
              const value = e.target.value;
              replace(idx, {
                form,
                quantity: value === "" ? "" : Number(value)
              });
            }
          }}
        />
      ];
    });

    // Callback executé lorsque l'on clique sur la checkbox de l'en-tête
    // permettant de sélectionner / dé-sélectionner en masse
    function onSelectAll(e: React.ChangeEvent<HTMLInputElement>) {
      setIsDirty(true);
      if (e.target.checked) {
        for (const { form, quantity } of forms) {
          if (!currentlyAnnexedFormIds.includes(form.id)) {
            push({
              form,
              quantity: getQuantityLeft({ form, quantity }).toNumber()
            });
          }
        }
      } else {
        setFieldValue("grouping", []);
      }
    }

    // En tête du tableau
    const headers = [
      <Checkbox
        options={[
          {
            label: "",
            nativeInputProps: {
              checked: currentlyAnnexedForms.length === forms.length,
              onChange: onSelectAll
            }
          }
        ]}
      />,
      "Numéro",
      "Code déchet",
      "Émetteur initial",
      "Date de l'acceptation",
      "Opération réalisée",
      "Qté acceptée",
      "Qté restante",
      "Qté à regrouper"
    ];

    return <Table headers={headers} data={rows} />;
  };

  if (forms.length > 0) {
    return (
      <>
        <div className="fr-grid-row fr-grid-row--gutters">
          <div className="fr-col-12 fr-col-sm-6 fr-col-md-4 fr-col-xl">
            <Input
              label="Numéro de bordereau"
              nativeInputProps={{
                value: readableIdFilter,
                onChange: v => setReadableIdFilter(v.target.value)
              }}
            />
          </div>
          <div className="fr-col-12 fr-col-sm-6 fr-col-md-4 fr-col-xl">
            <Input
              label="Code déchet"
              nativeInputProps={{
                value: wasteCodeFilter,
                onChange: v => setWasteCodeFilter(v.target.value)
              }}
            />
          </div>
          <div className="fr-col-12 fr-col-sm-6 fr-col-md-4 fr-col-xl">
            <Input
              label="N°SIRET émetteur"
              nativeInputProps={{
                value: emitterSiretFilter,
                onChange: v => setEmitterSiretFilter(v.target.value)
              }}
            />
          </div>
        </div>
        <FieldArray name="grouping" render={renderTable} />
      </>
    );
  }

  return (
    <Alert
      severity="warning"
      title="Aucun bordereau éligible au regroupement"
      description="Vérifiez que vous avez bien sélectionné le bon émetteur"
      small
    />
  );
}
