import chai    from 'chai';
import Manager from '../src/wizards-duel/manager.js';
import Player  from '../src/wizards-duel/player.js';
import Effects from '../src/wizards-duel/effects.js';
import Spells  from '../src/wizards-duel/spells.js';
import OutputBuffer from '../src/wizards-duel/output-buffer.js';

var expect = chai.expect;

describe('Player', () => {
	var player;
	var manager;

	beforeEach(() => {
		manager = new Manager({
			brain: {},
			hear: () => {},
		});
		manager.startOutput({
			send: function() {},
			reply: function() {},
		});

		player = new Player(manager, Player.getInitialState('alice', true, 'bob'));
	});

	it('#resetTurnVars works', () => {
		player.state.spellcasting = 100;
		player.state.accuracy = 50;
		player.state.evasion = 50;
		player.state.pain = 50;

		player.resetTurnVars();

		expect(player.state.turnSpellcasting).to.eql(player.state.spellcasting);
		expect(player.state.turnAccuracy).to.eql(player.state.accuracy);
		expect(player.state.turnEvasion).to.eql(player.state.evasion);
		expect(player.state.turnShield).to.eql(0);
		expect(player.state.turnPain).to.eql(player.state.pain);
	});

	it('#getAffectedPlayerState and #getAffectedState modify state correctly', () => {
		var effectName = 'example-modified-state';
		Effects.create(effectName, {
			modifiers: [
				[ 'turnAccuracy', '-=', 20, 'makes it difficult to see' ],
			],
		});

		player.state.accuracy = 50;
		player.resetTurnVars();
		player.state.effects = [ effectName ];
		var affectedState = Player.getAffectedPlayerState(manager, player.state, false);
		expect(affectedState.turnAccuracy).to.be.closeTo(30, 0.01);
		affectedState = player.getAffectedState();
		expect(affectedState.turnAccuracy).to.be.closeTo(30, 0.01);
	});

	it('#getActiveEffects takes into account counteractions', () => {
		var counteractedEffectName  = 'example-active-counteracted';
		var counteractingEffectName = 'example-active-counteracting';
		Effects.create(counteractedEffectName, {});
		Effects.create(counteractingEffectName, {
			counteracts: [ counteractedEffectName ]
		});

		player.state.effects = [ counteractedEffectName ];
		expect(Player.getActiveEffects(player.state)).to.deep.eql([ counteractedEffectName ]);
		player.state.effects.push(counteractingEffectName);
		expect(Player.getActiveEffects(player.state)).to.deep.eql([ counteractingEffectName ]);
	});

	it('#spellSucceeded correctly calculates cast success and failure', () => {
		var spell = Spells.create({});
		expect(player.spellSucceeded(spell)).to.be.true;
		player.state.turnSpellcasting = -1;
		player._affectedState = Player.getAffectedPlayerState(manager, player.state, false);
		expect(player.spellSucceeded(spell)).to.be.false;
	});

	it('#spellHitTarget correctly calculates hit success and failure', () => {
		var opponentState = Player.getInitialState('bob', false, 'alice');
		manager.getPlayerState = () => {
			return opponentState;
		};
		opponentState.turnEvasion = 0;
		player.state.turnAccuracy = 100;
		expect(player.spellHitTarget(Spells.create({}))).to.be.true;
		opponentState.turnEvasion = 100;
		expect(player.spellHitTarget(Spells.create({}))).to.be.false;

		// Test for effects that don't allow being hit
		var effectName = 'example-invincibility';
		var effect = Effects.create(effectName, {
			beforeHit: function(manager, player, spell, onSelf) {
				return false;
			}
		});
		opponentState.effects = [ effectName ];
		opponentState.turnEvasion = 0;

		expect(player.spellHitTarget(Spells.create({}))).to.be.false;
	});

	it('#attemptSpellCast short-circuits on effect beforeCast', () => {
		var effectName = 'example-short-circuit';
		Effects.create(effectName, {
			beforeCast: function(manager, player, spell, onSelf) {
				return false;
			},
		});

		manager.startOutput();
		player.state.effects = [ effectName ];
		player.attemptSpellCast(Spells.create({}), true);

		expect(manager.output.messages).to.deep.eql([]);
	});

	it('#attemptSpellCast narrates successful self cast', () => {
		var spell = Spells.create({
			incantation: 'bobbify',
		});

		player.state.turnSpellcasting = 500;
		player.attemptSpellCast(spell, true);

		expect(manager.output.messages).to.deep.eql([
			{
				type: OutputBuffer.MESSAGE_SEND,
				content: '@alice casts bobbify.  ',
			}
		]);
	});

	it('#attemptSpellCast narrates failure to cast', () => {
		var spell = Spells.create({
			incantation: 'bobbify',
		});

		player.state.turnSpellcasting = 0;
		player.attemptSpellCast(spell, true);

		expect(manager.output.messages).to.deep.eql([
			{
				type: OutputBuffer.MESSAGE_SEND,
				content: '@alice fails to cast bobbify.',
			}
		]);

		manager.output.flush();

		var message = 'yo yo yo';
		var spell2 = Spells.create({
			incantation: 'bobbify',
			onFailure: function(manager, player, onSelf) {
				manager.output.send(message);
			}
		});

		player.attemptSpellCast(spell2, true);

		expect(manager.output.messages).to.deep.eql([
			{
				type: OutputBuffer.MESSAGE_SEND,
				content: message,
			}
		]);
	});

});
