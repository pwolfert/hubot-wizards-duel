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
		modify: function(playerState) {
			playerState.turnSpellcasting *= 0.75;
		}
	},
	'fog': {
		modify: function(playerState) {
			playerState.turnAccuracy *= 0.75;
			playerState.turnDodge *= 1.25;
		}
	},
	'sunlight': {
		counteracts: [ 'fog' ]
	},
	'stench': {

	},
	'large-nose': {
		counteracts: [ 'small-nose' ],
		modify: function(playerState) {
			if (playerState.effects.contains('stench')) {
				// Double the effect of stench
				effects['stench'].modify(playerState);
			}
		},
	},
	'small-nose': {
		counteracts: [ 'large-nose' ],
		modify: function(playerState) {
			// Hmm, but how do we reverse another effect?  Do we need to
			// have inverseModify callback?  Or do we just start listing
			// out modifiers instead of having a modify function?
		}
	}
};

module.exports = effects;
