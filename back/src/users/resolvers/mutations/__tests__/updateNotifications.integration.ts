import gql from "graphql-tag";

const SET_COMPANY_NOTIFICATIONS = gql`
  mutation SetCompanyNotifications {
    setCompanyNotifications {
      notifications
    }
  }
`;

describe("Mutation { setCompanyNotifications }", () => {
  it("should set user e-mail notifications for a specific company", async () => {});
});
