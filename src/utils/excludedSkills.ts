/**
 * List of skills that are excluded from display because they are inherent/implicit
 * for all CRO.CAFE guests. These skills are fundamental to the field and don't
 * provide differentiating value when displayed.
 */
export const EXCLUDED_SKILLS = [
  'CRO',
  'Conversion Rate Optimization',
  'Conversion Optimization',
  'A/B Testing',
  'AB Testing',
  'Split Testing',
  'Multivariate Testing',
  'Experimentation',
  'Testing',
  'Optimization'
]

/**
 * Check if a skill should be excluded from display
 * @param skill - The skill to check
 * @returns true if the skill should be excluded, false otherwise
 */
export function isExcludedSkill(skill: string): boolean {
  const normalizedSkill = skill.toLowerCase().trim()
  return EXCLUDED_SKILLS.some(excluded =>
    normalizedSkill === excluded.toLowerCase() ||
    normalizedSkill === excluded.toLowerCase().replace(/\s+/g, '') // Handle variations without spaces
  )
}

/**
 * Filter out excluded skills from an array
 * @param skills - Array of skills to filter
 * @returns Filtered array without excluded skills
 */
export function filterExcludedSkills(skills: string[]): string[] {
  return skills.filter(skill => !isExcludedSkill(skill))
}