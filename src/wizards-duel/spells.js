
var spells = [
	{
		incantation: 'volito',
		description: 'levitates',
		cast: function(manager, response, playerState, onSelf) {
			manager.addEffect(response, onSelf ? playerState : playerState.opponent, 'levitation');
		}
	},
	{
		incantation: 'madefio',
		description: 'soaks with water',
		cast: function(manager, response, playerState, onSelf) {
			manager.addEffect(response, onSelf ? playerState : playerState.opponent, 'water');
		}
	},
	{
		incantation: 'confundo',
		description: 'confuses',
		cast: function(manager, response, playerState, onSelf) {
			manager.addEffect(response, onSelf ? playerState : playerState.opponent, 'confuse');
		}
	},
	{
		incantation: 'caseum foetidum',
		description: 'makes one smell like stinky cheese',
		narration: '@target smelleth like stinky cheese.',
		cast: function(manager, response, playerState, onSelf) {
			manager.addEffect(response, onSelf ? playerState : playerState.opponent, 'stench');
		}
	},
	{
		incantation: 'dilata nares',
		description: 'enlarges one\'s nose',
		narration: '@target\'s nose hath been englarged.',
		cast: function(manager, response, playerState, onSelf) {
			manager.addEffect(response, onSelf ? playerState : playerState.opponent, 'large-nose');
		}
	},
	{
		incantation: 'curatio aegritudinis',
		description: 'cures illnesses',
		narration: '@target\'s illnesses have been cured.',
		cast: function(manager, response, playerState, onSelf) {
			var illnesses = [ 'frog-vomitting' ];
			for (var i = 0; i < illnesses.length; i++) {
				if (playerState.effects.contains(illnesses[i]))
					manager.removeEffect(response, onSelf ? playerState : playerState.opponent, illnesses[i]);
			}
		}
	},
];

module.exports = spells;
