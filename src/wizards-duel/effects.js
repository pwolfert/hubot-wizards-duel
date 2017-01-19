import _            from 'lodash';
import oxfordJoin   from 'oxford-join';
import Spells       from './spells';
import Player       from './player';
import Effect       from './effect';
import SetFunctions from './set';
import Language     from './language';

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
		alwaysRemoves: [ 'termites' ], // Removes effects even when it's not a new effect being added
		counteracts: [ 'fog' ],
		repels: [ 'entangling-roots' ], // Works like removes but only keeps a new effect from being added
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
		noun: 'flames',
		adjective: 'on fire',
		negates: [ 'fog', 'cold', 'frost' ],
	},
	'burns': {
		noun: 'burns',
	},
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
	'fog': {
		modifiers: [
			[ 'turnAccuracy', '-=', 30, 'has difficulty aiming and avoiding shots' ],
			[ 'turnEvasion',  '-=', 15 ],
		],
	},
	'sunlight': {
		negates: [ 'fog' ],
	},
	'rain': {
		isWater: true,
	},
	'blizzard': {

	},
	'lightning': {
		modifiers: [
			[ 'turnPain', '+=', 20, 'is struck by lightning' ],
		],
		synergies: [
			{
				effects: {
					or: [ 'water', 'arena-flood' ],
				},
				modifiers: [
					[ 'turnPain', '+=', 10, 'is more susceptible to lightning strikes' ],
				],
			}
		]
	},


	// BODY
	// -------------------------------------------------------------------------
	'hairless': {
		determiner: Effect.POSSESSIVE_DETERMINER,
		removes: [ 'merlins-beard' ],
	},
	'frog-vomitting': {
		noun: 'vomitting up of frogs',
		adjective: 'vomitting frogs',
		determiner: Effect.POSSESSIVE_DETERMINER,
		isIllness: true,
		modifiers: [
			[ 'turnSpellcasting', '-=', 20, 'has difficulty speaking' ],
		],
	},
	'stench': {
		noun: 'stench',
		determiner: Effect.POSSESSIVE_DETERMINER,
		counteracts: [ 'fragrance' ],
		modifiers: [
			[ 'turnSpellcasting', '-=', 10, 'has difficulty concentrating' ],
		],
	},
	'fragrance': {
		noun: 'fragrance',
		determiner: Effect.POSSESSIVE_DETERMINER,
		counteracts: [ 'stench' ],
	},
	'large-nose': {
		noun: 'enlarged nose',
		determiner: Effect.POSSESSIVE_DETERMINER,
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
		noun: 'small nose',
		determiner: Effect.POSSESSIVE_DETERMINER,
		counteracts: [ 'stench', 'fragrance', 'bowel-stench' ],
		negates: [ 'large-nose' ],
	},
	'merlins-beard': {
		noun: 'beard',
		determiner: 'Merlin\'s',
		isFlammable: true,
		modifiers: [
			[ 'turnSpellcasting', '+=', 20, 'receives arcane wisdom' ],
		],
	},
	'bowel-slickery': {
		noun: 'bowel slickery',
		determiner: Effect.POSSESSIVE_DETERMINER,
		isIllness: true,
		modifiers: [
			[ 'turnEvasion', '+=', 5, 'has lubricated legs' ],
		],
	},
	'bowel-stench': {
		noun: 'bowel stench',
		determiner: Effect.POSSESSIVE_DETERMINER,
		isIllness: true,
		modifiers: [ 'stench' ],
	},
	'small-feet': {
		noun: 'small feet',
		determiner: Effect.POSSESSIVE_DETERMINER,
		negates: [ 'large feet' ],
		modifiers: [
			[ 'turnEvasion', '-=', 10, 'moves with greater difficulty' ],
		],
	},
	'tiny-feet': {
		noun: 'tiny feet',
		determiner: Effect.POSSESSIVE_DETERMINER,
		negates: [ 'large feet' ],
		removes: [ 'small-feet' ],
		modifiers: [
			[ 'turnEvasion', '-=', 30, 'cannot stand' ],
		],
	},
	'swollen-tongue': {
		noun: 'swollen tongue',
		determiner: Effect.POSSESSIVE_DETERMINER,
		modifiers: [
			[ 'turnSpellcasting', '-=', 15, 'has difficulty speaking' ],
		],
	},
	'swollen-eyes': {
		noun: 'swollen eyes',
		determiner: Effect.POSSESSIVE_DETERMINER,
		modifiers: [
			[ 'turnAccuracy', '-=', 10, 'has difficulty seeing' ],
			[ 'turnEvasion',  '-=',  5 ],
		],
	},
	'wings': {
		determiner: Effect.POSSESSIVE_DETERMINER,
		isFlammable: true,
		counteracts: [ 'small-feet', 'tiny-feet' ],
	},
	'bat-ears': {
		noun: 'bat ears',
		determiner: Effect.POSSESSIVE_DETERMINER,
	},
	'noodle-arms': {
		noun: 'noodle arms',
		determiner: Effect.POSSESSIVE_DETERMINER,
	},
	'skin-irritation': {
		noun: 'skin irritation',
		determiner: Effect.POSSESSIVE_DETERMINER,
		isIllness: true,
	},
	'eagle-head': {
		noun: 'eagle head',
		determiner: Effect.POSSESSIVE_DETERMINER,
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
		],
	},
	'elephant-form': {
		noun: 'elephant form',
		determiner: Effect.POSSESSIVE_DETERMINER,
		removes: [ /* other animal forms */ ],
		synergies: [
			{
				effects: {
					or: [ 'mice' ],
					onEitherPlayer: true,
				},
				modifiers: [
					'fear',
				],
			},
		],
	},
	'marionette': {
		determiner: Effect.POSSESSIVE_DETERMINER,
	},
	'mer-tail': {
		determiner: Effect.POSSESSIVE_DETERMINER,
		removes: [ 'small-feet', 'tiny-feet', 'large-feet' ],
		modifiers: [
			[ 'turnEvasion', '-=', 20, 'cannot move effectively on land' ],
		],
		synergies: [
			{
				effects: {
					or: [ 'flood-arena' ],
				},
				modifiers: [
					[ 'turnEvasion', '+=', 20, 'is very agile in the water' ],
				],
				counteractsBaseModifiers: true,
			},
		]
	},

	// MENTAL
	// -------------------------------------------------------------------------
	'confusion': {
		determiner: Effect.POSSESSIVE_DETERMINER,
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
		noun: 'mental clarity',
		determiner: Effect.POSSESSIVE_DETERMINER,
		negates: [ 'confusion', 'intoxication' ],
		modifiers: [
			[ 'turnSpellcasting', '+=', 10, 'can think more clearly' ],
		],
	},
	'intoxication': { // Spoonerisms
		determiner: Effect.POSSESSIVE_DETERMINER,
		negates: [ 'clarity' ],
		beforeCast: function(manager, player, spell, onSelf) {
			var words = spell.incantation.split(' ');
			// 60% chance of swapping word beginnings
			if (words.length > 1 && Math.random() < 0.6) {
				// Swap the beginning of the first two words
				var newIncantation = Language.spoonerize(words).join(' ');
				if (newIncantation !== spell.incantation) {
					manager.output.append(`@${player.state.name} tries to say _${spell.incantation}_ but drunkenly says _${newIncantation}_ instead.`);
					return false;
				}
			}
		},
	},
	'phonemic-confusion': {
		noun: 'phonemic confusion',
		determiner: Effect.POSSESSIVE_DETERMINER,
		beforeCast: function(manager, player, spell, onSelf) {
			var bsReplaced = spell.incantation.replace('b', 'd');
			if (spell.incantation !== bsReplaced) {
				manager.output.append(`@${player.state.name} tries to say _${spell.incantation}_ but instead says _${bsReplaced}_.`);
				return false;
			}
		}
	},
	'fear-of-snakes': {
		noun: 'fear of snakes',
		determiner: Effect.POSSESSIVE_DETERMINER,
		synergies: [
			{
				effects: {
					each: [ 'snakes' ],
					onEitherPlayer: true,
				},
				modifiers: [ 'fear' ],
			},
		],
	},
	'fear-of-rats': {
		noun: 'fear of rats',
		determiner: Effect.POSSESSIVE_DETERMINER,
		synergies: [
			{
				effects: {
					each: [ 'rats' ],
					onEitherPlayer: true,
				},
				modifiers: [ 'fear' ],
			},
		],
	},
	'fear': {
		determiner: Effect.POSSESSIVE_DETERMINER,
		modifiers: [
			[ 'turnPain', '+=', 10, 'is in mental anguish' ],
		],
	},
	'inverted-vision': {
		noun: 'inverted vision',
		determiner: Effect.POSSESSIVE_DETERMINER,
		modifiers: [
			[ 'turnAccuracy', '-=', 40, 'is very confused' ],
			[ 'turnEvasion',  '-=', 10 ],
		],
	},


	// CREATURES
	// -------------------------------------------------------------------------
	'brain-parasite': {
		noun: 'brain parasite',
		determiner: Effect.POSSESSIVE_DETERMINER,
		modifiers: [ [ 'turnSpellcasting', '-=', 10, 'has decreased brain capacity' ] ],
	},
	'friendly-bard': {
		noun: 'friendly bard',
		modifiers: [ [ 'turnPain', '-=', 10, 'can bear the pain of this world a little better' ] ],
	},
	'unfriendly-bard': {
		noun: 'unfriendly bard',
		modifiers: [ [ 'turnPain', '+=', 10, 'feels worse' ] ],
	},
	'rats': {
		noun: 'mischief of rats',
	},
	'mice': {
		noun: 'nest of mice',
	},
	'snakes': {
		noun: 'nest of snakes',
		removes: [ 'mice', 'rats' ],
		removalVerb: 'eat',
	},
	'termites': {
		noun: 'colony of termites',
		alwaysRemoves: [ ':isWood' ],
		removalVerb: 'eat',
	},
	'spiders': {
		noun: 'cluster of spiders',
		modifiers: [ 'fear' ],
	},
	'bees': {
		noun: 'swarm of bees',
		modifiers: [ [ 'turnPain', '+=', 10, 'is covered in painful bee stings' ] ],
	},
	'crows': {
		noun: 'murder of crows',
		alwaysRemoves: [ 'spiders', 'termites' ],
		removalVerb: 'eat',
	},
	'mongoose': {
		noun: 'mongoose',
		alwaysRemoves: [ 'spiders', 'termites' ],
		removalVerb: 'eat',
		negates: [ 'snakes' ],
		negatingVerb: 'succeeds in but dies fighting',
	},


	// PROTECTION / BUFFS
	// ---------------------------------------------------------------------------
	'magic-shield-10': {
		noun: 'protective aura I',
		modifiers: [ [ 'turnShield', '+=', 10, 'is provided with a minor magical shield' ] ],
	},
	'magic-shield-20': {
		noun: 'protective aura II',
		modifiers: [ [ 'turnShield', '+=', 20, 'is provided with a good magical shield' ] ],
		removes: [ 'magic-shield-10' ],
	},
	'magic-shield-30': {
		noun: 'protective aura III',
		modifiers: [ [ 'turnShield', '+=', 30, 'is provided with a greater magical shield' ] ],
		removes: [ 'magic-shield-20' ],
	},
	'levitation': {
		adjective: 'floating in the air',
		counteracts: [ 'flood', 'flood-arena' ],
		repels: [ 'entangling-roots' ],
		repellingVerb: 'is out of reach of',
	},
	'spectral': {
		beforeHit: function(manager, player, spell, onSelf) {
			manager.output.append(`The ${spell.projectileDescription} passes straight through @${player.state.name} with no effect`);
			return false;
		},
	},


	// HINDRANCES / TRAPS
	// ---------------------------------------------------------------------------
	'metal-cage': {
		noun: 'metal cage',
		isMetal: true,
		counteracts: [ 'levitation', 'lightning', 'arena-thunderstorm' ],
		modifiers: [
			[ 'turnEvasion', '-=', 40, 'is trapped and can\'t dodge effectively' ],
			[ 'turnShield',  '+=', 5,  'has a small chance of protection against spells' ],
		],
	},
	'entangling-roots': {
		noun: 'entangling roots',
		isWood: true,
		counteracts: [ 'levitation' ],
		modifiers: [
			[ 'turnEvasion', '-=', 40, 'is entangled at the feet and cannot move' ],
		],
	},
	'hemp-ropes': {
		noun: 'hemp ropes',
		modifiers: [
			[ 'turnEvasion', '-=', 40, 'is bound and can\'t dodge effectively' ],
		],
	},
	'peanut-butter': {
		noun: 'peanut butter coating',
		adjective: 'peanut-buttered',
	},

	// GLOBAL EFFECTS
	// ---------------------------------------------------------------------------
	'arena-flood': {
		global: true,
	},
	'arena-rain': {
		global: true,
		modifiers: [ 'rain' ],
	},
	'arena-thunderstorm': {
		global: true,
	},
	'arena-blizzard': {
		global: true,
		modifiers: [ 'blizzard' ],
	},
};

var combinations = [
	[ [ 'hemp-ropes', 'peanut-butter', 'mice' ], [ 'mice' ], 'The mice, eating the peanut butter, chew through the ropes.' ],
	[ [ 'peanut-butter', 'mice' ], [ 'mice' ], 'The mice eat the peanut butter.' ],
	[ [ 'hemp-ropes', 'peanut-butter', 'rats' ], [ 'rats' ], 'The rats, eating the peanut butter, chew through the ropes.' ],
	[ [ 'peanut-butter', 'rats' ], [ 'rats' ], 'The rats eat the peanut butter.' ],
	[ [ 'cold', 'water' ], [ 'ice' ], 'The water freezes into ice.' ],
	[ [ 'cold', 'rain' ], [ 'hail' ], 'The rain freezes and turns to hail.' ],
	[ [ 'arena-cold', 'arena-rain' ], [ 'arena-hail' ], 'The rain freezes and turns to hail.' ],
];

/**
 * The interface through which we will access effects from other modules
 */
var Effects = {

	effects: _.mapValues(effectConfigs, function(effect, effectName) {
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

	extractGlobalEffects(effectNames) {
		var localEffects = [];
		var globalEffects = [];

		for (let effectName of effectNames) {
			if (Effects.get(effectName).global)
				globalEffects.push(effectName);
			else
				localEffects.push(effectName);
		}

		return { localEffects, globalEffects };
	},

	getNouns(effectNames) {
		return effectNames.map((name) => this.get(name).noun);
	},

	addEffect(currentEffectNames, effectName, output, playerName) {
		// If the list already contains the effect, adding it will do nothing.
		if (currentEffectNames.includes(effectName))
			return currentEffectNames;

		var effect = Effects.get(effectName);

		// If there is a current effect that alwaysRemoves this effect, don't add it.
		for (let name of currentEffectNames) {
			let currentEffect = Effects.get(name);
			if (currentEffect.alwaysRemoves(effectName)) {
				if (output) {
					let d = currentEffect.getDeterminer(playerName);
					let Determiner = d.charAt(0).toUpperCase() + d.slice(1);
					output.append(`${Determiner} ${currentEffect.noun} ${currentEffect.removalVerb} ${effect.getDeterminer(playerName)} ${effect.noun}. `);
				}
				return currentEffectNames;
			}
			else if (currentEffect.repels(effectName)) {
				if (output) {
					let d = currentEffect.getDeterminer(playerName);
					let Determiner = d.charAt(0).toUpperCase() + d.slice(1);
					output.append(`${Determiner} ${currentEffect.noun} ${currentEffect.repellingVerb} ${effect.getDeterminer(playerName)} ${effect.noun}. `);
				}
				return currentEffectNames;
			}
		}

		var allNewEffectNames = [ effectName ];
		var allEffectNames = currentEffectNames.concat([ effectName ]);

		// Recursively check for combinations
		var remainingEffects;
		var resultantEffects;
		do {
			({ remainingEffects, resultantEffects } = this.getCombinationResults(allEffectNames, output, playerName));
			// console.log(remainingEffects, resultantEffects)
			if (resultantEffects.length) {
				allEffectNames = remainingEffects.concat(resultantEffects);
				allNewEffectNames = allNewEffectNames.concat(resultantEffects);
			}
		} while (resultantEffects.length);

		// Figure out, after all the combining, what our new effects are
		var newEffectNames = _.intersection(allEffectNames, allNewEffectNames);

		// Then with all the new effects, see if they negate or remove any existing effects
		for (let newEffectName of newEffectNames) {
			var newEffect = Effects.get(newEffectName);
			var determiner = newEffect.getDeterminer(playerName);
			var Determiner = determiner.charAt(0).toUpperCase() + determiner.slice(1);

			var negated = this.getNegatedEffects(allEffectNames, newEffectName);
			if (negated.length) {
				SetFunctions.remove(allEffectNames, newEffectName);
				for (let negatedEffectName of negated)
					SetFunctions.remove(allEffectNames, negatedEffectName);

				if (output)
					output.append(`${Determiner} ${newEffect.noun} ${newEffect.negatingVerb} the ${oxfordJoin(negated)}. `);
			}

			var removed = this.getRemovedEffects(allEffectNames, newEffectName);

			for (let removedEffectName of removed)
				SetFunctions.remove(allEffectNames, removedEffectName);

			if (output) {
				if (removed.length)
					output.append(`${Determiner} ${newEffect.noun} ${newEffect.removalVerb} the ${oxfordJoin(this.getNouns(removed))}. `);

				var counteracted = this.getCounteractedEffects(allEffectNames, newEffectName);
				if (counteracted.length)
					output.append(`${Determiner} ${newEffect.noun} counteracts the ${oxfordJoin(this.getNouns(counteracted))}. `);
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

		return _.filter(effectNames, function(name) {
			return (effect.counteracts(name));
		});
	},

	getNegatedEffects(effectNames, effectName) {
		var effect = Effects.get(effectName);

		return _.filter(effectNames, function(name) {
			return (effect.negates(name));
		});
	},

	getRemovedEffects(effectNames, effectName) {
		var effect = Effects.get(effectName);

		return _.filter(effectNames, function(name) {
			return (effect.removes(name));
		});
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
					if (combination[2]) {
						// We've got a custom narration for the combination
						output.append(`${combination[2]} `);
					}
					else {
						// There's no custom narration, so just use a generic formula
						var ingredientNouns = this.getNouns(combination[0]);
						var resultNouns     = this.getNouns(realResults);
						output.append(`The ${oxfordJoin(ingredientNouns)} combined, resulting in ${oxfordJoin(resultNouns)}. `);
					}
				}
			}
		}

		return { remainingEffects, resultantEffects };
	},

	combinations: combinations,

};

export default Effects;
