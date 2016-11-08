var _ = require('underscore');

var spells = [
	{
		incantation: 'volito',
		description: 'levitates',
		effects: [ 'levitation' ],
	},
	{
		incantation: 'madefio',
		description: 'soaks with water',
		effects: [ 'water' ],
	},
	{
		incantation: 'confundo',
		description: 'confuses',
		effects: [ 'confusion' ],
	},
	{
		incantation: 'caseum foetidum',
		description: 'makes one smell like stinky cheese',
		narration: '@target smelleth like stinky cheese.',
		effects: [ 'stench' ],
	},
	{
		incantation: 'fabrisio',
		effects: [ 'fragrance' ],
	},
	{
		incantation: 'narem amplio',
		description: 'enlarges one\'s nose',
		narration: '@target\'s nose hath been englarged.',
		effects: [ 'large-nose' ],
	},
	{
		incantation: 'narem imminuo',
		description: 'shrinks one\'s nose',
		narration: '@target\'s nose hath shrunk.',
		effects: [ 'small-nose' ],
	},
	{
		incantation: 'curatio aegritudinis',
		description: 'cures illnesses',
		narration: '@target\'s illnesses have been cured.',
		removedEffects: [ 'frog-vomitting' ],
	},
];


var Spell = function(spell) {
	_.extend(this, spell);
	this.spell = spell;

	this.cast = function(manager, response, playerState, onSelf) {
		var i;

		// Add effects as appropriate
		if (this.effects) {
			for (i = 0; i < this.effects.length; i++)
				manager.addEffect(response, onSelf ? playerState : playerState.opponent, this.effects[i]);
		}

		// Remove effects as appropriate
		if (this.removedEffects) {
			var targetState = onSelf ? playerState : manager.getPlayerState(playerState.opponent);
			for (i = 0; i < this.removedEffects.length; i++) {
				if (targetState.effects.contains(this.removedEffects[i]))
					manager.removeEffect(response, onSelf ? playerState : playerState.opponent, this.removedEffects[i]);
			}
		}

		// Call the spell config's cast function if it exists
		if (spell.cast)
			spell.cast(arguments);
	};
};


var Spells = {

	get: function(incantation) {
		return _.findWhere(spells, { incantation: incantation });
	},

	spells: _.map(spells, function(spell) {
		return new Spell(spell);
	}),

	each: _.partial(_.each, this.spells),

};


module.exports = Spells;
