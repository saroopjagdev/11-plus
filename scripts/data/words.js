// Word data for the algorithmic VR generators.
//
// - `compounds`: [whole, first, second] — a real compound word split in two.
// - `hiddenWords`: small real words used as the hidden target across a boundary.
// - `commonWords`: tiered word lists for anagrams / codes.
// - `distractorPool`: neutral words used as wrong options for synonym/antonym/
//   analogy questions (none is a synonym/antonym of the targets in those sets).

const compounds = [
  ['sunflower', 'sun', 'flower'], ['football', 'foot', 'ball'], ['rainbow', 'rain', 'bow'],
  ['butterfly', 'butter', 'fly'], ['classroom', 'class', 'room'], ['playground', 'play', 'ground'],
  ['snowball', 'snow', 'ball'], ['moonlight', 'moon', 'light'], ['seashell', 'sea', 'shell'],
  ['toothbrush', 'tooth', 'brush'], ['fireplace', 'fire', 'place'], ['newspaper', 'news', 'paper'],
  ['bedroom', 'bed', 'room'], ['waterfall', 'water', 'fall'], ['cupboard', 'cup', 'board'],
  ['handbag', 'hand', 'bag'], ['starfish', 'star', 'fish'], ['rainforest', 'rain', 'forest'],
];

const commonWords = {
  Easy: ['table', 'chair', 'plant', 'brush', 'clock', 'stone', 'bread', 'chain', 'grape', 'shirt'],
  Medium: ['garden', 'pencil', 'orange', 'planet', 'silver', 'window', 'jacket', 'basket', 'candle', 'forest'],
  Hard: ['machine', 'journey', 'mystery', 'kitchen', 'diamond', 'compass', 'lantern', 'harvest', 'thunder', 'crystal'],
};

// Short real words used as targets hidden across a two-word boundary.
const hiddenWords = ['ant', 'ear', 'eat', 'ten', 'rat', 'hen', 'pea', 'oak', 'ash', 'ice', 'ink', 'owl', 'pin', 'net'];

// Neutral, concrete nouns — safe wrong options that carry no synonym/antonym
// relationship to the abstract target words in the relation sets.
const distractorPool = [
  'table', 'window', 'pencil', 'garden', 'basket', 'candle', 'jacket', 'planet', 'bridge', 'ladder',
  'kettle', 'saddle', 'tunnel', 'mirror', 'wallet', 'anchor', 'pillow', 'button', 'ribbon', 'cabinet',
];

module.exports = { compounds, commonWords, hiddenWords, distractorPool };
