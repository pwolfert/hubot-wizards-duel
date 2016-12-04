import _ from 'underscore';
import Player from './player';
import Spell from './spell';
import Effects from './effects';
import friendlyBards   from './data/friendly-bards.json';
import unfriendlyBards from './data/unfriendly-bards.json';

const AUTOMATIC_HIT = 99999;

var spellConfigs = [
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
		baseSuccessRate: 0.25,
	},
	{
		incantation: 'TODO: CURE STOMACH AILMENTS',
		description: 'cures stomach ailments',
		narration: '@target\'s stomach ailments have been cured.',
		removedEffects: [ 'frog-vomitting', 'bowel-stench', 'bowel-slickery' ],
		baseSuccessRate: 0.75,
	},
	{
		incantation: 'evoco baridum amicum',
		description: 'conjures a friendly bard',
		narration: function(target) {
			var bardName = _.sample(friendlyBards);
			return `${bardName} is summoned to play inspiring music.`;
		},
		effects: [ 'friendly-bard' ],
		hitModifier: AUTOMATIC_HIT,
	},
	{
		incantation: 'evoco inimicum vatis',
		description: 'conjures an ufriendly bard',
		narration: function(target) {
			var bardName = _.sample(unfriendlyBards);
			return `${bardName} is summoned to play demoralizing music.`;
		},
		effects: [ 'unfriendly-bard' ],
		hitModifier: AUTOMATIC_HIT,
	},
	{
		incantation: 'TODO: BANISH FRIENDLIES',
		description: 'banishes friendlies',
	},
	{
		incantation: 'anvillus dropio',
		description: 'banishes friendlies',
		effects: [ 'crushed' ],
		hitModifier: -30,
		onHitTarget: function(manager, target, onSelf) {
			manager.output.append(`An anvil drops on @${target}.`);
		},
	},
	{
		incantation: 'TODO: CURE INFLAMMATION',
		description: 'cures inflammation',
		baseSuccessRate: 0.75,
	},
	{
		incantation: 'TODO: FIREBALL',
		description: 'has a chance to catch things on fire',
		onHitTarget: function(manager, target, onSelf) {
			var flammableEffects = _.intersection(target.state.effects, Effects.filterByAttribute('flammable'));
			// Calculate chance to catch on fire (aided by presence of very flammable effects)
			var toCatchOnFire = 0.5 + 0.25 * flammableEffects.length;
			if (Math.random() <= toCatchOnFire) {
				target.addEffect('fire');
				manager.output.append(`@${target.state.name} has caught fire.`);
			}
			else {
				manager.output.append(`@${target.state.name} does not catch fire.`);
			}
		},
	},
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
	},

};


export default Spells;
