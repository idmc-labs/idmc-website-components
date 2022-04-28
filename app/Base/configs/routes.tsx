import { lazy } from 'react';

import { wrap } from '#base/utils/routes';

const fourHundredFour = wrap({
    path: '*',
    title: '404',
    component: lazy(() => import('#base/components/PreloadMessage')),
    componentProps: {
        heading: '404',
        content: 'What you are looking for does not exist.',
    },
    visibility: 'is-anything',
    navbarVisibility: true,
});
const login = wrap({
    path: '/login/',
    title: 'Login',
    navbarVisibility: false,
    component: lazy(() => import('#views/Template')),
    componentProps: {
        name: 'Login Page',
    },
    visibility: 'is-not-authenticated',
});

const home = wrap({
    path: '/',
    title: 'Home',
    navbarVisibility: true,
    component: lazy(() => import('#views/Template')),
    componentProps: {
        name: 'Home Page',
    },
    visibility: 'is-authenticated',
});
const goodPractices = wrap({
    path: '/good-practices/',
    title: 'Good Practices',
    navbarVisibility: true,
    component: lazy(() => import('#views/GoodPractices')),
    componentProps: {},
    visibility: 'is-authenticated',
});
const goodPractice = wrap({
    path: '/good-practices/:id/',
    title: 'Good Practice',
    navbarVisibility: true,
    component: lazy(() => import('#views/GoodPractice')),
    componentProps: {},
    visibility: 'is-authenticated',
});

const countryProfile = wrap({
    path: '/country-profiles/:id/',
    title: 'Country Profile',
    navbarVisibility: true,
    component: lazy(() => import('#views/CountryProfile')),
    componentProps: {},
    visibility: 'is-authenticated',
});

const routes = {
    login,
    home,
    goodPractices,
    goodPractice,
    countryProfile,
    fourHundredFour,
};
export default routes;
