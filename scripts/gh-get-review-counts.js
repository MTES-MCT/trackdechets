module.exports = async ({ github, context, core }) => {
  const { debug, setOutput, setFailed } = core;
  try {
    const ghEvent = context.payload;
    const ghEventName = context.eventName;
    if (ghEventName !== "pull_request_review") {
      throw new Error(`Unsupported event type: ${ghEventName}`);
    }
    const prData = ghEvent.pull_request;

    if (prData === undefined) {
      throw new Error("Failed to extract pull request data.");
    }
    const { owner, repo } = context.repo;
    const pull_number = prData.number;

    const data = await github.pulls.listReviews({
      owner,
      repo,
      pull_number,
      per_page: 100
    });

    const reviews = data.filter(review =>
      ["COLLABORATOR", "MEMBER", "OWNER"].includes(review.author_association)
    );

    debug(`${reviews.length} total valid reviews`);
    [
      "APPROVED",
      "CHANGES_REQUESTED",
      "COMMENTED",
      "DISMISSED",
      "PENDING"
    ].forEach(stateName => {
      const stateReviewsCount = reviews.filter(
        review => review.state === stateName
      ).length;
      const outputKey = stateName.toLowerCase();
      debug(`${outputKey}: ${stateReviewsCount}`);
      setOutput(outputKey, stateReviewsCount);
    });
  } catch (err) {
    setFailed(err);
  }
};
