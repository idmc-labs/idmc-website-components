# -------------------------- Dev ---------------------------------------

FROM node:20-bookworm

RUN apt-get update -y \
    && apt-get install -y --no-install-recommends \
        git bash g++ make \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /code

# -------------------------- Builder ---------------------------------------
FROM dev AS builder

COPY ./package.json ./yarn.lock /code/

RUN yarn install

COPY . /code/

# -------------------------- Nginx - Builder --------------------------------
FROM builder AS nginx-build

# Dynamic configs. Can be changed with containers. (Placeholder values)
# Using ./nginx-serve/apply-config.sh
ENV REACT_APP_ENVIRONMENT=REACT_APP_ENVIRONMENT_PLACEHOLDER
ENV REACT_APP_HELIX_GRAPHQL_ENDPOINT=https://REACT-APP-HELIX-GRAPHQL-ENDPOINT.COM/
ENV REACT_APP_HELIX_REST_ENDPOINT=https://REACT-APP-HELIX-REST-ENDPOINT.COM/external-api/

ENV REACT_APP_GIDD_GRAPHQL_ENDPOINT=https://REACT-APP-GIDD-GRAPHQL-ENDPOINT.COM/
ENV REACT_APP_DRUPAL_ENDPOINT=https://REACT-APP-DRUPAL-ENDPOINT.COM/
ENV REACT_APP_DRUPAL_REST_ENDPOINT=https://REACT-APP-DRUPAL-REST-ENDPOINT.COM/

ENV REACT_APP_MAPBOX_STYLE=REACT_APP_MAPBOX_STYLE_PLACEHOLDER
ENV REACT_APP_HCAPTCHA_SITEKEY=REACT_APP_HCAPTCHA_SITEKEY_PLACEHOLDER
ENV REACT_APP_HELIX_CLIENT_ID=REACT_APP_HELIX_CLIENT_ID_PLACEHOLDER
ENV REACT_APP_DATA_RELEASE=REACT_APP_DATA_RELEASE_PLACEHOLDER
ENV REACT_APP_MAPBOX_ACCESS_TOKEN=REACT_APP_MAPBOX_ACCESS_TOKEN_PLACEHOLDER
ENV REACT_APP_SENTRY_DSN=REACT_APP_SENTRY_DSN_PLACEHOLDER
ENV REACT_APP_TINY_MCE_KEY=REACT_APP_TINY_MCE_KEY_PLACEHOLDER
ENV REACT_APP_GA_TRACKING_ID=REACT_APP_GA_TRACKING_ID_PLACEHOLDER

RUN env > .env && yarn build:unsafe

# ---------------------------------------------------------------------------
FROM nginx:1 AS nginx-serve

LABEL maintainer="IDMC"
LABEL org.opencontainers.image.source="github.com/idmc-labs/idmc-website-components"

COPY ./nginx-serve/apply-config.sh /docker-entrypoint.d/
COPY ./nginx-serve/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=nginx-build /code/build /code/build

ENV APPLY_CONFIG__SOURCE_DIRECTORY=/code/build/
ENV APPLY_CONFIG__DESTINATION_DIRECTORY=/usr/share/nginx/html/
ENV APPLY_CONFIG__OVERWRITE_DESTINATION=true
