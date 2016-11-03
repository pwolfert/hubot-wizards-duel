var Helper = require('hubot-test-helper');
var chai   = require('chai');

var expect = chai.expect;

var helper = new Helper('../src/wizards-duel.js');

describe('wizards-duel', function() {
	var room;

	beforeEach(function() {
		room = helper.createRoom();
	});

	afterEach(function() {
		room.destroy();
	});

	it('responds to challenges', function() {
		var message1 = 'I challenge @bob to a wizards duel!';
		var expectedResult = [
			['alice', message1]
			['hubot', [
				'@alice hath challenged @bob to a wizard\'s duel!  _Doth @bob accept?_',
				'Type "I accept @alice\'s challenge." to accept.'
			].join('\n')]
		];

		room.user.say('alice', message1).then(function() {
			expect(room.messages).to.eql(expectedResult);
		});
	});
});
