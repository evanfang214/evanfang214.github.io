/**
 * Curated Bible verse & multi-verse library for Selah Scripture Memory.
 * Both translations (WEB: World English Bible, KJV: King James Version) are public domain.
 */

const BIBLE_VERSES = [
  {
    id: 'psalm-23-4',
    reference: 'Psalm 23:4',
    book: 'Psalm',
    chapter: 23,
    verseRange: '4',
    category: 'Comfort & Peace',
    isMultiVerse: false,
    translations: {
      WEB: [
        { num: 4, text: 'Even though I walk through the valley of the shadow of death, I will fear no evil, for you are with me. Your rod and your staff, they comfort me.' }
      ],
      KJV: [
        { num: 4, text: 'Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me.' }
      ]
    }
  },
  {
    id: 'psalm-23-1-4',
    reference: 'Psalm 23:1-4',
    book: 'Psalm',
    chapter: 23,
    verseRange: '1-4',
    category: 'Comfort & Peace',
    isMultiVerse: true,
    translations: {
      WEB: [
        { num: 1, text: 'Yahweh is my shepherd; I shall lack nothing.' },
        { num: 2, text: 'He makes me lie down in green pastures. He leads me beside still waters.' },
        { num: 3, text: 'He restores my soul. He guides me in the paths of righteousness for his name’s sake.' },
        { num: 4, text: 'Even though I walk through the valley of the shadow of death, I will fear no evil, for you are with me. Your rod and your staff, they comfort me.' }
      ],
      KJV: [
        { num: 1, text: 'The LORD is my shepherd; I shall not want.' },
        { num: 2, text: 'He maketh me to lie down in green pastures: he leadeth me beside the still waters.' },
        { num: 3, text: 'He restoreth my soul: he leadeth me in the paths of righteousness for his name’s sake.' },
        { num: 4, text: 'Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me.' }
      ]
    }
  },
  {
    id: 'john-3-16',
    reference: 'John 3:16',
    book: 'John',
    chapter: 3,
    verseRange: '16',
    category: 'Love & Grace',
    isMultiVerse: false,
    translations: {
      WEB: [
        { num: 16, text: 'For God so loved the world, that he gave his only born Son, that whoever believes in him should not perish, but have eternal life.' }
      ],
      KJV: [
        { num: 16, text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.' }
      ]
    }
  },
  {
    id: 'proverbs-3-5-6',
    reference: 'Proverbs 3:5-6',
    book: 'Proverbs',
    chapter: 3,
    verseRange: '5-6',
    category: 'Wisdom & Guidance',
    isMultiVerse: true,
    translations: {
      WEB: [
        { num: 5, text: 'Trust in Yahweh with all your heart, and don’t lean on your own understanding.' },
        { num: 6, text: 'In all your ways acknowledge him, and he will make your paths straight.' }
      ],
      KJV: [
        { num: 5, text: 'Trust in the LORD with all thine heart; and lean not unto thine own understanding.' },
        { num: 6, text: 'In all thy ways acknowledge him, and he shall direct thy paths.' }
      ]
    }
  },
  {
    id: 'philippians-4-13',
    reference: 'Philippians 4:13',
    book: 'Philippians',
    chapter: 4,
    verseRange: '13',
    category: 'Strength & Courage',
    isMultiVerse: false,
    translations: {
      WEB: [
        { num: 13, text: 'I can do all things through Christ who strengthens me.' }
      ],
      KJV: [
        { num: 13, text: 'I can do all things through Christ which strengtheneth me.' }
      ]
    }
  },
  {
    id: 'philippians-4-6-7',
    reference: 'Philippians 4:6-7',
    book: 'Philippians',
    chapter: 4,
    verseRange: '6-7',
    category: 'Comfort & Peace',
    isMultiVerse: true,
    translations: {
      WEB: [
        { num: 6, text: 'In nothing be anxious, but in everything, by prayer and petition with thanksgiving, let your requests be made known to God.' },
        { num: 7, text: 'And the peace of God, which surpasses all understanding, will guard your hearts and your thoughts in Christ Jesus.' }
      ],
      KJV: [
        { num: 6, text: 'Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.' },
        { num: 7, text: 'And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.' }
      ]
    }
  },
  {
    id: 'romans-8-28',
    reference: 'Romans 8:28',
    book: 'Romans',
    chapter: 8,
    verseRange: '28',
    category: 'Faith & Hope',
    isMultiVerse: false,
    translations: {
      WEB: [
        { num: 28, text: 'We know that all things work together for good for those who love God, for those who are called according to his purpose.' }
      ],
      KJV: [
        { num: 28, text: 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.' }
      ]
    }
  },
  {
    id: 'isaiah-40-31',
    reference: 'Isaiah 40:31',
    book: 'Isaiah',
    chapter: 40,
    verseRange: '31',
    category: 'Strength & Courage',
    isMultiVerse: false,
    translations: {
      WEB: [
        { num: 31, text: 'But those who wait for Yahweh will renew their strength. They will mount up with wings like eagles. They will run, and not be weary. They will walk, and not faint.' }
      ],
      KJV: [
        { num: 31, text: 'But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.' }
      ]
    }
  },
  {
    id: 'jeremiah-29-11',
    reference: 'Jeremiah 29:11',
    book: 'Jeremiah',
    chapter: 29,
    verseRange: '11',
    category: 'Faith & Hope',
    isMultiVerse: false,
    translations: {
      WEB: [
        { num: 11, text: 'For I know the thoughts that I think toward you, says Yahweh, thoughts of peace, and not of evil, to give you hope and a future.' }
      ],
      KJV: [
        { num: 11, text: 'For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end.' }
      ]
    }
  },
  {
    id: 'joshua-1-9',
    reference: 'Joshua 1:9',
    book: 'Joshua',
    chapter: 1,
    verseRange: '9',
    category: 'Strength & Courage',
    isMultiVerse: false,
    translations: {
      WEB: [
        { num: 9, text: 'Haven’t I commanded you? Be strong and courageous. Don’t be afraid. Don’t be dismayed, for Yahweh your God is with you wherever you go.' }
      ],
      KJV: [
        { num: 9, text: 'Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.' }
      ]
    }
  },
  {
    id: 'matthew-11-28',
    reference: 'Matthew 11:28',
    book: 'Matthew',
    chapter: 11,
    verseRange: '28',
    category: 'Comfort & Peace',
    isMultiVerse: false,
    translations: {
      WEB: [
        { num: 28, text: 'Come to me, all you who labor and are heavily burdened, and I will give you rest.' }
      ],
      KJV: [
        { num: 28, text: 'Come unto me, all ye that labour and are heavy laden, and I will give you rest.' }
      ]
    }
  },
  {
    id: 'psalm-46-1',
    reference: 'Psalm 46:1',
    book: 'Psalm',
    chapter: 46,
    verseRange: '1',
    category: 'Strength & Courage',
    isMultiVerse: false,
    translations: {
      WEB: [
        { num: 1, text: 'God is our refuge and strength, a very present help in trouble.' }
      ],
      KJV: [
        { num: 1, text: 'God is our refuge and strength, a very present help in trouble.' }
      ]
    }
  },
  {
    id: 'psalm-119-105',
    reference: 'Psalm 119:105',
    book: 'Psalm',
    chapter: 119,
    verseRange: '105',
    category: 'Wisdom & Guidance',
    isMultiVerse: false,
    translations: {
      WEB: [
        { num: 105, text: 'Your word is a lamp to my feet, and a light for my path.' }
      ],
      KJV: [
        { num: 105, text: 'Thy word is a lamp unto my feet, and a light unto my path.' }
      ]
    }
  },
  {
    id: 'psalm-27-1',
    reference: 'Psalm 27:1',
    book: 'Psalm',
    chapter: 27,
    verseRange: '1',
    category: 'Strength & Courage',
    isMultiVerse: false,
    translations: {
      WEB: [
        { num: 1, text: 'Yahweh is my light and my salvation. Whom shall I fear? Yahweh is the strength of my life. Of whom shall I be afraid?' }
      ],
      KJV: [
        { num: 1, text: 'The LORD is my light and my salvation; whom shall I fear? the LORD is the strength of my life; of whom shall I be afraid?' }
      ]
    }
  },
  {
    id: 'psalm-121-1-2',
    reference: 'Psalm 121:1-2',
    book: 'Psalm',
    chapter: 121,
    verseRange: '1-2',
    category: 'Faith & Hope',
    isMultiVerse: true,
    translations: {
      WEB: [
        { num: 1, text: 'I will lift up my eyes to the hills. Where does my help come from?' },
        { num: 2, text: 'My help comes from Yahweh, who made heaven and earth.' }
      ],
      KJV: [
        { num: 1, text: 'I will lift up mine eyes unto the hills, from whence cometh my help.' },
        { num: 2, text: 'My help cometh from the LORD, which made heaven and earth.' }
      ]
    }
  },
  {
    id: 'isaiah-41-10',
    reference: 'Isaiah 41:10',
    book: 'Isaiah',
    chapter: 41,
    verseRange: '10',
    category: 'Strength & Courage',
    isMultiVerse: false,
    translations: {
      WEB: [
        { num: 10, text: 'Don’t you be afraid, for I am with you. Don’t be dismayed, for I am your God. I will strengthen you. Yes, I will help you. Yes, I will uphold you with the right hand of my righteousness.' }
      ],
      KJV: [
        { num: 10, text: 'Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee; yea, I will uphold thee with the right hand of my righteousness.' }
      ]
    }
  },
  {
    id: 'romans-12-2',
    reference: 'Romans 12:2',
    book: 'Romans',
    chapter: 12,
    verseRange: '2',
    category: 'Wisdom & Guidance',
    isMultiVerse: false,
    translations: {
      WEB: [
        { num: 2, text: 'Don’t be conformed to this world, but be transformed by the renewing of your mind, so that you may prove what is the good, well-pleasing, and perfect will of God.' }
      ],
      KJV: [
        { num: 2, text: 'And be not conformed to this world: but be ye transformed by the renewing of your mind, that ye may prove what is that good, and acceptable, and perfect, will of God.' }
      ]
    }
  },
  {
    id: '1-corinthians-13-4-7',
    reference: '1 Corinthians 13:4-7',
    book: '1 Corinthians',
    chapter: 13,
    verseRange: '4-7',
    category: 'Love & Grace',
    isMultiVerse: true,
    translations: {
      WEB: [
        { num: 4, text: 'Love is patient and is kind. Love doesn’t envy. Love doesn’t brag, is not proud,' },
        { num: 5, text: 'doesn’t behave itself inappropriately, doesn’t seek its own way, is not provoked, takes no account of evil;' },
        { num: 6, text: 'doesn’t rejoice in unrighteousness, but rejoices with the truth;' },
        { num: 7, text: 'bears all things, believes all things, hopes all things, and endures all things.' }
      ],
      KJV: [
        { num: 4, text: 'Charity suffereth long, and is kind; charity envieth not; charity vaunteth not itself, is not puffed up,' },
        { num: 5, text: 'Doth not behave itself unseemly, seeketh not her own, is not easily provoked, thinketh no evil;' },
        { num: 6, text: 'Rejoiceth not in iniquity, but rejoiceth in the truth;' },
        { num: 7, text: 'Beareth all things, believeth all things, hopeth all things, endureth all things.' }
      ]
    }
  },
  {
    id: 'galatians-5-22-23',
    reference: 'Galatians 5:22-23',
    book: 'Galatians',
    chapter: 5,
    verseRange: '22-23',
    category: 'Love & Grace',
    isMultiVerse: true,
    translations: {
      WEB: [
        { num: 22, text: 'But the fruit of the Spirit is love, joy, peace, patience, kindness, goodness, faith,' },
        { num: 23, text: 'gentleness, and self-control. Against such things there is no law.' }
      ],
      KJV: [
        { num: 22, text: 'But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith,' },
        { num: 23, text: 'Meekness, temperance: against such there is no law.' }
      ]
    }
  },
  {
    id: '2-timothy-1-7',
    reference: '2 Timothy 1:7',
    book: '2 Timothy',
    chapter: 1,
    verseRange: '7',
    category: 'Strength & Courage',
    isMultiVerse: false,
    translations: {
      WEB: [
        { num: 7, text: 'For God didn’t give us a spirit of fear, but of power, love, and self-control.' }
      ],
      KJV: [
        { num: 7, text: 'For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.' }
      ]
    }
  },
  {
    id: 'ephesians-2-8-9',
    reference: 'Ephesians 2:8-9',
    book: 'Ephesians',
    chapter: 2,
    verseRange: '8-9',
    category: 'Love & Grace',
    isMultiVerse: true,
    translations: {
      WEB: [
        { num: 8, text: 'For by grace you have been saved through faith, and that not of yourselves; it is the gift of God,' },
        { num: 9, text: 'not of works, that no one would boast.' }
      ],
      KJV: [
        { num: 8, text: 'For by grace are ye saved through faith; and that not of yourselves: it is the gift of God:' },
        { num: 9, text: 'Not of works, lest any man should boast.' }
      ]
    }
  },
  {
    id: 'matthew-6-33',
    reference: 'Matthew 6:33',
    book: 'Matthew',
    chapter: 6,
    verseRange: '33',
    category: 'Wisdom & Guidance',
    isMultiVerse: false,
    translations: {
      WEB: [
        { num: 33, text: 'But seek first God’s Kingdom and his righteousness; and all these things will be given to you as well.' }
      ],
      KJV: [
        { num: 33, text: 'But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.' }
      ]
    }
  },
  {
    id: 'hebrews-11-1',
    reference: 'Hebrews 11:1',
    book: 'Hebrews',
    chapter: 11,
    verseRange: '1',
    category: 'Faith & Hope',
    isMultiVerse: false,
    translations: {
      WEB: [
        { num: 1, text: 'Now faith is assurance of things hoped for, proof of things not seen.' }
      ],
      KJV: [
        { num: 1, text: 'Now faith is the substance of things hoped for, the evidence of things not seen.' }
      ]
    }
  },
  {
    id: 'john-14-6',
    reference: 'John 14:6',
    book: 'John',
    chapter: 14,
    verseRange: '6',
    category: 'Faith & Hope',
    isMultiVerse: false,
    translations: {
      WEB: [
        { num: 6, text: 'Jesus said to him, “I am the way, the truth, and the life. No one comes to the Father, except through me.”' }
      ],
      KJV: [
        { num: 6, text: 'Jesus saith unto him, I am the way, the truth, and the life: no man cometh unto the Father, but by me.' }
      ]
    }
  },
  {
    id: '1-peter-5-7',
    reference: '1 Peter 5:7',
    book: '1 Peter',
    chapter: 5,
    verseRange: '7',
    category: 'Comfort & Peace',
    isMultiVerse: false,
    translations: {
      WEB: [
        { num: 7, text: 'casting all your worries on him, because he cares for you.' }
      ],
      KJV: [
        { num: 7, text: 'Casting all your care upon him; for he careth for you.' }
      ]
    }
  },
  {
    id: 'james-1-5',
    reference: 'James 1:5',
    book: 'James',
    chapter: 1,
    verseRange: '5',
    category: 'Wisdom & Guidance',
    isMultiVerse: false,
    translations: {
      WEB: [
        { num: 5, text: 'But if any of you lacks wisdom, let him ask of God, who gives to all liberally and without reproach; and it will be given to him.' }
      ],
      KJV: [
        { num: 5, text: 'If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him.' }
      ]
    }
  },
  {
    id: 'colossians-3-23',
    reference: 'Colossians 3:23',
    book: 'Colossians',
    chapter: 3,
    verseRange: '23',
    category: 'Wisdom & Guidance',
    isMultiVerse: false,
    translations: {
      WEB: [
        { num: 23, text: 'Whatever you do, work at it heartily, as for the Lord, and not for men,' }
      ],
      KJV: [
        { num: 23, text: 'And whatsoever ye do, do it heartily, as to the Lord, and not unto men;' }
      ]
    }
  },
  {
    id: 'romans-8-38-39',
    reference: 'Romans 8:38-39',
    book: 'Romans',
    chapter: 8,
    verseRange: '38-39',
    category: 'Love & Grace',
    isMultiVerse: true,
    translations: {
      WEB: [
        { num: 38, text: 'For I am persuaded that neither death, nor life, nor angels, nor principalities, nor things present, nor things to come, nor powers,' },
        { num: 39, text: 'nor height, nor depth, nor any other created thing will be able to separate us from God’s love which is in Christ Jesus our Lord.' }
      ],
      KJV: [
        { num: 38, text: 'For I am persuaded, that neither death, nor life, nor angels, nor principalities, nor powers, nor things present, nor things to come,' },
        { num: 39, text: 'Nor height, nor depth, nor any other creature, shall be able to separate us from the love of God, which is in Christ Jesus our Lord.' }
      ]
    }
  },
  {
    id: '2-corinthians-5-17',
    reference: '2 Corinthians 5:17',
    book: '2 Corinthians',
    chapter: 5,
    verseRange: '17',
    category: 'Faith & Hope',
    isMultiVerse: false,
    translations: {
      WEB: [
        { num: 17, text: 'Therefore if anyone is in Christ, he is a new creation. The old things have passed away. Behold, all things have become new.' }
      ],
      KJV: [
        { num: 17, text: 'Therefore if any man be in Christ, he is a new creature: old things are passed away; behold, all things are become new.' }
      ]
    }
  },
  {
    id: 'john-16-33',
    reference: 'John 16:33',
    book: 'John',
    chapter: 16,
    verseRange: '33',
    category: 'Comfort & Peace',
    isMultiVerse: false,
    translations: {
      WEB: [
        { num: 33, text: 'I have told you these things, that in me you may have peace. In the world you have trouble; but cheer up! I have overcome the world.' }
      ],
      KJV: [
        { num: 33, text: 'These things I have spoken unto you, that in me ye might have peace. In the world ye shall have tribulation: but be of good cheer; I have overcome the world.' }
      ]
    }
  },
  {
    id: 'psalm-37-4',
    reference: 'Psalm 37:4',
    book: 'Psalm',
    chapter: 37,
    verseRange: '4',
    category: 'Faith & Hope',
    isMultiVerse: false,
    translations: {
      WEB: [
        { num: 4, text: 'Also delight yourself in Yahweh, and he will give you the desires of your heart.' }
      ],
      KJV: [
        { num: 4, text: 'Delight thyself also in the LORD; and he shall give thee the desires of thine heart.' }
      ]
    }
  },
  {
    id: 'micah-6-8',
    reference: 'Micah 6:8',
    book: 'Micah',
    chapter: 6,
    verseRange: '8',
    category: 'Wisdom & Guidance',
    isMultiVerse: false,
    translations: {
      WEB: [
        { num: 8, text: 'He has shown you, O man, what is good. What does Yahweh require of you, but to act justly, to love mercy, and to walk humbly with your God?' }
      ],
      KJV: [
        { num: 8, text: 'He hath shewed thee, O man, what is good; and what doth the LORD require of thee, but to do justly, and to love mercy, and to walk humbly with thy God?' }
      ]
    }
  },
  {
    id: 'lamentations-3-22-23',
    reference: 'Lamentations 3:22-23',
    book: 'Lamentations',
    chapter: 3,
    verseRange: '22-23',
    category: 'Love & Grace',
    isMultiVerse: true,
    translations: {
      WEB: [
        { num: 22, text: 'It is because of Yahweh’s loving kindnesses that we are not consumed, because his compassions don’t fail.' },
        { num: 23, text: 'They are new every morning. Great is your faithfulness.' }
      ],
      KJV: [
        { num: 22, text: 'It is of the LORD’s mercies that we are not consumed, because his compassions fail not.' },
        { num: 23, text: 'They are new every morning: great is thy faithfulness.' }
      ]
    }
  },
  {
    id: 'matthew-5-14-16',
    reference: 'Matthew 5:14-16',
    book: 'Matthew',
    chapter: 5,
    verseRange: '14-16',
    category: 'Faith & Hope',
    isMultiVerse: true,
    translations: {
      WEB: [
        { num: 14, text: 'You are the light of the world. A city located on a hill can’t be hidden.' },
        { num: 15, text: 'Neither do you light a lamp and put it under a measuring basket, but on a stand; and it shines to all who are in the house.' },
        { num: 16, text: 'Even so, let your light shine before men, that they may see your good works and glorify your Father who is in heaven.' }
      ],
      KJV: [
        { num: 14, text: 'Ye are the light of the world. A city that is set on an hill cannot be hid.' },
        { num: 15, text: 'Neither do men light a candle, and put it under a bushel, but on a candlestick; and it giveth light unto all that are in the house.' },
        { num: 16, text: 'Let your light so shine before men, that they may see your good works, and glorify your Father which is in heaven.' }
      ]
    }
  },
  {
    id: 'isaiah-26-3',
    reference: 'Isaiah 26:3',
    book: 'Isaiah',
    chapter: 26,
    verseRange: '3',
    category: 'Comfort & Peace',
    isMultiVerse: false,
    translations: {
      WEB: [
        { num: 3, text: 'You will keep whoever’s mind is steadfast in perfect peace, because he trusts in you.' }
      ],
      KJV: [
        { num: 3, text: 'Thou wilt keep him in perfect peace, whose mind is stayed on thee: because he trusteth in thee.' }
      ]
    }
  }
];
