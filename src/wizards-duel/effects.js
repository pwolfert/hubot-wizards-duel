import _      from 'underscore';
import spells from './spells';
import Player from './player';

/**
 *
 * Effect configuration options: {
 *   negates: []     // Upon adding this effect, if any effects in this list are found, this and that effect are removed
 *   counteracts: [] // Listed effects are rendered ineffective
 *
 * }
 */
var effects = {
	'fire': {
		noun: 'burning',
		adjective: 'on fire',
		negates: [ 'fog', 'cold', 'frost' ],
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
	'levitation': {
		adjective: 'floating in the air',
	},
	'entangling-roots': {
		counteracts: [ 'levitation' ],
	},
	'frog-vomitting': {
		noun: 'vomitting up of frogs',
		adjective: 'vomitting frogs',
		modifiers: [
			[ 'turnSpellcasting', '*=', 0.75, 'makes it difficult to speak' ],
		],
	},
	'fog': {
		modifiers: [
			[ 'turnAccuracy', '*=', 0.75, 'makes it difficult to see' ],
			[ 'turnEvasion',  '*=', 1.25, 'makes it difficult to see' ],
		],
	},
	'sunlight': {
		negates: [ 'fog' ],
	},
	'stench': {
		noun: 'stench',
		counteracts: [ 'fragrance' ],
		modifiers: [
			[ 'turnSpellcasting', '*=', 0.75, 'makes it difficult to concentrate' ],
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
			if (playerState.effects.contains('stench') || opponent.state.effects.contains('stench')) {
				// If the effect is on us this applies the effect again, which
				//   effectively doubles it.  If the effect is on the opponent,
				//   we want it now applied to us as well.
				Effects.get('stench').modify(manager, playerState, isDefense);
			}
		},
	},
	'small-nose': {
		negates: [ 'large-nose' ],
		modify: function(manager, playerState, isDefense) {
			// Hmm, but how do we reverse another effect?  Do we need to
			// have inverseModify callback?  Or do we just start listing
			// out modifiers instead of having a modify function?
		},
	},
	'confusion': {
		negates: [ 'clarity' ],
		beforeCast: function(manager, player, spell, onSelf) {
			// 25% chance of casting a completely different spell
			if (Math.random() < 0.25) {
				var spellsArray = _.values(spells);
				var randomSpell = _.sample(spellsArray);

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
		}
	}
};

/**
 * Class for effect instances that wraps some standard functionality around the
 *   configuration.
 */
class Effect {

	constructor(name, effect) {
		this.effect = effect;
		this.name = name;
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
			this.effect.modify(arguments);
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

	narrateDefenseModifiers(playerState) {

	}

	narrateOffenseModifiers(playerState) {
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

}


var Effects = {

	effects: _.mapObject(effects, function(effect, effectName) {
		return new Effect(effectName, effect);
	}),

	get(effectName) {
		// Create an object with callable functions
		return this.effects[effectName];
	},

};

export default Effects;
