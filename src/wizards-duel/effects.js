import _      from 'underscore';
import spells from './spells';

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
		modify: function(manager, response, playerState, isDefense) {
			var opponentState = manager.getPlayerState(playerState.opponent);
			if (playerState.effects.contains('stench') || opponentState.effects.contains('stench')) {
				// If the effect is on us this applies the effect again, which
				//   effectively doubles it.  If the effect is on the opponent,
				//   we want it now applied to us as well.
				Effects.get('stench').modify(manager, repsonse, playerState, isDefense);
			}
		},
	},
	'small-nose': {
		negates: [ 'large-nose' ],
		modify: function(manager, response, playerState, isDefense) {
			// Hmm, but how do we reverse another effect?  Do we need to
			// have inverseModify callback?  Or do we just start listing
			// out modifiers instead of having a modify function?
		},
	},
	'confusion': {
		negates: [ 'clarity' ],
		beforeCast: function(manager, response, modifiedPlayerState, spell, onSelf) {
			// 25% chance of casting a completely different spell
			if (Math.random() < 0.25) {
				var spellsArray = _.values(spells);
				var randomSpell = _.sample(spellsArray);

				// Narrate what just happened
				response.send(
					`@${modifiedPlayerState.name} attempts to utter the _${spell.incantation}_ ` +
					`but is confused and instead utters _${randomSpell.incantation}_.`
				);

				manager.attemptSpellCast(response, modifiedPlayerState, randomSpell, onSelf);

				return false; // Don't allow the spell to be cast
			}
		},
	},
	'clarity': {
		negates: [ 'confusion', 'intoxication' ],
	},
	'intoxication': { // Spoonerisms
		negates: [ 'clarity' ],
		beforeCast: function(manager, response, modifiedPlayerState, spell, onSelf) {
			var words = spell.incantation.split(' ');
			// 60% chance of swapping word beginnings
			if (words.length > 1 && Math.random() < 0.6) {
				// Swap the beginning of the first two words
				// Maybe figure out where the first vowel begins and select the beginning to that
			}
		}
	}
};

var Effect = function(name, effect) {
	_.extend(this, effect);
	this.effect = effect;
	this.name = name;

	this.modify = function(manager, response, playerState, isDefense) {
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
	};

	this.inverseModify = function(manager, response, playerState, isDefense) {
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
	};

	this.narrateDefenseModifiers = function(response, playerState) {

	};

	this.narrateOffenseModifiers = function(response, playerState) {
		// 'Spellcasting chance is lowered'
	};
};

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
