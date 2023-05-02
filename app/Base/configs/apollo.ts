import {
    ApolloClientOptions,
    NormalizedCacheObject,
    InMemoryCache,
    ApolloLink as ApolloLinkFromClient,
    HttpLink,
    from,
    concat,
} from '@apollo/client';
import {
    HELIX_REST_ENDPOINT,
    DRUPAL_ENDPOINT,
    readStorage,
} from '#utils/common';
import { ApolloLink } from 'apollo-link';
import { RestLink } from 'apollo-link-rest';
import { createUploadLink } from 'apollo-upload-client';

// FIXME: move this to utils
const langStorageKey = 'idmc-website-language';

const GIDD_GRAPHQL_ENDPOINT = process.env.REACT_APP_GIDD_GRAPHQL_ENDPOINT as string;
const HELIX_GRAPHQL_ENDPOINT = process.env.REACT_APP_HELIX_GRAPHQL_ENDPOINT as string;

const giddGqlLink = new HttpLink({
    uri: GIDD_GRAPHQL_ENDPOINT,
    credentials: 'include',
});

const helixGqlLink = new HttpLink({
    uri: HELIX_GRAPHQL_ENDPOINT,
    credentials: 'include',
});

const link = ApolloLink.split(
    (operation) => operation.getContext().clientName === 'helix',
    helixGqlLink as unknown as ApolloLink,
    giddGqlLink as unknown as ApolloLink,
) as unknown as ApolloLinkFromClient;

const languageAwareGqlLink = concat(
    new ApolloLinkFromClient((operation, forward) => {
        // add the Accept-Language to the headers
        operation.setContext(({ headers = {} }) => {
            const lang = readStorage(langStorageKey) || 'en';
            return {
                headers: {
                    ...headers,
                    'Accept-Language': lang,
                },
            };
        });
        return forward(operation);
    }),
    link,
);

const restLink = new RestLink({
    endpoints: {
        helix: HELIX_REST_ENDPOINT,
        drupal: DRUPAL_ENDPOINT,
    },
    credentials: 'omit',
});

const uploadGqlLink = createUploadLink({
    uri: GIDD_GRAPHQL_ENDPOINT,
    credentials: 'include',
});

const apolloOptions: ApolloClientOptions<NormalizedCacheObject> = {
    link: from([
        ApolloLink.split(
            (operation) => operation.getContext().hasUpload,
            uploadGqlLink as unknown as ApolloLink,
            ApolloLink.from([
                restLink as unknown as ApolloLink,
                languageAwareGqlLink as unknown as ApolloLink,
            ]),
        ) as unknown as ApolloLinkFromClient,
    ]),
    cache: new InMemoryCache(),
    assumeImmutableResults: true,
    defaultOptions: {
        query: {
            fetchPolicy: 'network-only',
            errorPolicy: 'all',
        },
        watchQuery: {
            fetchPolicy: 'cache-and-network',
            nextFetchPolicy: 'cache-and-network',
            errorPolicy: 'all',
        },
    },
};

export default apolloOptions;
