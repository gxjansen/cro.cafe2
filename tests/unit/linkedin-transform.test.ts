import { describe, it, expect } from 'vitest'
import { transformLinkedInData, type LinkedInDataRaw } from '../../src/types/linkedin'

describe('LinkedIn Data Transformation', () => {
  it('should parse dates from caption fields', () => {
    const rawData: LinkedInDataRaw = {
      linkedin_experiences: JSON.stringify([
        {
          title: "CEO",
          subtitle: "Wynter · Full-time",
          caption: "Jan 2021 - Present   4 yrs 6 mos",
          metadata: "Austin, Texas, United States",
          breakdown: false
        }
      ])
    }

    const result = transformLinkedInData(rawData)
    
    expect(result.experiences).toHaveLength(1)
    expect(result.experiences[0].startDate).toBe('2021-01-01')
    expect(result.experiences[0].endDate).toBeNull()
    expect(result.experiences[0].isCurrent).toBe(true)
  })

  it('should handle nested experiences with subComponents', () => {
    const rawData: LinkedInDataRaw = {
      linkedin_experiences: JSON.stringify([
        {
          title: "CXL",
          subtitle: "14 yrs 6 mos",
          breakdown: true,
          subComponents: [
            {
              title: "Chairman of the Board",
              subtitle: "Part-time",
              caption: "Nov 2022 - Present   2 yrs 8 mos"
            },
            {
              title: "CEO",
              subtitle: "Full-time",
              caption: "Jan 2011 - Nov 2022   11 yrs 11 mos",
              metadata: "Austin, Texas Metropolitan Area"
            }
          ]
        }
      ])
    }

    const result = transformLinkedInData(rawData)
    
    expect(result.experiences).toHaveLength(2)
    
    // First role (Chairman)
    expect(result.experiences[0].title).toBe('Chairman of the Board')
    expect(result.experiences[0].company).toBe('CXL')
    expect(result.experiences[0].startDate).toBe('2022-11-01')
    expect(result.experiences[0].endDate).toBeNull()
    expect(result.experiences[0].isCurrent).toBe(true)
    
    // Second role (CEO)
    expect(result.experiences[1].title).toBe('CEO')
    expect(result.experiences[1].company).toBe('CXL')
    expect(result.experiences[1].startDate).toBe('2011-01-01')
    expect(result.experiences[1].endDate).toBe('2022-11-01')
    expect(result.experiences[1].isCurrent).toBe(false)
  })

  it('should parse Peep Laja real data correctly', () => {
    // Using actual data from Peep Laja's profile
    const experiences = `[{"companyId":"18529103","companyUrn":"urn:li:fsd company:18529103","companyLink1":"https://www.linkedin.com/company/18529103/","companyLink2":"https://www.linkedin.com/company/wynter/","logo":"https://media.licdn.com/dms/image/v2/D4D0BAQG6N4RAaqP7sg/company-logo 200 200/company-logo 200 200/0/1661791345484/wynter logo e 1756339200&v beta&t OcVOo-789VbY0YVQWs9 NbSbIxdg5--iYC8nxw0y3HM","title":"CEO","subtitle":"Wynter   Full-time","caption":"Jan 2021 - Present   4 yrs 6 mos","metadata":"Austin, Texas, United States","breakdown":false,"subComponents":[{"description":[{"type":"textComponent","text":"Wynter can tell you almost anything you want to know about your ICPs, and what they think about you."}]}]},{"companyId":"5035649","companyUrn":"urn:li:fsd company:5035649","companyLink1":"https://www.linkedin.com/company/5035649/","logo":"https://media.licdn.com/dms/image/v2/D4E0BAQH o0s8tGNLIQ/company-logo 400 400/B4EZc7TsumHsAY-/0/1749046709545/cxldotcom logo e 1756339200&v beta&t uEv5r-jpydkoJQJj6LGK48iCskPfZ9hi1wMHCzsqSuE","title":"CXL","subtitle":"14 yrs 6 mos","breakdown":true,"subComponents":[{"title":"Chairman of the Board","subtitle":"Part-time","caption":"Nov 2022 - Present   2 yrs 8 mos","description":[]},{"title":"CEO","subtitle":"Full-time","caption":"2011 - Nov 2022   11 yrs 11 mos","metadata":"Austin, Texas Metropolitan Area","description":[{"type":"textComponent","text":"CXL is the world leader helping determined marketers become the top 1  in the world."}]}]}]`
    
    const rawData: LinkedInDataRaw = {
      linkedin_experiences: experiences
    }

    const result = transformLinkedInData(rawData)
    
    // Should have 3 experiences total (1 from Wynter, 2 from CXL)
    expect(result.experiences).toHaveLength(3)
    
    // Debug: log all experiences to see the actual data
    console.log('All experiences:', result.experiences.map(exp => ({
      title: exp.title,
      company: exp.company,
      startDate: exp.startDate,
      endDate: exp.endDate
    })))
    
    // Wynter CEO role
    const wynterRole = result.experiences.find(exp => exp.company === 'Wynter   Full-time' || exp.company === 'Wynter')
    expect(wynterRole).toBeDefined()
    expect(wynterRole?.title).toBe('CEO')
    expect(wynterRole?.startDate).toBe('2021-01-01')
    expect(wynterRole?.endDate).toBeNull()
    expect(wynterRole?.isCurrent).toBe(true)
    
    // CXL roles
    const cxlRoles = result.experiences.filter(exp => exp.company === 'CXL')
    expect(cxlRoles).toHaveLength(2)
    
    // Chairman role
    const chairmanRole = cxlRoles.find(exp => exp.title === 'Chairman of the Board')
    expect(chairmanRole).toBeDefined()
    expect(chairmanRole?.startDate).toBe('2022-11-01')
    expect(chairmanRole?.isCurrent).toBe(true)
    
    // CEO role at CXL
    const cxlCeoRole = cxlRoles.find(exp => exp.title === 'CEO')
    expect(cxlCeoRole).toBeDefined()
    expect(cxlCeoRole?.endDate).toBe('2022-11-01')
    expect(cxlCeoRole?.isCurrent).toBe(false)
  })
})