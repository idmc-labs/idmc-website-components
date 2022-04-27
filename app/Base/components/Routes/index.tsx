import React, { Suspense } from 'react';
import { Switch, Route } from 'react-router-dom';
import PreloadMessage from '#base/components/PreloadMessage';

import routes from '#base/configs/routes';

interface Props {
    className?: string;
}

function Routes(props: Props) {
    const { className } = props;

    return (
        <Suspense
            fallback={(
                <PreloadMessage
                    className={className}
                    content="Loading page..."
                />
            )}
        >
            <Switch>
                <Route
                    exact
                    path={routes.home.path}
                >
                    {routes.home.load({ className })}
                </Route>
                <Route
                    exact
                    path={routes.countryProfile.path}
                >
                    {routes.countryProfile.load({ className })}
                </Route>
                <Route
                    exact
                    path={routes.goodPractice.path}
                >
                    {routes.goodPractice.load({ className })}
                </Route>
                <Route
                    exact
                    path={routes.goodPractices.path}
                >
                    {routes.goodPractices.load({ className })}
                </Route>
                <Route
                    exact
                    path={routes.countryProfile.path}
                >
                    {routes.countryProfile.load({ className })}
                </Route>
                <Route
                    exact
                    path={routes.login.path}
                >
                    {routes.login.load({ className })}
                </Route>
                <Route
                    exact
                    path={routes.fourHundredFour.path}
                >
                    {routes.fourHundredFour.load({ className })}
                </Route>
            </Switch>
        </Suspense>
    );
}
export default Routes;
