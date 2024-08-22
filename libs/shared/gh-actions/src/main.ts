import { getInput, debug, setOutput, setFailed } from "@actions/core";
import { getOctokit, context } from "@actions/github";
import { WebhookEvent, PullRequestReviewEvent } from "@octokit/webhooks-types";

const run = async () => {
  try {
    const client = getOctokit(getInput("repo-token", { required: true }));
    const ghEvent = context.payload as WebhookEvent;
    const ghEventName = context.eventName;
    if (ghEventName !== "pull_request_review") {
      throw new Error(`Unsupported event type: ${ghEventName}`);
    }
    const prData = (ghEvent as PullRequestReviewEvent).pull_request;

    if (prData === undefined) {
      throw new Error("Failed to extract pull request data.");
    }
    const { owner: repoOwner, repo: repoName } = context.repo;
    const prNumber = prData.number;
    const queryVars: Record<string, { type: string; value: unknown }> = {
      repoOwner: { type: "String!", value: repoOwner },
      repoName: { type: "String!", value: repoName },
      prNumber: { type: "Int!", value: prNumber }
    };

    const queryArgs: string = Object.entries(queryVars)
      .map(([argName, { type }]) => `$${argName}: ${type}`)
      .join(", ");

    const query = `
      query GetCollaboratorApprovedPrReviewCount(${queryArgs}) {
        repository(owner: $repoOwner, name: $repoName) {
          pullRequest(number: $prNumber) {
            reviews(first: 100) {
              nodes {
                authorAssociation
                state
              }
            }
          }
        }
      }
    `;

    const vars: Record<string, unknown> = Object.fromEntries(
      Object.entries(queryVars).map(([varName, { value }]) => [varName, value])
    );

    debug(`Using query:\n${query}`);
    debug(`Variables: ${JSON.stringify(vars, undefined, 2)}`);

    const data: {
      repository: {
        pullRequest: {
          reviews: {
            nodes: {
              authorAssociation: CommentAuthorAssociation;
              state: ReviewState;
            }[];
          };
        };
      };
    } = await client.graphql(query, vars);

    const reviews = data.repository.pullRequest.reviews.nodes.filter(review =>
      collaboratorAssociation.includes(review.authorAssociation)
    );

    debug(`${reviews.length} total valid reviews`);
    Object.keys(ReviewState)
      .filter(key => isNaN(Number(key)))
      .forEach(stateName => {
        const stateReviewsCount = reviews.filter(
          review => review.state === (stateName as unknown as ReviewState)
        ).length;
        const outputKey = stateName.toLowerCase();
        debug(`  ${outputKey}: ${stateReviewsCount.toLocaleString("en")}`);
        setOutput(outputKey, stateReviewsCount);
      });
  } catch (err) {
    setFailed(err);
  }
};

enum ReviewState {
  APPROVED = "APPROVED",
  CHANGES_REQUESTED = "CHANGED_REQUESTED",
  COMMENTED = "COMMENTED",
  DISMISSED = "DISMISSED",
  PENDING = "PENDING"
}

enum CommentAuthorAssociation {
  COLLABORATOR = "COLLABORATOR",
  CONTRIBUTOR = "CONTRIBUTOR",
  FIRST_TIME_CONTRIBUTOR = "FIRST_TIME_CONTRIBUTOR",
  FIRST_TIMER = "FIRST_TIMER",
  MEMBER = "MEMBER",
  OWNER = "OWNER",
  NONE = "NONE"
}

const collaboratorAssociation: CommentAuthorAssociation[] = [
  CommentAuthorAssociation.COLLABORATOR,
  CommentAuthorAssociation.MEMBER,
  CommentAuthorAssociation.OWNER
];

// Run the action
run();
