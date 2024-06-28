import { useLazyQuery } from "@apollo/client";
import gql from "graphql-tag";
import React from "react";
import { Query } from "@td/codegen-ui";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler } from "react-hook-form";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { Loader } from "../../Apps/common/Components";
import { DsfrNotificationError } from "../../Apps/common/Components/Error/Error";
import CompaniesTable from "./CompanyTable";

export const companyExhaustiveInfoFragment = gql`
  fragment CompanyExhaustiveInfoFragment on CompanyExhaustiveInfo {
    siret
    name
    contact
    address
    createdAt
    etatAdministratif
    statutDiffusion
    codeNaf
  }
`;

const COMPANIES_EXHAUSTIVE = gql`
  ${companyExhaustiveInfoFragment}

  query companyExhaustive($siret: String!) {
    companyExhaustive(siret: $siret) {
      anonymousCompany {
        ...CompanyExhaustiveInfoFragment
      }
      dbCompany {
        ...CompanyExhaustiveInfoFragment
      }
      esCompany {
        ...CompanyExhaustiveInfoFragment
      }
      sireneCompany {
        ...CompanyExhaustiveInfoFragment
      }
    }
  }
`;

const validationSchema = z.object({
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
    )
});

export const CompaniesDashboard = () => {
  const [companiesExhaustive, { data, error, loading }] = useLazyQuery<
    Pick<Query, "companyExhaustive">
  >(COMPANIES_EXHAUSTIVE, {
    fetchPolicy: "network-only"
  });

  const onSubmit: SubmitHandler<
    z.infer<typeof validationSchema>
  > = async data => {
    const { siret } = data;

    companiesExhaustive({ variables: { siret: "AAA" } });
  };

  const { handleSubmit, reset, formState, register } = useForm<
    z.infer<typeof validationSchema>
  >({ resolver: zodResolver(validationSchema) });

  return (
    <div>
      <h3 className="fr-h3 fr-mt-2w">Entreprises</h3>

      <div className="fr-mb-4v">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="Siret"
            className="fr-col-3 fr-mb-5v"
            hintText="Format: 14 chiffres 123 456 789 00099"
            state={formState.errors.siret ? "error" : "default"}
            nativeInputProps={{
              ...register("siret", { required: true })
            }}
            stateRelatedMessage={
              (formState?.errors?.siret?.message as string) ?? ""
            }
          />

          <Button disabled={loading}>Rechercher</Button>
        </form>
      </div>

      {loading && <Loader />}

      {error && <DsfrNotificationError apolloError={error} />}

      {!loading && Boolean(data?.companyExhaustive) && !Boolean(error) && (
        <>
          <CompaniesTable data={data?.companyExhaustive} />
        </>
      )}
    </div>
  );
};
