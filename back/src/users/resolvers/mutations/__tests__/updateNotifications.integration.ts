import gql from "graphql-tag";

const UPDATE_NOTIFICATIONS = gql`
  mutation UpdateNotifications {
    updateNotifications {
      notifications
    }
  }
`;

describe("Mutation { updateNotifications }", () => {
  it("should update user e-mail notifications for a specific company", async () => {});
});
