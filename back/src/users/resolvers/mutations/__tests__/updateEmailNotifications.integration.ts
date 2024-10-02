import gql from "graphql-tag";

const UPDATE_EMAIL_NOTIFICATIONS = gql`
  mutation UpdateEmailNotifications {
    updateEmailNotifications {
      emailNotifications
    }
  }
`;

describe("Mutation { updateEmailNotifications }", () => {
  it("should update user e-mail notifications for a specific company", async () => {});
});
