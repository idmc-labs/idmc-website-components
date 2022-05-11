interface CountryMetadata {
    countryProfileTooltip?: string;
    displacementDataTooltip?: string;
    conflictAndViolenceTooltip?: string;
    disasterTooltip?: string;
    latestNewDisplacementsTooltip?: string;
    internalDisplacementUpdatesTooltip?: string;
    relatedMaterialTooltip?: string;
    essentialReadingTooltip?: string;
    contactTooltip?: string;
    conflictInternalDisplacementTooltip?: string;
    conflictIDPTooltip?: string;
    disasterInternalDisplacementTooltip?: string;
    disasterEventTooltip?: string;
}

export const countryMetadata: CountryMetadata = {
    countryProfileTooltip: 'Country Profile',
    displacementDataTooltip: 'Displacement Data',
    conflictAndViolenceTooltip: 'Conflict and Violence',
    disasterTooltip: 'Disaster',
    latestNewDisplacementsTooltip: 'Latest Internal Displacements',
    internalDisplacementUpdatesTooltip: 'Internal Displacement Updates',
    relatedMaterialTooltip: 'Related Material',
    essentialReadingTooltip: 'Essential Reading',
    contactTooltip: 'Contact',
    conflictInternalDisplacementTooltip: 'Internal displacements corresponds to the estimated number of internal displacement movements to have taken place during the year. Figures include individuals who have been displaced more than once. In this sense, the number of new displacements does not equal to the number of people displaced during the year.',
    conflictIDPTooltip: 'Total number of IDPs corresponds to the total number of people living in internal displacement.',
    disasterInternalDisplacementTooltip: 'Internal displacements corresponds to the estimated number of internal displacement movements to have taken place during the year. Figures include individuals who have been displaced more than once. In this sense, the number of new displacements does not equal to the number of people displaced during the year.',
};

interface Statistics {
    // FIXME: get this from country query
    bounds: [number, number, number, number];
    conflict?: {
        newDisplacements: number; // this can be calculated
        newDisplacementsLabel: string;

        noOfIdps: number; // NOTE: this can be calculated
        noOfIdpsLabel: string;

        timeseries: {
            year: string;
            total: number;
            totalStock: number;
        }[];
    },
    disaster?: {
        newDisplacements: number;
        newDisplacementsLabel: string;

        noOfEvents: number;
        noOfEventsLabel: string;

        timeseries: {
            year: string;
            total: number;
        }[];
        categories: {
            label: string;
            total: number;
        }[];
    },
}

export const statistics: Statistics = {
    bounds: [68.176645, 7.965535, 97.402561, 35.49401],
    conflict: {
        newDisplacements: 1821629,
        newDisplacementsLabel: 'New Displacements',

        noOfIdps: 473079,
        noOfIdpsLabel: 'Total number of IDPs',

        timeseries: [{ year: '2009', total: 33000, totalStock: 500000 }, { year: '2010', total: 106500, totalStock: 650000 }, { year: '2011', total: 53000, totalStock: 650000 }, { year: '2012', total: 500000, totalStock: 1000000 }, { year: '2013', total: 64000, totalStock: 526000 }, { year: '2014', total: 345000, totalStock: 853900 }, { year: '2015', total: 1000, totalStock: 611763 }, { year: '2016', total: 448400, totalStock: 796275 }, { year: '2017', total: 78489, totalStock: 805744 }, { year: '2018', total: 169313, totalStock: 479446 }, { year: '2019', total: 19005, totalStock: 469624 }, { year: '2020', total: 3922, totalStock: 473079 }],
    },
    disaster: {
        newDisplacements: 48513346,
        newDisplacementsLabel: 'New Displacements',

        noOfEvents: 161,
        noOfEventsLabel: 'Disaster events reported',

        timeseries: [{ year: '2008', total: 6662165 }, { year: '2009', total: 5304000 }, { year: '2010', total: 1411285 }, { year: '2011', total: 1503320 }, { year: '2012', total: 9110000 }, { year: '2013', total: 2144671 }, { year: '2014', total: 3427618 }, { year: '2015', total: 3654637 }, { year: '2016', total: 2400307 }, { year: '2017', total: 1345994 }, { year: '2018', total: 2675414 }, { year: '2019', total: 5017722 }, { year: '2020', total: 3856213 }],
        categories: [{ label: 'Flood', total: 37171049 }, { label: 'Storm', total: 11104537 }, { label: 'Earthquake', total: 166510 }, { label: 'Drought', total: 63404 }, { label: 'Wet Mass Movement', total: 7701 }, { label: 'Other', total: 145 }],
    },
};
