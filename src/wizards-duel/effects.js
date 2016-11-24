import _      from 'underscore';
import Spells from './spells';
import Player from './player';

/**
 *
 * Effect configuration options: {
 *   negates: []     // Upon adding this effect, if any effects in this list are found, this and that effect are removed
 *   counteracts: [] // Listed effects are rendered ineffective
 *
 * }
 */
var effectConfigs = {
	// This is just an example that includes all the possibilities
	'example': {
		noun: 'example',
		adjective: 'exampled',
		negates: [ 'fire' ],
		removes: [ 'sunlight' ],
		counteracts: [ 'fog' ],
		counteredBy: [], // I haven't yet decided if I want this, but it would make it easier to write configs some cases even if it's redundant
		modifiers: [
			[ 'turnSpellcasting', '+=', 10, 'makes it easier to think' ],
			[ 'turnAccuracy',     '-=', 20, 'makes it difficult to see' ],
			[ 'turnEvasion',      '+=', 10, 'makes it easier to move' ],
			[ 'turnShield',       '+=', 10, 'provides a minor magical shield' ]
		],
		modify: function(manager, playerState, isDefense) {
			playerState.modified = true;
			playerState.modifiedIsDefense = isDefense;
		},
		// Called before a player attempts a spell cast
		beforeCast: function(manager, player, spell, onSelf) {
			return false;
		},
		// Called when a player is about to be hit by a spell
		beforeHit: function(manager, player, spell, onSelf) {

		}
	},

	// ELEMENTAL
	// -------------------------------------------------------------------------
	'fire': {
		noun: 'burning',
		adjective: 'on fire',
		negates: [ 'fog', 'cold', 'frost' ],
	},
	'burned': {},
	'water': {
		adjective: 'soaking wet',
		negates: [ 'fire' ],
	},
	'cold': {
		adjective: 'cold',
	},
	'frost': {
		adjective: 'frozen',
	},
	'entangling-roots': {
		counteracts: [ 'levitation' ],
	},
	'fog': {
		modifiers: [
			[ 'turnAccuracy', '-=', 30, 'makes it difficult to see' ],
			[ 'turnEvasion',  '-=', 15, 'makes it difficult to see' ],
		],
	},
	'sunlight': {
		negates: [ 'fog' ],
	},


	// BODY
	// -------------------------------------------------------------------------
	'frog-vomitting': {
		noun: 'vomitting up of frogs',
		adjective: 'vomitting frogs',
		modifiers: [
			[ 'turnSpellcasting', '-=', 20, 'makes it difficult to speak' ],
		],
	},
	'stench': {
		noun: 'stench',
		counteracts: [ 'fragrance' ],
		modifiers: [
			[ 'turnSpellcasting', '-=', 10, 'makes it difficult to concentrate' ],
		],
	},
	'fragrance': {
		noun: 'fragrance',
		counteracts: [ 'stench' ],
	},
	'large-nose': {
		noun: 'enlarged nose',
		negates: [ 'small-nose' ],
		modify: function(manager, playerState, isDefense) {
			var opponent = new Player(manager, playerState.opponent);
			if (playerState.effects.includes('stench') || opponent.state.effects.includes('stench')) {
				// If the effect is on us this applies the effect again, which
				//   effectively doubles it.  If the effect is on the opponent,
				//   we want it now applied to us as well.
				Effects.get('stench').modify(manager, playerState, isDefense);
			}
		},
	},
	'small-nose': {
		counteracts: [ 'stench', 'fragrance', 'bowel-stench' ],
		negates: [ 'large-nose' ],
	},
	'merlins-beard': {
		// added wisdom, destroyed by fire and hairloss
	},
	'bowel-slickery': {},
	'bowel-stench': {},
	'small-feet': {},
	'tiny-feet': {},
	'swollen-tongue': {},
	'swollen-eyes': {},
	'wings': {},
	'bat-ears': {},
	'noodle-arms': {},


	// MENTAL
	// -------------------------------------------------------------------------
	'confusion': {
		negates: [ 'clarity' ],
		beforeCast: function(manager, player, spell, onSelf) {
			// 25% chance of casting a completely different spell
			if (Math.random() < 0.25) {
				var randomSpell = _.sample(Spells.spells);

				// Narrate what just happened
				manager.output.send(
					`@${player.state.name} attempts to utter the _${spell.incantation}_ ` +
					`but is confused and instead utters _${randomSpell.incantation}_.`
				);

				player.attemptSpellCast(randomSpell, onSelf);

				return false; // Don't allow the spell to be cast
			}
		},
	},
	'clarity': {
		negates: [ 'confusion', 'intoxication' ],
	},
	'intoxication': { // Spoonerisms
		negates: [ 'clarity' ],
		beforeCast: function(manager, player, spell, onSelf) {
			var words = spell.incantation.split(' ');
			// 60% chance of swapping word beginnings
			if (words.length > 1 && Math.random() < 0.6) {
				// Swap the beginning of the first two words
				// Maybe figure out where the first vowel begins and select the beginning to that
			}
		},
	},
	'marionette': {},


	// CREATURE
	// -------------------------------------------------------------------------
	'brain-parasite': {},
	'friendly-bard': {
		modifiers: [ [ 'turnPain', '-=', 10, 'makes the pain of this world a little easier to bear' ] ],
	},
	'unfriendly-bard': {
		modifiers: [ [ 'turnPain', '+=', 10, 'is painful to hear' ] ],
	},


	// PROTECTION / BUFFS
	// ---------------------------------------------------------------------------
	'magic-shield-10': {
		modifiers: [ [ 'turnShield', '+=', 10, 'provides a minor magical shield' ] ],
	},
	'magic-shield-20': {
		modifiers: [ [ 'turnShield', '+=', 20, 'provides a decent magical shield' ] ],
		removes: [ 'magic-shield-10' ],
	},
	'magic-shield-30': {
		modifiers: [ [ 'turnShield', '+=', 30, 'provides a good magical shield' ] ],
		removes: [ 'magic-shield-20' ],
	},
	'levitation': {
		adjective: 'floating in the air',
		counteracts: [ 'entangling-roots' ],
	},
	'spectral': {
		beforeHit: function(manager, player, spell, onSelf) {
			manager.output.append(`The ${spell.projectileDescription} passes straight through @${player.state.name} with no effect`);
			return false;
		}
	},

	/**
	 * Global effects (haven't decided if they'll be a thing yet)
	 */
	'flood-arena': {
		global: true,
	},
	'rainstorm-arena': {
		global: true,
	}
};

/**
 * Class for effect instances that wraps some standard functionality around the
 *   configuration.
 */
class Effect {

	constructor(name, effectConfig) {
		this.effect = effectConfig;
		this.name = name;
	}

	get negatedEffects() {
		if (this.effect.negates)
			return this.effect.negates;
		return [];
	}

	get removedEffects() {
		if (this.effect.removes)
			return this.effect.removes;
		return [];
	}

	get counteractedEffects() {
		if (this.effect.counteracts)
			return this.effect.counteracts;
		return [];
	}

	modify(manager, playerState, isDefense) {
		// Apply listed modifiers
		if (this.effect.modifiers) {
			for (var i = 0; i < this.effect.modifiers.length; i++) {
				var modifier = this.effect.modifiers[i];
				var property = modifier[0];
				var operator = modifier[1];
				var operand = modifier[2];
				switch (operator) {
					case '*=':
						playerState[property] *= operand;
						break;
					case '/=':
						playerState[property] /= operand;
						break;
					case '+=':
						playerState[property] += operand;
						break;
					case '-=':
						playerState[property] -= operand;
						break;
					case '=':
						playerState[property] = operand;
						break;
				}
			}
		}

		// Call modify function if it exists
		if (this.effect.modify)
			this.effect.modify.apply(this, arguments);
	}

	inverseModify(manager, playerState, isDefense) {
		// Inversly apply listed modifiers
		if (this.effect.modifiers) {
			for (var i = 0; i < this.effect.modifiers.length; i++) {
				var modifier = this.effect.modifiers[i];
				var property = modifier[0];
				var operator = modifier[1];
				var operand = modifier[2];
				switch (operator) {
					case '*=':
						playerState[property] /= operand;
						break;
					case '/=':
						playerState[property] *= operand;
						break;
					case '+=':
						playerState[property] -= operand;
						break;
					case '-=':
						playerState[property] += operand;
						break;
				}
			}
		}
	}

	getDefenseModifiersNarration(playerState) {
		const defenseModifiers = [ 'turnEvasion' ]
	}

	getOffenseModifiersNarration(playerState) {
		// 'Spellcasting chance is lowered'
	}

	counteracts(effectName) {
		if (this.effect.counteracts)
			return this.effect.counteracts.includes(effectName);
		else
			return false;
	}

	negates(effectName) {
		if (this.effect.negates)
			return this.effect.negates.includes(effectName);
		else
			return false;
	}

	/**
	 * Called on every active effect before a player attempts a spell cast.
	 *   If `false` is returned, the spell won't be cast.
	 */
	beforeCast(manager, player, spell, onSelf) {
		if (this.effect.beforeCast)
			return this.effect.beforeCast.apply(this, arguments);

		return true;
	}

	/**
	 * Called on every active effect when a player is about to be hit by a spell.
	 *   If `false` is returned, the spell won't hit.
	 */
	beforeHit(manager, player, spell, onSelf) {
		if (this.effect.beforeHit)
			return this.effect.beforeHit.apply(this, arguments);

		return true;
	}

}


/**
 * The interface through which we will access effects from other modules
 */
var Effects = {

	effects: _.mapObject(effectConfigs, function(effect, effectName) {
		return new Effect(effectName, effect);
	}),

	get(effectName) {
		// Create an object with callable functions
		return this.effects[effectName];
	},

	/**
	 * Only used for testing
	 */
	create(effectName, config) {
		var effect = new Effect(effectName, config);
		this.effects[effectName] = effect;
		return effect;
	},

	veryFlammableEffectNames: [
		'wings', 'merlins-beard'
	],

};

export default Effects;
