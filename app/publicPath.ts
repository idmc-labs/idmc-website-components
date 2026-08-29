import { readRuntimeConfig } from '#utils/runtimeConfig';

// Where the runtime fetches lazy chunks and emitted assets from. An embedding
// page serves this app from another origin than its own, so anything resolved
// against the document would be looked up on the embedder. This module has to
// run before the first chunk request, which is why the entry imports it first.
//
// webpack's own detection reads whichever script tag executed last. That is the
// right one only while the page loads our tags directly -- an embedder that
// concatenates its scripts, or defers ours, leaves it pointing at a file of the
// embedder's, and every chunk 404s. So the two explicit sources win over it.

interface EmbedWindow {
    // Set by an embedding page before the bundle loads, when neither the baked
    // configuration nor our own script tag can be trusted.
    idmcComponentsBaseUrl?: string;
}

// Only an absolute origin is usable. A relative one would resolve against the
// embedding document, which is the failure this module exists to prevent -- and
// a deployment that never ran the placeholder substitution supplies the marker
// itself, which is a non-empty string that would otherwise be taken at face
// value and turned into a path segment.
function asAbsoluteBaseUrl(value: string | undefined) {
    if (!value) {
        return undefined;
    }
    try {
        const url = new URL(value);
        return url.href.endsWith('/') ? url.href : `${url.href}/`;
    } catch {
        return undefined;
    }
}

function resolveBaseUrl() {
    const fromEmbedder = asAbsoluteBaseUrl((window as EmbedWindow).idmcComponentsBaseUrl);
    if (fromEmbedder) {
        return fromEmbedder;
    }

    const fromDeployment = asAbsoluteBaseUrl(
        readRuntimeConfig(process.env.REACT_APP_ASSET_BASE_URL),
    );
    if (fromDeployment) {
        return fromDeployment;
    }

    // Found by name rather than by position: the embedder's own script tags are
    // in the same document, and one of them is usually the last.
    const ownScript = document.querySelector<HTMLScriptElement>('script[src*="js/main.bundle.js"]');
    if (ownScript?.src) {
        // The entry sits one directory below the deployment root.
        return new URL('../', ownScript.src).href;
    }

    return undefined;
}

const baseUrl = resolveBaseUrl();
if (baseUrl) {
    // eslint-disable-next-line camelcase
    __webpack_public_path__ = baseUrl;
} else {
    // eslint-disable-next-line no-console
    console.error('[config] cannot tell which origin serves this bundle; set REACT_APP_ASSET_BASE_URL for the deployment, or window.idmcComponentsBaseUrl on the embedding page');
}
