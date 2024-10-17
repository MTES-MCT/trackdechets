import React, { useState } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
import {
  InlineError,
  NotificationError
} from "../common/Components/Error/Error";
import Loader from "../common/Components/Loader/Loaders";
import {
  MembershipRequestStatus,
  Mutation,
  Query,
  UserRole
} from "@td/codegen-ui";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { TOAST_DURATION } from "../../common/config";

const MEMBERSHIP_REQUEST = gql`
  query MembershipRequest($id: ID!) {
    membershipRequest(id: $id) {
      email
      siret
      name
      status
    }
  }
`;

const ACCEPT_MEMBERSHIP_REQUEST = gql`
  mutation AcceptMembershipRequest($id: ID!, $role: UserRole!) {
    acceptMembershipRequest(id: $id, role: $role) {
      id
      users {
        id
        role
      }
    }
  }
`;

const REFUSE_MEMBERSHIP_REQUEST = gql`
  mutation RefuseMembershipRequest($id: ID!) {
    refuseMembershipRequest(id: $id) {
      id
      users {
        id
        role
      }
    }
  }
`;

export default function AccountMembershipRequest() {
  const { id } = useParams<{ id: string }>();

  const navigate = useNavigate();

  const [userRole, setUserRole] = useState<UserRole>(UserRole.Member);

  const { loading, error, data } = useQuery<Pick<Query, "membershipRequest">>(
    MEMBERSHIP_REQUEST,
    {
      variables: { id }
    }
  );

  const [
    acceptMembershipRequest,
    { loading: acceptLoading, error: acceptError }
  ] = useMutation<Pick<Mutation, "acceptMembershipRequest">>(
    ACCEPT_MEMBERSHIP_REQUEST,
    {
      onCompleted: () => {
        toast.success("La demande de rattachement a bien été acceptée", {
          duration: TOAST_DURATION
        });
        navigate("/");
      }
    }
  );

  const [
    refuseMembershipRequest,
    { loading: refuseLoading, error: refuseError }
  ] = useMutation<Pick<Mutation, "refuseMembershipRequest">>(
    REFUSE_MEMBERSHIP_REQUEST,
    {
      onCompleted: () => {
        toast.success("La demande de rattachement a bien été refusée", {
          duration: TOAST_DURATION
        });
        navigate("/");
      }
    }
  );

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return <InlineError apolloError={error} />;
  }

  if (
    data &&
    data.membershipRequest?.status !== MembershipRequestStatus.Pending
  ) {
    return (
      <div>Cette demande de rattachement a déjà été acceptée ou refusée</div>
    );
  }

  if (data && data.membershipRequest) {
    const { email, siret, name } = data.membershipRequest;

    return (
      <div className="container-narrow">
        <section className="section section-white">
          <h3 className="h4 tw-mb-10">
            Un utilisateur aimerait rejoindre l'établissement {name} ({siret})
          </h3>

          <div className="tw-flex tw-flex-row tw-justify-start">
            <label className="tw-mr-5">{email}</label>
            <select
              name="role"
              className="td-select"
              value={userRole}
              onChange={e => setUserRole(e.target.value as UserRole)}
            >
              <option value={UserRole.Admin}>Administrateur</option>
              <option value={UserRole.Member}>Collaborateur</option>
              <option value={UserRole.Reader}>Lecteur</option>
              <option value={UserRole.Driver}>Chauffeur</option>
            </select>
          </div>

          <div className="td-flex tw-space-x-3 tw-mt-10">
            <a className="btn btn--outline-primary" href="/">
              Annuler
            </a>
            <button
              className="btn btn--primary"
              type="button"
              onClick={() => refuseMembershipRequest({ variables: { id } })}
            >
              {refuseLoading ? "Chargement..." : "Refuser"}
            </button>
            <button
              className="btn btn--primary"
              type="button"
              onClick={() =>
                acceptMembershipRequest({ variables: { id, role: userRole } })
              }
            >
              {acceptLoading ? "Chargement..." : "Accepter"}
            </button>
          </div>
          {acceptError && <NotificationError apolloError={acceptError} />}
          {refuseError && <NotificationError apolloError={refuseError} />}
        </section>
      </div>
    );
  }

  return null;
}
