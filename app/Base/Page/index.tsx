import React, { useEffect } from 'react';
import { addBreadcrumb } from '@sentry/react';
import ReactGA from 'react-ga4';

import DocumentTitle from '#components/DocumentTitle';
import Message from '#components/Message';
import {
    routeSettings,
    notFoundRoute,
} from '#base/routes';
import {
    readString,
    readInteger,
    readClientCode,
} from '#utils/params';
import { stripClientCode } from '#utils/common';

interface Props {
    className?: string;
    // FIXME: make this typesafe
    name?: string;
}

function Page(props: Props) {
    const {
        className,
        name,
    } = props;

    const requestedPage = name ?? 'home';
    const route = routeSettings[requestedPage] ?? notFoundRoute;

    useEffect(
        () => {
            addBreadcrumb({
                category: 'navigation',
                message: `Page view: ${route.title}`,
                level: 'info',
            });

            const iso3 = readString('iso3');
            const clientCode = readClientCode();

            ReactGA.send({
                hitType: 'pageview',
                page: route.pattern,
                title: route.title,
                content_group: route.category,
                location: stripClientCode(window.location.href),
                page_referrer: stripClientCode(document.referrer),
                // Custom dimensions
                country_iso3: iso3.value ? iso3.value.toUpperCase() : undefined,
                client_code: clientCode.value ? clientCode.value : undefined,
            });
        },
        // NOTE: We want to add page here so that subsequent 404 errors also track page views
        [name, route],
    );

    const Loader = route.loader;

    return (
        <>
            <DocumentTitle value={route.title} />
            <React.Suspense fallback={<Message pending />}>
                <Loader
                    readString={readString}
                    readInteger={readInteger}
                    readClientCode={readClientCode}
                    className={className}
                    route={route}
                />
            </React.Suspense>
        </>
    );
}

export default Page;
