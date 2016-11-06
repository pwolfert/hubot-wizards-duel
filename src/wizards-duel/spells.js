
var spells = [
	{
		incantation: 'volito',
		description: 'levitates',
		cast: function(manager, response, playerState, onSelf) {
			manager.addEffect(onSelf ? playerState.name : playerState.opponent, 'levitation');
		}
	},
	{
		incantation: 'madefio',
		description: 'soaks with water',
		cast: function(manager, response, playerState, onSelf) {
			manager.addEffect(onSelf ? playerState.name : playerState.opponent, 'water');
		}
	},
	{
		incantation: 'confundo',
		description: 'confuses',
		cast: function(manager, response, playerState, onSelf) {
			manager.addEffect(onSelf ? playerState.name : playerState.opponent, 'confuse');
		}
	},
	{
		incantation: 'caseum foetidum',
		description: 'makes one smell like stinky cheese',
		narration: '@target smelleth like stinky cheese.',
		cast: function(manager, response, playerState, onSelf) {
			manager.addEffect(onSelf ? playerState.name : playerState.opponent, 'stench');
		}
	},
];

module.exports = spells;
