interface GoodPracticeMeta {
    totalCount: number;
    description: string | undefined;
    goodPracticeLink: string,
    contactEmail: string,
    contactFormLink: string,
    faqs: {
        id: number;
        title: string;
        description: string;
    }[];
}

export const goodPracticeMeta: GoodPracticeMeta = {
    totalCount: 50,
    description: `
<p>
Welcome to the IDMC Global Repository for Good Practices
</p>
<p>
The Internal Displacement Monitoring Center is investing in more systematically monitoring national and global efforts to reduce the risk, scale and negative impacts of internal displacement. This Global Repository of Good Practices will compile, share and evaluate parctices, policy and programmatic approaches to internal displacement with the aim of creating an exchange platform for goverments adn other interested decision-makers to learn from each other, in line with the recommendations by the High-Level Panel on Internal Displacement to establish platforms for state-to-state exchange.
</p>
    `,
    goodPracticeLink: 'https://google.com',
    contactEmail: 'dev@datafriendlyspace.org',
    contactFormLink: 'https://google.com',
    faqs: [
        {
            id: 1,
            title: 'How should I use this repository?',
            description: 'To help you access the information you need, the good practices stored in this repository can be filtered according to various variables such as country, type of good practice, or driver of displacement. Once you have specified your search criteria, relevant good practices will appear. In each case, we provide a short description of the good practice alongside information of impact, innovation and lessons learned. You will also find links to further resources in case you want to find out more.',
        },
        {
            id: 2,
            title: 'What types of practices are included?',
            description: '',
        },
        {
            id: 3,
            title: 'What constitutes a good practice?',
            description: '',
        },
        {
            id: 4,
            title: 'Can I submit a good practice?',
            description: '',
        },
    ],
};

export const goodPracticesGeoJson: GeoJSON.FeatureCollection<
    GeoJSON.Point,
    { status: 'approved' | 'under_review' | 'recently_submitted' }
> = {
    type: 'FeatureCollection',
    features: [
        {
            id: 1,
            type: 'Feature',
            properties: {
                status: 'approved',
            },
            geometry: {
                type: 'Point',
                coordinates: [
                    20.390625,
                    27.994401411046148,
                ],
            },
        },
        {
            id: 2,
            type: 'Feature',
            properties: {
                status: 'under_review',
            },
            geometry: {
                type: 'Point',
                coordinates: [
                    44.6484375,
                    23.885837699862005,
                ],
            },
        },
        {
            id: 3,
            type: 'Feature',
            properties: {
                status: 'under_review',
            },
            geometry: {
                type: 'Point',
                coordinates: [
                    22.148437499999996,
                    -31.05293398570514,
                ],
            },
        },
        {
            id: 4,
            type: 'Feature',
            properties: {
                status: 'recently_submitted',
            },
            geometry: {
                type: 'Point',
                coordinates: [
                    31.640625,
                    49.15296965617042,
                ],
            },
        },
        {
            id: 5,
            type: 'Feature',
            properties: {
                status: 'under_review',
            },
            geometry: {
                type: 'Point',
                coordinates: [
                    -3.8671874999999996,
                    39.36827914916014,
                ],
            },
        },
        {
            id: 6,
            type: 'Feature',
            properties: {
                status: 'recently_submitted',
            },
            geometry: {
                type: 'Point',
                coordinates: [
                    1.9335937499999998,
                    46.98025235521883,
                ],
            },
        },
        {
            id: 7,
            type: 'Feature',
            properties: {
                status: 'under_review',
            },
            geometry: {
                type: 'Point',
                coordinates: [
                    -0.615234375,
                    52.64306343665892,
                ],
            },
        },
        {
            id: 8,
            type: 'Feature',
            properties: {
                status: 'recently_submitted',
            },
            geometry: {
                type: 'Point',
                coordinates: [
                    9.84375,
                    51.069016659603896,
                ],
            },
        },
        {
            id: 9,
            type: 'Feature',
            properties: {
                status: 'approved',
            },
            geometry: {
                type: 'Point',
                coordinates: [
                    12.65625,
                    42.5530802889558,
                ],
            },
        },
        {
            id: 10,
            type: 'Feature',
            properties: {
                status: 'under_review',
            },
            geometry: {
                type: 'Point',
                coordinates: [
                    15.732421875,
                    49.439556958940855,
                ],
            },
        },
        {
            id: 11,
            type: 'Feature',
            properties: {
                status: 'recently_submitted',
            },
            geometry: {
                type: 'Point',
                coordinates: [
                    19.951171875,
                    51.781435604431195,
                ],
            },
        },
        {
            id: 12,
            type: 'Feature',
            properties: {
                status: 'approved',
            },
            geometry: {
                type: 'Point',
                coordinates: [
                    78.046875,
                    22.024545601240337,
                ],
            },
        },
        {
            id: 13,
            type: 'Feature',
            properties: {
                status: 'under_review',
            },
            geometry: {
                type: 'Point',
                coordinates: [
                    84.19921875,
                    27.761329874505233,
                ],
            },
        },
        {
            id: 14,
            type: 'Feature',
            properties: {
                status: 'approved',
            },
            geometry: {
                type: 'Point',
                coordinates: [
                    64.775390625,
                    33.063924198120645,
                ],
            },
        },
        {
            id: 15,
            type: 'Feature',
            properties: {
                status: 'approved',
            },
            geometry: {
                type: 'Point',
                coordinates: [
                    101.6015625,
                    4.390228926463396,
                ],
            },
        },
        {
            id: 16,
            type: 'Feature',
            properties: {
                status: 'under_review',
            },
            geometry: {
                type: 'Point',
                coordinates: [
                    -101.25,
                    39.095962936305476,
                ],
            },
        },
        {
            id: 17,
            type: 'Feature',
            properties: {
                status: 'recently_submitted',
            },
            geometry: {
                type: 'Point',
                coordinates: [
                    -58.18359375,
                    -23.24134610238612,
                ],
            },
        },
    ],
};
