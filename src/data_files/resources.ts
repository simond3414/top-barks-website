// Resource categorization data
// Maps PDF filenames to categories and display names

export interface ResourceFile {
  filename: string;
  displayName: string;
  category: string;
  size?: string;
  order?: number; // For custom ordering within categories
}

// Default categories - can be extended dynamically
export const DEFAULT_CATEGORIES = [
  "Puppy Training",
  "Basic Training & Lead Work",
  "Advanced Skills & Recall",
  "Behaviour & Emotional Issues",
  "Gundog & Show Training",
  "Health & Medical",
  "Enrichment & Socialisation"
] as const;

// Get current categories (could be stored in KV for persistence)
export function getCategories(): string[] {
  // For now, return default categories
  // In future, this could fetch from KV or R2 metadata
  return [...DEFAULT_CATEGORIES];
}

// Initial resource files mapping
// Note: In production, this should be stored in KV or fetched from R2 metadata
export const RESOURCE_FILES: ResourceFile[] = [
  // Puppy Training (5 files)
  { filename: "Puppy essentials.pdf", displayName: "Puppy Essentials", category: "Puppy Training", order: 0 },
  { filename: "Puppie weekly social chart.pdf", displayName: "Puppy Weekly Social Chart", category: "Puppy Training", order: 1 },
  { filename: "Puppies and older dogs together.pdf", displayName: "Puppies and Older Dogs Together", category: "Puppy Training", order: 2 },
  { filename: "Car sick Puppies.pdf", displayName: "Car Sick Puppies", category: "Puppy Training", order: 3 },
  { filename: "The Name Game.pdf", displayName: "The Name Game", category: "Puppy Training", order: 4 },

  // Basic Training & Lead Work (8 files)
  { filename: "Getting started with the clicker.pdf", displayName: "Getting Started with the Clicker", category: "Basic Training & Lead Work", order: 0 },
  { filename: "Reward your dog.pdf", displayName: "Reward Your Dog", category: "Basic Training & Lead Work", order: 1 },
  { filename: "The Sit Position from a stand.pdf", displayName: "Sit Position from a Stand", category: "Basic Training & Lead Work", order: 2 },
  { filename: "The Sit Position from a down.pdf", displayName: "Sit Position from a Down", category: "Basic Training & Lead Work", order: 3 },
  { filename: "Loose lead diagram.pdf", displayName: "Loose Lead Diagram", category: "Basic Training & Lead Work", order: 4 },
  { filename: "why dogs pull.pdf", displayName: "Why Dogs Pull", category: "Basic Training & Lead Work", order: 5 },
  { filename: "Lets go for a walk.pdf", displayName: "Let's Go for a Walk", category: "Basic Training & Lead Work", order: 6 },
  { filename: "Dont walk the dog.pdf", displayName: "Don't Walk the Dog", category: "Basic Training & Lead Work", order: 7 },
  { filename: "Relaxed down on lead.pdf", displayName: "Relaxed Down on Lead", category: "Basic Training & Lead Work", order: 8 },

  // Advanced Skills & Recall (6 files)
  { filename: "The stop whistle.pdf", displayName: "The Stop Whistle", category: "Advanced Skills & Recall", order: 0 },
  { filename: "Whistle recall.pdf", displayName: "Whistle Recall", category: "Advanced Skills & Recall", order: 1 },
  { filename: "Standard gundog whistle Cues.pdf", displayName: "Standard Gundog Whistle Cues", category: "Advanced Skills & Recall", order: 2 },
  { filename: "Teaching and progressing the leave.pdf", displayName: "Teaching and Progressing the Leave", category: "Advanced Skills & Recall", order: 3 },
  { filename: "The whiplash turn.pdf", displayName: "The Whiplash Turn", category: "Advanced Skills & Recall", order: 4 },
  { filename: "Engage-Disengage.pdf", displayName: "Engage-Disengage", category: "Advanced Skills & Recall", order: 5 },

  // Behaviour & Emotional Issues (7 files)
  { filename: "Resource Guarding.pdf", displayName: "Resource Guarding", category: "Behaviour & Emotional Issues", order: 0 },
  { filename: "resourceguardingandfoodgame.pdf", displayName: "Resource Guarding and Food Game", category: "Behaviour & Emotional Issues", order: 1 },
  { filename: "Dogs who are scared of people.pdf", displayName: "Dogs Scared of People", category: "Behaviour & Emotional Issues", order: 2 },
  { filename: "Helping nervous and Shy Dogs.pdf", displayName: "Helping Nervous and Shy Dogs", category: "Behaviour & Emotional Issues", order: 3 },
  { filename: "My dog doesn_t want to go out.pdf", displayName: "My Dog Doesn't Want to Go Out", category: "Behaviour & Emotional Issues", order: 4 },
  { filename: "Modifying and managing behaviour problems.pdf", displayName: "Modifying and Managing Behaviour Problems", category: "Behaviour & Emotional Issues", order: 5 },
  { filename: "Ladder of aggression.pdf", displayName: "Ladder of Aggression", category: "Behaviour & Emotional Issues", order: 6 },

  // Gundog & Show Training (2 files)
  { filename: "Handling your gundog.pdf", displayName: "Handling Your Gundog", category: "Gundog & Show Training", order: 0 },
  { filename: "Training for the show ring.pdf", displayName: "Training for the Show Ring", category: "Gundog & Show Training", order: 1 },

  // Health & Medical (3 files)
  { filename: "Fluoxetine For Dogs.pdf", displayName: "Fluoxetine for Dogs", category: "Health & Medical", order: 0 },
  { filename: "Zylkene.pdf", displayName: "Zylkene", category: "Health & Medical", order: 1 },
  { filename: "COGNITIVE DYSFUNCTION.pdf", displayName: "Cognitive Dysfunction", category: "Health & Medical", order: 2 },

  // Enrichment & Socialisation (6 files)
  { filename: "KONG STUFFING RECIPES.pdf", displayName: "Kong Stuffing Recipes", category: "Enrichment & Socialisation", order: 0 },
  { filename: "The two toy or treat game.pdf", displayName: "The Two Toy or Treat Game", category: "Enrichment & Socialisation", order: 1 },
  { filename: "Good dog handling.pdf", displayName: "Good Dog Handling", category: "Enrichment & Socialisation", order: 2 },
  { filename: "Parallel walking.pdf", displayName: "Parallel Walking", category: "Enrichment & Socialisation", order: 3 },
  { filename: "Full page photo.pdf", displayName: "Full Page Photo", category: "Enrichment & Socialisation", order: 4 },
  { filename: "Automatic Check In.pdf", displayName: "Automatic Check In", category: "Enrichment & Socialisation", order: 5 }
];

export function getResourcesByCategory(category: string): ResourceFile[] {
  return RESOURCE_FILES
    .filter(r => r.category === category)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

export function getAllCategories(): string[] {
  return getCategories();
}

// Helper to find resource by filename
export function getResourceByFilename(filename: string): ResourceFile | undefined {
  return RESOURCE_FILES.find(r => r.filename === filename);
}

// Get all resources sorted by category then order
export function getAllResources(): ResourceFile[] {
  const categories = getCategories();
  const sorted: ResourceFile[] = [];
  
  categories.forEach(category => {
    const categoryResources = getResourcesByCategory(category);
    sorted.push(...categoryResources);
  });
  
  return sorted;
}
