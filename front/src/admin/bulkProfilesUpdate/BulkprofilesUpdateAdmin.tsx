import { gql, useMutation } from "@apollo/client";
import { z } from "zod";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { Table } from "@codegouvfr/react-dsfr/Table";
import React from "react";
import {
  Mutation,
  CompanyUpdateRow,
  CompanyPrivate,
  CollectorType,
  CompanyType,
  WasteProcessorType,
  WasteVehiclesType
} from "@td/codegen-ui";

const validationSchema = z.object({
  adminEmail: z.string({
    required_error: "L'eamil de l'administrateur des établissments est requis"
  }),
  companyUpdateRows: z
    .string()
    .transform((val, ctx) => {
      try {
        return JSON.parse(val);
      } catch (error) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Le json est invalide"
        });
        return z.never;
      }
    })
    .pipe(
      z.array(
        z.object({
          orgId: z.string(),
          companyTypes: z.array(
            z.enum([
              CompanyType.Broker,
              CompanyType.Collector,
              CompanyType.DisposalFacility,
              CompanyType.EcoOrganisme,
              CompanyType.Intermediary,
              CompanyType.Producer,
              CompanyType.RecoveryFacility,
              CompanyType.Trader,
              CompanyType.Broker,
              CompanyType.Transporter,
              CompanyType.Wasteprocessor,
              CompanyType.WasteCenter,
              CompanyType.WasteVehicles,
              CompanyType.Worker
            ])
          ),
          collectorTypes: z.array(
            z.enum([
              CollectorType.DangerousWastes,
              CollectorType.DeeeWastes,
              CollectorType.OtherDangerousWastes,
              CollectorType.OtherNonDangerousWastes,
              CollectorType.NonDangerousWastes
            ])
          ),
          wasteProcessorTypes: z.array(
            z.enum([
              WasteProcessorType.Cremation,
              WasteProcessorType.DangerousWastesIncineration,
              WasteProcessorType.DangerousWastesStorage,
              WasteProcessorType.InertWastesStorage,
              WasteProcessorType.NonDangerousWastesIncineration,
              WasteProcessorType.NonDangerousWastesStorage,
              WasteProcessorType.OtherDangerousWastes,
              WasteProcessorType.OtherNonDangerousWastes
            ])
          ),
          wasteVehiclesTypes: z.array(
            z.enum([WasteVehiclesType.Broyeur, WasteVehiclesType.Demolisseur])
          )
        })
      )
    )
});

export const MASS_UPDATE_COMPANIES_PROFILES = gql`
  mutation bulkUpdateCompaniesProfiles(
    $adminEmail: String!
    $companyUpdateRows: [companyUpdateRow!]!
  ) {
    bulkUpdateCompaniesProfiles(
      input: { adminEmail: $adminEmail, companyUpdateRows: $companyUpdateRows }
    ) {
      orgId
      companyTypes
      collectorTypes
      wasteProcessorTypes
      wasteVehiclesTypes
    }
  }
`;

export function BulkProfileUpdateAdmin() {
  const [bulkUpdateCompaniesProfiles, { loading, error, data }] = useMutation<
    Pick<Mutation, "bulkUpdateCompaniesProfiles">,
    { adminEmail: String; companyUpdateRows: CompanyUpdateRow[] }
  >(MASS_UPDATE_COMPANIES_PROFILES);

  const onSubmit: SubmitHandler<
    z.infer<typeof validationSchema>
  > = async data => {
    const { adminEmail, companyUpdateRows } = data;

    bulkUpdateCompaniesProfiles({
      variables: { adminEmail, companyUpdateRows }
    });
  };

  const {
    handleSubmit,
    formState: { errors },
    register
  } = useForm<z.infer<typeof validationSchema>>({
    resolver: zodResolver(validationSchema)
  });

  return (
    <div>
      <div>
        <h3 className="fr-h3 fr-mt-4w">
          Modification en masse de profils et sous-profils des établissements
        </h3>
        {!data && (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="fr-grid-row fr-grid-row--bottom">
              <Input
                label="Email de l'administrateur des établissement (demandeur)"
                hintText="Pour valider les permissisons du demandeur"
                className="fr-col-8  fr-mb-5v"
                nativeInputProps={{
                  required: true,

                  type: "email",
                  ...register("adminEmail", { required: true })
                }}
                state={errors?.adminEmail && "error"}
                stateRelatedMessage={
                  (errors?.adminEmail?.message as string) ?? ""
                }
              />

              <Input
                label="Fichier xls validé et converti en json"
                className="fr-col-12 fr-mb-5v"
                hintText='[{"orgId": "xxx", "companyTypes": […], "collectorTypes": […], "wasteProcessorTypes": […], "wasteVehiclesTypes": […]},…]'
                textArea
                nativeTextAreaProps={{
                  required: true,
                  rows: 10,
                  ...register("companyUpdateRows", { required: true })
                }}
                state={errors?.companyUpdateRows && "error"}
                stateRelatedMessage="Veuillez vous référer au tableau d'erreurs"
              />
            </div>
            <Button disabled={loading}>Effectuer la mise à jour</Button>
          </form>
        )}
      </div>
      {loading && <div>Mise à jour des établissements en cours...</div>}
      {errors?.companyUpdateRows && <ErrorsTable errors={errors} />}
      {error && (
        <Alert
          className="fr-mt-3w"
          small
          description={error.message}
          severity="error"
        />
      )}
      {data?.bulkUpdateCompaniesProfiles && (
        <BulkUpdateCompaniesProfilesDigest
          data={data?.bulkUpdateCompaniesProfiles?.filter(Boolean)}
        />
      )}
    </div>
  );
}

type Props = {
  data?: (CompanyPrivate | null)[];
};

const formatErrorMessage = (row, field) => {
  const errorField = row?.[field];
  if (!errorField) {
    return null;
  }

  if (Array.isArray(errorField)) {
    return errorField.map(err => err?.message).join(",");
  }
  return errorField?.message;
};
const formatRowErrors = errors => {
  const ret: any[] = [];

  errors?.companyUpdateRows?.forEach((row, index) => {
    try {
      ret.push([
        index + 1,
        formatErrorMessage(row, "companyTypes"),
        formatErrorMessage(row, "collectorTypes"),
        formatErrorMessage(row, "wasteProcessorTypes"),
        formatErrorMessage(row, "wasteVehiclesTypes")
      ]);
    } catch {
      //continue
    }
  });

  return ret;
};

const ErrorsTable = ({ errors }) => {
  const tableHeaders = [
    "index",
    "companyTypes",
    "collectorTypes",
    "wasteProcessorTypes",
    "wasteVehiclesTypes"
  ];
  if (!errors?.companyUpdateRows || !Object.keys(errors?.companyUpdateRows)) {
    return null;
  }

  if (Array.isArray(errors?.companyUpdateRows)) {
    const f = formatRowErrors(errors) || [];

    return (
      <>
        <h3 className="fr-h3 fr-mt-3w">Erreurs</h3>
        <Table
          colorVariant="pink-tuile"
          headers={tableHeaders}
          data={f}
          fixed
        />
      </>
    );
  }
  return <h3 className="fr-h3 fr-mt-3w">Erreur - Json invalide</h3>;
};

const BulkUpdateCompaniesProfilesDigest = ({ data }: Props) => {
  const tableHeaders = [
    "Orgid",
    "companyTypes",
    "collectorTypes",
    "wasteProcessorTypes",
    "wasteVehiclesTypes"
  ];
  const tableData =
    data?.map(row => [
      row?.orgId,
      row?.companyTypes.join(","),
      row?.collectorTypes.join(","),
      row?.wasteProcessorTypes.join(","),
      row?.wasteVehiclesTypes.join(",")
    ]) ?? [];

  return (
    <div>
      <h3 className="fr-h3">Établissements mis à jour</h3>
      <Table headers={tableHeaders} data={tableData} fixed />
    </div>
  );
};
