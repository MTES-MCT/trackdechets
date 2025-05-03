import React, { useState } from "react";
import { useQuery } from "@apollo/client";
import { Query } from "@td/codegen-ui";
import { type UseFormReturn, Controller } from "react-hook-form";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import styles from "./ReportFor.module.scss";
import { RegistryCompanySwitcher } from "../../../dashboard/registry/RegistryCompanySwitcher";
import { formatError } from "../builder/error";
import { REGISTRY_DELEGATIONS } from "../../../Apps/common/queries/registryDelegation/queries";
import { InlineLoader } from "../../../Apps/common/Components/Loader/Loaders";
import Select from "@codegouvfr/react-dsfr/Select";

type Props = {
  methods: UseFormReturn<any>;
  reportForLabel: string;
  reportAsLabel: string;
  disabled?: boolean;
};

export function ReportFor({
  methods,
  reportForLabel,
  reportAsLabel,
  disabled
}: Props) {
  const [isDelegation, setIsDelegation] = useState(false);
  const { errors } = methods.formState;
  const reportForCompanySiret = methods.watch("reportForCompanySiret");
  const { data: registryDelegationsData, loading: registryDelegationsLoading } =
    useQuery<Pick<Query, "registryDelegations">>(REGISTRY_DELEGATIONS, {
      variables: {
        where: {
          delegatorOrgId: reportForCompanySiret,
          givenToMe: true,
          activeOnly: true
        }
      },
      skip: !isDelegation,
      fetchPolicy: "network-only"
    });

  return (
    <div className="fr-col">
      <div className="fr-grid-row fr-grid-row--gutters">
        <Controller
          name="reportForCompanySiret"
          control={methods.control}
          render={({ field }) => (
            <RegistryCompanySwitcher
              wrapperClassName="fr-col-8"
              label={reportForLabel}
              defaultSiret={field.value}
              disabled={disabled}
              onCompanySelect={(siret, isDelegation) => {
                field.onChange(siret);
                setIsDelegation(isDelegation);
              }}
            />
          )}
        />
        {errors?.reportForCompanySiret && (
          <div className="fr-col-12">
            <Alert
              description={formatError(errors.reportForCompanySiret)}
              severity="error"
              small
            />
          </div>
        )}
        {isDelegation ? (
          registryDelegationsLoading ? (
            <div className="fr-col-8">
              <InlineLoader size={32} />
            </div>
          ) : registryDelegationsData?.registryDelegations.edges.length ? (
            <div className="fr-col-8">
              {registryDelegationsData.registryDelegations.edges.length ===
              1 ? (
                <p className={styles.delegationHint}>
                  {`Cette déclaration sera faite en tant que :\n`}
                  <br />
                  <b>
                    {`${
                      registryDelegationsData.registryDelegations.edges[0].node
                        .delegate.givenName ||
                      registryDelegationsData.registryDelegations.edges[0].node
                        .delegate.name ||
                      ""
                    } ${
                      registryDelegationsData.registryDelegations.edges[0].node
                        .delegate.orgId || ""
                    }`}
                  </b>
                </p>
              ) : (
                <Select
                  label={reportAsLabel}
                  style={{ width: "100%" }}
                  nativeSelectProps={{
                    ...methods.register("reportAsCompanySiret")
                  }}
                >
                  {registryDelegationsData.registryDelegations.edges.map(
                    edge => (
                      <option
                        value={edge.node.delegate.orgId}
                        key={edge.node.delegate.orgId}
                      >
                        {`${
                          edge.node.delegate.givenName ||
                          edge.node.delegate.name ||
                          ""
                        } ${edge.node.delegate.orgId || ""}`}
                      </option>
                    )
                  )}
                </Select>
              )}
            </div>
          ) : null
        ) : null}
      </div>
    </div>
  );
}
