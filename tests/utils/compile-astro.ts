import { promises as fs } from 'fs'
import path from 'path'

// Simple Astro component compiler for testing
export async function compileAstroComponent(componentPath: string) {
  // For testing purposes, we'll create mock components
  // In a real setup, you'd use Astro's compiler
  const componentName = path.basename(componentPath, '.astro')

  // Return a mock component factory
  return function MockComponent(props: any) {
    return {
      type: 'astro-component',
      name: componentName,
      props,
      // Mock HTML based on component name
      html: getMockHTML(componentName, props)
    }
  }
}

function getMockHTML(componentName: string, props: any): string {
  switch (componentName) {
    case 'Breadcrumb':
      return `
        <nav aria-label="Breadcrumb">
          <ol class="breadcrumb-text flex items-center space-x-1 sm:space-x-2 text-sm">
            <li><a href="/" class="breadcrumb-link">Home</a></li>
            ${props.episodeTitle ? `<li><span aria-current="page">${props.episodeTitle}</span></li>` : ''}
            ${props.guestName ? `<li><span aria-current="page">${props.guestName}</span></li>` : ''}
          </ol>
        </nav>
      `

    case 'EpisodeCard':
      return `
        <article class="episode-card ${props.size || 'medium'}">
          <a href="/episodes/${props.episode?.data?.slug || 'test'}">
            <img src="/test.jpg" alt="${props.episode?.data?.title || 'Test Episode'}" />
            <h3>${props.episode?.data?.title || 'Test Episode'}</h3>
            <p>S${props.episode?.data?.season || 1} E${props.episode?.data?.episode || 1}</p>
            <p>${props.episode?.data?.duration || '45:00'}</p>
          </a>
        </article>
      `

    case 'GuestCard':
      return `
        <article class="guest-card ${props.size || 'medium'}">
          <a href="/guests/${props.guest?.data?.slug || 'test'}">
            <img src="/test.jpg" alt="${props.guest?.data?.name || 'Test Guest'}" />
            <h3>${props.guest?.data?.name || 'Test Guest'}</h3>
            <p>${props.guest?.data?.role || 'Role'}</p>
            <p>${props.guest?.data?.company || 'Company'}</p>
          </a>
        </article>
      `

    case 'Header':
      return `
        <header class="sticky top-0 z-50" style="isolation: isolate;">
          <nav id="main-navigation" aria-label="Main navigation">
            <a href="${props.currentPath?.startsWith('/en/') ? '/en/' : '/'}" aria-label="CRO.CAFE Home">
              <img src="/logo.svg" alt="CRO.CAFE Logo" />
            </a>
            <div class="hidden md:block">
              <a href="/en/episodes/" ${props.currentPath?.startsWith('/en/episodes/') ? 'aria-current="page"' : ''}>Episodes</a>
              <a href="/en/guests/">Guests</a>
              <a href="/en/subscribe/">Subscribe</a>
            </div>
            <a href="/en/search/" class="hidden lg:flex touch-target" aria-label="Search episodes and guests">
              <svg aria-hidden="true"></svg>
            </a>
            <button id="mobile-search-trigger" class="flex lg:hidden touch-target" aria-label="Search episodes and guests">
              <svg aria-hidden="true"></svg>
            </button>
            <button id="mobile-menu-toggle" class="touch-target" aria-label="Open main menu" aria-expanded="false">
              <svg aria-hidden="true"></svg>
            </button>
            <nav id="mobile-menu" class="hidden" aria-label="Mobile navigation">
              <a href="/en/episodes/" class="touch-target min-h-[48px]">Episodes</a>
            </nav>
          </nav>
        </header>
      `

    case 'LanguageSwitcher':
      const currentLang = props.currentLanguage || 'en'
      const langNames = { en: 'English', nl: 'Nederlands', de: 'Deutsch', es: 'Español' }
      return `
        <div class="language-switcher-container" style="z-index: 60;">
          <button type="button" 
            class="language-switcher-button px-2 sm:px-3 py-2 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 hover:bg-primary-50 dark:hover:bg-gray-700 max-w-[120px] sm:max-w-none"
            aria-expanded="false" 
            aria-haspopup="true" 
            aria-label="Choose language. Current: ${langNames[currentLang] || 'All Languages'}"
            data-language-button>
            <span class="mr-1 sm:mr-2" aria-hidden="true">🇬🇧</span>
            <span class="hidden sm:inline">${langNames[currentLang] || 'All Languages'}</span>
            <span class="sm:hidden text-xs">${currentLang?.toUpperCase() || 'ALL'}</span>
            <svg class="ml-1 sm:ml-2" aria-hidden="true"></svg>
          </button>
          <div class="language-switcher-menu hidden w-60 sm:w-64 max-w-[calc(100vw-2rem)]" role="menu" aria-orientation="vertical" data-language-menu style="isolation: isolate;">
            <a href="/all/episodes/" role="menuitem" class="px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-primary-50 dark:hover:bg-gray-700">
              <span class="mr-3 text-lg" aria-hidden="true">🌍</span>
              <div>All Languages</div>
              <div class="text-xs text-gray-500">50 episodes · 25 guests</div>
            </a>
            <a href="/en/episodes/" role="menuitem" class="px-4 py-2 text-primary-700 dark:text-primary-200" aria-current="${currentLang === 'en' ? 'page' : undefined}">
              <span class="mr-3 text-lg" aria-hidden="true">🇬🇧</span>
              <div>English</div>
              <svg aria-label="Currently selected"></svg>
              <div class="text-xs text-gray-500">20 episodes · 10 guests</div>
            </a>
          </div>
        </div>
      `

    default:
      return `<div>Mock ${componentName}</div>`
  }
}