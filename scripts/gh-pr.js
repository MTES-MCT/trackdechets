module.exports = async ({ github, context, core }) => {
  const output = await getBody(github, context);

  core.setOutput("prs", output);
};

async function getBody(github, context) {
  const prs = await getPrsReadyToReview(github, context);

  if (prs.length === 0) {
    return "Rien dans le poulailler ce matin 🐔 On retourne pondre du code ! 🧑‍💻";
  }

  const header = `|Titre|N°|Auteur|Approvals||
|---|---|---|---|---|`;

  const lines = [];
  for (const pr of prs) {
    const nbApprovals = await getNbPrApprovals(github, context, pr);

    lines.push(
      `|${pr.title}|[#${pr.number}](${pr.html_url})}|@${
        pr.user.login
      }|${nbApprovals}| ${nbApprovals >= 2 ? "🐥" : nbApprovals === 1 ? "🐣" : "🥚"}|`
    );
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

  return reviews.filter(review => review.state === "APPROVED").length;
}
