#!/bin/sh

set -e
BACK_GIT_URL=""
FRONT_GIT_URL=""

BRANCH_NAME=$(echo "$GITHUB_REF" | cut -d/ -f3)

echo "🪐 \e[1mGetting GIT deploy URLs...\e[m"
case $BRANCH_NAME in
    staging-1)
        BACK_GIT_URL=$GIT_STAGING_1_BACK
        FRONT_GIT_URL=$GIT_STAGING_1_FRONT
        ;;
    dev)
        echo "⚠ Not handled yet, exiting."
        exit 1
        ;;
    master)
        echo "⚠ Not handled yet, exiting."
        exit 1
        ;;
    *)
        echo "❌ Not a deploy target, aborting."
        exit 0
        ;;
esac

if [ -z "$BACK_GIT_URL" ] || [ -z "$FRONT_GIT_URL" ]
then
      echo "No deployment target, exiting."
      exit 1
fi

echo "🏠 \e[1mConfiguring GIT...\e[m"
git config --global user.email "tech@trackdechets.beta.gouv.fr"
git config --global user.name "TD GitHub actions"

echo "📦 \e[1mPushing for branch \e[36m<$BRANCH_NAME>\e[39m...\e[m"
git push "$BACK_GIT_URL" HEAD:master --force 2>&1 | grep -e 'remote:' -e '->'
git push "$FRONT_GIT_URL" HEAD:master --force 2>&1 | grep -e 'remote:' -e '->'

echo "🚀 \e[1mDeploy successfull\e[m"