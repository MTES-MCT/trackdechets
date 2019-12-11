import React from "react";

export type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type Props = {
  user: User;
};

export default function AccountCompanyMember({ user }: Props) {
  return (
    <>
      <tr key={user.id}>
        <td>{user.name}</td>
        <td>{user.email}</td>
        <td>{user.role}</td>
      </tr>
    </>
  );
}
