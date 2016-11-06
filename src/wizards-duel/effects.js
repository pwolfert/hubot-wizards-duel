var _      = require('underscore');
var spells = require('./spells');

var effects = {
	'fire': {
		adjective: 'on fire',
		counteracts: [ 'fog', 'cold', 'frost' ]
	},
	'water': {
		adjective: 'soaking wet',
		counteracts: [ 'fire' ]
	},
	'cold': {
		adjective: 'cold'
	},
	'frost': {
		adjective: 'frozen'
	},
	'levitation': {
		adjective: 'floating in the air'
	},
	'entangling-roots': {
		counteracts: [ 'levitation' ]
	},
	'frog-vomitting': {
		adjective: 'vomitting frogs',
		modify: function(manager, playerState) {
			playerState.turnSpellcasting *= 0.75;
		}
	},
	'fog': {
		modify: function(manager, playerState) {
			playerState.turnAccuracy *= 0.75;
			playerState.turnDodgeChance *= 1.25;
		}
	},
	'sunlight': {
		counteracts: [ 'fog' ]
	},
	'stench': {

	},
	'large-nose': {
		counteracts: [ 'small-nose' ],
		modify: function(manager, playerState) {
			var opponentState = manager.getPlayerState(playerState.opponent);
			if (playerState.effects.contains('stench') || opponentState.effects.contains('stench')) {
				// If the effect is on us this applies the effect again, which
				//   effectively doubles it.  If the effect is on the opponent,
				//   we want it now applied to us as well.
				effects['stench'].modify(playerState);
			}
		},
	},
	'small-nose': {
		counteracts: [ 'large-nose' ],
		modify: function(manager, playerState) {
			// Hmm, but how do we reverse another effect?  Do we need to
			// have inverseModify callback?  Or do we just start listing
			// out modifiers instead of having a modify function?
		}
	},
	'confuse': {
		beforeCast: function(manager, response, modifiedPlayerState, spell, onSelf) {
			// 25% chance of casting a completely different spell
			if (Math.random() >= 0.25) {
				var spellsArray = _.values(spells);
				var randomSpell = _.sample(spellsArray);

				// Narrate what just happened
				response.send(
					'@' + modifiedPlayerState.name + ' attempteth to utter the _' + spell.incantation + '_ ' +
					'but is confused and instead uttereth _' + randomSpell.incantation + '_.'
				);

				manager.attemptSpellCast(response, modifiedPlayerState, randomSpell, onSelf);

				return false; // Don't allow the spell to be cast
			}
		}
	}
};

module.exports = effects;
