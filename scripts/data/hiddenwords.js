// Hidden Words — verified sentences where a short word is hidden across the
// boundary of two neighbouring words (spanning the gap). Each `hidden` word has
// been checked to span a boundary and to be the only listed word findable in the
// sentence's letter stream.

module.exports = [
  { sentence: 'My cat enjoys warm milk.', hidden: 'ten', difficulty: 'Easy' },     // caT ENjoys
  { sentence: 'Open the atlas now.', hidden: 'eat', difficulty: 'Easy' },           // thE ATlas
  { sentence: 'We watched the army march.', hidden: 'ear', difficulty: 'Easy' },    // thE ARmy
  { sentence: 'Please keep inside the lines.', hidden: 'pin', difficulty: 'Medium' },// keeP INside
  { sentence: 'We keep boxes in our attic.', hidden: 'rat', difficulty: 'Medium' }, // ouR ATtic
  { sentence: 'She had fresh energy today.', hidden: 'hen', difficulty: 'Medium' }, // fresH ENergy
  { sentence: 'Please help each other.', hidden: 'pea', difficulty: 'Hard' },       // helP EAch
  { sentence: 'I bought extra shoes.', hidden: 'ash', difficulty: 'Hard' },         // extrA SHoes
];
