import React from "react";
import { Query, UserRole } from "@td/codegen-ui";
import { useForm } from "react-hook-form";
import { object, string, ObjectSchema } from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useMutation } from "@apollo/client";
import { INVITE_USER_TO_COMPANY } from "../common/queries";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { NotificationError } from "../../common/Components/Error/Error";
import { InlineLoader } from "../../common/Components/Loader/Loaders";
import { userRoleSwitchOptions } from "./CompanyMembersList";
import toast from "react-hot-toast";
import { TOAST_DURATION } from "../../../common/config";
import { CompanyPrivateMembers } from "./CompanyMembers";

interface CompanyMembersInviteProps {
  company: CompanyPrivateMembers;
}
interface CompanyMembersInviteFields {
  email: string;
  role: UserRole;
}

// replace with zod schema
const yupSchema = object()
  .shape({
    email: string().email().required(),
    role: string().required()
  })
  .required();

const CompanyMembersInvite = ({ company }: CompanyMembersInviteProps) => {
  const [inviteUserToCompany, { data, error, loading }] = useMutation(
    INVITE_USER_TO_COMPANY
  );

  const defaultValues: CompanyMembersInviteFields = {
    email: "",
    role: UserRole.Member
  };

  const { handleSubmit, formState, register, reset } = useForm({
    defaultValues,
    values: { ...data?.inviteUserToCompany }, // will get updated once values returns
    resolver: yupResolver<ObjectSchema<any>>(yupSchema)
  });

  const updateCompanyMembers = data => {
    inviteUserToCompany({
      variables: { siret: company.orgId, ...data },
      onCompleted: () => {
        toast.success("Invitation envoyée", { duration: TOAST_DURATION });
        reset();
      },
      updateQueries: {
        CompanyPrivateInfos: (
          prev: Pick<Query, "companyPrivateInfos">,
          { mutationResult }
        ) => {
          return {
            companyPrivateInfos: {
              ...prev,
              users: mutationResult.data?.inviteUserToCompany.users ?? []
            }
          };
        }
      }
    });
  };

  return (
    <>
      <div className="company-members__invite">
        <h4 className="fr-h4">Inviter une personne</h4>
        <form onSubmit={handleSubmit(updateCompanyMembers)}>
          <Input
            label="Email"
            nativeInputProps={{
              type: "email",
              ...register("email", { required: true }),
              ...{ "data-testid": "company-members-email" }
            }}
            state={formState.errors.email ? "error" : "default"}
            stateRelatedMessage="Email invalide"
          />

          <Select
            label="Rôle attribué"
            nativeSelectProps={{
              ...register("role"),
              ...{ "data-testid": "company-members-role" }
            }}
          >
            {userRoleSwitchOptions()}
          </Select>

          <Button
            priority="primary"
            size="small"
            nativeButtonProps={{
              type: "button",
              "data-testid": "company-members-submit"
            }}
            type="submit"
            disabled={loading || !formState.isDirty}
          >
            Inviter
          </Button>
          {loading && <InlineLoader />}
          {error && <NotificationError apolloError={error} />}
        </form>
      </div>
      <br />
      <hr />
    </>
  );
};

export default CompanyMembersInvite;
