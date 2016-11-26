
/**
 * Class for effect instances that wraps some standard functionality around the
 *   configuration.
 */
export default class Effect {

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

	modify(manager, playerState, isDefense) {
		// Apply listed modifiers
		if (this.effect.modifiers) {
			for (let modifier of this.effect.modifiers)
				this.applyModifier(playerState, modifier);
		}

		// Look for synergies
		if (this.effect.synergies) {
			for (let synergy of this.effect.synergies) {
				var conditionsMet;

				if (synergy.effects.or) {
					conditionsMet = false;
					for (let effectName of synergy.effects.or) {
						if (playerState.effects.includes(effectName)) {
							conditionsMet = true;
							break;
						}
					}
				}
				else
					conditionsMet = true;

				if (synergy.effects.and) {
					for (let effectName of synergy.effects.and)
						conditionsMet &= playerState.effects.includes(effectName);
				}

				if (conditionsMet) {
					var numTimesToApply;

					if (synergy.effects.each) {
						numTimesToApply = 0;
						for (let effectName of synergy.effects.each) {
							if (playerState.effects.includes(effectName))
								numTimesToApply++;
						}
					}
					else
						numTimesToApply = 1;

					for (let i = 0; i < numTimesToApply; i++) {
						for (let modifier of synergy.modifiers)
							this.applyModifier(playerState, modifier);
					}
				}
			}
		}

		// Call modify function if it exists
		if (this.effect.modify)
			this.effect.modify.apply(this, arguments);
	}

	applyModifier(playerState, modifier) {
		var property = modifier[0];
		var operator = modifier[1];
		var operand = modifier[2];
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
