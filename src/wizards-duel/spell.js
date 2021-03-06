import _ from "lodash";
import oxfordJoin from "oxford-join";
import Player from "./player";
import Effects from "./effects";
import Language from "./language";

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
    else return "bolt of magic";
  }

  get incantation() {
    return this.spell.incantation;
  }

  get description() {
    if (this.spell.description) return this.spell.description;
    else return "DOES NOT HAVE A DESCRIPTION";
  }

  get narration() {
    if (this.spell.narration) return this.spell.narration;
    return "";
  }

  get difficultyAdjective() {
    return Language.getDifficultyAdjective(this.baseSuccessRate * 100);
  }

  get onFailure() {
    return this.spell.onFailure;
  }

  get effects() {
    if (this.spell.effects) return this.spell.effects;
    return [];
  }

  get removedEffects() {
    if (this.spell.removedEffects) return this.spell.removedEffects;
    return [];
  }

  get toggledEffects() {
    if (this.spell.toggledEffects) return this.spell.toggledEffects;
    return [];
  }

  get baseSuccessRate() {
    if (this.spell.baseSuccessRate) return this.spell.baseSuccessRate;
    return 1;
  }

  get hitModifier() {
    if (this.spell.hitModifier) return this.spell.hitModifier;
    return 0;
  }

  get isGlobal() {
    if (this.spell.isGlobal) return this.spell.isGlobal;
    return false;
  }

  cast(manager, player, onSelf) {
    var i;
    var target = onSelf ? player : new Player(manager, player.state.opponent);
    var oldEffects = target.state.effects.slice();

    // Add effects as appropriate
    if (this.effects.length) {
      // var nouns = Effects.getNouns(this.effects);
      // manager.output.append(`_${this.incantation}_ adds ${oxfordJoin(nouns)} to @${target.state.name}. `);

      for (i = 0; i < this.effects.length; i++)
        target.addEffect(this.effects[i]);
    }

    // Remove effects as appropriate
    if (this.removedEffects.length) {
      // nouns = Effects.getNouns(this.removedEffects);
      // manager.output.append(`_${this.incantation}_ removes ${oxfordJoin(nouns)} from @${target.state.name}. `);

      for (i = 0; i < this.removedEffects.length; i++) {
        if (target.state.effects.includes(this.removedEffects[i]))
          target.removeEffect(this.removedEffects[i]);
      }
    }

    // Toggle effects as appropriate
    if (this.toggledEffects.length) {
      for (i = 0; i < this.toggledEffects.length; i++) {
        if (target.state.effects.includes(this.toggledEffects[i]))
          target.removeEffect(this.toggledEffects[i]);
        else target.addEffect(this.toggledEffects[i]);
      }
    }

    // Call the spell config's cast function if it exists
    if (this.spell.cast) this.spell.cast.apply(this, arguments);

    // If it's the opponent, we need to save
    if (!onSelf) target.save();

    // Narrate the effects if they changed
    if (_.xor(oldEffects, target.state.effects.slice()).length)
      target.getEffectsExplanation();
  }

  onHitTarget(manager, player, onSelf) {
    if (this.spell.onHitTarget) this.spell.onHitTarget.apply(this, arguments);
  }

  getNarration(target) {
    if (typeof this.narration === "function")
      return this.narration.call(this, target);
    else return this.narration.replace("@target", "@" + target);
  }
}
