import chai    from 'chai';
import Manager from '../src/wizards-duel/manager.js';
import Player  from '../src/wizards-duel/player.js';
import Spells  from '../src/wizards-duel/spells.js';

var expect = chai.expect;

describe('Spells', () => {
	var player;
	var manager;

	beforeEach(() => {
		manager = new Manager({
			brain: {},
			hear: () => {},
		});

		player = new Player(manager, Player.getInitialState('alice', true, 'bob'));
	});

	it('adds and removes appropriate effects', () => {
		player.state.effects = [ 'confusion' ];

		var spell = Spells.create({
			incantation: 'examplio',
			effects: [ 'fragrance' ],
			removedEffects: [ 'confusion' ],
		});

		spell.cast(manager, player, true);

		expect(player.state.effects).to.deep.eql([ 'fragrance' ]);
	});

	it('calls #cast in config', () => {
		var spell = Spells.create({
			incantation: 'examplio',
			cast: function(manager, player, onSelf) {
				player.state.hi = 'hello';
			}
		});

		spell.cast(manager, player, true);

		expect(player.state.hi).to.eql('hello');
	});

	it('#getNarration works', () => {
		var spell = Spells.create({
			incantation: 'examplio',
			narration: '@target smells like stinky cheese',
		});

		spell.cast(manager, player, true);

		expect(spell.getNarration('alice')).to.eql('@alice smells like stinky cheese');
	});

});
