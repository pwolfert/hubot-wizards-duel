import _       from 'lodash';
import Effects from './effects';

const POSSESSIVE_DETERMINER = '_possessive';

/**
 * Class for effect instances that wraps some standard functionality around the
 *   configuration.
 */
class Effect {

	constructor(name, effectConfig) {
		this.effect = effectConfig;
		this.name = name;
	}

	get noun() {
		if (this.effect.noun)
			return this.effect.noun;
		else
			return this.name;
	}

	get removalVerb() {
		if (this.effect.removalVerb)
			return this.effect.removalVerb;
		else
			return 'removes';
	}

	get negatingVerb() {
		if (this.effect.negatingVerb)
			return this.effect.negatingVerb;
		else
			return 'negates';
	}

	get global() {
		return this.effect.global;
	}

	get negatedEffects() {
		if (this.effect.negates)
			return this.effect.negates;
		return [];
	}

	get removedEffects() {
		if (this.effect.removes)
			return this.effect.removes;
		return [];
	}

	get counteractedEffects() {
		if (this.effect.counteracts)
			return this.effect.counteracts;
		return [];
	}

	getDeterminer(player) {
		if (this.effect.determiner) {
			if (this.effect.determiner === POSSESSIVE_DETERMINER)
				return `@${player}'s`;
			else
				return this.effect.determiner;
		}
		else
			return 'the';
	}

	modify(manager, playerState, isDefense, verbose) {
		// Apply listed modifiers
		if (this.effect.modifiers) {
			for (let modifier of this.effect.modifiers) {
				let narrations = this.applyModifier(manager, playerState, modifier);
				if (narrations.length && verbose)
					manager.output.append(`Because of ${this.noun}, @${playerState.name} ${oxfordJoin(narrations)}. `);
			}
		}

		// Look for synergies
		if (this.effect.synergies) {
			for (let synergy of this.effect.synergies) {
				var conditionsMet;

				// Find out what our pool of effects is
				var effects;
				if (synergy.effects.onOpponent)
					effects = manager.getPlayerState(playerState.opponent).effects;
				else if (synergy.effects.onEitherPlayer)
					effects = manager.getPlayerState(playerState.opponent).effects.concat(playerState.effects);
				else
					effects = playerState.effects;

				// List of affects that were present and applicable
				var applicableEffects = [];

				if (synergy.effects.or) {
					conditionsMet = false;
					for (let effectName of synergy.effects.or) {
						if (effects.includes(effectName)) {
							conditionsMet = true;
							applicableEffects.push(effectName);
						}
					}
				}
				else
					conditionsMet = true;

				if (synergy.effects.and) {
					for (let effectName of synergy.effects.and) {
						conditionsMet &= effects.includes(effectName);
						applicableEffects.push(effectName);
					}
				}

				if (conditionsMet) {
					var numTimesToApply;

					if (synergy.effects.each) {
						numTimesToApply = 0;
						for (let effectName of synergy.effects.each) {
							if (effects.includes(effectName))
								numTimesToApply++;
						}
					}
					else
						numTimesToApply = 1;

					if (verbose) {
						var nouns = Effects.getNouns(applicableEffects);
						var determiner = this.getDeterminer(playerState.name);
						manager.output.append(`Because of ${determiner} ${this.noun} and the presence of ${oxfordJoin(nouns)}, @${playerState.name} `);
					}

					let narrations = [];
					let modifierNarrations;
					let didCollectNarrations = false;
					for (let i = 0; i < numTimesToApply; i++) {
						for (let modifier of synergy.modifiers) {
							modifierNarrations = this.applyModifier(manager, playerState, modifier);
							if (verbose && !didCollectNarrations)
								narrations.push(modifierNarrations);
						}
						didCollectNarrations = true;
					}

					if (verbose) {
						manager.output.append(oxfordJoin(narrations));
						if (numTimesToApply > 1)
							manager.output.append(`(x${numTimesToApply})`);
						manager.output.append('.');
					}
				}
			}
		}

		// Call modify function if it exists
		if (this.effect.modify)
			this.effect.modify.apply(this, arguments);
	}

	/**
	 * Applies the modifier to the playerState and returns a narration
	 */
	applyModifier(playerState, modifier) {
		var narrations = [];

		if (_.isArray(modifier) || _.isObject(modifier)) {
			var property  = modifier[0];
			var operator  = modifier[1];
			var operand   = modifier[2];
			var narration = modifier[3];

			switch (operator) {
				case '*=':
					playerState[property] *= operand;
					break;
				case '/=':
					playerState[property] /= operand;
					break;
				case '+=':
					playerState[property] += operand;
					break;
				case '-=':
					playerState[property] -= operand;
					break;
				case '=':
					playerState[property] = operand;
					break;
			}

			if (narration)
				narrations.push(narration);
		}
		else if (typeof modifier === 'string') {
			// It's the name of another effect; just take its direct modifiers
			var effect = Effects.get(modifier);
			if (effect.modifiers) {
				for (let effectModifier of effect.modifiers)
					narrations = narrations.concat(this.applyModifier(playerState, effectModifier));
			}
		}
		else {
			throw new Error('Bad modifier passed to Effect.applyModifiers: ', modifier);
		}

		return narrations;
	}

	inverselyApplyModifier(playerState, modifier) {
		// Inversly apply listed modifiers
		var property = modifier[0];
		var operator = modifier[1];
		var operand = modifier[2];
		switch (operator) {
			case '*=':
				playerState[property] /= operand;
				break;
			case '/=':
				playerState[property] *= operand;
				break;
			case '+=':
				playerState[property] -= operand;
				break;
			case '-=':
				playerState[property] += operand;
				break;
		}
	}

	getDefenseModifiersNarration(playerState) {
		const defenseModifiers = [ 'turnEvasion', 'turnShield' ];
	}

	getOffenseModifiersNarration(playerState) {
		// 'Spellcasting chance is lowered'
	}

	counteracts(effectName) {
		if (this.effect.counteracts)
			return this.effect.counteracts.includes(effectName);
		else
			return false;
	}

	negates(effectName) {
		if (this.effect.negates)
			return this.effect.negates.includes(effectName);
		else
			return false;
	}

	/**
	 * Called on every active effect before a player attempts a spell cast.
	 *   If `false` is returned, the spell won't be cast.
	 */
	beforeCast(manager, player, spell, onSelf) {
		if (this.effect.beforeCast)
			return this.effect.beforeCast.apply(this, arguments);

		return true;
	}

	/**
	 * Called on every active effect when a player is about to be hit by a spell.
	 *   If `false` is returned, the spell won't hit.
	 */
	beforeHit(manager, player, spell, onSelf) {
		if (this.effect.beforeHit)
			return this.effect.beforeHit.apply(this, arguments);

		return true;
	}

}

Effect.POSSESSIVE_DETERMINER = POSSESSIVE_DETERMINER;

export default Effect;
