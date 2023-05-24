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
        en: 'Country (select from list)',
        fr: 'Pays (sélectionnez dans la liste)',
    },
    countryLabelFr: {
        en: 'Pays (sélectionnez dans la liste)',
        fr: 'Pays (sélectionnez dans la liste)',
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
    captchaLabel: {
        en: 'Captcha',
        fr: 'Captcha',
    },
    captchaLabelFr: {
        en: 'Captcha',
        fr: 'Captcha',
    },
    coverImageLabel: {
        en: 'Cover image',
        fr: 'Image de couverture',
    },
    coverImageTitle: {
        en: 'Upload a cover image',
        fr: 'télécharger une image de couverture',
    },
    startYearLabel: {
        en: 'Project start year',
        fr: 'Année de début du projet',
    },
    startYearLabelFr: {
        en: 'Année de début du projet',
        fr: 'Année de début du projet',
    },
    endYearLabel: {
        en: 'Project end year (or ongoing)',
        fr: 'Fin d`année du projet (ou en cours)',
    },
    endYearLabelFr: {
        en: 'Fin d`année du projet (ou en cours)',
        fr: 'Fin d`année du projet (ou en cours)',
    },
    ongoingLabel: {
        en: 'Ongoing',
        fr: 'en cours',
    },
    ongoingLabelFr: {
        en: 'en cours',
        fr: 'en cours',
    },
    tagLabel: {
        en: 'Tags',
        fr: 'étiquette',
    },
    typeLabel: {
        en: 'Type',
        fr: 'taper',
    },
    contactNameLabel: {
        en: 'Contact name',
        fr: 'Nom du contact',
    },
    contactNameLabelFr: {
        en: 'Nom du contact',
        fr: 'Nom du contact',
    },
    contactEmailLabel: {
        en: 'Contact email',
        fr: 'Email du contact',
    },
    contactEmailLabelFr: {
        en: 'Email du contact',
        fr: 'Email du contact',
    },
    implementingEntityLabel: {
        en: 'Implementing organisation/entity',
        fr: 'Entité de mise en œuvre',
    },
    implementingEntityFrLabel: {
        en: 'Entité de mise en œuvre',
        fr: 'Entité de mise en œuvre',
    },
    mediaAndResourceLinksLabel: {
        en: `Please provide links to any relevant reports,
        evaluations or other documents that will help us better
         understand the project and its impacts`,
        fr: `Veuillez fournir des liens vers tous les rapports,
         évaluations ou autres documents pertinents qui nous
         aideront à mieux comprendre le projet et ses impacts.`,
    },
    mediaAndResourceLinksFrLabel: {
        en: 'Description du projet (max 2 000 caractères)',
        fr: 'liens médias et ressources',
    },
    descriptionLabel: {
        en: 'Description of the project (max 10,000 characters)',
        fr: 'Description du projet (max 10 000 caractères)',
    },
    descriptionsFrLabel: {
        en: 'Description du projet (max 10 000 caractères)',
        fr: 'Description du projet (max 10 000 caractères)',
    },
    titleLabel: {
        en: 'Name of project',
        fr: 'Nom du projet',
    },
    titleFrLabel: {
        en: 'Nom du projet',
        fr: 'Nom du projet',
    },
    submitLabel: {
        en: 'Submit',
        fr: 'nous faire parvenir',
    },
    inFrenchLabel: {
        en: ' in French',
        fr: ' en français',
    },
    alsoSubmitInFrenchLabel: {
        en: 'Submit in French',
        fr: 'Soumettre en français',
    },
    submitNewGoodPracticeLabel: {
        en: 'Submit a new good practice',
        fr: 'soumettre une nouvelle bonne pratique',
    },
    addNewGoodPracticeHeading: {
        en: 'Do you have a Good Practice you would like us to review?',
        fr: 'Avez-vous une bonne pratique que vous aimeriez que nous examinions?',
    },
    textLimitExceeded: {
        en: 'Your text limit has exceeded',
        fr: 'Votre limite de texte a été dépassée',
    },
    agreementTerms: {
        en: `By submitting this form you consent to the content being used
        in IDMC's Global Repository of Good Practices and other related products.
        IDMC reserves the right to amend some or all of the text submitted,
         according to its own review and verification process.`,
        fr: `En soumettant ce formulaire, vous consentez à
        ce que le contenu soit utilisé dans le référentiel
        mondial des bonnes pratiques d'IDMC et d'autres produits
        connexes. IDMC se réserve le droit de modifier tout ou
        partie du texte soumis, selon son propre processus d'examen
        et de vérification.`,
    },
    agreementTermsFr: {
        en: `En soumettant ce formulaire, vous consentez à
        ce que le contenu soit utilisé dans le référentiel
        mondial des bonnes pratiques d'IDMC et d'autres produits
        connexes. IDMC se réserve le droit de modifier tout ou
        partie du texte soumis, selon son propre processus d'examen
        et de vérification.`,
        fr: `En soumettant ce formulaire, vous consentez à
        ce que le contenu soit utilisé dans le référentiel
        mondial des bonnes pratiques d'IDMC et d'autres produits
        connexes. IDMC se réserve le droit de modifier tout ou
        partie du texte soumis, selon son propre processus d'examen
        et de vérification.`,
    },
    promisingLabel: {
        en: 'What makes this a promising practice? (max 2,000 characters)',
        fr: 'Qu`est-ce qui en fait une pratique prometteuse? (max 2 000 caractères)',
    },
    promisingLabelFr: {
        en: 'Qu`est-ce qui en fait une pratique prometteuse? (max 2 000 caractères)',
        fr: 'Qu`est-ce qui en fait une pratique prometteuse? (max 2 000 caractères)',
    },
    keyLessonsLabel: {
        en: 'Briefly describe the key lessons learned (max 2,000 characters)',
        fr: 'Décrivez brièvement les principaux enseignements tirés (2 000 caractères maximum)',
    },
    keyLessonsLabelFr: {
        en: 'Décrivez brièvement les principaux enseignements tirés (2 000 caractères maximum)',
        fr: 'Décrivez brièvement les principaux enseignements tirés (2 000 caractères maximum)',
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
    addNewGoodPracticeHeading: {
        en: 'Do you have a Good Practice you would like us to review?',
        fr: 'Avez-vous une bonne pratique que vous aimeriez que nous examinions?',
    },
    submitNewGoodPracticeLabel: {
        en: 'Submit a new good practice',
        fr: 'soumettre une nouvelle bonne pratique',
    },
};
