import React, { useState } from "react";
import { gql, useMutation } from "@apollo/client";
import { User } from "@td/codegen-ui";
import { useForm, SubmitHandler } from "react-hook-form";
import Input from "@codegouvfr/react-dsfr/Input";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { validationAccountParametersSchema } from "../accountSchema";
import AccountInfoActionBar from "./AccountInfoActionBar";
import { DsfrNotificationError } from "../../common/Components/Error/Error";
import AccountFormChangePassword from "./AccountFormChangePassword";

type Props = {
  readonly me: User;
};

interface AccountInfoFormFields {
  name: string | undefined;
  phone: string | undefined;
  email: string | undefined;
}

const AccountFieldPhoneFragments = {
  me: gql`
    fragment AccountFieldPhoneFragment on User {
      id
      phone
    }
  `
};

const AccountFieldNameFragments = {
  me: gql`
    fragment AccountFieldNameFragment on User {
      id
      name
    }
  `
};

AccountInfo.fragments = {
  me: gql`
    fragment AccountInfoFragment on User {
      email
      ...AccountFieldPhoneFragment
      ...AccountFieldNameFragment
    }
    ${AccountFieldPhoneFragments.me},
    ${AccountFieldNameFragments.me}
  `
};

export default function AccountInfo({ me }: Props) {
  type ValidationSchema = z.infer<typeof validationAccountParametersSchema>;

  const defaultValues: AccountInfoFormFields = {
    name: me.name as string,
    email: me.email,
    phone: me.phone as string
  };
  const UPDATE_PROFILE = gql`
    mutation UpdateProfile($name: String!, $phone: String!) {
      editProfile(name: $name, phone: $phone) {
        id
        name
        phone
      }
    }
  `;
  const [updateProfile, { loading, error }] = useMutation(UPDATE_PROFILE);

  const { handleSubmit, reset, formState, register } =
    useForm<ValidationSchema>({
      defaultValues,
      resolver: zodResolver(validationAccountParametersSchema)
    });

  const onSubmit: SubmitHandler<ValidationSchema> = async data => {
    await updateProfile({ variables: { name: data.name, phone: data.phone } });
    setIsEditing(false);
  };
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const onReset = () => {
    setIsEditing(false);
    reset();
  };

  const onEditProfile = () => {
    setIsEditing(true);
  };

  return (
    <>
      <hr />
      {!isEditing && (
        <>
          <AccountInfoActionBar
            title="Coordonnées"
            onEditInfo={onEditProfile}
            onReset={onReset}
            isEditing={isEditing}
          />
          <div className="fr-grid-row fr-grid-row--gutters">
            <div className="fr-col-8">
              <p className="fr-text--bold">Prénom et nom</p>
              <p className="fr-text fr-mb-2w" data-testid="username">
                {me.name}
              </p>
            </div>
            <div className="fr-col-8">
              <p className="fr-text--bold">Email</p>
              <p className="fr-text fr-mb-2w" data-testid="email">
                {me.email}
              </p>
            </div>
            <div className="fr-col-6">
              <p className="fr-text--bold">Téléphone</p>
              <p className="fr-text fr-mb-2w" data-testid="phone">
                {me.phone}
              </p>
            </div>
          </div>
        </>
      )}
      {isEditing && (
        <form onSubmit={handleSubmit(onSubmit)}>
          <AccountInfoActionBar
            title="Coordonnées"
            onEditInfo={onEditProfile}
            onReset={onReset}
            isEditing={isEditing}
            isDisabled={formState.isSubmitting}
          />
          <div className="fr-col-md-8 fr-mb-2w">
            <Input
              label="Prénom et nom"
              state={formState.errors?.name && "error"}
              stateRelatedMessage={formState.errors?.name?.message}
              nativeInputProps={{
                ...register("name")
              }}
            />
          </div>
          <div className="fr-col-md-8 fr-mb-2w">
            <Input
              label="Email"
              disabled
              nativeInputProps={{
                ...register("email")
              }}
            />
          </div>
          <div className="fr-col-md-6 fr-mb-2w">
            <Input
              label="Téléphone"
              state={formState.errors?.phone && "error"}
              stateRelatedMessage={formState.errors?.phone?.message}
              nativeInputProps={{
                ...register("phone"),
                ...{ "data-testid": "phone-input" }
              }}
            />
          </div>
          <AccountInfoActionBar
            onEditInfo={onEditProfile}
            onReset={onReset}
            isEditing={isEditing}
            isDisabled={formState.isSubmitting}
          />

          {loading && <div>Envoi en cours...</div>}
          {error && <DsfrNotificationError apolloError={error} />}
        </form>
      )}

      <hr className="fr-mt-2w" />
      <AccountFormChangePassword />
    </>
  );
}
