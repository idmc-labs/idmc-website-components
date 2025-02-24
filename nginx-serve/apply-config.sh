#!/bin/bash -xe

SOURCE_DIRECTORY=${APPLY_CONFIG__SOURCE_DIRECTORY?Required}
DESTINATION_DIRECTORY=${APPLY_CONFIG__DESTINATION_DIRECTORY?Required}

# Parse arguments for --overwrite option
OVERWRITE_DESTINATION=${APPLY_CONFIG__OVERWRITE_DESTINATION:-false}
for arg in "$@"; do
  if [[ "$arg" == "--overwrite" ]]; then
    OVERWRITE_DESTINATION=true
  fi
done


if [ -d "$DESTINATION_DIRECTORY" ]; then
  if [ "$OVERWRITE_DESTINATION" == "true" ]; then
    echo "Destination directory <$DESTINATION_DIRECTORY> already exists. Force deleting..."
    rm -rf "$DESTINATION_DIRECTORY"
  else
    echo "Destination directory <$DESTINATION_DIRECTORY> already exists. Please delete and try again, or use --overwrite to force delete."
    exit 1
  fi
fi

mkdir -p $(dirname "$DESTINATION_DIRECTORY")
cp -r --no-target-directory "$SOURCE_DIRECTORY" "$DESTINATION_DIRECTORY"

find "$DESTINATION_DIRECTORY" -type f -exec sed -i "s|\<REACT_APP_ENVIRONMENT_PLACEHOLDER\>|$REACT_APP_ENVIRONMENT|g" {} +

find "$DESTINATION_DIRECTORY" -type f -exec sed -i "s|\<REACT_APP_ENVIRONMENT_PLACEHOLDER|$REACT_APP_ENVIRONMENT|g" {} +
find "$DESTINATION_DIRECTORY" -type f -exec sed -i "s|\<https://REACT-APP-HELIX-GRAPHQL-ENDPOINT.COM/|$REACT_APP_HELIX_GRAPHQL_ENDPOINT|g" {} +
find "$DESTINATION_DIRECTORY" -type f -exec sed -i "s|\<https://REACT-APP-HELIX-REST-ENDPOINT.COM/external-api/|$REACT_APP_HELIX_REST_ENDPOINT|g" {} +
find "$DESTINATION_DIRECTORY" -type f -exec sed -i "s|\<https://REACT-APP-GIDD-GRAPHQL-ENDPOINT.COM/|$REACT_APP_GIDD_GRAPHQL_ENDPOINT|g" {} +
find "$DESTINATION_DIRECTORY" -type f -exec sed -i "s|\<https://REACT-APP-DRUPAL-ENDPOINT.COM/|$REACT_APP_DRUPAL_ENDPOINT|g" {} +
find "$DESTINATION_DIRECTORY" -type f -exec sed -i "s|\<https://REACT-APP-DRUPAL-REST-ENDPOINT.COM/|$REACT_APP_DRUPAL_REST_ENDPOINT|g" {} +
find "$DESTINATION_DIRECTORY" -type f -exec sed -i "s|\<REACT_APP_MAPBOX_STYLE_PLACEHOLDER|$REACT_APP_MAPBOX_STYLE|g" {} +
find "$DESTINATION_DIRECTORY" -type f -exec sed -i "s|\<REACT_APP_HCAPTCHA_SITEKEY_PLACEHOLDER|$REACT_APP_HCAPTCHA_SITEKEY|g" {} +
find "$DESTINATION_DIRECTORY" -type f -exec sed -i "s|\<REACT_APP_HELIX_CLIENT_ID_PLACEHOLDER|$REACT_APP_HELIX_CLIENT_ID|g" {} +
find "$DESTINATION_DIRECTORY" -type f -exec sed -i "s|\<REACT_APP_DATA_RELEASE_PLACEHOLDER|$REACT_APP_DATA_RELEASE|g" {} +
find "$DESTINATION_DIRECTORY" -type f -exec sed -i "s|\<REACT_APP_MAPBOX_ACCESS_TOKEN_PLACEHOLDER|$REACT_APP_MAPBOX_ACCESS_TOKEN|g" {} +
find "$DESTINATION_DIRECTORY" -type f -exec sed -i "s|\<REACT_APP_SENTRY_DSN_PLACEHOLDER|$REACT_APP_SENTRY_DSN|g" {} +
find "$DESTINATION_DIRECTORY" -type f -exec sed -i "s|\<REACT_APP_GA_TRACKING_ID_PLACEHOLDER|$REACT_APP_GA_TRACKING_ID|g" {} +

# Show diffs (Useful to debug issues)
set +xe
find "$SOURCE_DIRECTORY" -type f -printf '%P\n' | while IFS= read -r file; do
    diff -W 100 <(fold -w 100 "$SOURCE_DIRECTORY/$file") <(fold -w 100 "$DESTINATION_DIRECTORY/$file") --suppress-common-lines
done
