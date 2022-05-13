interface CountryMetadata {
    overviewHeader: string;
    countryProfileHeader: string;
    displacementDataHeader: string;
    conflictAndViolenceHeader: string;
    disasterHeader: string;
    // latestNewDisplacementsHeader: string;
    internalDisplacementUpdatesHeader: string;
    relatedMaterialHeader: string;
    essentialReadingHeader: string;
    contactHeader: string;

    overviewTooltip?: string;
    countryProfileTooltip?: string;
    displacementDataTooltip?: string;
    conflictAndViolenceTooltip?: string;
    disasterTooltip?: string;
    // latestNewDisplacementsTooltip?: string;
    internalDisplacementUpdatesTooltip?: string;
    relatedMaterialTooltip?: string;
    essentialReadingTooltip?: string;
    contactTooltip?: string;

    disasterEventTooltip?: string;
    conflictInternalDisplacementTooltip?: string;
    conflictIDPTooltip?: string;
    disasterInternalDisplacementTooltip?: string;
}

// eslint-disable-next-line import/prefer-default-export
export const countryMetadata: CountryMetadata = {
    overviewHeader: 'Overview',
    countryProfileHeader: 'Country Profile',
    displacementDataHeader: 'Displacement Data',
    conflictAndViolenceHeader: 'Conflict and Violence Data',
    disasterHeader: 'Disaster Data',
    // latestNewDisplacementsHeader: 'Latest Internal Displacements',
    internalDisplacementUpdatesHeader: 'Internal Displacement Updates',
    relatedMaterialHeader: 'Related Material',
    essentialReadingHeader: 'Essential Reading',
    contactHeader: 'Contact',

    conflictInternalDisplacementTooltip: 'New displacements corresponds to the estimated number of internal displacement movements to have taken place during the year. Figures include individuals who have been displaced more than once. In this sense, the number of new displacements does not equal to the number of people displaced during the year.',
    conflictIDPTooltip: 'Total number of IDPs corresponds to the total number of people living in internal displacement as of 31 December of every year.',
    disasterInternalDisplacementTooltip: 'New displacements corresponds to the estimated number of internal displacement movements to have taken place during the year. Figures include individuals who have been displaced more than once. In this sense, the number of new displacements does not equal to the number of people displaced during the year.',
};
