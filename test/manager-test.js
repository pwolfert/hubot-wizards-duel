import Helper  from 'hubot-test-helper';
import chai    from 'chai';
import Manager from '../src/wizards-duel/manager';
import Spells  from '../src/wizards-duel/spells';
import Effects from '../src/wizards-duel/effects';

var expect = chai.expect;
var helper = new Helper('../src/wizards-duel.js');


describe('Manager', () => {
  var message1 = 'I challenge @bob to a wizards duel!';
  var message2 = 'I accept @alice\'s challenge';

  describe('Sending a Challenge', () => {
    var room;

    before((done) => {
      room = helper.createRoom();
      room.user.say('alice', message1).then(() => {
        done();
      });
    });

    after(() => {
      room.destroy();
    });

    it('responds to challenges - messages', () => {
      var expectedResult = [
        ['alice', message1],
        ['hubot', [
          '@alice has challenged @bob to a wizard\'s duel!  _Does @bob accept?_',
          'Type "I accept @alice\'s challenge." to accept.'
        ].join('\n')]
      ];

      expect(room.messages).to.deep.eql(expectedResult);
    });

    it('responds to challenges - stores status', () => {
      var duelKey = Manager.getDuelKey('alice', 'bob');

      expect(room.robot.brain.data._private[duelKey]).to.eql(Manager.STATUS_CHALLENGE_SENT);
    });

  });

  describe('Accepting a Challenge', () => {
    var room;
    var turnData;

    before((done) => {
      room = helper.createRoom();
      room.user.say('alice', message1).then(() => {
        room.user.say('bob', message2).then(() => {
          var turnKey = Manager.getTurnKey('alice', 'bob');
          turnData = room.robot.brain.data._private[turnKey];
          done();
        });
      });
    });

    after(() => {
      room.destroy();
    });

    it('handles challenge accepting - stores turn info', () => {
      expect(turnData.attack).to.eql(true);
    });

    it('handles challenge accepting - messages', () => {
      var startingPlayer = turnData.player;
      var expectedLast2Messages = [
        ['bob', message2],
        ['hubot', [
          '*Hear ye! Hear ye!*',
          `A duel shall now commence between @alice and @bob! ` +
          `@${startingPlayer}, you have won the coin toss and may start your offensive turn. ` +
          'For a list of rules, type "dueling rules". ' +
          'For the list of spells, type "list spells"',
        ].join('\n')]
      ];

      var last2Messages = [
        room.messages[room.messages.length - 2],
        room.messages[room.messages.length - 1]
      ];
      expect(last2Messages).to.deep.eql(expectedLast2Messages);
    });

    it('handles challenge accepting - stores status', () => {
      var duelKey = Manager.getDuelKey('alice', 'bob');

      expect(room.robot.brain.data._private[duelKey]).to.eql(Manager.STATUS_DUELING);
    });

  });

  describe('First attack applies effects and sets turn to next player', () => {
    var room;
    var firstPlayer;
    var secondPlayer;
    var spellIncantation = 'attack 1 incantation';
    var spellEffect = 'attack-1-effect';
    var attackMessage1 = spellIncantation + '!';

    before((done) => {
      Effects.create(spellEffect, {});
      Spells.create({
        incantation: spellIncantation,
        effects: [ spellEffect ],
        hitModifier: 100, // Make sure we're guaranteed a hit
      });

      room = helper.createRoom();
      room.user.say('alice', message1).then(() => {
        room.user.say('bob', message2).then(() => {
          var turnKey = Manager.getTurnKey('alice', 'bob');
          var turnData = room.robot.brain.data._private[turnKey];
          firstPlayer = turnData.player;
          secondPlayer = (firstPlayer === 'alice') ? 'bob' : 'alice';

          room.user.say(firstPlayer, attackMessage1).then(() => {
            done();
          });
        });
      });
    });

    after(() => {
      room.destroy();
    });

    it('handles spell incantations', () => {
      var expectedLast2Messages = [
        [firstPlayer, attackMessage1],
        ['hubot',
          `@${firstPlayer} casts _${spellIncantation}_ on @${secondPlayer}. ` +
          `_${spellIncantation}_ adds ${spellEffect} to @${secondPlayer}. `
        ],
        ['hubot',
          `@${secondPlayer}, it is now the beginning of your turn.`
        ],
      ];

      var last3Messages = [
        room.messages[room.messages.length - 3],
        room.messages[room.messages.length - 2],
        room.messages[room.messages.length - 1],
      ];
      expect(last3Messages).to.deep.eql(expectedLast2Messages);

      var secondPlayerState = room.robot.brain.data._private[Manager.getPlayerStateKey(secondPlayer)];
      expect(secondPlayerState.effects).to.have.members([ spellEffect ]);
    });

  });

});
