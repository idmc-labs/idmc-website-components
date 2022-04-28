import React from 'react';
import {
    Redirect,
    generatePath,
} from 'react-router-dom';

import route from '#base/configs/routes';

function Home() {
    const defaultRoute = generatePath(route.countryProfile.path, { id: 'IND' });

    return (
        <Redirect
            to={defaultRoute}
            replace
        />
    );
}

export default Home;
