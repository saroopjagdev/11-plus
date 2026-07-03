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

  { sentence: 'Close the archive carefully.', hidden: 'ear', difficulty: 'Easy' },       // thE ARchive
  { sentence: 'We shall close attic doors.', hidden: 'eat', difficulty: 'Easy' },        // closE ATtic
  { sentence: 'Talk about entering the room quietly.', hidden: 'ten', difficulty: 'Medium' }, // abouT ENtering
  { sentence: 'The choir attempts a new song.', hidden: 'rat', difficulty: 'Medium' },   // choiR ATtempts
  { sentence: 'The chef had fresh endives today.', hidden: 'hen', difficulty: 'Medium' },// fresH ENdives
  { sentence: 'Finish the top easy chores first.', hidden: 'pea', difficulty: 'Hard' },  // toP EAsy
  { sentence: 'The brave soldier marched ashore.', hidden: 'ash', difficulty: 'Hard' },  // marched ASHore
  { sentence: 'Please clean toys before bedtime.', hidden: 'ant', difficulty: 'Hard' },  // cleAN Toys

  { sentence: 'He walked into a kettle by mistake.', hidden: 'oak', difficulty: 'Easy' },      // intO A Kettle
  { sentence: 'We went to the ski centre for lessons.', hidden: 'ice', difficulty: 'Medium' }, // skI CEntre
  { sentence: 'She found the cabin keys yesterday.', hidden: 'ink', difficulty: 'Medium' },    // cabIN Keys
  { sentence: 'The valley lies below, lightly dusted with snow.', hidden: 'owl', difficulty: 'Hard' }, // belOW Lightly
  { sentence: 'Their top income came from exports.', hidden: 'pin', difficulty: 'Easy' },      // toP INcome
  { sentence: 'The book holds seven eternal truths and tales.', hidden: 'net', difficulty: 'Hard' }, // seveN ETernal
];
