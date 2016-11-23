import _ from 'underscore';
import oxfordJoin from 'oxford-join';
import clamp from 'clamp';
import Effects from './effects';
import SetFunctions from './set';

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
			spellcasting: 1,
			accuracy: 1,
			evasion: 0,
			pain: 0,
		};

		Player.resetTurnVars(playerState);

		return playerState;
	}

	static resetTurnVars(playerState) {
		_.extend(playerState, {
			turnSpellcasting: playerState.spellcasting,
			turnAccuracy:     playerState.accuracy,
			turnEvasion:      playerState.evasion,
			turnShield:       0,
			turnPain:         playerState.pain,
		});
	}

	resetTurnVars(save) {
		Player.resetTurnVars(this.state);

		if (save)
			this.save;
	}

	attemptSpellCast(spell, onSelf) {
		// Apply effects to playerState
		var affectedState = this.getAffectedState();

		// Call any beforeCast functions from effects
		var attemptCast = true;
		for (let effectName of affectedState.effects) {
			if (Effects.get(effectName).beforeCast(this.manager, this, spell, onSelf) === false)
				attemptCast = false;
		}

		// Attempt to perform the spell
		if (attemptCast) {
			var succeeded = this.spellSucceeded(spell);
			if (succeeded) {
				if (onSelf || this.spellHitTarget(spell)) {
					spell.cast(this.manager, this, onSelf);

					var narration = `@${this.state.name} casts ${spell.incantation}`;
					if (!onSelf)
						narration += ` on @${this.state.opponent}`;
					narration += '.  ';
					narration += spell.getNarration(onSelf ? this.state.name : this.state.opponent);

					this.output.send(narration);
				}
				else {
					this.output.send(`@${this.state.name} fails to hit his target.`);
				}
			}
			else if (spell.onFailure)
				spell.onFailure(this.manager, this, onSelf);
			else
				this.output.send(`@${this.state.name} fails to cast ${spell.incantation}.`);
		}
	}

	spellHitTarget(spell) {
		var playerState = this.getAffectedState();
		var opponent = new Player(this.manager, this.state.opponent);
		var opponentState = opponent.getAffectedState(true);

		var accuracy = clamp(playerState.turnAccuracy, MIN_ACCURACY, MAX_ACCURACY);
		var evasion  = clamp(opponentState.turnEvasion,  MIN_EVASION, MAX_EVASION);

		var chanceToHit = ((accuracy - evasion) / accuracy);
		if (chanceToHit <= 0)
			return false;
		else if (Math.random() > chanceToHit)
			return false;
		else {
			var activeEffects = Player.getActiveEffects(opponentState);
			var effectsAllowHit = true;

			for (let effectName of activeEffects) {
				if (Effects.get(effectName).beforeHit(this.manager, opponent, spell, false) === false)
					effectsAllowHit = false;
			}

			return effectsAllowHit;
		}
	}

	/**
	 * Determines whether the spell is cast based off the player's state
	 */
	spellSucceeded(spell) {
		return (Math.random() <= this.getAffectedState().turnSpellcasting);
	}

	/**
	 * Adds an effect to the player, negates opposite effects, and removes removed effects
	 *
	 * @param {Object} response - hubot response object
	 * @param {(Object|string)} playerState - either the playerState object or player name
	 * @param {string} effectName - the effects array key for the effect
	 */
	addEffect(effectName) {
		var negated = [];
		var negates = Effects.get(effectName).negatedEffects;
		for (let negatedEffectName of negates) {
			if (SetFunctions.includes(this.state.effects, negatedEffectName)) {
				SetFunctions.remove(this.state.effects, negatedEffectName);
				negated.push(negatedEffectName);
			}
		}

		var removed = [];
		var removes = Effects.get(effectName).removedEffects;
		for (let removedEffectName of removes) {
			if (SetFunctions.includes(this.state.effects, removedEffectName)) {
				SetFunctions.remove(this.state.effects, removedEffectName);
				removed.push(removedEffectName);
			}
		}

		var counteracted = [];
		var counteracts = Effects.get(effectName).counteractedEffects;
		for (let counteractedEffectName of counteracts) {
			if (SetFunctions.includes(this.state.effects, counteractedEffectName))
				counteracted.push(counteractedEffectName);
		}

		if (!negated.length) {
			SetFunctions.add(this.state.effects, effectName);
			if (removed.length > 0)
				this.output.append(`The ${effectName} removed @${this.state.name}'s ${oxfordJoin(removed)}. `);
			if (counteracted.length > 0)
				this.output.append(`The ${effectName} counteracted @${this.state.name}'s ${oxfordJoin(counteracted)}. `);
		}
		else
			this.output.append(`The ${effectName} has negated @${this.state.name}'s ${oxfordJoin(negated)}. `);
	}

	/**
	 * Removes an effect from the player
	 *
	 * @param {string} effectName - the effects array key for the effect
	 */
	removeEffect(effectName) {
		SetFunctions.remove(this.state.effects, effectName);
	}

	getAffectedState(isDefense) {
		if (isDefense) {
			if (!this._defenseAffectedState)
				this._defenseAffectedState = Player.getAffectedPlayerState(this.manager, this.state, isDefense);

			return this._defenseAffectedState;
		}
		else {
			if (!this._affectedState)
				this._affectedState = Player.getAffectedPlayerState(this.manager, this.state, isDefense);

			return this._affectedState;
		}
	}

	static getAffectedPlayerState(manager, playerState, isDefense) {
		var modifiedPlayerState = _.extend({}, playerState);
		var activeEffects = Player.getActiveEffects(playerState);

		for (let effectName of activeEffects)
			Effects.get(effectName).modify(manager, modifiedPlayerState, isDefense);

		return modifiedPlayerState;
	}

	static getActiveEffects(playerState) {
		var effects = playerState.effects;
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

		return activeEffects;
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
