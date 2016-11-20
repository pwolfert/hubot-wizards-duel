import _ from 'underscore';
import Player from './player';

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
		narration: '@target smells like stinky cheese.',
		effects: [ 'stench' ],
	},
	{
		incantation: 'fabrisio',
		effects: [ 'fragrance' ],
	},
	{
		incantation: 'narem amplio',
		description: 'enlarges one\'s nose',
		narration: '@target\'s nose has been englarged.',
		effects: [ 'large-nose' ],
	},
	{
		incantation: 'narem imminuo',
		description: 'shrinks one\'s nose',
		narration: '@target\'s nose has shrunk.',
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

	this.cast = function(manager, player, onSelf) {
		var i;
		var target = onSelf ? player : new Player(manager, player.state.opponent);

		// Add effects as appropriate
		if (this.effects) {
			for (i = 0; i < this.effects.length; i++)
				target.addEffect(this.effects[i]);
		}

		// Remove effects as appropriate
		if (this.removedEffects) {
			var targetState = onSelf ? player : manager.getPlayerState(player.state.opponent);
			for (i = 0; i < this.removedEffects.length; i++) {
				if (targetState.effects.contains(this.removedEffects[i]))
					target.removeEffect(this.removedEffects[i]);
			}
		}

		// If it's the opponent, we need to save
		if (!onSelf)
			target.save();

		// Call the spell config's cast function if it exists
		if (spell.cast)
			spell.cast(arguments);
	};
};


var Spells = {

	spells: _.map(spells, function(spell) {
		return new Spell(spell);
	}),

	get: function(incantation) {
		return _.findWhere(this.spells, { incantation: incantation });
	},

	each: _.partial(_.each, spells),

};


export default Spells;
