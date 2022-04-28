interface GoodPractice {
    title: string;
    description: string;

    lastUpdated: string;

    country: string;
    region: string;
    implementingEntity: string;
    ccDriver: string;
    trigger: string;
    displacementImpact: string;
    interventionPhase: string;
    timeframe: string;
    databaseRef: number;

    contactEmail: string,
    contactFormLink: string,
}

// eslint-disable-next-line import/prefer-default-export
export const goodPractice: GoodPractice = {
    title: 'Gaibanda model for Community-Driven Disability-inclusive Disaster Risk Reduction (CDDiDRR)',
    description: `
<p>
<b>Description:</b> The project focuses on building resilience and reducing disaster risks for people with disabilities through a community-based development approach, with a view to preventing displacement and ensuring people with disabilities are included in disaster risk reduction and response planning. The communities where this project was implemented were already facing the impacts of climate change, with sudden-onset disasters occurring more frequently and at higher intensity, including a severe flood in 2017 which displaced many and caused widespread damage to crops and livelihoods.
</p>
<p>
The main activities involved working with the community to map the houses of people with disabilities so that they could help them to evacuate during a disaster; building the leadership capacity of people with disabilities to enable them to advocate for themselves with the government, form their own associations and develop their own projects; and providing support for livelihoods opportunities to increase the resilience and economic stability of people with disabilities, raising their status within the community and helping them to participate in mainstream activities. Throughout the project they worked with local government to raise awareness of issues facing people with disabilities and promote their inclusion in local DRR initiatives.
</p>
<p>
<b>Impact:</b> The livelihoods component of the project meant that people with disabilities were able to generate their own income, building their resilience and confidence to participate in mainstream activities. Women with disabilities and female-headed households were prioritised for livelihoods support, including skill development, seasonal seed support, business management and tailoring. The establishment of community-based organisations for people with disabilities (OPD) meant that project participants could self-organise and develop their own projects, raise their own funding and sustain the activities beyond the project implementation period.
</p>
<p>
<b>Innovation:</b> The inclusive community-based development model put people with disabilities at the centre and supported them to lead. This ensured the project was guided by their needs and priorities, while also raising their status within the community and countering the longstanding stigma attached to disability in Bangladesh. This approach was made possible by the long-term duration of the project, as people with disabilities were trained in leadership and advocacy and supported to form their own associations, enabling them to advocate on their own behalf with local government and in some cases national government. Finally, the project built a prototype multipurpose evacuation boat which was then replicated by the local government. They have built 60 of these to evacuate people with disabilities, which are managed the local community.
</p>
<p>
<p>Lessons learned:</p> Regular monitoring visits to the project areas is important to ensure any gaps are identified early and opportunities for connecting people with disabilities and their associations to relevant government processes. In terms of replicating the project, while some aspects were easier due to the previous experience, such as helping people with disabilities to establish associations and engage with the local government, the contextual differences should not be underestimated. The new region where the initiative is being implemented is affected by different types of hazards, particularly cyclones, and requires more substantial investment in transport and communications infrastructure to facilitate the project.
</p>
<p>
<b>Links:</b> <a href="https://www.cbm.org/fileadmin/user_upload/DRR_Booklet_FINAL_-_Online_10MB.pdf">https://www.cbm.org/fileadmin/user_upload/DRR_Booklet_FINAL_-_Online_10MB.pdf</a>
</p>
    `,
    country: 'Bangladesh',
    region: 'South Asia',
    implementingEntity: 'Centre for Disability in Development (CDD) and CBM',
    ccDriver: 'Increasing Temperatures',
    trigger: 'Sudden-onset disasters',
    displacementImpact: 'Security; Livelihoods',
    interventionPhase: 'DDR Strategies',
    timeframe: '2009-2021',
    databaseRef: 29,

    lastUpdated: '2021-04-26T09:55:13.093Z',

    contactEmail: 'dev@datafriendlyspace.org',
    contactFormLink: 'https://google.com',
};

export const gallery: {
    id: number;
    image: string;
    description: string;
}[] = [
    {
        id: 1,
        image: 'https://images.unsplash.com/photo-1650829726246-a9c41b749da1?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80',
        description: `
<p>The project focuses on building resilience and reducing disaster risks for people with disabilities through a community-based development approach, with a view to preventing displacement and ensuring people with disabilities are included in disaster risk reduction and response planning. The communities where this project was implemented were already facing the impacts of climate change, with sudden-onset disasters occurring more frequently and at higher intensity, including a severe flood in 2017 which displaced many and caused widespread damage to crops and livelihoods.</p>
<p>The main activities involved working with the community to map the houses of people with disabilities so that they could help them to evacuate during a disaster; building the leadership capacity of people with disabilities to enable them to advocate for themselves with the government, form their own associations and develop their own projects; and providing support for livelihoods opportunities to increase the resilience and economic stability of people with disabilities, raising their status within the community and helping them to participate in mainstream activities. Throughout the project they worked with local government to raise awareness of issues facing people with disabilities and promote their inclusion in local DRR initiatives.</p>
        `,
    },
    {
        id: 2,
        description: `
<p>The International Panel on Climate Change (IPCC) has identified El Salvador as one of the countries most sensitive to climate change, and it has already seen a dramatic increase in extreme climatic events from one per decade in the seventies to eight in the past decade.1 In San Salvador, the urban areas are both experiencing the effects of climate change while also receiving an inflow of people displaced from rural areas due to the impacts, including increased frequency and intensity of hurricanes destroying livelihoods. Sudden-onset disasters, loss of livelihoods and food insecurity are all known to increase the risk of displacement. The project focuses on building the resilience of urban areas to climate change through community-based projects that improve natural resource management and address land degradation, with a view to reducing flood risk and preventing displacement.</p>
        `,
        image: 'https://images.unsplash.com/photo-1650816086405-a63b99d86ce1?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=626&q=80',
    },
    {
        id: 3,
        description: `
<p>The project supported government counterparts to lead the mobilisation of community-based planning processes to identify and prioritise solutions to address the multidimensional factors contributing to displacement. It brought together various groups within the community, including displaced people, returnees, women, youth and other host community members to collectively analyse the context and identify initiatives to address the challenges faced. Some of these initiatives included access to basic services in places affected by displacement, such as water and sanitation projects, access to education, health services, roads, all of which would improve the absorptive capacity of host communities and reduce conflict over resources in areas affected by displacement.</p>
        `,
        image: 'https://images.unsplash.com/photo-1650843596168-3c68dbaf0b99?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80',
    },
    {
        id: 4,
        description: `
<p>The project was created in 2005, when Niger was facing a large-scale food security crisis driven by drought and locust invasion. Many people had been displaced due to food scarcity and lack of agricultural livelihoods opportunities in their villages, leaving behind people with disabilities. The CBM team developed a package of activities to strengthen the resilience of people with disabilities and their families to face food security shocks and thereby prevent displacement. The project involved 4 types of activities: the first was the garden of 625m² where the household can grow diverse crops; the second component was the distribution of 3 goats to each household, which they could sell for food if they faced shocks, as well as a donkey and cart; The third is water points: a well was provided for the beneficiaries of the garden and the local community to have access to water; The final component is hygiene: toilets were installed in the houses of people with disabilities so that they were not reliant on others to help them access the communal latrines.</p>
        `,
        image: 'https://images.unsplash.com/photo-1650656005408-845911c7f3f3?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1374&q=80',
    },
    {
        id: 5,
        description: `
<p>The project focused on developing a community-based model for building resilience to climate change and disasters, enhancing the communities’ ability to prevent and prepare for future disaster events. This involved the development of disaster preparedness plans and early warning systems, as well as mitigation measures in the form of integrated mangrove afforestation to improve coastal protection and reduce exposure to storm surges and flooding. The project targeted extremely poor and disaster-prone villages in the region, with over 60% of project beneficiaries badly affected by disasters prior to the project, the majority of which had their houses damaged or destroyed. Given the high level of exposure to sudden-onset disasters and the effects of climate change, including cyclones, flooding, salinisation and drought, it is reasonable to expect that the project’s efforts to increase the resilience of communities to these hazards will both reduce the risk and impact of future displacement linked with climate change, although this was not a specific objective of the intervention.</p>
        `,
        image: 'https://images.unsplash.com/photo-1650518223112-b5803610fd67?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80',
    },
    {
        id: 6,
        description: `
<p>The program was created in 2014 to support the design and implementation of adaptive social protection programs and systems in the six Sahel countries (Burkina Faso, Chad, Mali, Mauritania, Niger, and Senegal). The objective of the program is to increase access to adaptive social protection for poor and vulnerable populations to build resilience and increase the capacity of individuals, households and communities to anticipate, absorb and recover from climatic shocks, conflict and forced displacement. The Sahel is particularly vulnerable to the effects of climate change, with increasingly frequent and severe droughts and less predictable rainy seasons, and recent survey data from the program found 40 percent of households in the region reported being impacted by climate shocks. This, coupled with conflict and insecurity, is resulting in increased numbers of internally displaced people across the region. The program has a dedicated thematic focus on fragility and forced displacement which seeks to identify and implement solutions to social protection in such challenging contexts.</p>
        `,
        image: 'https://images.unsplash.com/photo-1650374636041-db6c1e0dfb8f?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80',
    },
];
