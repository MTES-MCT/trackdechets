import React, { useState } from "react";
import { useQuery, useMutation } from "@apollo/react-hooks";
import { InlineError, NotificationError } from "common/components/Error";
import Loader from "common/components/Loaders";
import {
  MembershipRequestStatus,
  Mutation,
  Query,
  UserRole,
} from "generated/graphql/types";
import gql from "graphql-tag";
import { useHistory, useParams } from "react-router-dom";
import { FaHourglassHalf } from "react-icons/fa";
import cogoToast from "cogo-toast";

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
      }
    }
  }
`;

export default function AccountMembershipRequest() {
  const { id } = useParams<{ id: string }>();

  const history = useHistory();

  const [userRole, setUserRole] = useState<UserRole>(UserRole.Member);

  const { loading, error, data } = useQuery<Pick<Query, "membershipRequest">>(
    MEMBERSHIP_REQUEST,
    {
      variables: { id },
    }
  );

  const [
    acceptMembershipRequest,
    { loading: acceptLoading, error: acceptError },
  ] = useMutation<Pick<Mutation, "acceptMembershipRequest">>(
    ACCEPT_MEMBERSHIP_REQUEST,
    {
      onCompleted: () => {
        cogoToast.success("La demande de rattachement a bien été acceptée", {
          hideAfter: 5,
        });
        history.push("/");
      },
    }
  );

  const [
    refuseMembershipRequest,
    { loading: refuseLoading, error: refuseError },
  ] = useMutation<Pick<Mutation, "refuseMembershipRequest">>(
    REFUSE_MEMBERSHIP_REQUEST,
    {
      onCompleted: () => {
        cogoToast.success("La demande de rattachement a bien été refusée", {
          hideAfter: 5,
        });
        history.push("/");
      },
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
          <h4 className="h4 tw-mb-10">
            Un utilisateur aimerait rejoindre l'établissement {name} ({siret})
          </h4>

          <div className="tw-flex tw-flex-row tw-justify-start">
            <label className="tw-mr-5">{email}</label>
            <select
              name="role"
              className="td-select"
              value={userRole}
              onChange={e => setUserRole(e.target.value as UserRole)}
            >
              <option value={UserRole.Member}>Collaborateur</option>
              <option value={UserRole.Admin}>Administrateur</option>
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
              {refuseLoading ? <FaHourglassHalf /> : "Refuser"}
            </button>
            <button
              className="btn btn--primary"
              type="button"
              onClick={() =>
                acceptMembershipRequest({ variables: { id, role: userRole } })
              }
            >
              {acceptLoading ? <FaHourglassHalf /> : "Accepter"}
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
