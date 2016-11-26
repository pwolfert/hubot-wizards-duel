import _ from 'underscore';
import Player from './player';

/**
 * Class representing a spell, wrapping additional functionality around
 *   the configs and filling in holes in the information given.
 */
export default class Spell {

	constructor(spellConfig) {
		this.spell = spellConfig;
	}

	get projectileDescription() {
		if (this.spell.projectileDescription)
			return this.spell.projectileDescription;
		else
			return 'bolt of magic';
	}

	get incantation() {
		return this.spell.incantation;
	}

	get description() {
		return this.spell.description;
	}

	get narration() {
		if (this.spell.narration)
			return this.spell.narration;
		return '';
	}

	get onFailure() {
		return this.spell.onFailure;
	}

	get effects() {
		if (this.spell.effects)
			return this.spell.effects;
		return [];
	}

	get removedEffects() {
		if (this.spell.removedEffects)
			return this.spell.removedEffects;
		return [];
	}

	get baseSuccessRate() {
		if (this.spell.baseSuccessRate)
			return this.spell.baseSuccessRate;
		return 1;
	}

	cast(manager, player, onSelf) {
		var i;
		var target = onSelf ? player : new Player(manager, player.state.opponent);

		// Add effects as appropriate
		for (i = 0; i < this.effects.length; i++)
			target.addEffect(this.effects[i]);

		// Remove effects as appropriate
		for (i = 0; i < this.removedEffects.length; i++) {
			if (target.state.effects.includes(this.removedEffects[i]))
				target.removeEffect(this.removedEffects[i]);
		}

		// If it's the opponent, we need to save
		if (!onSelf)
			target.save();

		// Call the spell config's cast function if it exists
		if (this.spell.cast)
			this.spell.cast.apply(this, arguments);
	}

	onHitTarget(manager, player, onSelf) {
		if (this.spell.onHitTarget)
			this.spell.onHitTarget.apply(this, arguments);
	}

	getNarration(target) {
		if (typeof this.narration === 'function')
			return this.narration.call(this, target);
		else
			return this.narration.replace('@target', '@' + target);
	}

}
