import _            from 'lodash';
import oxfordJoin   from 'oxford-join';
import clamp        from 'clamp';
import Effects      from './effects';
import Language     from './language';
import SetFunctions from './set';

const MIN_ACCURACY =  5;
const MAX_ACCURACY = 95;
const MIN_EVASION  =  5;
const MAX_EVASION  = 95;
const MIN_PAIN     = 0;
const MAX_PAIN     = 100;

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
		this.manager.setPlayerState(this.state.name, this.state);
	}

	load() {
		this.state = this.manager.getPlayerState(this.state.name);
	}

	static getInitialState(name, isChallenger, opponent) {
		var playerState = {
			name: name,
			isChallenger: isChallenger,
			opponent: opponent,
			effects: [],
			numFailures: 0,
			spellcasting: 100,
			accuracy: 95,
			evasion: 5,
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
			this.save();
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
					this.output.startSend();

					this.output.append(`@${this.state.name} casts _${spell.incantation}_`);
					if (!onSelf)
						this.output.append(` on @${this.state.opponent}`);
					this.output.append(`, which ${spell.description}. `);

					spell.cast(this.manager, this, onSelf);

					this.output.append(spell.getNarration(onSelf ? this.state.name : this.state.opponent));

					spell.onHitTarget(this.manager, onSelf ? this : new Player(this.manager, this.state.opponent), onSelf);

					this.output.endSend();
				}
				else {
					this.output.send(`@${this.state.name} casts _${spell.incantation}_ but fails to hit @${this.state.opponent}.`);
				}
			}
			else if (spell.onFailure)
				spell.onFailure(this.manager, this, onSelf);
			else
				this.output.send(`@${this.state.name} fails to cast _${spell.incantation}_.`);

			return succeeded;
		}

		return attemptCast;
	}

	spellHitTarget(spell) {
		var playerState = this.getAffectedState();
		var opponent = new Player(this.manager, this.state.opponent);
		var opponentState = opponent.getAffectedState(true);

		var accuracy = clamp(playerState.turnAccuracy, MIN_ACCURACY, MAX_ACCURACY) - clamp(playerState.turnPain, MIN_PAIN, MAX_PAIN);
		var evasion  = clamp(opponentState.turnEvasion, MIN_EVASION, MAX_EVASION) - clamp(opponentState.turnPain, MIN_PAIN, MAX_PAIN);

		var chanceToHit = ((accuracy - evasion) / accuracy) + (spell.hitModifier / 100);
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
		var playerState = this.getAffectedState();
		var pain = clamp(playerState.turnPain, MIN_PAIN, MAX_PAIN);
		var toCast = (playerState.turnSpellcasting - pain) * spell.baseSuccessRate;
		return (Math.random() * 100 <= toCast);
	}

	/**
	 * Adds an effect to the player, negates opposite effects, and removes removed effects
	 *
	 * @param {Object} response - hubot response object
	 * @param {(Object|string)} playerState - either the playerState object or player name
	 * @param {string} effectName - the effects array key for the effect
	 */
	addEffect(effectName) {
		this.state.effects = Effects.addEffect(this.state.effects, effectName, this.output, this.state.name);
	}

	/**
	 * Removes an effect from the player
	 *
	 * @param {string} effectName - the effects array key for the effect
	 */
	removeEffect(effectName) {
		this.state.effects = Effects.removeEffect(this.state.effects, effectName, this.output, this.state.name);
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

	static getAffectedPlayerState(manager, playerState, isDefense, verbose) {
		var modifiedPlayerState = _.extend({}, playerState);
		var activeEffects = Player.getActiveEffects(playerState);

		for (let effectName of activeEffects)
			Effects.get(effectName).modify(manager, modifiedPlayerState, isDefense, verbose);

		return modifiedPlayerState;
	}

	getEffectsExplanation() {
		// Calls the same modification functions as getAffectedPlayerState but in verbose mode
		Player.getAffectedPlayerState(this.manager, this.state, true, true);
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

			list.push(line);
		}

		return list;
	}

	/**
	 * Returns a summary of the player's attributes given the current effects
	 */
	getStatus() {
		var state = this.getAffectedState(true);
		var initialState = Player.getInitialState();
		var lines = [];
		var attributes = {
			turnSpellcasting: [ 'Spell-casting ability', initialState.spellcasting ],
			turnAccuracy: [ 'Accuracy', initialState.accuracy ],
			turnEvasion: [ 'Evasive ability', initialState.evasion ],
		};

		for (let key in attributes) {
			let value = state[key];
			let attr = attributes[key][0];
			let initial = attributes[key][1];

			if (value === initial)
				lines.push(`Your ${attr} is normal`);
			else if (value > initial) {
				let degree = Language.getDegreeAdverb(value - initial);
				lines.push(`Your ${attr} is ${degree} improved`);
			}
			else {
				let degree = Language.getSeverityAdverb(initial - value);
				lines.push(`Your ${attr} is ${degree} diminished`);
			}
		}

		if (state.turnPain > 0)
			lines.push(`You are in ${Language.getSeverityAdjective(state.turnPain)} pain`);
		else
			lines.push('You feel no pain');

		if (state.turnShield > 0)
			lines.push(`and you have a ${Language.getAdvantageAdjective(state.turnShield)} shield.`);
		else
			lines.push('and you have no magical shield.');

		return lines.join(',\n');
	}

};

export default Player;
