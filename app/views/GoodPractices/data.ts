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

export const goodPracticesList: { title: string; description: string, image: string }[] = [
    {
        title: 'Gaibanda model for Community-Driven Disability-inclusive Disaster Risk Reduction (CDDiDRR)',
        description: `
<p>The project focuses on building resilience and reducing disaster risks for people with disabilities through a community-based development approach, with a view to preventing displacement and ensuring people with disabilities are included in disaster risk reduction and response planning. The communities where this project was implemented were already facing the impacts of climate change, with sudden-onset disasters occurring more frequently and at higher intensity, including a severe flood in 2017 which displaced many and caused widespread damage to crops and livelihoods.</p>
<p>The main activities involved working with the community to map the houses of people with disabilities so that they could help them to evacuate during a disaster; building the leadership capacity of people with disabilities to enable them to advocate for themselves with the government, form their own associations and develop their own projects; and providing support for livelihoods opportunities to increase the resilience and economic stability of people with disabilities, raising their status within the community and helping them to participate in mainstream activities. Throughout the project they worked with local government to raise awareness of issues facing people with disabilities and promote their inclusion in local DRR initiatives.</p>
        `,
        image: 'https://images.unsplash.com/photo-1650829726246-a9c41b749da1?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80',
    },
    {
        title: 'CityAdapt - Building climate resilience of urban systems through Ecosystem-based Adaptation (EbA)',
        description: `
<p>The International Panel on Climate Change (IPCC) has identified El Salvador as one of the countries most sensitive to climate change, and it has already seen a dramatic increase in extreme climatic events from one per decade in the seventies to eight in the past decade.1 In San Salvador, the urban areas are both experiencing the effects of climate change while also receiving an inflow of people displaced from rural areas due to the impacts, including increased frequency and intensity of hurricanes destroying livelihoods. Sudden-onset disasters, loss of livelihoods and food insecurity are all known to increase the risk of displacement. The project focuses on building the resilience of urban areas to climate change through community-based projects that improve natural resource management and address land degradation, with a view to reducing flood risk and preventing displacement.</p>
        `,
        image: 'https://images.unsplash.com/photo-1650816086405-a63b99d86ce1?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=626&q=80',
    },
    {
        title: 'Midnimo I: Achieving local solutions to displacement crises in Somalia',
        description: `
<p>The project supported government counterparts to lead the mobilisation of community-based planning processes to identify and prioritise solutions to address the multidimensional factors contributing to displacement. It brought together various groups within the community, including displaced people, returnees, women, youth and other host community members to collectively analyse the context and identify initiatives to address the challenges faced. Some of these initiatives included access to basic services in places affected by displacement, such as water and sanitation projects, access to education, health services, roads, all of which would improve the absorptive capacity of host communities and reduce conflict over resources in areas affected by displacement.</p>
        `,
        image: 'https://images.unsplash.com/photo-1650843596168-3c68dbaf0b99?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80',
    },
    {
        title: 'CBM - ‘Survival Yard’ project in Niger, West Africa',
        description: `
<p>The project was created in 2005, when Niger was facing a large-scale food security crisis driven by drought and locust invasion. Many people had been displaced due to food scarcity and lack of agricultural livelihoods opportunities in their villages, leaving behind people with disabilities. The CBM team developed a package of activities to strengthen the resilience of people with disabilities and their families to face food security shocks and thereby prevent displacement. The project involved 4 types of activities: the first was the garden of 625m² where the household can grow diverse crops; the second component was the distribution of 3 goats to each household, which they could sell for food if they faced shocks, as well as a donkey and cart; The third is water points: a well was provided for the beneficiaries of the garden and the local community to have access to water; The final component is hygiene: toilets were installed in the houses of people with disabilities so that they were not reliant on others to help them access the communal latrines.</p>
        `,
        image: 'https://images.unsplash.com/photo-1650656005408-845911c7f3f3?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1374&q=80',
    },
    {
        title: 'Strengthening of DRR capacity and community-based management of the mangrove forest ecosystem for adaptation to climate change in high-risk areas of Rakhine State, Myanmar',
        description: `
<p>The project focused on developing a community-based model for building resilience to climate change and disasters, enhancing the communities’ ability to prevent and prepare for future disaster events. This involved the development of disaster preparedness plans and early warning systems, as well as mitigation measures in the form of integrated mangrove afforestation to improve coastal protection and reduce exposure to storm surges and flooding. The project targeted extremely poor and disaster-prone villages in the region, with over 60% of project beneficiaries badly affected by disasters prior to the project, the majority of which had their houses damaged or destroyed. Given the high level of exposure to sudden-onset disasters and the effects of climate change, including cyclones, flooding, salinisation and drought, it is reasonable to expect that the project’s efforts to increase the resilience of communities to these hazards will both reduce the risk and impact of future displacement linked with climate change, although this was not a specific objective of the intervention.</p>
        `,
        image: 'https://images.unsplash.com/photo-1650518223112-b5803610fd67?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80',
    },
    {
        title: 'Sahel Adaptive Social Protection Program (SASPP)',
        description: `
<p>The program was created in 2014 to support the design and implementation of adaptive social protection programs and systems in the six Sahel countries (Burkina Faso, Chad, Mali, Mauritania, Niger, and Senegal). The objective of the program is to increase access to adaptive social protection for poor and vulnerable populations to build resilience and increase the capacity of individuals, households and communities to anticipate, absorb and recover from climatic shocks, conflict and forced displacement. The Sahel is particularly vulnerable to the effects of climate change, with increasingly frequent and severe droughts and less predictable rainy seasons, and recent survey data from the program found 40 percent of households in the region reported being impacted by climate shocks. This, coupled with conflict and insecurity, is resulting in increased numbers of internally displaced people across the region. The program has a dedicated thematic focus on fragility and forced displacement which seeks to identify and implement solutions to social protection in such challenging contexts.</p>
        `,
        image: 'https://images.unsplash.com/photo-1650374636041-db6c1e0dfb8f?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80',
    },
];

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
