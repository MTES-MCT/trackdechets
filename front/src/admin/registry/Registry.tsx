import React, { useEffect } from "react";
import { useLazyQuery } from "@apollo/client";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler } from "react-hook-form";
import { Query, WasteRegistryType } from "@td/codegen-ui";
import { DsfrNotificationError } from "../../Apps/common/Components/Error/Error";
import {
  WASTES_REGISTRY_CSV,
  WASTES_REGISTRY_XLS
} from "../../dashboard/exports/ExportsForm";
import { format } from "date-fns";

const DATE_FMT = "yyyy-MM-dd";
const validationSchema = z
  .object({
    siret: z
      .string({
        required_error: "Le siret est requis"
      })
      .transform(value => value.replace(/\s+/g, ""))
      .pipe(
        z
          .string()
          .min(14, { message: "Le siret doit faire 14 caractères" })
          .max(14, { message: "Le siret doit faire 14 caractères" })
      ),
    exportType: z.string(),
    startDate: z.coerce
      .date({
        required_error: "La date de debut est requise",
        invalid_type_error: "La date est invalide"
      })
      .refine(val => !val || val < new Date(), {
        message: "La date ne peut pas être dans le futur."
      })
      .transform(v => v.toISOString()),
    endDate: z.coerce
      .date({
        required_error: "La date de fin est requise",
        invalid_type_error: "La date est invalide"
      })
      .refine(val => !val || val < new Date(), {
        message: "La date  ne peut pas être dans le futur."
      })
      .transform(v => v.toISOString()),
    exportFormat: z.string()
  })
  .refine(data => data.endDate >= data.startDate, {
    message: "la date de fin doit être postérieure  à la date de début",
    path: ["endDate"]
  });

export function Registry() {
  const now = new Date();

  const [
    wastesRegistryCsv,
    { data: wastesCsvData, error: wastesCsvError, loading: csvLoading }
  ] = useLazyQuery<Pick<Query, "wastesRegistryCsv">>(WASTES_REGISTRY_CSV, {
    fetchPolicy: "network-only"
  });

  const [
    wastesRegistryXls,
    { data: wastesXlsData, error: wastesXlsError, loading: xlsLoading }
  ] = useLazyQuery<Pick<Query, "wastesRegistryXls">>(WASTES_REGISTRY_XLS, {
    fetchPolicy: "network-only"
  });

  const gqlError = wastesCsvError || wastesXlsError;
  const loading = csvLoading || xlsLoading;

  const { handleSubmit, reset, formState, register } = useForm<
    z.infer<typeof validationSchema>
  >({ resolver: zodResolver(validationSchema) });

  // effect to redirect to concrete download route if downloadLink is returned
  useEffect(() => {
    const data = wastesCsvData || wastesXlsData;

    if (!data) {
      return;
    }

    const key = Object.keys(data)[0];
    if (data[key].downloadLink) {
      window.open(data[key].downloadLink, "_blank");
      reset();
    }
  }, [wastesCsvData, wastesXlsData, reset]);

  const onSubmit: SubmitHandler<
    z.infer<typeof validationSchema>
  > = async data => {
    const { exportFormat, startDate, endDate, exportType, siret } = data;
    const downloadFile =
      exportFormat === "CSV" ? wastesRegistryCsv : wastesRegistryXls;

    const dateFilter =
      exportType === WasteRegistryType.Incoming
        ? { destinationReceptionDate: { _gte: startDate, _lte: endDate } }
        : { transporterTakenOverAt: { _gte: startDate, _lte: endDate } };

    downloadFile({
      variables: {
        sirets: [siret],
        registryType: exportType,
        where: {
          ...dateFilter
        }
      }
    });
  };

  return (
    <div>
      <h3 className="fr-h3">Registre</h3>

      <Alert
        className="fr-mb-5v"
        description="Votre compte doit être associé à un compte gouvernemental pour disposer des permissions nécessaires"
        severity="info"
        small
      />

      {gqlError && <DsfrNotificationError apolloError={gqlError} />}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Siret"
          className="fr-col-3  fr-mb-5v"
          hintText="Format: 14 chiffres 123 456 789 00099"
          state={formState.errors.siret ? "error" : "default"}
          nativeInputProps={{
            ...register("siret", { required: true })
          }}
          stateRelatedMessage={
            (formState?.errors?.siret?.message as string) ?? ""
          }
        />

        <Select
          label="Type de registre"
          className="fr-col-3 fr-mb-5v"
          nativeSelectProps={{
            ...register("exportType", { required: true })
          }}
        >
          <option value={WasteRegistryType.Outgoing}>Déchets sortants</option>
          <option value={WasteRegistryType.Incoming}>Déchets entrants</option>
          <option value={WasteRegistryType.Transported}>Transporteur</option>
          <option value={WasteRegistryType.Managed}>Gestion</option>
          <option value={WasteRegistryType.All}>Exhaustif</option>
        </Select>

        <Input
          label="Début de la période"
          className="fr-col-3 fr-mb-5v"
          state={formState.errors.startDate ? "error" : "default"}
          nativeInputProps={{
            ...register("startDate", { required: true }),
            type: "date",
            defaultValue: format(new Date(now.getFullYear(), 0, 1), DATE_FMT)
          }}
          stateRelatedMessage={
            (formState?.errors?.startDate?.message as string) ?? ""
          }
        />

        <Input
          label="Fin de la période"
          className="fr-col-3 fr-mb-5v"
          state={formState.errors.endDate ? "error" : "default"}
          nativeInputProps={{
            ...register("endDate", { required: true }),
            type: "date",
            defaultValue: format(now, DATE_FMT)
          }}
          stateRelatedMessage={
            (formState?.errors?.endDate?.message as string) ?? ""
          }
        />

        <Select
          className="fr-col-3 fr-mb-5v"
          label="Format d'export"
          nativeSelectProps={{
            ...register("exportFormat", { required: true })
          }}
        >
          <option value="XLSX">.xlsx (Excel)</option>
          <option value="CSV">.csv</option>
        </Select>

        <Button>
          {loading ? <span>Export en cours...</span> : "Exporter"}
        </Button>
      </form>
    </div>
  );
}
