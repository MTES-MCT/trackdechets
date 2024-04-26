import {
  CompanyPrivate,
  Mutation,
  MutationUpdateCompanyArgs,
  UserRole
} from "@td/codegen-ui";
import React from "react";
import { useForm } from "react-hook-form";
import CompanyFormWrapper from "../common/Components/CompanyFormWrapper";
import { isSiret, isVat } from "@td/constants";
import { Input } from "@codegouvfr/react-dsfr/Input";
import {
  UPDATE_COMPANY_NAME_ADRESS,
  UPDATE_GIVEN_NAME_OR_GEREP_ID
} from "../common/queries";
import { useMutation } from "@apollo/client";
import { NotificationError } from "../../common/Components/Error/Error";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Loader } from "../../common/Components";

interface CompanyIdentificationFormProps {
  company: CompanyPrivate;
}
interface CompanyIdentificationFormFields {
  siret: string;
  vatNumber: string;
  libelleNaf: string;
  address: string;
  urlFiche: string;
  gerepId: string;
  givenName: string;
}
const CompanyIdentificationForm = ({
  company
}: CompanyIdentificationFormProps) => {
  const defaultValues: CompanyIdentificationFormFields = {
    siret: company?.siret || "",
    vatNumber: company?.vatNumber || "",
    libelleNaf: company?.libelleNaf || "",
    address: company?.address || "",
    urlFiche: company?.installation?.urlFiche || "",
    gerepId: company?.gerepId || "",
    givenName: company?.givenName || ""
  };
  const isAdmin = company.userRole === UserRole.Admin;
  const isASiret = isSiret(
    company.siret,
    import.meta.env.VITE_ALLOW_TEST_COMPANY === "true"
  );

  const [updateIdentificationInfo, { data, error, loading }] = useMutation(
    UPDATE_GIVEN_NAME_OR_GEREP_ID
  );
  const { handleSubmit, reset, formState, register } = useForm({
    defaultValues,
    values: { ...data?.updateCompany } // will get updated once values returns
  });

  const updateCompanyIdentificationInfo = async (data, onClose) => {
    await updateIdentificationInfo({ variables: { id: company.id, ...data } });
    if (!error) {
      onClose();
    }
  };
  const getSiretOrVatNumber = () => {
    if (isASiret) {
      return company.siret;
    }
    if (isVat(company.vatNumber)) {
      return company.vatNumber;
    }
    return "-";
  };

  const [updateAuto, { loading: loadingUpdateAuto, error: errorUpdateAuto }] =
    useMutation<Pick<Mutation, "updateCompany">, MutationUpdateCompanyArgs>(
      UPDATE_COMPANY_NAME_ADRESS,
      { variables: { id: company.id } }
    );

  const ctaSynchroLabel = isASiret
    ? "Synchroniser avec l'INSEE"
    : "Synchroniser avec le registre européen";
  const naf = `${company.naf} - ${company.libelleNaf}`;
  return (
    <CompanyFormWrapper
      title="Identification"
      reset={reset}
      disabled={!formState.isDirty || formState.isSubmitting}
      defaultValues={defaultValues}
      isAdmin={isAdmin}
    >
      {(formRef, isEditing, onClose) => (
        <form
          ref={formRef}
          onSubmit={handleSubmit(
            async data => await updateCompanyIdentificationInfo(data, onClose)
          )}
        >
          {isEditing && (
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                size="small"
                onClick={async () => {
                  await updateAuto();
                  if (!errorUpdateAuto && !loadingUpdateAuto) {
                    onClose();
                  }
                }}
                nativeButtonProps={{
                  type: "button",
                  disabled: loadingUpdateAuto
                }}
              >
                {loadingUpdateAuto ? "Requête en cours..." : ctaSynchroLabel}
              </Button>
              {errorUpdateAuto && (
                <NotificationError apolloError={errorUpdateAuto} />
              )}
            </div>
          )}
          <p className="companyFormWrapper__title-field">
            Numéro de SIRET ou n° de TVA intra-communautaire
          </p>
          <p className="companyFormWrapper__value-field">
            {getSiretOrVatNumber()}
          </p>

          <p className="companyFormWrapper__title-field">Code NAF</p>
          <p className="companyFormWrapper__value-field">{naf || "-"}</p>

          <p className="companyFormWrapper__title-field">Adresse</p>
          <p className="companyFormWrapper__value-field">
            {company.address || "-"}
          </p>

          {company?.installation?.urlFiche && (
            <>
              <p className="companyFormWrapper__title-field">Fiche ICPE</p>
              <p className="companyFormWrapper__value-field">
                <a
                  href={company.installation.urlFiche}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Lien
                </a>
              </p>
            </>
          )}

          {isEditing ? (
            <Input
              label="Nom usuel"
              nativeInputProps={{
                ...register("givenName")
              }}
            />
          ) : (
            <>
              <p className="companyFormWrapper__title-field">Nom usuel</p>
              <p className="companyFormWrapper__value-field">
                {company.givenName || "-"}
              </p>
            </>
          )}

          {isEditing ? (
            <Input
              label="Identifiant GEREP"
              hintText="Format 1111.11111"
              nativeInputProps={{
                ...register("gerepId")
              }}
            />
          ) : (
            <>
              <p className="companyFormWrapper__title-field">
                Identifiant GEREP
              </p>
              <p className="companyFormWrapper__value-field">
                {company.gerepId || "-"}
              </p>
            </>
          )}

          {(loadingUpdateAuto || loading) && <Loader />}
          {error && <NotificationError apolloError={error} />}
        </form>
      )}
    </CompanyFormWrapper>
  );
};
export default CompanyIdentificationForm;
