import _ from "lodash";
import Player from "./player";
import Spell from "./spell";
import Effects from "./effects";
import friendlyBards from "./data/friendly-bards.json";
import unfriendlyBards from "./data/unfriendly-bards.json";

const AUTOMATIC_HIT = 99999;

var spellConfigs = [
  // ELEMENTAL
  // -------------------------------------------------------------------------
  {
    incantation: "madefio",
    description: "soaks with water",
    effects: ["water"]
  },
  {
    incantation: "incendio",
    description: "has a chance to catch things on fire",
    onHitTarget: function(manager, target, onSelf) {
      var flammableEffects = _.intersection(
        target.state.effects,
        Effects.filterByAttribute("flammable")
      );
      // Calculate chance to catch on fire (aided by presence of very flammable effects)
      var toCatchOnFire = 0.5 + 0.25 * flammableEffects.length;
      if (Math.random() <= toCatchOnFire) {
        target.addEffect("fire");
        target.addEffect("burns");
        manager.output.append(`@${target.state.name} has caught fire.`);
      } else {
        manager.output.append(`@${target.state.name} does not catch fire.`);
      }
    }
  },
  {
    incantation: "tempesto gelato",
    description: "conjures an arena-wide blizzard",
    effects: ["arena-blizzard"]
  },
  {
    incantation: "oppugno gelato",
    description: "conjures a localized blizzard over the target",
    baseSuccessRate: 0.75,
    hitModifier: -5,
    effects: ["blizzard"]
  },
  {
    incantation: "nimbusorio",
    description: "conjures an arena-wide rainstorm",
    effects: ["arena-rain"]
  },
  {
    incantation: "nimbus polus",
    description: "conjures localized rain over the target",
    baseSuccessRate: 0.75,
    hitModifier: -5,
    effects: ["rain"]
  },
  {
    incantation: "tempesto fulmeno",
    description: "conjures an arena-wide thunderstorm",
    baseSuccessRate: 0.75
  },
  {
    incantation: "nimbus fulmenus",
    description: "conjures a small cloud that shoots bolts of lightning",
    baseSuccessRate: 0.5,
    hitModifier: -5,
    effects: ["lightning"]
  },
  {
    incantation: "nebulo",
    description: "wraps the target in a thick fog",
    effects: ["fog"]
  },

  // BODY
  // -------------------------------------------------------------------------
  {
    incantation: "caseum foetidum",
    description: "makes one smell like stinky cheese",
    narration: "@target smells like stinky cheese.",
    effects: ["stench"]
  },
  {
    incantation: "fabrisio",
    description: "creates an overpowering fragrance",
    effects: ["fragrance"]
  },
  {
    incantation: "narem amplio",
    description: "enlarges one's nose",
    narration: "@target's nose has been englarged.",
    effects: ["large-nose"]
  },
  {
    incantation: "narem imminuo",
    description: "shrinks one's nose",
    narration: "@target's nose has shrunk.",
    effects: ["small-nose"]
  },
  {
    incantation: "coeliacus",
    description: "gives target urgent bowel issues",
    effects: ["bowel-stench", "bowel-slickery"]
  },
  {
    incantation: "curo aegritudinis",
    description: "cures illnesses",
    narration: "@target's illnesses have been cured.",
    removedEffects: [":isIllness"],
    baseSuccessRate: 0.25
  },
  {
    incantation: "curo coeliaca",
    description: "cures stomach ailments",
    narration: "@target's stomach ailments have been cured.",
    removedEffects: ["frog-vomitting", "bowel-stench", "bowel-slickery"],
    baseSuccessRate: 0.75
  },
  {
    incantation: "curo inflammatio",
    description: "cures inflammation",
    baseSuccessRate: 0.75,
    removedEffects: ["swollen-tongue", "swollen-eyes"]
  },
  {
    incantation: "sirenio",
    description: "gives the target a mer-tail",
    baseSuccessRate: 0.75,
    effects: ["mer-tail"]
  },
  {
    incantation: "oriculae vespilio",
    description: "gives the target bat ears",
    effects: ["bat-ears"]
  },
  {
    incantation: "arami noodli",
    description: "gives the target noodle arms",
    effects: ["noodle-arms"]
  },
  {
    incantation: "reddus bullus",
    description: "gives the target wings",
    effects: ["wings"]
  },
  {
    incantation: "oculi inflammatio",
    description: "swells the area around the eyes",
    effects: ["swollen-eyes"]
  },
  {
    incantation: "lingua inflammatio",
    description: "swells the tongue",
    effects: ["swollen-tongue"]
  },
  {
    incantation: "barba merlini",
    description: "gives the beard of Merlin",
    effects: ["merlins-beard"]
  },
  {
    incantation: "rana vomitio",
    description: "causes the target to vomit frogs",
    effects: ["frog-vomitting"]
  },

  // MENTAL
  // -------------------------------------------------------------------------
  {
    incantation: "claritas",
    description: "gives the target greater mental clearity",
    effects: ["clarity"]
  },
  {
    incantation: "confundo",
    description: "confuses the target",
    effects: ["confusion"],
    baseSuccessRate: 0.75
  },
  {
    incantation: "inebrio",
    description: "causes intoxication",
    effects: ["intoxication"],
    baseSuccessRate: 0.5
  },
  {
    incantation: "phonemia confusio",
    description: "causes a phonemic confusion in which B's become D's",
    effects: ["phonemic-confusion"],
    baseSuccessRate: 0.75
  },
  {
    incantation: "adspectus inverto",
    description: "turns vision upside-down and flipped",
    baseSuccessRate: 0.5,
    toggledEffects: ["inverted-vision"]
  },
  {
    incantation: "ophidiophobia",
    description: "causes a fear of snakes",
    effects: ["fear-of-snakes"]
  },
  {
    incantation: "musiophobia",
    description: "causes a fear of rats",
    effects: ["fear-of-rats"]
  },

  // CREATURES
  // -------------------------------------------------------------------------
  {
    incantation: "amiobardi",
    description: "conjures a friendly bard",
    narration: function(target) {
      var bardName = _.sample(friendlyBards);
      return `${bardName} is summoned to play inspiring music.`;
    },
    effects: ["friendly-bard"],
    hitModifier: AUTOMATIC_HIT
  },
  {
    incantation: "inimibardi",
    description: "conjures an ufriendly bard",
    narration: function(target) {
      var bardName = _.sample(unfriendlyBards);
      return `${bardName} is summoned to play demoralizing music.`;
    },
    effects: ["unfriendly-bard"],
    hitModifier: AUTOMATIC_HIT
  },
  {
    incantation: "expello socii",
    description: "banishes friendly companions",
    removedEffects: ["friendly-bard"]
  },
  {
    incantation: "evoco rati",
    description: "summons a mischief of rats",
    effects: ["rats"]
  },
  {
    incantation: "evoco muris",
    description: "summons mice",
    effects: ["mice"]
  },
  {
    incantation: "evoco serpentis",
    description: "summons snakes",
    effects: ["snakes"]
  },
  {
    incantation: "evoco termitis",
    description: "summons termites",
    effects: ["termites"]
  },
  {
    incantation: "evoco araneae",
    description: "summons a cluster of spiders",
    effects: ["spiders"]
  },
  {
    incantation: "evoco apis",
    description: "summons a swarm of bees",
    effects: ["bees"]
  },
  {
    incantation: "evoco cornicis",
    description: "summons a murder of crows",
    effects: ["crows"]
  },
  {
    incantation: "evoco herpestes",
    description: "summons a mongoose",
    effects: ["mongoose"]
  },
  {
    incantation: "taenia solium",
    description: "summons a brain parasite",
    effects: ["brain-parasite"]
  },

  // PROTECTION / BUFFS
  // -------------------------------------------------------------------------
  {
    incantation: "volito",
    description: "levitates target",
    effects: ["levitation"]
  },
  {
    incantation: "clostrumagia",
    description: "provides target with a minor magical shield",
    effects: ["magic-shield-10"],
    baseSuccessRate: 0.75
  },
  {
    incantation: "clostrumagia magna",
    description: "provides target with a decent magical shield",
    effects: ["magic-shield-20"],
    baseSuccessRate: 0.5
  },
  {
    incantation: "clostrumagia maxima",
    description: "provides target with a good magical shield",
    effects: ["magic-shield-30"],
    baseSuccessRate: 0.25
  },

  // HINDRANCES / TRAPS
  // -------------------------------------------------------------------------
  {
    incantation: "anvillus dropio",
    description: "banishes friendlies",
    effects: ["crushed"],
    hitModifier: -30,
    onHitTarget: function(manager, target, onSelf) {
      manager.output.append(`An anvil drops on @${target}.`);
    }
  },
  {
    incantation: "cavea metallica",
    description: "drops a heavy metal cage around the target",
    effects: ["metal-cage"],
    baseSuccessRate: 0.75
  },
  {
    incantation: "radix irretio",
    description: "calls up entangling roots from the ground",
    effects: ["entangling-roots"],
    baseSuccessRate: 0.75
  },
  {
    incantation: "copula cannabia",
    description: "binds the target with hemp ropes",
    effects: ["hemp-ropes"],
    baseSuccessRate: 0.75
  },
  {
    incantation: "pinabuturum spredio",
    description: "covers the target in peanut butter",
    effects: ["peanut-butter"]
  }
];

// Create Spell instances out of the configs
var spells = spellConfigs.map(function(spell) {
  return new Spell(spell);
});

/**
 * The interface through which we will access spells from other modules
 */
var Spells = {
  spells: spells,

  get(incantation) {
    return _.findWhere(this.spells, { incantation: incantation });
  },

  each: _.partial(_.each, spells),

  /**
   * Only used for testing
   */
  create(config) {
    var spell = new Spell(config);
    spells.push(spell);
    this.each = _.partial(_.each, spells);
    return spell;
  }
};

export default Spells;
