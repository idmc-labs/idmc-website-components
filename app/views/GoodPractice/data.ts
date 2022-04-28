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
<b>Links:</b> https://www.cbm.org/fileadmin/user_upload/DRR_Booklet_FINAL_-_Online_10MB.pdf
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
