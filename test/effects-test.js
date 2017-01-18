import chai         from 'chai';
import Manager      from '../src/wizards-duel/manager.js';
import Player       from '../src/wizards-duel/player.js';
import Effects      from '../src/wizards-duel/effects.js';
import OutputBuffer from '../src/wizards-duel/output-buffer.js';
import sinon        from 'sinon';
import 'sinon-chai';
import _ from 'lodash'
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
					[ 'turnSpellcasting', '+=', 10, '' ],
					[ 'turnAccuracy',     '-=', 20, '' ],
					[ 'turnEvasion',      '+=', 20, '' ],
				],
				modify: function(manager, playerState, isDefense) {
					playerState.modified = true;
					playerState.modifiedIsDefense = isDefense;
				},
			});

			playerState.turnSpellcasting = 50;
			playerState.turnAccuracy     = 50;
			playerState.turnEvasion      = 50;

			effect.modify(manager, playerState, false);

			expect(playerState.turnSpellcasting).to.eql(60);
			expect(playerState.turnAccuracy).to.eql(30);
			expect(playerState.turnEvasion).to.eql(70);
			expect(playerState.modified).to.be.true;
			expect(playerState.modifiedIsDefense).to.be.false;
		});

		it('#modify takes into account synergies', () => {
			Effects.create('syn-heat-1', {});
			Effects.create('syn-heat-2', {});
			Effects.create('syn-heat-3', {});
			var furCoat = Effects.create('syn-fur-coat', {
				synergies: [{
					effects: {
						or: [ 'syn-heat-1', 'syn-heat-2' ],
					},
					modifiers: [
						[ 'turnPain', '+=', 10, 'combined with @effect makes it too hot' ],
					],
				},
				{
					effects: {
						and: [ 'syn-heat-1', 'syn-heat-3' ],
					},
					modifiers: [
						[ 'turnEvasion', '+=', 10, 'when it is really hot, sweat lubricates' ],
					],
				}],
			});

			playerState.turnSpellcasting = 100;
			playerState.turnAccuracy     = 90;
			playerState.turnEvasion      = 10;
			playerState.turnPain         = 0;
			playerState.effects = [ 'syn-heat-1', 'syn-heat-3', 'syn-fur-coat' ];

			furCoat.modify(manager, playerState, false);

			expect(playerState.turnSpellcasting).to.eql(100);
			expect(playerState.turnAccuracy).to.eql(90);
			expect(playerState.turnEvasion).to.eql(20);
			expect(playerState.turnPain).to.eql(10);

			Effects.create('syn-a', {});
			Effects.create('syn-b', {});
			Effects.create('syn-c', {});
			Effects.create('syn-d', {});
			var e = Effects.create('syn-e', {
				synergies: [{
					effects: {
						or: [ 'syn-a', 'syn-b' ],
						and: [ 'syn-c', 'syn-d' ],
					},
					modifiers: [
						[ 'turnSpellcasting', '-=', 20, '' ],
					],
				}],
			});

			playerState.turnSpellcasting = 100;
			playerState.effects = [ 'syn-b', 'syn-c', 'syn-e' ];

			e.modify(manager, playerState, false);

			expect(playerState.turnSpellcasting).to.eql(100);

			playerState.turnSpellcasting = 100;
			playerState.effects = [ 'syn-b', 'syn-c', 'syn-d', 'syn-e' ];

			e.modify(manager, playerState, false);

			expect(playerState.turnSpellcasting).to.eql(80);

			var f = Effects.create('syn-e', {
				synergies: [{
					effects: {
						each: [ 'syn-a', 'syn-b', 'syn-d' ],
					},
					modifiers: [
						[ 'turnSpellcasting', '-=', 10, '' ],
					],
				}],
			});

			playerState.turnSpellcasting = 100;
			playerState.effects = [ 'syn-a', 'syn-b', 'syn-c', 'syn-d', 'syn-e' ];

			f.modify(manager, playerState, false);

			expect(playerState.turnSpellcasting).to.eql(70);
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
				content: "The c-fire and c-ice combined, resulting in c-water. The c-water and c-flour combined, resulting in c-dough. The c-water removes the c-filth. ",
			}]);

			manager.flushOutput();
			manager.startOutput(fakeResponseObject);

			var effectNames = Effects.addEffect(['c-fire-fairies'], 'c-ice', manager.output, 'alice');
			manager.output.endMessage();

			expect(effectNames).to.not.have.members(['c-ice', 'c-fire-fairies']);
			expect(manager.output.messages).to.deep.eql([{
				type: OutputBuffer.MESSAGE_SEND,
				content: "The c-ice negates the c-fire-fairies. ",
			}]);
		});

		it('#removeEffect returns appropriate values and outputs correct text', () => {
			Effects.create('r-bobishness', { noun: 'bobishness' });

			manager.startOutput(fakeResponseObject);
			var effectNames = Effects.removeEffect(['r-bobishness'], 'r-bobishness', manager.output, 'alice');
			manager.output.endMessage();

			expect(effectNames).to.not.have.members(['r-bobishness']);
			expect(manager.output.messages).to.deep.eql([{
				type: OutputBuffer.MESSAGE_SEND,
				content: "@alice's bobishness has been removed. ",
			}]);
		});

		it('#filterByAttribute filters effects by attribute', () => {
			Effects.create('f-filtered-1', { isFilterExample: true });
			Effects.create('f-filtered-2', { isFilterExample: true });
			Effects.create('f-not-filtered-1', { isFilterExample: false });
			Effects.create('f-not-filtered-2', {});

			var filteredEffects = Effects.filterByAttribute('isFilterExample');
			expect(filteredEffects).to.have.members(['f-filtered-1', 'f-filtered-2']);
			expect(filteredEffects).to.not.have.members(['f-not-filtered-1', 'f-not-filtered-2']);

			filteredEffects = Effects.filterByAttribute(['f-filtered-2', 'f-not-filtered-1', 'f-not-filtered-2'], 'isFilterExample');
			expect(filteredEffects).to.have.members(['f-filtered-2']);
			expect(filteredEffects).to.not.have.members(['f-filtered-1', 'f-not-filtered-1', 'f-not-filtered-2']);

			filteredEffects = Effects.filterByAttribute(['f-filtered-2', 'f-not-filtered-1', 'f-not-filtered-2'], 'isFilterExample', false);
			expect(filteredEffects).to.have.members(['f-not-filtered-1']);
			expect(filteredEffects).to.not.have.members(['f-filtered-2', 'f-not-filtered-2']);
		});
	});

});
