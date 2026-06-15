import React, { useEffect } from 'react';
import { addBreadcrumb } from '@sentry/react';
import ReactGA from 'react-ga4';

import DocumentTitle from '#components/DocumentTitle';
import {
    routeSettings,
    notFoundRoute,
} from '#base/routes';
import {
    readString,
    readInteger,
    readClientCode,
} from '#utils/params';

interface Props {
    className?: string;
    // FIXME: make this typesafe
    page?: string;
}

function Page(props: Props) {
    const {
        className,
        page,
    } = props;

    const requestedPage = page ?? 'home';
    const route = routeSettings[requestedPage] ?? notFoundRoute;

    useEffect(
        () => {
            addBreadcrumb({
                category: 'navigation',
                message: `Page view: ${route.title}`,
                level: 'info',
            });

            ReactGA.send({
                hitType: 'pageview',
                page: route.pattern,
                title: route.title,
                content_group: route.category,
            });
            // NOTE: We want to add page here so that subsequent 404 errors also track page views
        },
        [page, route],
    );

    const Loader = route.loader;

    return (
        <>
            <DocumentTitle value={route.title} />
            <Loader
                readString={readString}
                readInteger={readInteger}
                readClientCode={readClientCode}
                className={className}
                route={route}
            />
        </>
    );
}

export default Page;
