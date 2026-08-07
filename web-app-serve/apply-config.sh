#!/bin/env bash

set -xe

# Substitute WEB_APP_SERVE_PLACEHOLDER__<VAR> markers with runtime values.
# Based on the base image's default-app-apply-config.sh, but for the
# REACT_APP_ prefix (the default script only handles ^APP_).
# A value only reaches the app correctly if it is escaped for the file it lands
# in. The build emits each marker inside a double-quoted JS string literal, so in
# JS and JSON the value needs the escaping the bundler would have applied: a `"`
# would otherwise close the literal early (the file still serves, so the app dies
# with a blank page) and a `\` would be consumed as a JS escape. Other file types
# take the value verbatim. Values are read line by line, so they cannot contain a
# newline.
while IFS='=' read -r KEY VALUE; do
    JS_VALUE=$(printf '%s' "$VALUE" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g')

    # Escape sed's own replacement metacharacters (\, & and the | delimiter) last,
    # so what the loop above produced substitutes literally.
    JS_ESCAPED_VALUE=$(printf '%s' "$JS_VALUE" | sed -e 's/[\\&|]/\\&/g')
    ESCAPED_VALUE=$(printf '%s' "$VALUE" | sed -e 's/[\\&|]/\\&/g')

    find "$DESTINATION_DIRECTORY" -type f \
        \( -name '*.js' -o -name '*.mjs' -o -name '*.cjs' -o -name '*.json' \
           -o -name '*.map' -o -name '*.webmanifest' \) \
        -exec sed -i "s|\<WEB_APP_SERVE_PLACEHOLDER__$KEY\>|$JS_ESCAPED_VALUE|g" {} +
    find "$DESTINATION_DIRECTORY" -type f \
        ! -name '*.js' ! -name '*.mjs' ! -name '*.cjs' ! -name '*.json' \
        ! -name '*.map' ! -name '*.webmanifest' \
        -exec sed -i "s|\<WEB_APP_SERVE_PLACEHOLDER__$KEY\>|$ESCAPED_VALUE|g" {} +
done < <(env | grep '^REACT_APP_')

# Every marker still present had no runtime value. Warn about all of them --
# including unquoted occurrences (CSS, index.html) that the rewrite below
# deliberately leaves alone -- so the operator either sets the variable or bakes
# a default into the image.
LEFTOVER_PLACEHOLDERS=$(grep -rho 'WEB_APP_SERVE_PLACEHOLDER__REACT_APP_[A-Za-z0-9_]*' "$DESTINATION_DIRECTORY" | sort -u)
if [ -n "$LEFTOVER_PLACEHOLDERS" ]; then
    echo "WARNING: no runtime value for the placeholder(s) below — quoted JS occurrences set to 'undefined'; any unquoted occurrence (e.g. index.html) is left in place:" >&2
    printf '%s\n' "$LEFTOVER_PLACEHOLDERS" | sed 's/^/  - /' >&2
fi

# Resolve unfilled placeholders to real JS `undefined` (falsy) instead of
# leaking the literal marker (a truthy string) into the bundle. The build bakes
# each marker as a quoted string literal, so consuming the surrounding quotes
# turns `"WEB_APP_SERVE_PLACEHOLDER__REACT_APP_X"` into a bare `undefined`.
find "$DESTINATION_DIRECTORY" -type f \
    -exec sed -i 's|"WEB_APP_SERVE_PLACEHOLDER__REACT_APP_[A-Za-z0-9_]*"|undefined|g' {} +
