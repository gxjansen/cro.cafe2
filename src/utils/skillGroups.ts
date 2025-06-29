/**
 * Skill grouping taxonomy for CRO.CAFE guest expertise
 * Groups related skills while maintaining precision for specialized CRO field
 */

export interface SkillGroup {
  id: string;
  name: string;
  description: string;
  icon?: string;
  skills: string[];
  relatedGroups?: string[];
}

export interface SkillRelation {
  skill: string;
  relatedSkills: string[];
}

// Main skill groups based on co-occurrence patterns in guest data
export const SKILL_GROUPS: SkillGroup[] = [
  {
    id: 'analytics',
    name: 'Analytics & Measurement',
    description: 'Data analysis, web analytics, and measurement tools',
    icon: '📊',
    skills: [
      'Web Analytics',
      'Google Analytics',
      'Analytics',
      'Data Analysis',
      'Marketing Analytics',
      'Adobe Analytics',
      'Data Analytics',
      'Business Intelligence',
      'Metrics',
      'KPIs'
    ],
    relatedGroups: ['technical', 'strategy']
  },
  {
    id: 'channels',
    name: 'Digital Marketing Channels',
    description: 'Various digital marketing channels and tactics',
    icon: '📢',
    skills: [
      'SEO',
      'Search Engine Optimization',
      'SEM',
      'Search Engine Marketing',
      'PPC',
      'Pay Per Click',
      'Google AdWords',
      'Email Marketing',
      'Content Marketing',
      'Social Media Marketing',
      'Social Media',
      'Mobile Marketing',
      'Affiliate Marketing',
      'Display Advertising',
      'Programmatic Advertising'
    ],
    relatedGroups: ['strategy', 'ecommerce']
  },
  {
    id: 'ux',
    name: 'User Experience & Design',
    description: 'UX, UI, usability, and design principles',
    icon: '🎨',
    skills: [
      'User Experience',
      'UX',
      'Usability',
      'User Interface Design',
      'UI Design',
      'UX Design',
      'User Research',
      'Information Architecture',
      'Interaction Design',
      'Visual Design',
      'Wireframing',
      'Prototyping'
    ],
    relatedGroups: ['technical', 'strategy']
  },
  {
    id: 'strategy',
    name: 'Business & Strategy',
    description: 'Strategic planning, business development, and growth',
    icon: '🎯',
    skills: [
      'Marketing Strategy',
      'Digital Strategy',
      'Business Strategy',
      'Growth Hacking',
      'Brand Management',
      'Product Management',
      'Marketing Management',
      'Strategic Planning',
      'Business Development',
      'Market Research',
      'Marketing Research',
      'Competitive Analysis'
    ],
    relatedGroups: ['analytics', 'ecommerce']
  },
  {
    id: 'ecommerce',
    name: 'E-commerce & Sales',
    description: 'Online sales, e-commerce platforms, and customer acquisition',
    icon: '🛒',
    skills: [
      'E-commerce',
      'Ecommerce',
      'Online Marketing',
      'Lead Generation',
      'Customer Acquisition',
      'Retention Marketing',
      'Customer Retention',
      'Sales',
      'B2B',
      'B2C',
      'Marketplace',
      'Shopping Cart Optimization',
      'Checkout Optimization'
    ],
    relatedGroups: ['channels', 'strategy']
  },
  {
    id: 'technical',
    name: 'Technical Skills',
    description: 'Development, automation, and technical implementation',
    icon: '💻',
    skills: [
      'Web Development',
      'JavaScript',
      'HTML',
      'CSS',
      'Marketing Automation',
      'Tag Management',
      'Google Tag Manager',
      'API Integration',
      'SQL',
      'Python',
      'Technical SEO',
      'Site Speed Optimization'
    ],
    relatedGroups: ['analytics', 'ux']
  },
  {
    id: 'optimization',
    name: 'Optimization & Testing',
    description: 'Conversion optimization, testing, and experimentation',
    icon: '🔬',
    skills: [
      'Funnel Optimization',
      'Landing Page Optimization',
      'Website Optimization',
      'Performance Optimization',
      'Mobile Optimization',
      'Multivariate Testing',
      'Usability Testing',
      'User Testing',
      'Heat Mapping',
      'Session Recording'
    ],
    relatedGroups: ['analytics', 'ux']
  },
  {
    id: 'psychology',
    name: 'Psychology & Behavior',
    description: 'Consumer psychology, behavioral science, and persuasion',
    icon: '🧠',
    skills: [
      'Consumer Psychology',
      'Behavioral Psychology',
      'Persuasion',
      'Neuromarketing',
      'Cognitive Psychology',
      'Social Psychology',
      'Behavioral Economics',
      'Decision Making',
      'User Behavior',
      'Customer Journey'
    ],
    relatedGroups: ['ux', 'strategy']
  }
];

// Related skills mapping for suggestions
export const SKILL_RELATIONS: SkillRelation[] = [
  {
    skill: 'SEO',
    relatedSkills: ['Content Marketing', 'Technical SEO', 'SEM', 'Google Analytics']
  },
  {
    skill: 'User Experience',
    relatedSkills: ['Usability', 'User Research', 'User Interface Design', 'Information Architecture']
  },
  {
    skill: 'Google Analytics',
    relatedSkills: ['Web Analytics', 'Data Analysis', 'Tag Management', 'Google Tag Manager']
  },
  {
    skill: 'E-commerce',
    relatedSkills: ['Online Marketing', 'Shopping Cart Optimization', 'Customer Acquisition', 'Retention Marketing']
  },
  {
    skill: 'PPC',
    relatedSkills: ['SEM', 'Google AdWords', 'Display Advertising', 'Landing Page Optimization']
  },
  {
    skill: 'Email Marketing',
    relatedSkills: ['Marketing Automation', 'Lead Generation', 'Customer Retention', 'Content Marketing']
  }
];

/**
 * Get the group(s) a skill belongs to
 */
export function getSkillGroups(skill: string): SkillGroup[] {
  const normalizedSkill = skill.toLowerCase().trim();
  return SKILL_GROUPS.filter(group => 
    group.skills.some(groupSkill => 
      groupSkill.toLowerCase() === normalizedSkill
    )
  );
}

/**
 * Get all skills in a group
 */
export function getGroupSkills(groupId: string): string[] {
  const group = SKILL_GROUPS.find(g => g.id === groupId);
  return group ? group.skills : [];
}

/**
 * Get related skills for a given skill
 */
export function getRelatedSkills(skill: string): string[] {
  const relation = SKILL_RELATIONS.find(r => 
    r.skill.toLowerCase() === skill.toLowerCase()
  );
  return relation ? relation.relatedSkills : [];
}

/**
 * Check if a skill matches any skill in a group
 */
export function skillMatchesGroup(skill: string, groupId: string): boolean {
  const groupSkills = getGroupSkills(groupId);
  const normalizedSkill = skill.toLowerCase().trim();
  
  return groupSkills.some(groupSkill => 
    normalizedSkill.includes(groupSkill.toLowerCase()) ||
    groupSkill.toLowerCase().includes(normalizedSkill)
  );
}

/**
 * Get a display-friendly group name with icon
 */
export function getGroupDisplay(groupId: string): string {
  const group = SKILL_GROUPS.find(g => g.id === groupId);
  return group ? `${group.icon || ''} ${group.name}`.trim() : groupId;
}

/**
 * Count guests that have skills in a specific group
 */
export function countGuestsInGroup(guests: any[], groupId: string): number {
  const groupSkills = getGroupSkills(groupId);
  
  return guests.filter(guest => {
    if (!guest.data.linkedin_skills) return false;
    
    const guestSkills = typeof guest.data.linkedin_skills === 'string'
      ? guest.data.linkedin_skills.toLowerCase()
      : '';
      
    return groupSkills.some(skill => 
      guestSkills.includes(skill.toLowerCase())
    );
  }).length;
}