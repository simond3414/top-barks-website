// Resource categorization data
// Maps PDF filenames to categories and display names

export interface ResourceFile {
  filename: string;
  displayName: string;
  category: string;
  size?: string;
}

export const RESOURCE_CATEGORIES = [
  "Puppy Training",
  "Basic Training & Lead Work",
  "Advanced Skills & Recall",
  "Behaviour & Emotional Issues",
  "Gundog & Show Training",
  "Health & Medical",
  "Enrichment & Socialisation"
] as const;

export type ResourceCategory = (typeof RESOURCE_CATEGORIES)[number];

export const RESOURCE_FILES: ResourceFile[] = [
  // Puppy Training (5 files)
  { filename: "Puppy essentials.pdf", displayName: "Puppy Essentials", category: "Puppy Training" },
  { filename: "Puppie weekly social chart.pdf", displayName: "Puppy Weekly Social Chart", category: "Puppy Training" },
  { filename: "Puppies and older dogs together.pdf", displayName: "Puppies and Older Dogs Together", category: "Puppy Training" },
  { filename: "Car sick Puppies.pdf", displayName: "Car Sick Puppies", category: "Puppy Training" },
  { filename: "The Name Game.pdf", displayName: "The Name Game", category: "Puppy Training" },

  // Basic Training & Lead Work (8 files)
  { filename: "Getting started with the clicker.pdf", displayName: "Getting Started with the Clicker", category: "Basic Training & Lead Work" },
  { filename: "Reward your dog.pdf", displayName: "Reward Your Dog", category: "Basic Training & Lead Work" },
  { filename: "The Sit Position from a stand.pdf", displayName: "Sit Position from a Stand", category: "Basic Training & Lead Work" },
  { filename: "The Sit Position from a down.pdf", displayName: "Sit Position from a Down", category: "Basic Training & Lead Work" },
  { filename: "Loose lead diagram.pdf", displayName: "Loose Lead Diagram", category: "Basic Training & Lead Work" },
  { filename: "why dogs pull.pdf", displayName: "Why Dogs Pull", category: "Basic Training & Lead Work" },
  { filename: "Lets go for a walk.pdf", displayName: "Let's Go for a Walk", category: "Basic Training & Lead Work" },
  { filename: "Dont walk the dog.pdf", displayName: "Don't Walk the Dog", category: "Basic Training & Lead Work" },
  { filename: "Relaxed down on lead.pdf", displayName: "Relaxed Down on Lead", category: "Basic Training & Lead Work" },

  // Advanced Skills & Recall (6 files)
  { filename: "The stop whistle.pdf", displayName: "The Stop Whistle", category: "Advanced Skills & Recall" },
  { filename: "Whistle recall.pdf", displayName: "Whistle Recall", category: "Advanced Skills & Recall" },
  { filename: "Standard gundog whistle Cues.pdf", displayName: "Standard Gundog Whistle Cues", category: "Advanced Skills & Recall" },
  { filename: "Teaching and progressing the leave.pdf", displayName: "Teaching and Progressing the Leave", category: "Advanced Skills & Recall" },
  { filename: "The whiplash turn.pdf", displayName: "The Whiplash Turn", category: "Advanced Skills & Recall" },
  { filename: "Engage-Disengage.pdf", displayName: "Engage-Disengage", category: "Advanced Skills & Recall" },

  // Behaviour & Emotional Issues (7 files)
  { filename: "Resource Guarding.pdf", displayName: "Resource Guarding", category: "Behaviour & Emotional Issues" },
  { filename: "resourceguardingandfoodgame.pdf", displayName: "Resource Guarding and Food Game", category: "Behaviour & Emotional Issues" },
  { filename: "Dogs who are scared of people.pdf", displayName: "Dogs Scared of People", category: "Behaviour & Emotional Issues" },
  { filename: "Helping nervous and Shy Dogs.pdf", displayName: "Helping Nervous and Shy Dogs", category: "Behaviour & Emotional Issues" },
  { filename: "My dog doesn_t want to go out.pdf", displayName: "My Dog Doesn't Want to Go Out", category: "Behaviour & Emotional Issues" },
  { filename: "Modifying and managing behaviour problems.pdf", displayName: "Modifying and Managing Behaviour Problems", category: "Behaviour & Emotional Issues" },
  { filename: "Ladder of aggression.pdf", displayName: "Ladder of Aggression", category: "Behaviour & Emotional Issues" },

  // Gundog & Show Training (2 files)
  { filename: "Handling your gundog.pdf", displayName: "Handling Your Gundog", category: "Gundog & Show Training" },
  { filename: "Training for the show ring.pdf", displayName: "Training for the Show Ring", category: "Gundog & Show Training" },

  // Health & Medical (3 files)
  { filename: "Fluoxetine For Dogs.pdf", displayName: "Fluoxetine for Dogs", category: "Health & Medical" },
  { filename: "Zylkene.pdf", displayName: "Zylkene", category: "Health & Medical" },
  { filename: "COGNITIVE DYSFUNCTION.pdf", displayName: "Cognitive Dysfunction", category: "Health & Medical" },

  // Enrichment & Socialisation (5 files)
  { filename: "KONG STUFFING RECIPES.pdf", displayName: "Kong Stuffing Recipes", category: "Enrichment & Socialisation" },
  { filename: "The two toy or treat game.pdf", displayName: "The Two Toy or Treat Game", category: "Enrichment & Socialisation" },
  { filename: "Good dog handling.pdf", displayName: "Good Dog Handling", category: "Enrichment & Socialisation" },
  { filename: "Parallel walking.pdf", displayName: "Parallel Walking", category: "Enrichment & Socialisation" },
  { filename: "Full page photo.pdf", displayName: "Full Page Photo", category: "Enrichment & Socialisation" },
  { filename: "Automatic Check In.pdf", displayName: "Automatic Check In", category: "Enrichment & Socialisation" }
];

export function getResourcesByCategory(category: ResourceCategory): ResourceFile[] {
  return RESOURCE_FILES.filter(r => r.category === category);
}

export function getAllCategories(): ResourceCategory[] {
  return [...RESOURCE_CATEGORIES];
}
