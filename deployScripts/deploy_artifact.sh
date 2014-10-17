#! /usr/bin/env bash
set -x # use + to only "echo" results on console (ie turn debugging off)
set -e # exit if there are any errors at all (perfect build or none at all).

SCRIPT_DIR=`dirname $0`

#CIRCLE_PROJECT_USERNAME The username or organization name of the project being tested, i.e. "expectlabs"
#CIRCLE_PROJECT_REPONAME The repository name of the project being tested, i.e. "crawler" in circleci.com/gh/expectlabs/crawler/123
#CIRCLE_BRANCH The name of the branch being tested, e.g. 'master'.
#CIRCLE_SHA1 The SHA1 of the commit being tested.
#CIRCLE_COMPARE_URL A link to GitHub's comparison view for this push. Not present for builds that are triggered by GitHub pushes.
#CIRCLE_BUILD_NUM The build number, same as in circleci.com/gh/foo/bar/123
#CIRCLE_ARTIFACTS The directory whose contents are automatically saved as build artifacts.

if [ -z "$CHEF_ENVIRONMENT" ]; then
  if [ "$CIRCLE_BRANCH" = "develop" ]; then
      CHEF_ENVIRONMENT='west-dev-d'
  elif [[ "$CIRCLE_BRANCH" == release/* ]]; then
      CHEF_ENVIRONMENT='west-dev-e'
  elif [ "$CIRCLE_BRANCH" = "master" ]; then
      CHEF_ENVIRONMENT='west-prod-a'
  elif [ "$CIRCLE_BRANCH" = "feature/voice-navigator" ]; then
      echo "Using VN build; not setting CHEF_ENVIRONMENT"
  else
      echo "Currently only set up to deploy develop to dev-d, release to dev-e, and master to prod-a."
      exit 1
  fi
elif [ "$CHEF_ENVIRONMENT" = "west-prod-a" ]; then
  echo "You are not allowed to specify production as an override environment."
  exit 1
fi

#Set specific params from the circle params
REPO=$CIRCLE_PROJECT_REPONAME
if [ "$CIRCLE_BRANCH" = "feature/voice-navigator" ]; then
  REPO="$CIRCLE_PROJECT_REPONAME"-voice-navigator
fi

PREFIX="$REPO/"
GIT_COMMIT=$CIRCLE_SHA1
BUILD_ID="$CIRCLE_BUILD_NUM"_`date +"%Y-%m-%d_%H-%M-%S"`
S3CMD="s3cmd --config=$SCRIPT_DIR/s3cfg"

tempDir="/var/tmp/${REPO}_${BUILD_ID}"
tarFile="${REPO}_${BUILD_ID}.tgz"
tarSha="${REPO}_${BUILD_ID}.sha1"
mkdir -p $tempDir
$SCRIPT_DIR/git-archive-all --prefix=$PREFIX --extra='dist/' "$tempDir/$tarFile"
echo $GIT_COMMIT > "$tempDir/$tarSha"
$S3CMD put "$tempDir/$tarFile" "s3://elabs-pkg/releases/$tarFile"
$S3CMD put "$tempDir/$tarSha" "s3://elabs-pkg/releases/$tarSha"
if [ "$CIRCLE_BRANCH" = "feature/voice-navigator" ]; then
  # voiceNavigator we need to put in all environments -- this branch is 'master' for VN.
  for chefEnv in 'west-dev-d' 'west-dev-e' 'west-prod-a'; do
    $S3CMD cp "s3://elabs-pkg/releases/$tarFile" "s3://elabs-pkg/env/${chefEnv}/${REPO}.tgz"
    $S3CMD cp "s3://elabs-pkg/releases/$tarSha" "s3://elabs-pkg/env/${chefEnv}/${REPO}.sha1"
  done
else
  $S3CMD cp "s3://elabs-pkg/releases/$tarFile" "s3://elabs-pkg/env/${CHEF_ENVIRONMENT}/${REPO}.tgz"
  $S3CMD cp "s3://elabs-pkg/releases/$tarSha" "s3://elabs-pkg/env/${CHEF_ENVIRONMENT}/${REPO}.sha1"
fi
rm -rf $tempDir
