import _            from 'underscore';
import oxfordJoin   from 'oxford-join';
import Spells       from './spells';
import Player       from './player';
import Effect       from './effect';
import SetFunctions from './set';

/**
 * Effect Configurations
 *
 * Notes:
 *  - some effects have no direct modifiers but exist solely for being part of
 *    synergies and combinations
 */
var effectConfigs = {
	// This is just an example that includes all the possibilities
	'example': {
		noun: 'example',
		adjective: 'exampled',
		negates: [ 'fire' ],
		removes: [ 'sunlight', ':isFlammable', ':isWood' ],
		counteracts: [ 'fog' ],
		counteredBy: [], // I haven't yet decided if I want this, but it would make it easier to write configs some cases even if it's redundant
		modifiers: [
			[ 'turnSpellcasting', '+=', 10, 'has an easier time thinking' ],
			[ 'turnAccuracy',     '-=', 20, 'has difficulty seeing' ],
			[ 'turnEvasion',      '+=', 10, 'moves with greater ease' ],
			[ 'turnShield',       '+=', 10, 'is provided with a minor magical shield' ],
		],
		synergies: [
			{
				effects: {
					or: [ 'cold' ],
				},
				modifiers: [
					[ 'turnPain', '+=', 10, 'is in slight pain from cold' ],
				],
			},
			{
				effects: {
					and: [ 'fire', 'tar' ],
				},
				modifiers: [
					[ 'turnPain', '+=', 10, 'is in pain from burning' ],
				],
			},
			{
				effects: {
					each: [ 'styrofoam', 'hay' ],
				},
				modifiers: [
					[ 'turnPain', '+=', 10, 'is in pain from burning' ],
				],
			},
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

		},
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
		isWood: true,
	},
	'fog': {
		modifiers: [
			[ 'turnAccuracy', '-=', 30, 'has difficulty aiming and avoiding shots' ],
			[ 'turnEvasion',  '-=', 15, ],
		],
	},
	'sunlight': {
		negates: [ 'fog' ],
	},
	'rain': {
		isWater: true,
	},


	// BODY
	// -------------------------------------------------------------------------
	'hairless': {},
	'frog-vomitting': {
		noun: 'vomitting up of frogs',
		adjective: 'vomitting frogs',
		modifiers: [
			[ 'turnSpellcasting', '-=', 20, 'has difficulty speaking' ],
		],
	},
	'stench': {
		noun: 'stench',
		counteracts: [ 'fragrance' ],
		modifiers: [
			[ 'turnSpellcasting', '-=', 10, 'has difficulty concentrating' ],
		],
	},
	'fragrance': {
		noun: 'fragrance',
		counteracts: [ 'stench' ],
	},
	'large-nose': {
		noun: 'enlarged nose',
		negates: [ 'small-nose' ],
		synergies: [
			{
				effects: {
					each: [ 'stench', 'bowel-stench' ],
					onEitherPlayer: true,
				},
				modifiers: [
					// If the effect is on us this applies the effect again, which
					//   effectively doubles it.  If the effect is on the opponent,
					//   we want it now applied to us as well.
					'stench',
				],
			},
		],
	},
	'small-nose': {
		counteracts: [ 'stench', 'fragrance', 'bowel-stench' ],
		negates: [ 'large-nose' ],
	},
	'merlins-beard': {
		// added wisdom, destroyed by fire and hairloss
		isFlammable: true,
	},
	'bowel-slickery': {
		noun: 'bowel slickery',
		modifiers: [
			[ 'turnEvasion', '+=', 5, 'has lubricated legs' ],
		],
	},
	'bowel-stench': {
		modifiers: [ 'stench' ],
	},
	'small-feet': {
		noun: 'small feet',
		negates: [ 'large feet' ],
		modifiers: [
			[ 'turnEvasion', '-=', 10, 'moves with greater difficulty' ],
		],
	},
	'tiny-feet': {
		noun: 'tiny feet',
		negates: [ 'large feet' ],
		removes: [ 'small-feet' ],
		modifiers: [
			[ 'turnEvasion', '-=', 30, 'cannot stand' ],
		],
	},
	'swollen-tongue': {},
	'swollen-eyes': {},
	'wings': {
		isFlammable: true,
	},
	'bat-ears': {},
	'noodle-arms': {},
	'skin-irritation': {},
	'eagle-head': {
		modifiers: [
			[ 'turnAccuracy', '+=', 10, 'has eagle vision' ],
		],
		synergies: [
			{
				effects: {
					each: [ 'mice', 'rats', 'snakes' ],
					onEitherPlayer: true,
				},
				modifiers: [
					[ 'turnSpellcasting', '-=', 5, 'is distracted by the small prey' ],
				],
			},
		]
	},
	'elephant-form': {
		removes: [ /* other animal forms */ ],
		synergies: [
			{
				effects: {
					or: [ 'mice' ],
					onEitherPlayer: true,
				},
				modifiers: [
					'fear'
				],
			},
		]
	},
	'marionette': {},

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
	'fear-of-snakes': {},
	'fear-of-rats': {},


	// CREATURE
	// -------------------------------------------------------------------------
	'brain-parasite': {},
	'friendly-bard': {
		modifiers: [ [ 'turnPain', '-=', 10, 'can bear the pain of this world a little better' ] ],
	},
	'unfriendly-bard': {
		modifiers: [ [ 'turnPain', '+=', 10, 'feels worse' ] ],
	},


	// PROTECTION / BUFFS
	// ---------------------------------------------------------------------------
	'magic-shield-10': {
		modifiers: [ [ 'turnShield', '+=', 10, 'is provided with a minor magical shield' ] ],
	},
	'magic-shield-20': {
		modifiers: [ [ 'turnShield', '+=', 20, 'is provided with a decent magical shield' ] ],
		removes: [ 'magic-shield-10' ],
	},
	'magic-shield-30': {
		modifiers: [ [ 'turnShield', '+=', 30, 'is provided with a good magical shield' ] ],
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
		},
	},

	/**
	 * Global effects (haven't decided if they'll be a thing yet)
	 */
	'flood-arena': {
		global: true,
	},
	'rainstorm-arena': {
		global: true,
	},
};

/**
 * The interface through which we will access effects from other modules
 */
var Effects = {

	effects: _.mapObject(effectConfigs, function(effect, effectName) {
		return new Effect(effectName, effect);
	}),

	get(effectName) {
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

	filterByAttribute(effectNames, attribute, value) {
		if (typeof effectNames === 'string') {
			value = attribute;
			attribute = effectNames;
			effectNames = _.map(this.effects, (effect) => effect.name);
		}

		if (value === undefined)
			value = true;

		return _.filter(effectNames, (effectName) => {
			return (Effects.get(effectName).effect[attribute] === value);
		});
	},

	getNouns(effectNames) {
		return effectNames.map((name) => this.get(name).noun);
	},

	addEffect(currentEffectNames, effectName, output, playerName) {
		var effect = Effects.get(effectName);

		var allNewEffectNames = [ effectName ];
		var allEffectNames = currentEffectNames.concat([ effectName ]);

		// Recursively check for combinations
		var remainingEffects;
		var resultantEffects;
		do {
			({ remainingEffects, resultantEffects } = this.getCombinationResults(allEffectNames, output, playerName));

			if (resultantEffects.length) {
				allEffectNames = remainingEffects.concat(resultantEffects);
				allNewEffectNames = allNewEffectNames.concat(resultantEffects);
			}
		} while (resultantEffects.length);

		// Figure out, after all the combining, what our new effects are
		var newEffectNames = _.intersection(allEffectNames, allNewEffectNames);

		// Then with all the new effects, see if they negate or remove any existing effects
		for (let newEffectName of newEffectNames) {
			var negated = this.getNegatedEffects(allEffectNames, newEffectName);
			if (negated.length) {
				SetFunctions.remove(allEffectNames, newEffectName);
				for (let negatedEffectName of negated)
					SetFunctions.remove(allEffectNames, negatedEffectName);

				if (output)
					output.append(`The ${newEffectName} has negated @${playerName}'s ${oxfordJoin(negated)}. `);
			}

			var removed = this.getRemovedEffects(allEffectNames, newEffectName);

			for (let removedEffectName of removed)
				SetFunctions.remove(allEffectNames, removedEffectName);

			if (output) {
				if (removed.length)
					output.append(`The ${newEffectName} has removed @${playerName}'s ${oxfordJoin(this.getNouns(removed))}. `);

				var counteracted = this.getCounteractedEffects(allEffectNames, newEffectName);
				if (counteracted.length)
					output.append(`The ${newEffectName} has counteracted @${playerName}'s ${oxfordJoin(this.getNouns(counteracted))}. `);
			}
		}

		return allEffectNames;
	},

	removeEffect(currentEffectNames, effectName, output, playerName) {
		if (output)
			output.append(`@${playerName}'s ${Effects.get(effectName).noun} has been removed. `);
		return _.without(currentEffectNames, effectName);
	},

	getCounteractedEffects(effectNames, effectName) {
		var effect = Effects.get(effectName);
		var counteractedEffectNames = [];
		for (let counteractedEffectName of effect.counteractedEffects) {
			if (SetFunctions.includes(effectNames, counteractedEffectName))
				counteractedEffectNames.push(counteractedEffectName);
		}

		return counteractedEffectNames;
	},

	getNegatedEffects(effectNames, effectName) {
		var effect = Effects.get(effectName);
		var negatedEffectNames = [];
		for (let negatedEffectName of effect.negatedEffects) {
			if (SetFunctions.includes(effectNames, negatedEffectName))
				negatedEffectNames.push(negatedEffectName);
		}

		return negatedEffectNames;
	},

	getRemovedEffects(effectNames, effectName) {
		var effect = Effects.get(effectName);
		var removedEffectNames = [];
		for (let removedEffectName of effect.removedEffects) {
			if (SetFunctions.includes(effectNames, removedEffectName))
				removedEffectNames.push(removedEffectName);
		}

		return removedEffectNames;
	},

	getCombinationResults(effectNames, output, playerName) {
		var combinationOccurred = false;
		var remainingEffects = effectNames.slice();
		var resultantEffects = [];

		for (let combination of this.combinations) {
			// If the intersection of the player's effects and the listed combinator
			//   effects in the combination entry is equal to the list of combinator
			//   effects, then we have all the ingredients we need.
			var intersection = _.intersection(combination[0], effectNames);
			if (intersection.length === combination[0].length) {
				combinationOccurred = true;

				for (let combinationEffectName of combination[0]) {
					// Only remove it if it's not in the results list
					if (!combination[1].includes(combinationEffectName))
						SetFunctions.remove(remainingEffects, combinationEffectName);
				}

				// Only add it to the results if it wasn't already in the effects list
				var realResults = _.difference(combination[1], combination[0]);
				for (let resultantEffectName of realResults)
					SetFunctions.add(resultantEffects, resultantEffectName);

				if (output) {
					var ingredientNouns = this.getNouns(combination[0]);
					var resultNouns     = this.getNouns(realResults);
					output.append(`The ${oxfordJoin(ingredientNouns)} combined, resulting in ${oxfordJoin(resultNouns)}. `);
				}
			}
		}

		return { remainingEffects, resultantEffects };
	},

	combinations: [
		[ [ 'cold', 'water' ], [ 'ice' ] ],
		[ [ 'cold', 'rain' ], [ 'ice', 'rain' ] ],
	],

};

export default Effects;
