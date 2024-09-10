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
  MassUpdatedCompaniesProfile,
  CollectorType,
  CompanyType,
  WasteProcessorType,
  WasteVehiclesType
} from "@td/codegen-ui";

const validationSchema = z.object({
  adminEmail: z.string({
    required_error: "Le siret est requis"
  }),
  companyUpdateRows: z
    .string()
    .transform((val, ctx) => {
      try {
        const parsed = JSON.parse(val);

        return parsed;
      } catch (error) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "invalid json"
        });
        return z.never;
      }
    })
    .pipe(
      z.array(
        z.object({
          siret: z.string(),
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
              CollectorType.DangerousWastes
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
  mutation massUpdateCompaniesProfiles(
    $adminEmail: String!
    $companyUpdateRows: [companyUpdateRow!]!
  ) {
    massUpdateCompaniesProfiles(
      input: { adminEmail: $adminEmail, companyUpdateRows: $companyUpdateRows }
    ) {
      siret
      companyTypes
      collectorTypes
      wasteProcessorTypes
      wasteVehiclesTypes
    }
  }
`;

export function MassProfileUpdateAdmin() {
  const [massUpdateCompaniesProfiles, { loading, error, data }] = useMutation<
    Pick<Mutation, "massUpdateCompaniesProfiles">,
    { adminEmail: String; companyUpdateRows: CompanyUpdateRow[] }
  >(MASS_UPDATE_COMPANIES_PROFILES);

  const onSubmit: SubmitHandler<
    z.infer<typeof validationSchema>
  > = async data => {
    const { adminEmail, companyUpdateRows } = data;

    massUpdateCompaniesProfiles({
      variables: { adminEmail, companyUpdateRows }
    });
  };

  const { handleSubmit, formState, register } = useForm<
    z.infer<typeof validationSchema>
  >({ resolver: zodResolver(validationSchema) });

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
                stateRelatedMessage={
                  (formState?.errors?.adminEmail?.message as string) ?? ""
                }
              />

              <Input
                label="Fichier xls validé et converti en json"
                className="fr-col-12 fr-mb-5v"
                hintText='[{"siret": "xxx", "companyTypes": […], "collectorTypes": […], "wasteProcessorTypes": […], "wasteVehiclesTypes": […]},…]'
                textArea
                nativeTextAreaProps={{
                  required: true,
                  rows: 10,
                  ...register("companyUpdateRows", { required: true })
                }}
                stateRelatedMessage={
                  (formState?.errors?.companyUpdateRows?.message as string) ??
                  ""
                }
              />
            </div>
            <Button disabled={loading}>Effectuer la mise à jour</Button>
          </form>
        )}
      </div>
      {loading && <div>Mise à jour des établissements en cours...</div>}
      {error && (
        <Alert
          className="fr-mt-3w"
          small
          description={error.message}
          severity="error"
        />
      )}
      {data?.massUpdateCompaniesProfiles && (
        <MassUpdateCompaniesProfilesDigest
          data={data?.massUpdateCompaniesProfiles?.filter(Boolean)}
        />
      )}
    </div>
  );
}

type Props = {
  data?: (MassUpdatedCompaniesProfile | null)[];
};

const MassUpdateCompaniesProfilesDigest = ({ data }: Props) => {
  const tableHeaders = [
    "Siret",
    "companyTypes",
    "collectorTypes",
    "wasteProcessorTypes",
    "wasteVehiclesTypes"
  ];
  const tableData =
    data?.map(row => [
      row?.siret,
      row?.companyTypes.join(","),
      row?.collectorTypes.join(","),
      row?.wasteProcessorTypes.join(","),
      row?.wasteVehiclesTypes.join(",")
    ]) ?? [];

  return (
    <div>
      <h3 className="fr-h3">Établissements mis à jour</h3>
      <Table headers={tableHeaders} data={tableData} fixed />{" "}
    </div>
  );
};
