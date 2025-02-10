const skills = [
    {
        name: "Acrobatics",
        subSkill: false,
        instinctive: true,
        description: "Twisting, diving, cartwheels, back-handsprings, parkour, jumping etc.",
        baseSkill: "",
        abilities: ["agility"],
        proficient: false
    },
    {
        name: "Animal Handling",
        subSkill: false,
        instinctive: true,
        description: "",
        baseSkill: "",
        abilities: ["charisma"],
        proficient: false
    },
    {
        name: "Acting",
        subSkill: false,
        instinctive: true,
        description: "Portray yourself in a way or manner that is not who you truly are in species, culture, alignment, attitude, etc using words, mannerisms, and body language.",
        baseSkill: "",
        abilities: ["charisma"],
        proficient: false
    },
    {
        name: "Alchemy",
        subSkill: true,
        instinctive: false,
        description: "Brew potions and/or drinks with alchemy tools or a distilling set and various ingredients.",
        baseSkill: "Craft",
        abilities: ["intelligence"],
        proficient: false
    },
    {
        name: "Analyze",
        subSkill: false,
        instinctive: true,
        description: "Determine general observable characteristics, strengths, and weaknesses of a creature through observation, testing, physically manipulating, etc.",
        baseSkill: "",
        abilities: ["acuity", "intelligence"],
        proficient: false
    },
    {
        name: "Appraise",
        subSkill: false,
        instinctive: true,
        description: "Determine the value, properties, and other characteristics of an object using observation, touch, testing, physically manipulating, etc.",
        baseSkill: "",
        abilities: ["acuity", "intelligence"],
        proficient: false
    },
    {
        name: "Arcana",
        subSkill: false,
        instinctive: false,
        description: "Understand the generals of power and things of an arcane nature and in some cases manipulate them using your memory, resources, known powers, power scrolls and books, power focus's, and so on.",
        baseSkill: "",
        abilities: ["intelligence"],
        proficient: false
    },
    {
        name: "Artistry",
        subSkill: true,
        instinctive: false,
        description: "Painting, sculpting, pottery making with paints, potting clay / wheels, mud, etc.",
        baseSkill: "Craft",
        abilities: ["agility"],
        proficient: false
    },
    {
        name: "Athletics",
        subSkill: false,
        instinctive: false,
        description: "Pulling, jumping, lifting.",
        baseSkill: "",
        abilities: ["strength"],
        proficient: false
    },
    {
        name: "Breath Holding",
        subSkill: false,
        instinctive: true,
        description: "",
        baseSkill: "",
        abilities: ["vitality"],
        proficient: false
    },
    {
        name: "Charm",
        subSkill: true,
        instinctive: true,
        description: "Gaining the confidence, trust, favor, and/or desire of an individual through some form of performance such as singing, dancing, poetry, etc.",
        baseSkill: "Perform",
        abilities: ["charisma"],
        proficient: false
    },
    {
        name: "Climb",
        subSkill: false,
        instinctive: true,
        description: "For every 1 to climb, you gain a climb MS of 1 for surfaces of DC 10. +1 to skill allows you to climb +1 to DC without rolling. Can be used to climb difficult areas, or to temporarily boost climbing MS.",
        baseSkill: "",
        abilities: ["strength", "vitality"],
        proficient: false
    },
    {
        name: "Cook",
        subSkill: true,
        instinctive: false,
        description: "Prepare food dishes of various compositions with intended flavor profiles and potential health benefits with cooking utensils and sometimes heat.",
        baseSkill: "Craft",
        abilities: ["intelligence", "acuity"],
        proficient: false
    },
    {
        name: "Craft",
        subSkill: false,
        instinctive: false,
        description: "Create or repair a variety of things using a variety of tools, sets, or kits, specific to the base crafting skill(s) you currently have. Your base skill determines what these things are, but the craft subskill allows you to improvise with the tools in a way to create something different or not as intended using similar or the same tools.",
        baseSkill: "",
        abilities: ["strength", "agility", "vitality", "intelligence", "acuity"],
        proficient: false
    },
    {
        name: "Taunt",
        subSkill: false,
        instinctive: true,
        description: "Aggrivate, enrage, mock, or scorn an individual or group.",
        baseSkill: "",
        abilities: ["charisma"],
        proficient: false
    },
    {
        name: "Dance",
        subSkill: true,
        instinctive: true,
        description: "Perform dances in any style using innate fitness, skill, poise, rythm and talent. You recognize different styles of dance and can recall information regarding them.",
        baseSkill: "Perform",
        abilities: ["charisma", "agility"],
        proficient: false
    },
    {
        name: "Deceive",
        subSkill: false,
        instinctive: true,
        description: "Lying to or deceiving others through your words and body language.",
        baseSkill: "",
        abilities: ["charisma"],
        proficient: false
    },
    {
        name: "Enchant",
        subSkill: true,
        instinctive: false,
        description: "",
        baseSkill: "Craft",
        abilities: ["intelligence"],
        proficient: false
    },
    {
        name: "Forgery",
        subSkill: true,
        instinctive: false,
        description: "Forge or create signatures, documents, scripts, seals, and so on with forgery and/or calligraphy tools.",
        baseSkill: "Craft",
        abilities: ["agility", "intelligence"],
        proficient: false
    },
    {
        name: "Glassblowing",
        subSkill: true,
        instinctive: false,
        description: "Blow molten glass into various configurations and forms with glassblowing tools and source of extreeme heat.",
        baseSkill: "Craft",
        abilities: ["strength", "vitality"],
        proficient: false
    },
    {
        name: "Hide",
        subSkill: true,
        instinctive: true,
        description: "While staying still, blend in or stay out of sight, sound, and notice using strength, endurance, agility, and/or talent.",
        baseSkill: "Stealth",
        abilities: ["strength", "vitality", "agility"],
        proficient: false
    },
    {
        name: "History",
        subSkill: false,
        instinctive: true,
        description: "Determine and/or recall the history, root, source, or secrets of anything founded upon or directly relating to a general world history through the use of personal knowledge, books, journals, and current and recent events.",
        baseSkill: "",
        abilities: ["intelligence"],
        proficient: false
    },
    {
        name: "Insight",
        subSkill: false,
        instinctive: true,
        description: "Interpreting and understanding the true meaning or intent behind a creature's actions or words using body language, mannerisms, hesitation, shakiness, and other tells.",
        baseSkill: "",
        abilities: ["charisma"],
        proficient: false
    },
    {
        name: "Instrument",
        subSkill: false,
        instinctive: false,
        description: "You can play an instrument with proficiency.",
        baseSkill: "",
        abilities: ["charisma"],
        proficient: false
    },
    {
        name: "Intimidate",
        subSkill: false,
        instinctive: true,
        description: "Intimidate an individual or group into taking or not taking a course of action using threats, body language, and general appearance.",
        baseSkill: "",
        abilities: ["charisma", "strength", "vitality"],
        proficient: false
    },
    {
        name: "Investigate",
        subSkill: false,
        instinctive: true,
        description: "Interpret and learn more about something non-living up close by using touch and potentially other senses, and manipulating or testing it.",
        baseSkill: "",
        abilities: ["acuity", "intelligence"],
        proficient: false
    },
    {
        name: "Jewelcraft",
        subSkill: true,
        instinctive: false,
        description: "Embed gems and jewels into materials, finely cut crystals gems, and stones with stone cutting tools, and jewlers tools.",
        baseSkill: "Craft",
        abilities: ["agility", "intelligence"],
        proficient: false
    },
    {
        name: "Juggling",
        subSkill: true,
        instinctive: false,
        description: "You can juggle 3 small objects or weapons under 1d4 damage with proficiency with basic juggling. +1 with the juggling skill allows you to juggle 4 objects, +2 allows you to juggle slightly larger objects and weapons up to 1d6, +3 allows you to add a 5th object, +4 allows medium objects or 1d8 weapons, +5 allows a for a 6th of these objects.",
        baseSkill: "Acrobatics",
        abilities: ["agility"],
        proficient: false
    },
    {
        name: "Leatherwork",
        subSkill: true,
        instinctive: false,
        description: "Create, mend, or modify leather armor, clothing, and accessories with leatherworking supplies, tailor supplies, or sewing kit.",
        baseSkill: "Craft",
        abilities: ["agility", "strength"],
        proficient: false
    },
    {
        name: "Lockpick",
        subSkill: true,
        instinctive: false,
        description: "Picking locks, spinning combinations, or cracking mechanical codes using a set of lockpicking tools.",
        baseSkill: "Slight of Hand",
        abilities: ["agility"],
        proficient: false
    },
    {
        name: "Lore",
        subSkill: true,
        instinctive: false,
        description: "Determine and/or recall the history, root, source, or secrets of anything founded upon or directly relating to a specific set, part, or portion, of history through the use of personal knowledge, books, journals, and current and recent events. This knowledge is considered deeper than a general world history and can relate directly to religion, civilization, cult, people, clan, etc.",
        baseSkill: "History",
        abilities: ["intelligence"],
        proficient: false
    },
    {
        name: "Medicine",
        subSkill: false,
        instinctive: false,
        description: "Examine wounds, heal targets, seek to understand symptoms, and diagnose ailments with medical supplies. Healing requires medical materials such as bandages and stacks with any base healing these items can do.",
        baseSkill: "",
        abilities: ["intelligence"],
        proficient: false
    },
    {
        name: "Nature",
        subSkill: false,
        instinctive: true,
        description: "Determine the general characteristics of plants, animals, ecosystems, and other aspects of the natural world using a knowledge of nature.",
        baseSkill: "",
        abilities: ["intelligence"],
        proficient: false
    },
    {
        name: "Navigate",
        subSkill: false,
        instinctive: false,
        description: "Navigate using the stars, sun, maps, compasses, and other cartography tools.",
        baseSkill: "",
        abilities: ["intelligence"],
        proficient: false
    },
    {
        name: "Perceive",
        subSkill: false,
        instinctive: true,
        description: "Interpret your surroundings consciously and generally as you stay still including close and far away stimuli using sight, smell, temperature, sound, and other senses not involving touch or manipulation.",
        baseSkill: "",
        abilities: ["acuity"],
        proficient: false
    },
    {
        name: "Perform",
        subSkill: false,
        instinctive: true,
        description: "Gaining the confidence, trust, favor, and/or desire of a group of people through some form of performance such as singing, dancing, acting, poetry, etc.",
        baseSkill: "",
        abilities: ["charisma"],
        proficient: false
    },
    {
        name: "Persuade",
        subSkill: false,
        instinctive: true,
        description: "Convincing an individual to take or not take a course of action they may or may not want to do through words, body language, and mannerisms.",
        baseSkill: "",
        abilities: ["charisma"],
        proficient: false
    },
    {
        name: "Pickpocket",
        subSkill: true,
        instinctive: true,
        description: "Taking something out or putting something into a pocket, bag, or any reasonable location on a another without being noticed.",
        baseSkill: "Slight of Hand",
        abilities: ["agility"],
        proficient: false
    },
    {
        name: "Religion",
        subSkill: false,
        instinctive: false,
        description: "Offering prayer or supplication/plea for answers, aid, or otherwise.",
        baseSkill: "",
        abilities: ["charisma"],
        proficient: false
    },
    {
        name: "Search",
        subSkill: true,
        instinctive: true,
        description: "Broadly or specifically sweep a large or small area as you move, seeking to find anything out of the ordinary or of potential or specific interest using sight, smell, temperature, sound and other senses not involving touch or manipulation.",
        baseSkill: "Perceive",
        abilities: ["acuity"],
        proficient: false
    },
    {
        name: "Slight of Hand",
        subSkill: false,
        instinctive: true,
        description: "Concealing something, palming something, handing something off, or preparing to attack discreetely.",
        baseSkill: "",
        abilities: ["agility"],
        proficient: false
    },
    {
        name: "Smith",
        subSkill: true,
        instinctive: false,
        description: "Forge and shape metals into weapons, armor, and other items with smith's tools and often extreeme heat.",
        baseSkill: "Craft",
        abilities: ["strength", "vitality"],
        proficient: false
    },
    {
        name: "Spellweave",
        subSkill: false,
        instinctive: false,
        description: "Improvise power-using by attempting to craft a power impromptu to meet a situation's needs. It is easier to use powers similar to powers you already know. Powers attempted this way consume more than the usual amount of EN for a similarly powered power.",
        baseSkill: "",
        abilities: ["intelligence"],
        proficient: false
    },
    {
        name: "Stealth",
        subSkill: false,
        instinctive: true,
        description: "Sneak, speak, or move subtly and without notice using physical agility and talent.",
        baseSkill: "",
        abilities: ["agility"],
        proficient: false
    },
    {
        name: "Swim",
        subSkill: false,
        instinctive: false,
        description: "For every 1.5 to swim, you gain a swimming MS of 2 (max of 8 MS for 5). Can be used to temporarily boost swim MS.",
        baseSkill: "",
        abilities: ["agility", "vitality"],
        proficient: false
    },
    {
        name: "Tailor",
        subSkill: true,
        instinctive: false,
        description: "Sew, create, and/or mend various articles of clothing or textiles with tailor supplies or a sewing kit.",
        baseSkill: "Craft",
        abilities: ["agility"],
        proficient: false
    },
    {
        name: "Tinker",
        subSkill: true,
        instinctive: false,
        description: "Repair, create, modify, and tinker with small machinery or robotics using Tinker tools and/or various scraps/mechanical parts.",
        baseSkill: "Craft",
        abilities: ["agility", "intelligence"],
        proficient: false
    },
    {
        name: "Tame",
        subSkill: true,
        instinctive: false,
        description: "",
        baseSkill: "Animal Handling",
        abilities: ["charisma"],
        proficient: false
    },
    {
        name: "Track",
        subSkill: false,
        instinctive: true,
        description: "Track down a creature using senses of sight, smell, feel, and taste when necessary. The longer it's been since present, the harder it is to track.",
        baseSkill: "",
        abilities: ["acuity", "intelligence"],
        proficient: false
    },
    {
        name: "Triage",
        subSkill: true,
        instinctive: false,
        description: "Emergency or urgent medical care to fatally afflicted creatures using more drastic or urgent methods.",
        baseSkill: "Medicine",
        abilities: ["intelligence"],
        proficient: false
    },
    {
        name: "Vehicle",
        subSkill: false,
        instinctive: false,
        description: "",
        baseSkill: "",
        abilities: ["agility"],
        proficient: false
    },
    {
        name: "Woodcarve",
        subSkill: true,
        instinctive: true,
        description: "Craft or repair items from wood, such as furniture, weapons, and tools with woodcarving, carpentry, or woodworking tools.",
        baseSkill: "Craft",
        abilities: ["agility"],
        proficient: false
    }
];

export default skills;