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

    conflictInternalDisplacementTooltip: `
        <p><b>Internal displacements</b></p>
        <p><i>("flows")</i></p>
        <p>An "internal displacement" refers to each new forced movement of person within the borders of their country recorded during the year.</p>
    `,
    conflictIDPTooltip: `
        <p><b>Internally displaced people (IDPs)</b></p>
        <p><i>("stocks")</i></p>
        <p>The "internally displaced people" is a snapshot of all the people living in internal displacement at the end of the year.</p>
    `,
    disasterInternalDisplacementTooltip: `
        <p><b>Internal displacements</b></p>
        <p><i>("flows")</i></p>
        <p>An "internal displacement" refers to each new forced movement of person within the borders of their country recorded during the year.</p>
    `,
};
