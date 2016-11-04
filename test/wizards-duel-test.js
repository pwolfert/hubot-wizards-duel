var Helper  = require('hubot-test-helper');
var chai    = require('chai');
var Manager = require('../src/wizards-duel/manager.js');

var expect = chai.expect;
var helper = new Helper('../src/wizards-duel.js');


describe('wizards-duel', function() {

	describe('Challenge Sending', function() {
		var message1 = 'I challenge @bob to a wizards duel!';

		before(function() {
			room = helper.createRoom();
			return room.user.say('alice', message1).then();
		});

		after(function() {
			room.destroy();
		});

		it('responds to challenges', function() {
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

});
