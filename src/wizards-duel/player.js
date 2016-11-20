import oxfordJoin from 'oxford-join';

const MIN_ACCURACY = 0.05;
const MAX_ACCURACY = 0.95;
const MIN_EVASION = 0.05;
const MAX_EVASION = 0.95;

class Player {

	/**
	 * Creates a player object
	 *
	 * @param {Object} manager - a Manager instance
	 * @param {(Object|string)} playerState - either the playerState object or player name
	 */
	constructor(manager, playerState) {
		if (typeof playerState === 'string')
			playerState = manager.getPlayerState(playerState);

		this.manager = manager;
		this.state = playerState;
	}

	get output() {
		return this.manager.output;
	}

	save() {
		manager.setPlayerState(this.state.name, this.state);
	}

	load() {
		this.state = manager.getPlayerState(this.state.name);
	}

	static getInitialState(name, isChallenger, opponent) {
		var playerState = {
			name: name,
			isChallenger: isChallenger,
			opponent: opponent,
			effects: [],
			health: 100,
			spellcasting: 1,
			accuracy: 1,
			evasion: 0,
		};

		Player.resetTurnVars(playerState);

		return playerState;
	}

	static resetTurnVars(playerState) {
		_.extend(playerState, {
			turnSpellcasting: playerState.spellcasting,
			turnAccuracy:     playerState.accuracy,
			turnEvasion:      playerState.evasion,
		});
	}

	resetTurnVars(save) {
		Player.resetTurnVars(this.state);

		if (save)
			this.save;
	}

	attemptSpellCast(spell, onSelf) {
		// Apply effects to playerState
		var modifiedState = this.getModifiedState();

		// Call any beforeCast functions from effects
		var attemptCast = true;
		for (let effectName of modifiedState.effects) {
			var effect = Effects.get(effectName);
			if (effect.beforeCast &&
				effect.beforeCast(this.manager, this, spell, onSelf) === false
			) {
				attemptCast = false;
			}
		}

		// Attempt to perform the spell
		if (attemptCast) {
			var succeeded = this.spellSucceeded(spell);
			if (succeeded) {
				if (onSelf || this.spellHitTarget(spell)) {
					spell.cast(this.manager, this, onSelf);
					var narration = `${this.state.name} cast ${spell.incantation}`;
					if (!onSelf)
						narration += ` on @${this.state.opponent}`;
					narration += '.  ';
					narration += spell.narration.replace('@target', (onSelf ? this.state.name : this.state.opponent));
					this.output.send(narration);
				}
				else {
					this.output.send(`@${playerState.name} fails to hit his target.`);
				}
			}
			else if (spell.failure)
				spell.failure(this.manager, this, onSelf);
			else
				this.output.send(`@${playerState.name} fails to cast ${spell.incantation}.`);
		}
	}

	spellHitTarget(spell) {
		var opponent = new Player(this.manager, this.state.opponent);
		var opponentState = opponent.getModifiedState(true);
		var accuracy = Math.min(Math.max(this.getModifiedState().turnAccuracy, MIN_ACCURACY), MAX_ACCURACY);
		var evasion  = Math.min(Math.max(opponentState.turnEvasion,  MIN_EVASION),  MAX_EVASION);
		var chanceToHit = ((accuracy - evasion) / accuracy);
		if (chanceToHit <= 0)
			return false;
		else if (Math.random() > chanceToHit)
			return false;
		else
			return true;
	}

	/**
	 * Determines whether the spell is cast based off the player's state
	 */
	spellSucceeded(spell) {
		return (Math.random() >= this.getModifiedState().turnSpellcasting);
	}

	/**
	 * Adds an effect to the player and negates opposite effects
	 *
	 * @param {Object} response - hubot response object
	 * @param {(Object|string)} playerState - either the playerState object or player name
	 * @param {string} effectName - the effects array key for the effect
	 */
	addEffect(effectName) {
		var negated = [];
		var negates = Effects.get(effectName).negates;
		if (negates) {
			for (let i = 0; i < negates.length; i++) {
				if (Set.contains(this.state.effects, negates[i])) {
					Set.remove(this.state.effects, negates[i]);
					negated.push(negates[i]);
				}
			}
		}

		var counteracts = [];
		var counteracts = Effects.get(effectName).counteracts;
		if (counteracts) {
			for (let i = 0; i < counteracts.length; i++) {
				if (Set.contains(this.state.effects, counteracts[i]))
					counteracts.push(counteracts[i]);
			}
		}

		if (!negated.length) {
			Set.add(this.state.effects, effectName);

			if (counteracts.length > 0)
				this.manager.output.append(`The ${effectName} counteracted @${this.state.name}'s ${oxfordJoin(counteracted)}. `);
		}
		else
			this.manager.output.append(`The ${effectName} has negated @${this.state.name}'s ${oxfordJoin(negated)}. `);
	}

	/**
	 * Removes an effect from the player
	 *
	 * @param {string} effectName - the effects array key for the effect
	 */
	removeEffect(effectName) {
		Set.remove(this.state.effects, effectName);
	}

	getModifiedState(isDefense) {
		if (isDefense) {
			if (!this._defenseModifiedState)
				this._defenseModifiedState = Player.getAffectedPlayerState(this.manager, this.state, isDefense);

			return this._defenseModifiedState;
		}
		else {
			if (!this._modifiedState)
				this._modifiedState = Player.getAffectedPlayerState(this.manager, this.state, isDefense);

			return this._modifiedState;
		}
	}

	static getAffectedPlayerState(manager, playerState, isDefense) {
		var modifiedPlayerState = _.extend({}, playerState);

		var activeEffects = [];
		for (let i = 0; i < effects.length; i++) {
			// Search for countering effects
			var counteracted = false;
			for (let j = 0; j < effects.length; j++) {
				var possiblyCounteractingEffect = Effects.get(effects[j]);
				if (possiblyCounteractingEffect.counteracts(effects[i])) {
					counteracted = true;
					break;
				}
			}

			if (!counteracted)
				activeEffects.push(effects[i]);
		}

		for (let effectName of activeEffects)
			Effects.get(effectName).modify(manager, modifiedPlayerState, isDefense);

		return modifiedPlayerState;
	}

	/**
	 * Returns a list of effects with notes about counteracting effects.  Example:
	 *   - large-nose
	 *   - stench (counteracted by fragrance)
	 *   - fragrance (counteracted by stench)
	 */
	getEffectList() {
		var effects = this.state.effects;
		var list = [];
		for (let i = 0; i < effects.length; i++) {
			var effect = Effects.get(effects[i]);
			var line = '';
			var noun = effect.noun;

			// Search for countering effects
			var counteractedBy = [];
			for (let j = 0; j < effects.length; j++) {
				var possiblyCounteractingEffect = Effects.get(effects[j]);
				if (possiblyCounteractingEffect.counteracts(effects[i]))
					counteractedBy.push(possiblyCounteractingEffect.noun);
			}

			if (counteractedBy.length) {
				// Show the name of the effect with a strikethrough
				line += `~${noun}~ (counteracted by ${oxfordJoin(counteractedBy)})`;
			}
			else {
				// Show it normally
				line += noun;
			}
		}

		return list;
	}

};

export default Player;
