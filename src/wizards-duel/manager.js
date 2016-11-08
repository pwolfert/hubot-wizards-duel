var _          = require('underscore');
var oxfordJoin = require('oxford-join');
var Set        = require('./set');
var Effects    = require('./effects.js');
var Spells     = require('./spells.js');

/**
 * Dueling statuses
 */
var STATUS_NOT_DUELING = 0;
var STATUS_CHALLENGE_SENT = 1;
var STATUS_DUELING = 2;

/**
 * Manager manages the games state and everything
 */
function Manager(robot) {
	this.robot = robot;
	this.brain = robot.brain;

	this.registerListeners();
}

Manager.prototype.registerListeners = function() {
	var manager = this;
	var robot = this.robot;

	// Register the spell listeners
	Spells.each(function(spell) {
		var regex = new RegExp('^' + spell.incantation + '(\\sself)?!', 'i');

		robot.hear(regex, function(res) {
			var onSelf = res.match[1];
			var player = res.message.user.name;

			manager.utterIncantation(res, player, spell, onSelf);
		});
	});

	// Listen for challenges
	robot.hear(/I challenge (@\w+) to a wizard'?’?s'?’? duel!/i, function(res) {
		var challengee = res.match[1].substring(1);
		var challenger = res.message.user.name;

		manager.challenge(res, challenger, challengee);
	});

	// Listen for challenges being accepted
	robot.hear(/I accept (@\w+)'?’?s challenge/i, function(res) {
		var challenger = res.match[1].substring(1);
		var challengee = res.message.user.name;

		manager.acceptChallenge(res, challenger, challengee);
	});

	// Listen for resignations
	robot.hear(/I yield to (@\w+)/i, function(res) {
		var player = res.message.user.name;
		var opponent = res.match[1].substring(1);

		manager.resign(res, player, opponent);
	});

	// Listen for rule-list requests
	robot.hear(/dueling rules/i, function(res) {
		res.send(manager.getRules());
	});

	// Listen for spell-list requests
	robot.hear(/list spells/i, function(res) {
		var spellNames = Spells.spells.map(function(spell) {
			return ' - ' + spell.incantation;
		});

		res.send([
			'```',
			'Spells: ',
			spellNames.join('\n'),
			'```',
		].join('\n'));
	});
};

Manager.getDuelKey = function(challenger, challengee) {
	return 'duel-status:' + challenger + '-' + challengee;
};

Manager.prototype.getDuelStatus = function(challenger, challengee) {
	return this.brain.get(Manager.getDuelKey(challenger, challengee));
};

Manager.prototype.setDuelStatus = function(challenger, challengee, status) {
	this.brain.set(Manager.getDuelKey(challenger, challengee), status);
};

Manager.getPlayerStateKey = function(name) {
	return name + '.duel-info';
};

Manager.prototype.getPlayerState = function(name) {
	return this.brain.get(Manager.getPlayerStateKey(name));
};

Manager.prototype.setPlayerState = function(name, state) {
	this.brain.set(Manager.getPlayerStateKey(name), state);
};

Manager.getTurnKey = function(challenger, challengee) {
	return 'duel-turn:' + challenger + '-' + challengee;
};

Manager.prototype.startPassiveTurn = function(player, challenger, challengee) {
	this.brain.set(Manager.getTurnKey(challenger, challengee), {
		player: player,
		passive: true,
	});

	this.resetPlayerStateTurnVars(player);
};

Manager.prototype.startAttackTurn = function(player, challenger, challengee) {
	this.brain.set(Manager.getTurnKey(challenger, challengee), {
		player: player,
		attack: true,
	});

	this.resetPlayerStateTurnVars(player);
};

Manager.prototype.getCurrentTurn = function(challenger, challengee) {
	return this.brain.get(Manager.getTurnKey(challenger, challengee));
};

Manager.prototype.isDueling = function(user) {
	return this.brain.get(Manager.getPlayerStateKey(user));
};

Manager.prototype.duelEnded = function(challenger, challengee, results) {
	this.brain.set(Manager.getPlayerStateKey(challenger), STATUS_NOT_DUELING);
	this.brain.set(Manager.getPlayerStateKey(challengee), STATUS_NOT_DUELING);
	this.setDuelStatus(challenger, challengee, STATUS_NOT_DUELING);

	// TODO: talk about results
};

Manager.prototype.setInitialPlayerState = function(name, isChallenger, opponent) {
	var playerState = {
		name: name,
		isChallenger: isChallenger,
		opponent: opponent,
		effects: [],
		health: 100,
		spellcasting: 1,
		accuracy: 1,
		dodgeChance: 0,
	};
	this.resetPlayerStateTurnVars(playerState);
	this.setPlayerState(name, playerState);
};

Manager.prototype.resetPlayerStateTurnVars = function(player, playerState) {
	if (typeof player === 'string') {
		if (!playerState)
			playerState = this.getPlayerState(player);
	}
	else {
		playerState = player;
		player = undefined;
	}

	_.extend(playerState, {
		turnSpellcasting: playerState.spellcasting,
		turnAccuracy:     playerState.accuracy,
		turnDodgeChance:  playerState.dodgeChance,
	});

	if (player)
		this.setPlayerState(player, playerState);
};

Manager.prototype.challenge = function(response, challenger, challengee) {
	var challengerState = this.getPlayerState(challenger);
	if (challengerState) {
		response.reply('Thou art already dueling with @' + challengerState.opponent + '!');
	}
	else {
		// Set the status
		this.setDuelStatus(challenger, challengee, STATUS_CHALLENGE_SENT);

		response.send([
			'@' + challenger + ' hath challenged @' + challengee + ' to a wizard\'s duel!  _Doth @' + challengee + ' accept?_',
			'Type "I accept @' + challenger + '\'s challenge." to accept.',
		].join('\n'));
	}
};

Manager.prototype.acceptChallenge = function(response, challenger, challengee) {
	if (this.getDuelStatus(challenger, challengee) === STATUS_CHALLENGE_SENT) {
		this.setInitialPlayerState(challenger, true,  challengee);
		this.setInitialPlayerState(challengee, false, challenger);
		this.setDuelStatus(challenger, challengee, STATUS_DUELING);

		var startingPlayer = response.random([ challenger, challengee ]);
		this.startAttackTurn(startingPlayer, challenger, challengee);

		response.send([
			'*Hear ye! Hear ye!*',
			'A duel shall now commence between @' + challenger +' and @' + challengee + '!' +
			'@' + startingPlayer + ', thou hast won the coin toss and mayst begin first with an attack.  ' +
			'Whosoever requireth the list of rules shouldst only type "dueling rules".',
		].join('\n'));
	}
	else {
		response.reply('@' + challenger + ' did not challenge you.');
	}
};

Manager.prototype.resign = function(response, player, opponent) {
	var playerState = this.getPlayerState(player);
	if (!playerState || playerState.opponent != opponent) {
		response.reply('Thou art not dueling with @' + opponent + '.');
	}
	else {
		var challenger;
		var challengee;

		if (playerState.isChallenger) {
			challenger = playerState.name;
			challengee = playerState.opponent;
		}
		else {
			challenger = playerState.opponent;
			challengee = playerState.name;
		}

		this.duelEnded(challenger, challengee, {
			resigned: player,
		});
	}
};

Manager.prototype.getRules = function() {
	return [
		'```',
		'Dueling Rules:',
		'',
		'  Protocol:',
		'    1. The combatant who starteth the duel is determined by chance.',
		'    2. The starting combatant beginneth with an offensive spell.',
		'    3. The next combatant beginneth his turn with an optional passive spell on himself and then an offensive spell on his opponent.',
		'    4. It then becommeth his opponent\'s turn, and the cycle repeateth until one duelist stands alone.',
		'',
		'  Directions:',
		'    - To cast a spell on thy opponent, typest thou the spell\'s incantation.',
		'    - To cast a spell upon thyself, typest thou the spell\'s incantation followed by "self"',
		'      Example: "volito self"',
		'    - To surrender, typest thou "I yield to @[opponent\'s name]."',
		'```',
	].join('\n');
};

Manager.prototype.utterIncantation = function(response, player, spell, onSelf) {
	var playerState = this.getPlayerState(player);

	if (!playerState) {
		response.reply('Practice makes perfect.');
		return;
	}
	else {
		var challenger;
		var challengee;

		if (playerState.isChallenger) {
			challenger = playerState.name;
			challengee = playerState.opponent;
		}
		else {
			challenger = playerState.opponent;
			challengee = playerState.name;
		}

		var turn = this.getCurrentTurn(challenger, challengee);
		if (turn.player == playerState.name) {
			// Determine what the next turn will be depending on what type
			//   of spell this was and what turn it is.
			if (!onSelf && !turn.attack) {
				// They skipped the passive part of their turn
				response.send('@' + playerState.name + ' skipped his passive turn and went right to the attack!');
				// Go straight to the beginning of the opponent's turn
				this.startPassiveTurn(playerState.opponent, challenger, challengee);
			}
			else {
				// The player just used the passive part of his turn.  Go to his attack
				this.startAttackTurn(playerState.name, challenger, challengee);
			}

			// Apply effects to playerState
			var modifiedPlayerState = this.getAffectedPlayerState(response, playerState);

			// Call any beforeCast functions from effects
			var attemptCast = true;
			for (var i = 0; i < modifiedPlayerState.effects.length; i++) {
				var effect = modifiedPlayerState.effects[i];
				if (effect.beforeCast &&
					effect.beforeCast(this, response, modifiedPlayerState, spell, onSelf) === false
				) {
					attemptCast = false;
				}
			}

			// Attempt to perform the spell
			if (attemptCast)
				this.attemptSpellCast(response, modifiedPlayerState, spell, onSelf);
		}
		else {
			response.reply('It is not your turn.');
		}
	}
};

Manager.prototype.attemptSpellCast = function(response, playerState, spell, onSelf) {
	var succeeded = this.spellSucceeded(response, playerState, spell);
	if (succeeded) {
		if (onSelf || this.spellHitTarget(response, playerState, spell)) {
			console.log(spell)
			spell.cast(this, response, playerState, onSelf);
			var narration = playerState.name + ' casteth ' + spell.incantation;
			if (!onSelf)
				narration += ' on @' + playerState.opponent;
			narration += '.  ';
			narration += spell.narration.replace('@target', (onSelf ? playerState.name : playerState.opponent));
			response.send(narration);
		}
		else {
			response.send('@' + playerState.name + ' faileth to hit his target.');
		}
	}
	else if (spell.failure)
		spell.failure(this, response, playerState, onSelf);
	else
		response.send('@' + playerState.name + ' faileth to cast ' + spell.incantation + '.');
};

/**
 * Determines whether the spell is cast based off the player's state
 */
Manager.prototype.spellSucceeded = function(response, playerState, spell) {
	return true;
};

/**
 * Determines whether a given player was able to hit his opponent with a
 *   particular spell given his state and his opponent's state.
 */
Manager.prototype.spellHitTarget = function(response, playerState, spell) {
	return true;
};

Manager.prototype.getAffectedPlayerState = function(response, playerState, isDefense) {
	var modifiedPlayerState = _.extend({}, playerState);

	for (var i = 0; i < playerState.effects.length; i++)
		Effects.get(playerState.effects[i]).modify(this, response, modifiedPlayerState, isDefense);

	return modifiedPlayerState;
};

/**
 * Adds an effect to the player and negates opposite effects
 *
 * @param {Object} response - hubot response object
 * @param {(Object|string)} playerState - either the playerState object or player name
 * @param {string} effectName - the effects array key for the effect
 */
Manager.prototype.addEffect = function(response, playerState, effectName) {
	var player;
	if (typeof playerState === 'string') {
		player = playerState;
		playerState = this.getPlayerState(player);
	}

	var negated = [];
	var negates = Effects[effectName].negates;
	if (negates) {
		for (var i = 0; i < negates.length; i++) {
			if (Set.contains(playerState.effects, negates[i])) {
				Set.remove(playerState.effects, negates[i]);
				negated.push(negates[i]);
			}
		}
	}

	var counteracts = [];
	var counteracts = Effects[effectName].counteracts;
	if (counteracts) {
		for (var i = 0; i < counteracts.length; i++) {
			if (Set.contains(playerState.effects, counteracts[i]))
				negated.push(counteracts[i]);
		}
	}

	if (negated.length === 0)
		Set.add(playerState.effects, effectName);
	else
		response.send('The ' + effectName + ' hath negated @' + playerState.name + '\'s ' + oxfordJoin(negated) + '.');

	if (counteracts.length > 0)
		response.send('The ' + effectName + ' counteracteth @' + playerState.name + '\'s ' + oxfordJoin(counteracted) + '.');

	if (player)
		this.setPlayerState(player, playerState);
};

/**
 * Removes an effect from the player
 *
 * @param {Object} response - hubot response object
 * @param {(Object|string)} playerState - either the playerState object or player name
 * @param {string} effectName - the effects array key for the effect
 */
Manager.prototype.removeEffect = function(response, playerState, effectName) {
	var player;
	if (typeof playerState === 'string') {
		player = playerState;
		playerState = this.getPlayerState(player);
	}

	Set.remove(playerState.effects, effectName);

	if (player)
		this.setPlayerState(player, playerState);
};

/**
 * Returns a list of effects with notes about counteracting effects.  Example:
 *   - large-nose
 *   - stench (counteracted by fragrance)
 *   - fragrance (counteracted by stench)
 */
Manager.prototype.getEffectList = function(player) {
	var playerState = this.getPlayerState(player);
	var effects = playerState.effects;
	var list = [];
	for (var i = 0; i < effects.length; i++) {
		var line = Effects[effects[i]].noun;
		// Then search for countering effects
		var counteractedBy = [];
		for (var j = 0; j < effects.length; j++) {
			var effect = Effects[effects[j]];
			if (effect.counteracts && effect.counteracts.indexOf(effects[i]) !== -1)
				counteractedBy.push(effect.noun);
		}
		if (counteractedBy.length)
			line += '(countered by ' + oxfordJoin(counteractedBy) + ')';
	}
};

/**
 * Static constants
 */
Manager.STATUS_NOT_DUELING = STATUS_NOT_DUELING;
Manager.STATUS_CHALLENGE_SENT = STATUS_CHALLENGE_SENT;
Manager.STATUS_DUELING = STATUS_DUELING;

module.exports = Manager;
