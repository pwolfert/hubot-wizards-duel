var Helper  = require('hubot-test-helper');
var chai    = require('chai');
var Manager = require('../src/wizards-duel/manager.js');

var expect = chai.expect;
var helper = new Helper('../src/wizards-duel.js');


describe('wizards-duel', function() {
	var message1 = 'I challenge @bob to a wizards duel!';
	var message2 = 'I accept @alice\'s challenge';
	var attackMessage1 = 'madefio!';

	describe('Sending a Challenge', function() {

		before(function() {
			room = helper.createRoom();
			room.user.say('alice', message1).then();
		});

		after(function() {
			room.destroy();
		});

		it('responds to challenges - messages', function() {
			var expectedResult = [
				['alice', message1],
				['hubot', [
					'@alice hath challenged @bob to a wizard\'s duel!  _Doth @bob accept?_',
					'Type "I accept @alice\'s challenge." to accept.'
				].join('\n')]
			];

			expect(room.messages).to.deep.eql(expectedResult);
		});

		it('responds to challenges - stores status', function() {
			var duelKey = Manager.getDuelKey('alice', 'bob');

			expect(room.robot.brain.data._private[duelKey]).to.eql(Manager.STATUS_CHALLENGE_SENT);
		});

	});

	describe('Accepting a Challenge', function() {
		var turnData;

		before(function(done) {
			room = helper.createRoom();
			room.user.say('alice', message1).then(function() {
				room.user.say('bob', message2).then(function() {
					var turnKey = Manager.getTurnKey('alice', 'bob');
					turnData = room.robot.brain.data._private[turnKey];
					done();
				});
			});
		});

		after(function() {
			room.destroy();
		});

		it('handles challenge accepting - stores turn info', function() {
			expect(turnData.attack).to.eql(true);
		});

		it('handles challenge accepting - messages', function() {
			var startingPlayer = turnData.player;
			var expectedLast2Messages = [
				['bob', message2],
				['hubot', [
					'*Hear ye! Hear ye!*',
					'A duel shall now commence between @alice and @bob!' +
					'@' + startingPlayer + ', thou hast won the coin toss and mayst begin first with an attack.  ' +
					'Whosoever requireth the list of rules shouldst only type "dueling rules".'
				].join('\n')]
			];

			var last2Messages = [
				room.messages[room.messages.length - 2],
				room.messages[room.messages.length - 1]
			];
			expect(last2Messages).to.deep.eql(expectedLast2Messages);
		});

		it('handles challenge accepting - stores status', function() {
			var duelKey = Manager.getDuelKey('alice', 'bob');

			expect(room.robot.brain.data._private[duelKey]).to.eql(Manager.STATUS_DUELING);
		});

	});

});
