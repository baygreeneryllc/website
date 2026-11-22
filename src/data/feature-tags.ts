/* Feature tags used by the gallery's "Feature Finder" view.
   Photos are tagged with these ids (`tags:` on each photo in a project
   file). Synapse suggests these when photos are uploaded; a new tag is
   added here in the same pull request that first uses it. */
export const featureTags = [
  { id: 'lighting', name: 'Lighting' },
  { id: 'artificial-turf', name: 'Artificial turf' },
  { id: 'lawn-sod', name: 'Lawn & sod' },
  { id: 'retaining-walls', name: 'Retaining walls' },
  { id: 'steps-stairs', name: 'Steps & stairs' },
  { id: 'pathways', name: 'Pathways' },
  { id: 'planting', name: 'Planting' },
  { id: 'irrigation', name: 'Irrigation' },
  { id: 'fencing', name: 'Fencing' },
  { id: 'hardscape', name: 'Hardscape' },
  { id: 'grading', name: 'Grading' },
  { id: 'water-features', name: 'Water features' },
  { id: 'cleanup', name: 'Cleanup' },
] as const;

export type FeatureTagId = (typeof featureTags)[number]['id'];
export const featureTagIds = featureTags.map((t) => t.id) as [FeatureTagId, ...FeatureTagId[]];
