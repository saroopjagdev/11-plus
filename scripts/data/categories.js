// Odd-one-out categories. `members` all belong to the category; the odd one is
// drawn from `outsiders` (words that plausibly tempt but don't belong).

module.exports = [
  { category: 'fruits', members: ['apple', 'pear', 'plum', 'grape', 'peach', 'cherry'], outsiders: ['carrot', 'potato', 'onion', 'cabbage'], difficulty: 'Easy' },
  { category: 'animals', members: ['tiger', 'lion', 'wolf', 'bear', 'fox', 'deer'], outsiders: ['oak', 'rose', 'daisy', 'pebble'], difficulty: 'Easy' },
  { category: 'colours', members: ['scarlet', 'crimson', 'azure', 'amber', 'violet'], outsiders: ['square', 'circle', 'metre', 'litre'], difficulty: 'Easy' },
  { category: 'body parts', members: ['elbow', 'ankle', 'wrist', 'knee', 'shoulder'], outsiders: ['glove', 'sock', 'scarf', 'belt'], difficulty: 'Easy' },

  { category: 'musical instruments', members: ['violin', 'cello', 'flute', 'trumpet', 'oboe'], outsiders: ['easel', 'canvas', 'palette', 'chisel'], difficulty: 'Medium' },
  { category: 'weather', members: ['drizzle', 'blizzard', 'gale', 'thunder', 'frost'], outsiders: ['harvest', 'meadow', 'orchard', 'valley'], difficulty: 'Medium' },
  { category: 'metals', members: ['copper', 'iron', 'silver', 'bronze', 'zinc'], outsiders: ['marble', 'granite', 'slate', 'chalk'], difficulty: 'Medium' },
  { category: 'buildings', members: ['cottage', 'mansion', 'bungalow', 'cabin', 'chalet'], outsiders: ['harbour', 'meadow', 'summit', 'lagoon'], difficulty: 'Medium' },

  { category: 'poetry devices', members: ['simile', 'metaphor', 'alliteration', 'personification'], outsiders: ['equation', 'quotient', 'remainder', 'fraction'], difficulty: 'Hard' },
  { category: 'emotions', members: ['jubilant', 'melancholy', 'anxious', 'content', 'furious'], outsiders: ['triangular', 'circular', 'spherical', 'oval'], difficulty: 'Hard' },
  { category: 'monarchy', members: ['sovereign', 'regent', 'monarch', 'heir', 'consort'], outsiders: ['tenant', 'labourer', 'merchant', 'peasant'], difficulty: 'Hard' },
];
