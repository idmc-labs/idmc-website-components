import { Lang } from '#context/LanguageContext';

export type LangString = Record<Lang, string>;
export type LangStringWithTemplate = LangString & {
    var: string[];
}

export interface LangStrings {
    [key: string]: LangString | LangStringWithTemplate;
}

export const commonLabels = {
    recentByPublicationLabel: {
        en: 'Year of Publication (Latest First)',
        fr: 'Année de publication (La plus récente en premier)',
    },
    oldestByPublicationLabel: {
        en: 'Year of Publication (Oldest First)',
        fr: 'Année de publication (La plus ancienne en premier)',
    },
    mostPopularFirstLabel: {
        en: 'Most Popular First',
        fr: 'Les plus populaires en premier',
    },
    leastPopularFirstLabel: {
        en: 'Least Popular First',
        fr: 'Le moins populaire en premier',
    },
    noDataAvailableMessage: {
        en: 'No data available',
        fr: 'Pas de données disponibles',
    },
    noMatchingDataMessage: {
        en: 'No matching data',
        fr: 'Aucune donnée correspondante',
    },
    erroredEmptyDataMessage: {
        en: 'Oops! We ran into an issue',
        fr: 'Oops! Nous avons rencontré un problème',
    },
    alsoAvailableInLabel: {
        en: 'Also available in',
        fr: 'Également disponible en',
    },
    reloadButtonLabel: {
        en: 'Reload',
        fr: 'Recharger',
    },
};

export const goodPracticesDashboard = {
    goodPracticesHeader: {
        en: 'Global Repository of Good Practices',
        fr: 'Référentiel mondial de bonnes pratiques',
    },
    findGoodPracticesButtonLabel: {
        en: 'Find Good Practices',
        fr: 'Trouver des bonnes pratiques',
    },
    goodPracticesAroundTheWorldLabel: {
        en: 'Good practices around the world',
        fr: 'Les bonnes pratiques dans le monde',
    },
    goodPracticeLabel: {
        en: 'Good Practice: {value}',
        fr: 'Bonnes pratiques: {value}',
    },
    faqHeader: {
        en: 'Frequently asked questions',
        fr: 'Foire aux questions',
    },
    typeOfGoodPracticeHeader: {
        en: 'Type of Good Practice',
        fr: 'Type de bonne pratique',
    },
    regionLabel: {
        en: 'Region',
        fr: 'Région',
    },
    countryLabel: {
        en: 'Country',
        fr: 'Pays',
    },
    driversOfDisplacementLabel: {
        en: 'Drivers of Displacement',
        fr: 'Facteurs de déplacement',
    },
    focusAreaLabel: {
        en: 'Focus Area',
        fr: 'Domaine d’intervention',
    },
    stageLabel: {
        en: 'Stage',
        fr: 'Organiser',
    },
    clearButtonLabel: {
        en: 'Clear All Filters',
        fr: 'Effacer tous les filtres',
    },
    searchFilterLabel: {
        en: 'Search Good Practice',
        fr: 'Chercher des bonnes pratiques',
    },
    timescaleLabel: {
        en: 'Timescale',
        fr: 'Calendrier',
    },
    filterAndSortLabel: {
        en: 'Filter and Sort',
        fr: 'Filtrer et Trier',
    },
    sortResultsByLabel: {
        en: 'Sort Results by',
        fr: 'Trier les résultats par',
    },
    sortLabel: {
        en: 'Sort',
        fr: 'Tri',
    },
    noGoodPracticeFoundMessage: {
        en: 'No Good Practice Found',
        fr: 'Aucune bonne pratique trouvée',
    },
    noFilteredPracticesFoundMessage: {
        en: 'No Filtered Good Practice Found',
        fr: 'Aucune bonne pratique filtrée trouvée',
    },
    viewMoreButtonLabel: {
        en: 'View More Good Practices',
        fr: 'Afficher plus de bonnes pratiques',
    },
    showLessButtonLabel: {
        en: 'Show less',
        fr: 'Montrer moins',
    },
};

export const goodPracticeItem = {
    homeLabel: {
        en: 'Home',
        fr: 'Maison',
    },
    goodPracticesLabel: {
        en: 'Good Practices',
        fr: 'Bonnes pratiques',
    },
    goodPracticeLabel: {
        en: 'Good Practice',
        fr: 'Bonnes pratiques',
    },
    regionLabel: {
        en: 'Region',
        fr: 'Région',
    },
    countryLabel: {
        en: 'Country',
        fr: 'Pays',
    },
    timeframeLabel: {
        en: 'Timeframe',
        fr: 'Plage de temps',
    },
    ongoingLabel: {
        en: 'Ongoing',
        fr: 'En cours',
    },
    implementingEntityLabel: {
        en: 'Implementing entity',
        fr: 'Entité de mise en œuvre',
    },
    bestPracticeGalleryLabel: {
        en: 'Best Practice Gallery',
        fr: 'Galerie des meilleures pratiques',
    },
    mediaAndResourcesLabel: {
        en: 'Media and resources',
        fr: 'Médias et ressources',
    },
    relatedMaterialsLabel: {
        en: 'Related materials',
        fr: 'Matériel connexe',
    },
};