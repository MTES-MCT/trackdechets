module.exports = async ({ github, context, core }) => {
  const output = await getBody(github, context);

  core.setOutput("prs", output);
};

async function getBody(github, context) {
  const prs = await getPrsReadyToReview(github, context);

  if (prs.length === 0) {
    return "Rien dans le poulailler ce matin 🐔 On retourne pondre du code ! 🧑‍💻";
  }

  const header = `|Titre|N°|Auteur|Approvers en attente|🐔|
|---|---|---|---|---|`;

  const lines = [];
  for (const pr of prs) {
    const nbApprovals = await getNbPrApprovals(github, context, pr);
    const awaitingApprovers = await getRequestedReviewers(github, context, pr);

    const line = [
      "", // The line must start with | to be a valid markdown table
      pr.title,
      `[#${pr.number}](${pr.html_url})`,
      `@${pr.user.login}`,
      awaitingApprovers.map(login => `@${login}`).join(", "),
      `${nbApprovals >= 2 ? "🐥" : nbApprovals === 1 ? "🐣" : "🥚"}`,
      ""
    ].map(v => (v ? v.replaceAll("|", "\\|") : v));

    lines.push(line.join("|"));
  }

  return [header, ...lines].join("\n");
}

async function getPrsReadyToReview(github, context) {
  const prs = await github.rest.pulls.list({
    owner: context.repo.owner,
    repo: context.repo.repo,
    state: "open"
  });

  return prs.data.filter(pr =>
    pr.labels.some(label => label.name === "ready for review")
  );
}

async function getNbPrApprovals(github, context, pr) {
  const reviews = await github.rest.pulls.listReviews({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: pr.number
  });

  return reviews.data.filter(review => review.state === "APPROVED").length;
}

async function getRequestedReviewers(github, context, pr) {
  const reviews = await github.rest.pulls.listRequestedReviewers({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: pr.number
  });

  return reviews.data.users.map(user => user.login);
}
