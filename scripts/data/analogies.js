// Word analogies grouped by relation. Any two pairs from the same relation form
// "A is to B as C is to ?". Distractors are drawn from OTHER relations' words so
// they don't accidentally satisfy the relation.

module.exports = [
  { relation: 'young of', pairs: [['cat', 'kitten'], ['dog', 'puppy'], ['cow', 'calf'], ['horse', 'foal'], ['sheep', 'lamb']], difficulty: 'Easy' },
  { relation: 'home of', pairs: [['bird', 'nest'], ['bee', 'hive'], ['dog', 'kennel'], ['horse', 'stable'], ['spider', 'web']], difficulty: 'Easy' },
  { relation: 'opposite', pairs: [['hot', 'cold'], ['up', 'down'], ['big', 'small'], ['fast', 'slow'], ['day', 'night']], difficulty: 'Easy' },

  { relation: 'tool of worker', pairs: [['painter', 'brush'], ['writer', 'pen'], ['farmer', 'plough'], ['carpenter', 'saw'], ['gardener', 'spade']], difficulty: 'Medium' },
  { relation: 'group of', pairs: [['wolves', 'pack'], ['sheep', 'flock'], ['fish', 'shoal'], ['lions', 'pride'], ['cows', 'herd']], difficulty: 'Medium' },
  { relation: 'made from', pairs: [['bread', 'flour'], ['wine', 'grapes'], ['butter', 'cream'], ['paper', 'wood'], ['glass', 'sand']], difficulty: 'Medium' },

  { relation: 'degree (mild to strong)', pairs: [['warm', 'hot'], ['cool', 'cold'], ['stroll', 'run'], ['whisper', 'shout'], ['damp', 'soaked']], difficulty: 'Hard' },
  { relation: 'worker and place', pairs: [['teacher', 'school'], ['judge', 'court'], ['chef', 'kitchen'], ['actor', 'theatre'], ['sailor', 'ship']], difficulty: 'Hard' },
  { relation: 'part to whole', pairs: [['petal', 'flower'], ['chapter', 'book'], ['branch', 'tree'], ['key', 'keyboard'], ['wheel', 'car']], difficulty: 'Hard' },
];
