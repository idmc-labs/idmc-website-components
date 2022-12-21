import {
    ApolloClientOptions,
    NormalizedCacheObject,
    InMemoryCache,
    ApolloLink as ApolloLinkFromClient,
    HttpLink,
    from,
    concat,
} from '@apollo/client';
import { RestLink } from 'apollo-link-rest';
import { createUploadLink } from 'apollo-upload-client';

// FIXME: move this to utils
const langStorageKey = 'idmc-website-language';
function readStorage(key: string) {
    const langValueFromStorage = localStorage.getItem(key);
    if (langValueFromStorage) {
        return JSON.parse(langValueFromStorage);
    }
    return undefined;
}

const GRAPHQL_ENDPOINT = process.env.REACT_APP_GRAPHQL_ENDPOINT as string;
const HELIX_ENDPOINT = process.env.REACT_APP_HELIX_ENDPOINT as string;
const DRUPAL_ENDPOINT = (process.env.REACT_APP_DRUPAL_ENDPOINT || '') as string;

const link = new HttpLink({
    uri: GRAPHQL_ENDPOINT,
    credentials: 'include',
}) as unknown as ApolloLinkFromClient;

const languageAwareLink = concat(
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
        helix: HELIX_ENDPOINT,
        drupal: DRUPAL_ENDPOINT,
    },
    credentials: 'omit',
}) as unknown as ApolloLinkFromClient;

const apolloOptions: ApolloClientOptions<NormalizedCacheObject> = {
    link: from([restLink, languageAwareLink, createUploadLink()]),
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
