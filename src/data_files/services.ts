/**
 * Services Configuration
 * 
 * This file contains the central registry of all Top Barks services.
 * It is used by:
 * - Contact form dropdown (src/pages/contact.astro)
 * - Navigation links
 * - Anywhere service information is needed
 * 
 * ============================================
 * ADDING A NEW SERVICE:
 * ============================================
 * 
 * 1. Create the service page at:
 *    src/pages/services/[service-id].astro
 * 
 * 2. Add the service to this file in the SERVICES array below
 * 
 * 3. The service will automatically appear in:
 *    - Contact form dropdown
 *    - Any future service listings
 * 
 * Example entry:
 * {
 *   id: "service-name",           // URL-friendly ID (kebab-case)
 *   name: "Service Name",        // Display name for dropdown
 *   shortName: "Short Name",     // Optional: shorter display name
 *   description: "Brief desc",   // Optional: for future use
 *   showInDropdown: true,        // Include in contact form?
 *   order: 10                    // Display order (lower = first)
 * }
 */

export interface Service {
  /** URL-friendly ID used for routes (e.g., "dog-training") */
  id: string
  /** Full display name for the service */
  name: string
  /** Optional shorter name for compact displays */
  shortName?: string
  /** Brief description for listings */
  description?: string
  /** Whether to show in contact form dropdown */
  showInDropdown: boolean
  /** Display order (lower numbers appear first) */
  order: number
}

/**
 * All Top Barks services
 * 
 * To add a new service:
 * 1. Add entry below following the interface above
 * 2. Create the corresponding page at src/pages/services/[id].astro
 * 3. The contact form will automatically include it
 */
export const SERVICES: Service[] = [
  // Core training services
  {
    id: "dog-training",
    name: "Dog Training",
    description: "One-to-one dog training programmes",
    showInDropdown: true,
    order: 10,
  },
  {
    id: "puppy-training",
    name: "Puppy Training",
    description: "One-to-one puppy training for the best start",
    showInDropdown: true,
    order: 20,
  },
  {
    id: "puppy-pre-planning",
    name: "Puppy Pre-Planning",
    description: "Prepare for your new puppy before they arrive",
    showInDropdown: true,
    order: 25,
  },
  {
    id: "adolescent-training",
    name: "Adolescent Dog Training",
    shortName: "Adolescent Training",
    description: "Specialised training for teenage dogs",
    showInDropdown: true,
    order: 30,
  },
  {
    id: "gundog-training",
    name: "Gundog Training",
    description: "Working gundog training and preparation",
    showInDropdown: true,
    order: 40,
  },
  {
    id: "show-training",
    name: "Show Training",
    description: "Show ring preparation and handling",
    showInDropdown: true,
    order: 50,
  },
  {
    id: "training-walks",
    name: "Training Walks",
    description: "Let us be your dog's personal trainer",
    showInDropdown: true,
    order: 60,
  },
  {
    id: "behaviour-problems",
    name: "Behaviour Problems",
    description: "Help with unwanted dog behaviours",
    showInDropdown: true,
    order: 70,
  },
]

/**
 * Get services sorted by order for display
 */
export function getServices(): Service[] {
  return [...SERVICES].sort((a, b) => a.order - b.order)
}

/**
 * Get only services that should appear in dropdowns
 */
export function getDropdownServices(): Service[] {
  return getServices().filter((s) => s.showInDropdown)
}

/**
 * Get a service by its ID
 */
export function getServiceById(id: string): Service | undefined {
  return SERVICES.find((s) => s.id === id)
}

/**
 * Get service display name (uses shortName if available, otherwise name)
 */
export function getServiceDisplayName(service: Service): string {
  return service.shortName || service.name
}
