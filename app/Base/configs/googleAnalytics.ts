import { InitializeOptions } from 'react-ga';

export const trackingId = process.env.REACT_APP_GA_TRACKING_ID;

const isDev = process.env.NODE_ENV === 'development';

export const gaConfig: InitializeOptions = {
    debug: isDev,
    testMode: isDev,
    gaOptions: {
        userId: undefined,
    },
};
