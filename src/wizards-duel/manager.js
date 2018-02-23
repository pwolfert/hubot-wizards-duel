import _ from "lodash";
import oxfordJoin from "oxford-join";
import SetFunctions from "./set";
import Effects from "./effects";
import Spells from "./spells";
import Player from "./player";
import OutputBuffer from "./output-buffer";

/**
 * Dueling statuses
 */
const STATUS_NOT_DUELING = 0;
const STATUS_CHALLENGE_SENT = 1;
const STATUS_DUELING = 2;

const NUM_FAILURES_TO_LOSE = 5;

/**
 * Manager manages the games state and everything
 */
class Manager {
  constructor(robot) {
    this.robot = robot;
    this.brain = robot.brain;
    this.outputBuffers = [];

    this.registerListeners();
  }

  registerListeners() {
    // Register the spell listeners
    Spells.each(spell => {
      var regex = new RegExp(`^${spell.incantation}(\\sself)?!`, "i");

      this.hear(regex, res => {
        var onSelf = res.match[1];
        var player = res.message.user.name;

        this.utterIncantation(player, spell, onSelf);
      });
    });

    // Listen for challenges
    this.hear(/I challenge (@\w+) to a wizard'?’?s'?’? duel!/i, res => {
      var challengee = res.match[1].substring(1);
      var challenger = res.message.user.name;

      this.challenge(challenger, challengee);
    });

    // Listen for challenges being accepted
    this.hear(/I accept (@\w+)'?’?s challenge/i, res => {
      var challenger = res.match[1].substring(1);
      var challengee = res.message.user.name;

      this.acceptChallenge(challenger, challengee);
    });

    // Listen for resignations
    this.hear(/I yield to (@\w+)/i, res => {
      var player = res.message.user.name;
      var opponent = res.match[1].substring(1);

      this.resign(player, opponent);
    });

    // Listen for rule-list requests
    this.hear(/dueling rules/i, res => {
      this.output.send(this.getRules());
    });

    // Listen for spell-list requests
    this.hear(/list spells/i, res => {
      var spells = this.getSpellsList();

      this.output.response.send({
        text: "Spells",
        attachments: [
          {
            text: spells,
            mrkdwn_in: ["text"]
          }
        ]
      });
    });

    // Listen for effects-list requests
    this.hear(/my effects/i, res => {
      var playerName = res.message.user.name;
      var playerState = this.getPlayerState(playerName);
      if (playerState) {
        var player = new Player(this, playerName);

        this.output.reply(
          `Your current effects:\n` + player.getEffectList().join("\n")
        );
      } else
        this.output.reply("You have no effects because you are not dueling.");
    });

    // Listen for status requests
    this.hear(/my status/i, res => {
      var playerName = res.message.user.name;
      var playerState = this.getPlayerState(playerName);
      if (playerState) {
        var player = new Player(this, playerName);
        var effectsList = player.getEffectList();

        var output = "\n>>>" + player.getStatus() + "\n\n";

        if (effectsList.length)
          output += "Your current effects:\n" +
            player.getEffectList().join("\n");
        else
          output += "You have no effects.";

        this.output.reply(output);
      } else
        this.output.reply(
          "You have no dueling status because you are not dueling."
        );
    });

    this.robot.hear(/hey hey hey/i, res => {
      // res.send('message 1', 'message 2  jkfjel jkwe fke ', 'message 3', 'message 4 ------ 1-1- -22-3-3--1-ief-e-e');
      res.send("message 4", "message 3", "message 2", "message 1");
    });

    // Duelbot, what's your story? --I was made to serve at the arena
    // What's the arena? --a place built by my master for wizards to duel
    // Who built the arena? --the wizard who built me
    // Who built you? --the wizard who built the arena
    // Who is your master? --the wizard who built this
  }

  hear(regex, callback) {
    this.robot.hear(regex, response => {
      this.startOutput(response);
      callback(response);
      this.flushOutput();
    });
  }

  // ---------------------------------------------------------------------------------
  // User Input/Output
  // ---------------------------------------------------------------------------------

  get output() {
    if (this.outputBuffers.length)
      return this.outputBuffers[this.outputBuffers.length - 1];
    else
      throw new Error("No output buffer has been started.");
  }

  get currentUser() {
    return this.output.response.message.user;
  }

  startOutput(response) {
    this.outputBuffers.push(new OutputBuffer(response));
  }

  flushOutput() {
    var outputBuffer = this.outputBuffers.pop();
    outputBuffer.flush();
  }

  // ---------------------------------------------------------------------------------
  // State Management
  // ---------------------------------------------------------------------------------

  static getDuelKey(challenger, challengee) {
    return `duel-status:${challenger}-${challengee}`;
  }

  getDuelStatus(challenger, challengee) {
    return this.brain.get(Manager.getDuelKey(challenger, challengee));
  }

  setDuelStatus(challenger, challengee, status) {
    this.brain.set(Manager.getDuelKey(challenger, challengee), status);
  }

  isDueling(user) {
    return this.brain.get(Manager.getPlayerStateKey(user));
  }

  static getPlayerStateKey(name) {
    return `${name}.duel-info`;
  }

  getPlayerState(name) {
    return this.brain.get(Manager.getPlayerStateKey(name));
  }

  setPlayerState(name, state) {
    this.brain.set(Manager.getPlayerStateKey(name), state);
  }

  setInitialPlayerState(name, isChallenger, opponent) {
    this.setPlayerState(
      name,
      Player.getInitialState(name, isChallenger, opponent)
    );
  }

  resetPlayerStateTurnVars(name) {}

  static getGlobalEffectsKey(challenger, challengee) {
    return `global-effects:${challenger}-${challengee}`;
  }

  getGlobalEffects(challenger, challengee) {
    return this.brain.get(this.getGlobalEffectsKey(challenger, challengee));
  }

  setGlobalEffects(challenger, challengee, effects) {
    this.brain.set(this.getGlobalEffectsKey(challenger, challengee), effects);
  }

  static getKnownSpellsKey(roomId) {
    return `known-effects:${roomId}`;
  }

  getKnownSpells() {
    var roomId = this.output.response.message.room;
    var knownSpells = this.brain.get(Manager.getKnownSpellsKey(roomId));
    if (knownSpells) return knownSpells;
    else return [];
  }

  addKnownSpell(spell) {
    var roomId = this.output.response.message.room;
    var spells = this.getKnownSpells();
    SetFunctions.add(spells, spell.incantation);
    this.brain.set(Manager.getKnownSpellsKey(roomId), spells);
  }

  static getTurnKey(challenger, challengee) {
    return `duel-turn:${challenger}-${challengee}`;
  }

  startPassiveTurn(player, challenger, challengee) {
    this.brain.set(Manager.getTurnKey(challenger, challengee), {
      player: player,
      passive: true
    });
  }

  startAttackTurn(player, challenger, challengee) {
    this.brain.set(Manager.getTurnKey(challenger, challengee), {
      player: player,
      attack: true
    });
  }

  getCurrentTurn(challenger, challengee) {
    return this.brain.get(Manager.getTurnKey(challenger, challengee));
  }

  duelEnded(challenger, challengee, results) {
    this.brain.set(Manager.getPlayerStateKey(challenger), STATUS_NOT_DUELING);
    this.brain.set(Manager.getPlayerStateKey(challengee), STATUS_NOT_DUELING);
    this.setDuelStatus(challenger, challengee, STATUS_NOT_DUELING);

    if (results.won) {
      var winner = results.won;
      var loser = winner === challenger ? challengee : challenger;
      this.output.send(
        `*@${winner} has defeated @${loser}!* @${loser} failed to cast a spell ${NUM_FAILURES_TO_LOSE} times in a row.`
      );
    } else if (results.resigned) {
      var winner = results.resigned === challenger ? challengee : challenger;
      this.output.send(
        `*@${results.resigned} has yielded to @${winner}, making @${winner} the winner!*`
      );
    }
    // TODO: talk about results
    // https://api.slack.com/docs/message-attachments
  }

  challenge(challenger, challengee) {
    var challengerState = this.getPlayerState(challenger);
    if (challengerState) {
      this.output.reply(
        `Thou art already dueling with @${challengerState.opponent}!`
      );
    } else {
      // Set the status
      this.setDuelStatus(challenger, challengee, STATUS_CHALLENGE_SENT);

      this.output.send(
        [
          `@${challenger} has challenged @${challengee} to a wizard\'s duel!  _Does @${challengee} accept?_`,
          `Type "I accept @${challenger}'s challenge." to accept.`
        ].join("\n")
      );
    }
  }

  acceptChallenge(challenger, challengee) {
    if (this.getDuelStatus(challenger, challengee) === STATUS_CHALLENGE_SENT) {
      this.setInitialPlayerState(challenger, true, challengee);
      this.setInitialPlayerState(challengee, false, challenger);
      this.setDuelStatus(challenger, challengee, STATUS_DUELING);

      var startingPlayer = _.sample([challenger, challengee]);
      this.startAttackTurn(startingPlayer, challenger, challengee);

      this.output.send(
        [
          "*Hear ye! Hear ye!*",
          `A duel shall now commence between @${challenger} and @${challengee}! ` +
            `@${startingPlayer}, you have won the coin toss and may start your offensive turn. ` +
            'For a list of rules, type "dueling rules". ' +
            'For the list of spells, type "list spells"'
        ].join("\n")
      );
    } else {
      this.output.reply(`@${challenger} did not challenge you.`);
    }
  }

  resign(player, opponent) {
    var playerState = this.getPlayerState(player);
    if (!playerState || playerState.opponent != opponent) {
      this.output.reply(`You are not dueling with @${opponent}.`);
    } else {
      var challenger;
      var challengee;

      if (playerState.isChallenger) {
        challenger = playerState.name;
        challengee = playerState.opponent;
      } else {
        challenger = playerState.opponent;
        challengee = playerState.name;
      }

      this.duelEnded(challenger, challengee, {
        resigned: player
      });
    }
  }

  utterIncantation(playerName, spell, onSelf) {
    var player = new Player(this, playerName);

    if (!player.state) {
      this.output.reply("Practice makes perfect.");
      return;
    } else {
      player.resetTurnVars();

      var challenger;
      var challengee;

      if (player.state.isChallenger) {
        challenger = player.state.name;
        challengee = player.state.opponent;
      } else {
        challenger = player.state.opponent;
        challengee = player.state.name;
      }

      var turn = this.getCurrentTurn(challenger, challengee);
      if (turn.player == player.state.name) {
        // Determine what the next turn will be depending on what type
        //   of spell this was and what turn it is.
        if (!onSelf && !turn.attack) {
          // They skipped the passive part of their turn
          this.output.send(
            `@${player.state.name} skipped the passive turn and went right to the attack!`
          );
          // Count this as the attack turn
          turn.attack = true;
        } else {
          // The player just used the passive part of his turn.  Go to his attack
          this.startAttackTurn(player.state.name, challenger, challengee);
        }

        var successfullyCast = player.attemptSpellCast(spell, onSelf);
        if (successfullyCast) player.state.numFailures = 0;
        else player.state.numFailures++;

        // Save the player state
        player.save();

        // Add this spell to our list of known spells
        this.addKnownSpell(spell);

        // If this was the attack turn, start the opponent's passive turn
        if (turn.attack) {
          this.startPassiveTurn(player.state.opponent, challenger, challengee);
          this.output.send(
            `@${player.state.opponent}, it is now the beginning of your turn.`
          );
        }

        if (player.state.numFailures >= NUM_FAILURES_TO_LOSE) {
          this.duelEnded(challenger, challengee, {
            won: player.state.opponent
          });
        }
      } else {
        this.output.reply("It is not your turn.");
      }
    }
  }

  getRules() {
    return [
      "```",
      "Dueling Rules:",
      "",
      "  Protocol:",
      "    1. The starting combatant is determined by chance and begins with an offensive spell.",
      "    2. The next combatant begins his turn with an optional passive spell on himself and then an offensive spell on his opponent.",
      "    3. It then becomes his opponent's turn, and the cycle repeats until one duelist is no longer able to cast spells.",
      "",
      "  Directions:",
      "    - To cast a spell on your opponent, type the spell's incantation followed by an exclamation point!",
      '    - To cast a spell upon yourself, end your incantation with the word "self"',
      '      Example: "volito self!"',
      '    - To surrender, type "I yield to @[opponent\'s name]."',
      "    - For a more complete guide, visit pwolfert.github.io/hubot-wizards-duel",
      "```"
    ].join("\n");
  }

  getSpellsList() {
    var knownSpells = this.getKnownSpells();

    var incantations = Spells.spells.map(spell => {
      if (knownSpells.includes(spell.incantation))
        return `_*${spell.incantation}*_ - ${spell.description}`;
      else
        return `_${spell.incantation}_`;
    });

    incantations.sort();

    return incantations.join("\n");
  }
}

/**
 * Static constants
 */
Manager.STATUS_NOT_DUELING = STATUS_NOT_DUELING;
Manager.STATUS_CHALLENGE_SENT = STATUS_CHALLENGE_SENT;
Manager.STATUS_DUELING = STATUS_DUELING;

module.exports = Manager;
