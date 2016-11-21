import chai    from 'chai';
import Manager from '../src/wizards-duel/manager.js';
import Player  from '../src/wizards-duel/player.js';
import Effects from '../src/wizards-duel/effects.js';
import sinon   from 'sinon';
import 'sinon-chai';

var expect = chai.expect;

describe('Effects', () => {
	var playerState;
	var manager;

	beforeEach(() => {
		playerState = Player.getInitialState('alice', true, 'bob');

		manager = new Manager({
			brain: {},
			hear: () => {},
		});
	});

	it('#modify modifies player state properties', () => {
		var effect = Effects.create('example', {
			modifiers: [
				[ 'turnSpellcasting', '+=', 0.1, '' ],
				[ 'turnAccuracy',     '-=', 0.2, '' ],
				[ 'turnEvasion',      '+=', 0.2, '' ],
			],
			modify: function(manager, playerState, isDefense) {
				playerState.modified = true;
				playerState.modifiedIsDefense = isDefense;
			},
		});

		playerState.turnSpellcasting = 0.5;
		playerState.turnAccuracy     = 0.5;
		playerState.turnEvasion      = 0.5;

		effect.modify(manager, playerState, false);

		expect(playerState.turnSpellcasting).to.be.closeTo(0.6, 0.01);
		expect(playerState.turnAccuracy).to.be.closeTo(0.3, 0.01);
		expect(playerState.turnEvasion).to.be.closeTo(0.7, 0.01);
		expect(playerState.modified).to.be.true;
		expect(playerState.modifiedIsDefense).to.be.false;
	});

	it('#contains works', () => {
		var effect = Effects.create('example', {
			counteracts: [ 'fog' ],
		});

		expect(effect.counteracts('fog')).to.be.true;
		expect(effect.counteracts('log')).to.be.false;
	});

	it('#negates works', () => {
		var effect = Effects.create('example', {
			negates: [ 'fog' ],
		});

		expect(effect.negates('fog')).to.be.true;
		expect(effect.negates('log')).to.be.false;
	});

	it('#beforeCast returns appropriate values', () => {
		var effect = Effects.create('example', {
			beforeCast: function(manager, player, spell, onSelf) {
				return onSelf;
			},
		});

		var effect2 = Effects.create('example', {});

		expect(effect.beforeCast(manager, null, null, false)).to.be.false;
		expect(effect.beforeCast(manager, null, null, true)).to.be.true;
		expect(effect2.beforeCast(manager, null, null, false)).not.to.be.false;
	});

	it('#beforeHit returns appropriate values', () => {
		var effect = Effects.create('example', {
			beforeHit: function(manager, player, spell, onSelf) {
				return onSelf;
			},
		});

		var effect2 = Effects.create('example', {});

		expect(effect.beforeHit(manager, null, null, false)).to.be.false;
		expect(effect.beforeHit(manager, null, null, true)).to.be.true;
		expect(effect2.beforeHit(manager, null, null, false)).not.to.be.false;
	});

});
