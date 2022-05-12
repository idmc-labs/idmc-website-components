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

// eslint-disable-next-line import/prefer-default-export
export const countryMetadata: CountryMetadata = {
    /*
    countryProfileTooltip: 'Country Profile',
    displacementDataTooltip: 'Displacement Data',
    conflictAndViolenceTooltip: 'Conflict and Violence',
    disasterTooltip: 'Disaster',
    latestNewDisplacementsTooltip: 'Latest Internal Displacements',
    internalDisplacementUpdatesTooltip: 'Internal Displacement Updates',
    relatedMaterialTooltip: 'Related Material',
    essentialReadingTooltip: 'Essential Reading',
    contactTooltip: 'Contact',
    */

    conflictInternalDisplacementTooltip: 'New displacements corresponds to the estimated number of internal displacement movements to have taken place during the year. Figures include individuals who have been displaced more than once. In this sense, the number of new displacements does not equal to the number of people displaced during the year.',
    conflictIDPTooltip: 'Total number of IDPs corresponds to the total number of people living in internal displacement as of 31 December of every year.',
    disasterInternalDisplacementTooltip: 'New displacements corresponds to the estimated number of internal displacement movements to have taken place during the year. Figures include individuals who have been displaced more than once. In this sense, the number of new displacements does not equal to the number of people displaced during the year.',
};
