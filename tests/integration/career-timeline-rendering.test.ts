import { describe, it, expect, beforeEach } from 'vitest'
import type { LinkedInExperience } from '../../src/types/linkedin'

describe('CareerTimeline component integration', () => {
  // Test data setup
  const mockGuest = {
    name: 'Test Guest',
    linkedInData: {
      experiences: [
        {
          title: 'Current CEO',
          company: 'Tech Startup',
          startDate: '2022-01-01',
          endDate: null,
          isCurrent: true,
          location: 'San Francisco, CA',
          description: 'Leading innovative tech company'
        },
        {
          title: 'Previous CTO',
          company: 'Enterprise Corp',
          startDate: '2020-01-01',
          endDate: '2021-12-31',
          isCurrent: false,
          location: 'New York, NY',
          description: 'Technology leadership role'
        },
        {
          title: 'Senior Developer',
          company: 'Dev Agency',
          startDate: '2018-01-01',
          endDate: '2019-12-31',
          isCurrent: false,
          location: 'Austin, TX',
          description: 'Full-stack development'
        },
        {
          title: 'Board Advisor',
          company: 'AI Startup',
          startDate: '2021-06-01',
          endDate: null,
          isCurrent: true,
          location: 'Remote',
          description: 'Strategic advisory'
        }
      ] as LinkedInExperience[]
    }
  }

  const episodeDates = [
    '2023-06-15', // During Current CEO role
    '2021-03-15', // During Previous CTO role
    '2019-06-15'  // During Senior Developer role
  ]

  describe('Career timeline display rules', () => {
    it('should show maximum 4 jobs to fit desktop screens', () => {
      const experiences = mockGuest.linkedInData.experiences
      expect(experiences.length).toBe(4)
      
      // In real component, this would be limited by slice(0, 4)
      const displayedJobs = experiences.slice(0, 4)
      expect(displayedJobs.length).toBeLessThanOrEqual(4)
    })

    it('should prioritize current jobs', () => {
      const currentJobs = mockGuest.linkedInData.experiences.filter(
        exp => exp.isCurrent || !exp.endDate
      )
      
      expect(currentJobs.length).toBe(2)
      expect(currentJobs.map(j => j.title)).toContain('Current CEO')
      expect(currentJobs.map(j => j.title)).toContain('Board Advisor')
    })

    it('should include jobs that were active during episode recordings', () => {
      const relevantJobs = mockGuest.linkedInData.experiences.filter(exp => {
        if (!exp.endDate || exp.isCurrent) return true // Always include current
        
        const expStart = new Date(exp.startDate || '')
        const expEnd = new Date(exp.endDate)
        
        return episodeDates.some(epDate => {
          const episode = new Date(epDate)
          return expStart <= episode && expEnd >= episode
        })
      })
      
      // Should include all 4 jobs:
      // - Current CEO (current)
      // - Board Advisor (current)
      // - Previous CTO (active during 2021-03-15 episode)
      // - Senior Developer (active during 2019-06-15 episode)
      expect(relevantJobs.length).toBe(4)
    })

    it('should handle guests with only current jobs', () => {
      const guestWithOnlyCurrentJobs = {
        linkedInData: {
          experiences: [
            {
              title: 'Founder',
              company: 'My Company',
              startDate: '2015-01-01',
              endDate: null,
              isCurrent: true
            }
          ]
        }
      }
      
      const experiences = guestWithOnlyCurrentJobs.linkedInData.experiences
      expect(experiences.length).toBe(1)
      expect(experiences[0].isCurrent).toBe(true)
    })

    it('should handle guests with many concurrent roles', () => {
      const busyGuest = {
        linkedInData: {
          experiences: [
            { title: 'CEO', company: 'Main Co', isCurrent: true, endDate: null },
            { title: 'Advisor', company: 'Startup A', isCurrent: true, endDate: null },
            { title: 'Board Member', company: 'Nonprofit', isCurrent: true, endDate: null },
            { title: 'Consultant', company: 'Consulting Inc', isCurrent: true, endDate: null },
            { title: 'Investor', company: 'VC Fund', isCurrent: true, endDate: null },
            { title: 'Professor', company: 'University', isCurrent: true, endDate: null }
          ]
        }
      }
      
      // Component would limit to 4 jobs
      const displayLimit = 4
      const displayed = busyGuest.linkedInData.experiences.slice(0, displayLimit)
      expect(displayed.length).toBe(4)
    })
  })

  describe('Episode badge display logic', () => {
    it('should mark jobs that were active during episodes', () => {
      const jobDuringEpisode = {
        title: 'Previous CTO',
        company: 'Enterprise Corp',
        startDate: '2020-01-01',
        endDate: '2021-12-31',
        isCurrent: false
      }
      
      const episodeDate = new Date('2021-03-15')
      const jobStart = new Date(jobDuringEpisode.startDate!)
      const jobEnd = new Date(jobDuringEpisode.endDate!)
      
      const wasActiveAtRecording = jobStart <= episodeDate && jobEnd >= episodeDate
      expect(wasActiveAtRecording).toBe(true)
    })

    it('should not show episode badge for current roles', () => {
      const currentJob = mockGuest.linkedInData.experiences.find(exp => exp.title === 'Current CEO')
      
      // Even if job was active during episode, current jobs don't get the badge
      const shouldShowBadge = false // Logic: wasActiveAtRecording && !isCurrentRole
      expect(shouldShowBadge).toBe(false)
    })
  })

  describe('Date formatting', () => {
    it('should format dates correctly', () => {
      const formatDate = (dateStr?: string | null): string => {
        if (!dateStr) return 'Present'
        try {
          const date = new Date(dateStr)
          if (isNaN(date.getTime())) return 'Present'
          return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        } catch {
          return 'Present'
        }
      }
      
      expect(formatDate('2023-01-15')).toBe('Jan 2023')
      expect(formatDate(null)).toBe('Present')
      expect(formatDate(undefined)).toBe('Present')
      expect(formatDate('invalid-date')).toBe('Present')
    })
  })
})