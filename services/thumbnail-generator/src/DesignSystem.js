export class DesignSystem {
  constructor() {
    // Brand colors from CRO Café style guide
    this.colors = {
      primary: '#5a8a87',    // Teal
      accent: '#c05559',     // Coral
      text: {
        primary: '#2d3748',  // Dark gray
        secondary: '#4a5568' // Medium gray
      },
      background: {
        primary: '#f8fafc',  // Very light gray
        secondary: '#e2e8f0' // Light gray
      }
    };

    // Typography system following 2025 best practices - Increased sizes
    this.typography = {
      showName: {
        size: 200,
        family: 'Arial, sans-serif',
        weight: 700
      },
      episodeNumber: {
        size: 120,
        family: 'Arial, sans-serif',
        weight: 600
      },
      episodeTitle: {
        size: 90,
        family: 'Georgia, serif',
        weight: 500
      },
      personName: {
        size: 72,
        family: 'Arial, sans-serif',
        weight: 600
      },
      personRole: {
        size: 60,
        family: 'Arial, sans-serif',
        weight: 400
      }
    };

    // Layout configurations for different participant counts
    this.layouts = {
      '1-0': this.createLayout_1Host_0Guests(),
      '1-1': this.createLayout_1Host_1Guest(),
      '1-2': this.createLayout_1Host_2Guests(),
      '1-3': this.createLayout_1Host_3Guests(),
      '2-0': this.createLayout_2Hosts_0Guests(),
      '2-1': this.createLayout_2Hosts_1Guest(),
      '2-2': this.createLayout_2Hosts_2Guests(),
      '2-3': this.createLayout_2Hosts_3Guests()
    };
  }

  calculateLayout(hostCount, guestCount) {
    const key = `${hostCount}-${guestCount}`;
    const layout = this.layouts[key];
    
    if (!layout) {
      throw new Error(`Unsupported participant configuration: ${hostCount} hosts, ${guestCount} guests`);
    }
    
    return {
      ...layout,
      name: `${hostCount} Host${hostCount > 1 ? 's' : ''} + ${guestCount} Guest${guestCount !== 1 ? 's' : ''}`,
      totalParticipants: hostCount + guestCount
    };
  }

  // Layout: 1 Host, 0 Guests
  createLayout_1Host_0Guests() {
    const imageSize = 900;
    const hostX = 700; // Left side (red)
    const centerY = 1200;
    
    return {
      imageSize,
      grid: [
        { x: hostX - imageSize/2, y: centerY } // Host on left/red side
      ]
    };
  }

  // Layout: 1 Host, 1 Guest
  createLayout_1Host_1Guest() {
    const imageSize = 750;
    const hostX = 700; // Left side (red)
    const guestX = 2300; // Right side (green)
    const centerY = 1200;
    
    return {
      imageSize,
      grid: [
        { x: hostX - imageSize/2, y: centerY }, // Host (left/red side)
        { x: guestX - imageSize/2, y: centerY } // Guest (right/green side)
      ]
    };
  }

  // Layout: 1 Host, 2 Guests
  createLayout_1Host_2Guests() {
    const hostSize = 650;
    const guestSize = 600;
    const hostX = 700; // Left side (red)
    const guestX1 = 2100; // Right side (green)
    const guestX2 = 2100;
    
    return {
      imageSize: hostSize, // Primary size for calculations
      grid: [
        { x: hostX - hostSize/2, y: 1200 }, // Host (left/red side)
        { x: guestX1 - guestSize/2, y: 900 }, // Guest 1 (right/green top)
        { x: guestX2 - guestSize/2, y: 1600 } // Guest 2 (right/green bottom)
      ],
      customSizes: [hostSize, guestSize, guestSize]
    };
  }

  // Layout: 1 Host, 3 Guests
  createLayout_1Host_3Guests() {
    const hostSize = 550;
    const guestSize = 480;
    const canvasCenter = 1500;
    
    return {
      imageSize: hostSize,
      grid: [
        { x: canvasCenter - hostSize/2, y: 650 }, // Host (top center)
        { x: canvasCenter - 700, y: 1350 }, // Guest 1 (bottom left)
        { x: canvasCenter - guestSize/2, y: 1350 }, // Guest 2 (bottom center)
        { x: canvasCenter + 700 - guestSize, y: 1350 } // Guest 3 (bottom right)
      ],
      customSizes: [hostSize, guestSize, guestSize, guestSize]
    };
  }

  // Layout: 2 Hosts, 0 Guests
  createLayout_2Hosts_0Guests() {
    const imageSize = 600;
    const hostX = 700; // Left side (red)
    
    return {
      imageSize,
      grid: [
        { x: hostX - imageSize/2, y: 900 }, // Host 1 (left/red top)
        { x: hostX - imageSize/2, y: 1600 } // Host 2 (left/red bottom)
      ]
    };
  }

  // Layout: 2 Hosts, 1 Guest
  createLayout_2Hosts_1Guest() {
    const imageSize = 600;
    const hostX = 700; // Left side (red)
    const guestX = 2300; // Right side (green)
    
    return {
      imageSize,
      grid: [
        { x: hostX - imageSize/2, y: 900 }, // Host 1 (left/red top)
        { x: hostX - imageSize/2, y: 1600 }, // Host 2 (left/red bottom)
        { x: guestX - imageSize/2, y: 1200 } // Guest (right/green center)
      ]
    };
  }

  // Layout: 2 Hosts, 2 Guests
  createLayout_2Hosts_2Guests() {
    const imageSize = 550;
    const canvasCenter = 1500;
    
    return {
      imageSize,
      grid: [
        { x: canvasCenter - 600, y: 700 }, // Host 1 (top left)
        { x: canvasCenter + 600 - imageSize, y: 700 }, // Host 2 (top right)
        { x: canvasCenter - 600, y: 1450 }, // Guest 1 (bottom left)
        { x: canvasCenter + 600 - imageSize, y: 1450 } // Guest 2 (bottom right)
      ]
    };
  }

  // Layout: 2 Hosts, 3 Guests (Maximum density)
  createLayout_2Hosts_3Guests() {
    const hostSize = 480;
    const guestSize = 440;
    const canvasCenter = 1500;
    
    return {
      imageSize: hostSize,
      grid: [
        { x: canvasCenter - 550, y: 700 }, // Host 1 (top left)
        { x: canvasCenter + 550 - hostSize, y: 700 }, // Host 2 (top right)
        { x: canvasCenter - 700, y: 1350 }, // Guest 1 (bottom left)
        { x: canvasCenter - guestSize/2, y: 1350 }, // Guest 2 (bottom center)
        { x: canvasCenter + 700 - guestSize, y: 1350 } // Guest 3 (bottom right)
      ],
      customSizes: [hostSize, hostSize, guestSize, guestSize, guestSize]
    };
  }

  // Get adaptive font size based on participant density
  getAdaptiveFontSize(baseSize, totalParticipants) {
    if (totalParticipants <= 2) return baseSize;
    if (totalParticipants <= 4) return Math.floor(baseSize * 0.85);
    return Math.floor(baseSize * 0.75);
  }

  // Validate contrast ratio (WCAG AA compliance)
  validateContrast(foreground, background) {
    // Simplified contrast validation
    // In production, use a proper color contrast library
    return true; // Placeholder
  }

  // Get image size for specific participant position
  getImageSize(layout, participantIndex) {
    if (layout.customSizes && layout.customSizes[participantIndex]) {
      return layout.customSizes[participantIndex];
    }
    return layout.imageSize;
  }
}