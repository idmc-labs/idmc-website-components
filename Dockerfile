# -------------------------- Dev ---------------------------------------

FROM node:20-bookworm AS dev

RUN apt-get update -y \
    && apt-get install -y --no-install-recommends \
        git bash g++ make \
    && git config --global --add safe.directory /code \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /code

# -------------------------- Builder ---------------------------------------
FROM dev AS builder

COPY ./package.json ./yarn.lock /code/

RUN yarn install

COPY . /code/

# -------------------------- web-app-serve - Builder ------------------------
FROM builder AS web-app-serve-build

# Every runtime-configurable variable is built as a placeholder marker instead
# of a real value; ./web-app-serve/apply-config.sh substitutes them from the
# container environment when the container starts.
# Absolute base URL this deployment is reachable at. An embedding page loads the
# bundle across origins, so the runtime cannot derive where to fetch chunks from.
ENV REACT_APP_ASSET_BASE_URL=WEB_APP_SERVE_PLACEHOLDER__REACT_APP_ASSET_BASE_URL

ENV REACT_APP_ENVIRONMENT=WEB_APP_SERVE_PLACEHOLDER__REACT_APP_ENVIRONMENT
ENV REACT_APP_DATA_RELEASE=WEB_APP_SERVE_PLACEHOLDER__REACT_APP_DATA_RELEASE
ENV REACT_APP_GA_TRACKING_ID=WEB_APP_SERVE_PLACEHOLDER__REACT_APP_GA_TRACKING_ID

ENV REACT_APP_HELIX_GRAPHQL_ENDPOINT=WEB_APP_SERVE_PLACEHOLDER__REACT_APP_HELIX_GRAPHQL_ENDPOINT
ENV REACT_APP_HELIX_REST_ENDPOINT=WEB_APP_SERVE_PLACEHOLDER__REACT_APP_HELIX_REST_ENDPOINT
ENV REACT_APP_HELIX_CLIENT_ID=WEB_APP_SERVE_PLACEHOLDER__REACT_APP_HELIX_CLIENT_ID

ENV REACT_APP_GIDD_GRAPHQL_ENDPOINT=WEB_APP_SERVE_PLACEHOLDER__REACT_APP_GIDD_GRAPHQL_ENDPOINT
ENV REACT_APP_DRUPAL_ENDPOINT=WEB_APP_SERVE_PLACEHOLDER__REACT_APP_DRUPAL_ENDPOINT
ENV REACT_APP_DRUPAL_REST_ENDPOINT=WEB_APP_SERVE_PLACEHOLDER__REACT_APP_DRUPAL_REST_ENDPOINT

ENV REACT_APP_MAPBOX_STYLE=WEB_APP_SERVE_PLACEHOLDER__REACT_APP_MAPBOX_STYLE
ENV REACT_APP_MAPBOX_ACCESS_TOKEN=WEB_APP_SERVE_PLACEHOLDER__REACT_APP_MAPBOX_ACCESS_TOKEN
ENV REACT_APP_HCAPTCHA_SITEKEY=WEB_APP_SERVE_PLACEHOLDER__REACT_APP_HCAPTCHA_SITEKEY
ENV REACT_APP_SENTRY_DSN=WEB_APP_SERVE_PLACEHOLDER__REACT_APP_SENTRY_DSN

RUN env > .env && yarn build

# The build also emits pre-compressed *.gz siblings (CompressionPlugin). The base
# image's nginx serves them only with `gzip_static`, which it does not enable, so
# they are dead weight -- and sed cannot substitute placeholders inside a gzip
# stream, so a served copy would carry unreplaced markers.
RUN find /code/build -name '*.gz' -delete

# ---------------------------------------------------------------------------
FROM ghcr.io/toggle-corp/web-app-serve:v0.1.2 AS web-app-serve

LABEL org.opencontainers.image.source="https://github.com/idmc-labs/idmc-website-components"
LABEL org.opencontainers.image.authors="IDMC"

ENV APPLY_CONFIG__SOURCE_DIRECTORY=/code/build/
COPY --from=web-app-serve-build /code/build "$APPLY_CONFIG__SOURCE_DIRECTORY"

# The base image's apply-config only handles the APP_ prefix; this project uses
# REACT_APP_. The script is committed non-executable, so make it executable here
# -- the entrypoint execs it directly.
COPY ./web-app-serve/apply-config.sh /web-app-serve/react-app-apply-config.sh
RUN chmod +x /web-app-serve/react-app-apply-config.sh
ENV APPLY_CONFIG__APPLY_CONFIG_PATH=/web-app-serve/react-app-apply-config.sh

# APPLY_CONFIG__ENABLE_DEBUG=true reports unreplaced placeholders at /__debug/,
# but it first pretty-prints the build output with biome, which cannot parse the
# CSS toggle-ui ships (`#{var(--x)}` interpolation). Biome then exits non-zero
# and takes the entrypoint down with it, so a debug run would never serve. Skip
# that step; the rest of the debug report is unaffected.
ENV APPLY_CONFIG__DEBUG_USE_BIOME=false

# NOTE: no variable has a baked default -- every one of them is supplied per
# deployment. When one is unset, apply-config resolves it to `undefined` and names
# it in the startup log; analytics and Sentry then stay off, and the readers in
# app/utils/runtimeConfig.ts report every missing variable to the browser console.
