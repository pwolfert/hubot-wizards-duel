import chai         from 'chai';
import Manager      from '../src/wizards-duel/manager.js';
import Player       from '../src/wizards-duel/player.js';
import Effects      from '../src/wizards-duel/effects.js';
import OutputBuffer from '../src/wizards-duel/output-buffer.js';
import sinon        from 'sinon';
import 'sinon-chai';

var expect = chai.expect;

describe('Effects', () => {
	var fakeResponseObject = {
		send: function() {},
		reply: function() {},
	};

	describe('Effect Class', () => {
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

	describe('Effects Object', () => {
		var manager;

		beforeEach(() => {
			manager = new Manager({
				brain: {},
				hear: () => {},
			});
		});

		it('#getCounteractedEffects returns array of counteracted effects found in specified array', () => {
			var expectedCounteractedEffects = [ 'counteracted-example-1', 'counteracted-example-2' ];
			Effects.create('counteracted-example-4', {
				counteracts: expectedCounteractedEffects,
			});
			var effectNames = [ 'counteracted-example-1', 'counteracted-example-2', 'counteracted-example-3' ];
			var counteractedEffects = Effects.getCounteractedEffects(effectNames, 'counteracted-example-4');

			expect(counteractedEffects).to.deep.eql(expectedCounteractedEffects);
		});

		it('#getNegatedEffects returns array of negated effects found in specified array', () => {
			var expectedNegatedEffects = [ 'negated-example-1', 'negated-example-3' ];
			Effects.create('negated-example-4', {
				negates: expectedNegatedEffects,
			});
			var effectNames = [ 'negated-example-1', 'negated-example-2', 'negated-example-3' ];
			var negatedEffects = Effects.getNegatedEffects(effectNames, 'negated-example-4');

			expect(negatedEffects).to.deep.eql(expectedNegatedEffects);
		});

		it('#getRemovedEffects returns array of removed effects found in specified array', () => {
			var expectedRemovedEffects = [ 'removed-example-2', 'removed-example-3' ];
			Effects.create('removed-example-4', {
				removes: expectedRemovedEffects,
			});
			var effectNames = [ 'removed-example-1', 'removed-example-2', 'removed-example-3' ];
			var removedEffects = Effects.getRemovedEffects(effectNames, 'removed-example-4');

			expect(removedEffects).to.deep.eql(expectedRemovedEffects);
		});

		it('#getCombinationResults returns arrays of remaining and resultant effect names', () => {
			Effects.combinations.push([ ['c-water', 'c-dirt'], ['c-mud'] ]);

			var { remainingEffects, resultantEffects } = Effects.getCombinationResults([ 'c-water', 'c-dirt', 'c-bubbles' ]);

			expect(remainingEffects).to.deep.eql(['c-bubbles']);
			expect(resultantEffects).to.deep.eql(['c-mud']);
		});

		it('#addEffect returns appropriate values and outputs correct text', () => {
			Effects.combinations.push([ ['c-fire', 'c-ice'], ['c-water'] ]);
			Effects.combinations.push([ ['c-water', 'c-flour'], ['c-dough', 'c-water'] ]);
			Effects.create('c-water', {
				removes: ['c-filth']
			});
			Effects.create('c-ice', {
				negates: ['c-fire-fairies']
			});
			Effects.create('c-fire', {});
			Effects.create('c-flour', {});
			Effects.create('c-dough', {});
			Effects.create('c-filth', {});
			Effects.create('c-fire-fairies', {});

			manager.startOutput(fakeResponseObject);
			var effectNames = Effects.addEffect([
				'c-ice', 'c-flour', 'c-fire-fairies', 'c-filth'
			], 'c-fire', manager.output, 'alice');
			manager.output.endMessage();

			expect(effectNames).to.have.members(['c-dough', 'c-water', 'c-fire-fairies']);
			expect(effectNames).to.not.have.members(['c-fire', 'c-ice', 'c-filth', 'c-flour']);

			expect(manager.output.messages).to.deep.eql([{
				type: OutputBuffer.MESSAGE_SEND,
				content: "The c-fire and c-ice combined, resulting in c-water. The c-water and c-flour combined, resulting in c-dough. The c-water removed @alice's c-filth. ",
			}]);
		});

		// it('#removeEffect returns appropriate values and outputs correct text', () => {
		//
		// });
	});

});
