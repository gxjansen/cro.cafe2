import { describe, it, expect } from 'vitest'
import type { LinkedInExperience } from '../../src/types/linkedin'

// Mock the filtering logic from CareerTimeline component
function filterRelevantExperiences(
  experiences: LinkedInExperience[],
  episodeDates?: string[]
): LinkedInExperience[] {
  // Sort experiences by start date (most recent first)
  const sortedExperiences = [...experiences].sort((a, b) => {
    const dateA = a.startDate ? new Date(a.startDate).getTime() : 0
    const dateB = b.startDate ? new Date(b.startDate).getTime() : 0
    return dateB - dateA
  })

  // Always include current jobs
  const currentJobs = sortedExperiences.filter(exp => !exp.endDate || exp.isCurrent)
  
  // If we have episode dates, find jobs active during recordings
  const episodeTimeJobs = episodeDates ? sortedExperiences.filter(exp => {
    // Skip if already included as current job
    if (!exp.endDate || exp.isCurrent) return false
    
    const expStartDate = exp.startDate ? new Date(exp.startDate) : null
    const expEndDate = exp.endDate ? new Date(exp.endDate) : null
    
    // Check if this job was active during any episode recording
    return episodeDates.some(episodeDate => {
      const epDate = new Date(episodeDate)
      
      // Job was active if:
      // - It started before or on the episode date AND
      // - It ended after the episode date
      const startedBeforeEpisode = !expStartDate || (expStartDate <= epDate)
      const endedAfterEpisode = !expEndDate || (expEndDate >= epDate)
      
      return startedBeforeEpisode && endedAfterEpisode
    })
  }) : []
  
  // Combine and deduplicate
  const allRelevantJobs = [...currentJobs, ...episodeTimeJobs]
  const uniqueJobs = allRelevantJobs.filter((exp, index, self) => 
    self.findIndex(e => 
      e.title === exp.title && 
      e.company === exp.company &&
      e.startDate === exp.startDate
    ) === index
  )
  
  // Sort by start date (most recent first) and limit to 4
  return uniqueJobs.sort((a, b) => {
    const dateA = a.startDate ? new Date(a.startDate).getTime() : Date.now()
    const dateB = b.startDate ? new Date(b.startDate).getTime() : Date.now()
    return dateB - dateA
  }).slice(0, 4)
}

describe('CareerTimeline filtering logic', () => {
  const mockExperiences: LinkedInExperience[] = [
    {
      title: 'Current CEO',
      company: 'Current Company',
      startDate: '2022-01-01',
      endDate: null,
      isCurrent: true,
      location: 'New York',
      description: 'Leading the company'
    },
    {
      title: 'Previous CTO',
      company: 'Previous Company',
      startDate: '2020-01-01',
      endDate: '2021-12-31',
      isCurrent: false,
      location: 'San Francisco',
      description: 'Tech leadership'
    },
    {
      title: 'Old Manager',
      company: 'Old Company',
      startDate: '2018-01-01',
      endDate: '2019-12-31',
      isCurrent: false,
      location: 'Boston',
      description: 'Management role'
    },
    {
      title: 'Board Member',
      company: 'Advisory Board',
      startDate: '2019-06-01',
      endDate: null,
      isCurrent: true,
      location: 'Remote',
      description: 'Advisory role'
    },
    {
      title: 'Consultant',
      company: 'Consulting Firm',
      startDate: '2021-01-01',
      endDate: '2021-06-30',
      isCurrent: false,
      location: 'Chicago',
      description: 'Consulting work'
    }
  ]

  it('should include all current jobs', () => {
    const result = filterRelevantExperiences(mockExperiences, [])
    
    const currentJobs = result.filter(exp => exp.isCurrent || !exp.endDate)
    expect(currentJobs).toHaveLength(2)
    expect(currentJobs.map(j => j.title)).toContain('Current CEO')
    expect(currentJobs.map(j => j.title)).toContain('Board Member')
  })

  it('should include jobs active during episode recordings', () => {
    const episodeDates = ['2021-03-15', '2020-06-15'] // During CTO and Consultant roles
    const result = filterRelevantExperiences(mockExperiences, episodeDates)
    
    // Should include current jobs + CTO role (active during 2020-06-15) + Consultant role (active during 2021-03-15)
    expect(result.map(j => j.title)).toContain('Current CEO')
    expect(result.map(j => j.title)).toContain('Board Member')
    expect(result.map(j => j.title)).toContain('Previous CTO')
    expect(result.map(j => j.title)).toContain('Consultant')
    expect(result).toHaveLength(4)
  })

  it('should not include jobs that ended before all episodes', () => {
    const episodeDates = ['2021-03-15', '2022-06-15'] // After Old Manager role ended
    const result = filterRelevantExperiences(mockExperiences, episodeDates)
    
    // Should not include Old Manager role (ended 2019-12-31)
    expect(result.map(j => j.title)).not.toContain('Old Manager')
  })

  it('should handle multiple concurrent jobs correctly', () => {
    const concurrentExperiences: LinkedInExperience[] = [
      {
        title: 'Full-time Developer',
        company: 'Tech Corp',
        startDate: '2020-01-01',
        endDate: null,
        isCurrent: true
      },
      {
        title: 'Part-time Instructor',
        company: 'University',
        startDate: '2019-01-01',
        endDate: null,
        isCurrent: true
      },
      {
        title: 'Volunteer Board Member',
        company: 'Non-profit',
        startDate: '2018-01-01',
        endDate: null,
        isCurrent: true
      },
      {
        title: 'Freelance Consultant',
        company: 'Self-employed',
        startDate: '2021-01-01',
        endDate: null,
        isCurrent: true
      },
      {
        title: 'Advisory Role',
        company: 'Startup',
        startDate: '2022-01-01',
        endDate: null,
        isCurrent: true
      }
    ]
    
    const result = filterRelevantExperiences(concurrentExperiences, [])
    
    // Should limit to 4 most recent jobs even if all are current
    expect(result).toHaveLength(4)
    expect(result[0].title).toBe('Advisory Role') // Most recent
    expect(result[1].title).toBe('Freelance Consultant')
    expect(result[2].title).toBe('Full-time Developer')
    expect(result[3].title).toBe('Part-time Instructor')
  })

  it('should deduplicate identical jobs', () => {
    const duplicateExperiences: LinkedInExperience[] = [
      {
        title: 'Software Engineer',
        company: 'Tech Company',
        startDate: '2020-01-01',
        endDate: null,
        isCurrent: true
      },
      {
        title: 'Software Engineer',
        company: 'Tech Company',
        startDate: '2020-01-01',
        endDate: null,
        isCurrent: true
      }
    ]
    
    const result = filterRelevantExperiences(duplicateExperiences, [])
    
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Software Engineer')
  })

  it('should sort jobs by start date with most recent first', () => {
    const unsortedExperiences: LinkedInExperience[] = [
      {
        title: 'Job A',
        company: 'Company A',
        startDate: '2019-01-01',
        endDate: null,
        isCurrent: true
      },
      {
        title: 'Job C',
        company: 'Company C',
        startDate: '2021-01-01',
        endDate: null,
        isCurrent: true
      },
      {
        title: 'Job B',
        company: 'Company B',
        startDate: '2020-01-01',
        endDate: null,
        isCurrent: true
      }
    ]
    
    const result = filterRelevantExperiences(unsortedExperiences, [])
    
    expect(result[0].title).toBe('Job C') // 2021 - most recent
    expect(result[1].title).toBe('Job B') // 2020
    expect(result[2].title).toBe('Job A') // 2019 - oldest
  })

  it('should handle jobs with missing dates gracefully', () => {
    const incompleteExperiences: LinkedInExperience[] = [
      {
        title: 'No Start Date Job',
        company: 'Company A',
        startDate: null,
        endDate: '2021-12-31',
        isCurrent: false
      },
      {
        title: 'No End Date Job',
        company: 'Company B',
        startDate: '2020-01-01',
        endDate: null,
        isCurrent: false
      },
      {
        title: 'Complete Job',
        company: 'Company C',
        startDate: '2019-01-01',
        endDate: '2020-12-31',
        isCurrent: false
      }
    ]
    
    const episodeDates = ['2020-06-15']
    const result = filterRelevantExperiences(incompleteExperiences, episodeDates)
    
    // No End Date Job should be included (treated as current)
    expect(result.map(j => j.title)).toContain('No End Date Job')
    // Complete Job was active during episode
    expect(result.map(j => j.title)).toContain('Complete Job')
    // No Start Date Job should be included (assumes it started long ago)
    expect(result.map(j => j.title)).toContain('No Start Date Job')
  })

  it('should return empty array for empty experiences', () => {
    const result = filterRelevantExperiences([], ['2021-01-01'])
    expect(result).toEqual([])
  })

  it('should handle experiences without episode dates', () => {
    const result = filterRelevantExperiences(mockExperiences, undefined)
    
    // Should only include current jobs when no episode dates provided
    const currentJobs = result.filter(exp => exp.isCurrent || !exp.endDate)
    expect(currentJobs).toHaveLength(2)
    expect(result).toHaveLength(2)
  })
})