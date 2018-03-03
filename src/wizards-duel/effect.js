// @flow

import _ from "lodash";
import oxfordJoin from "oxford-join";
import Effects from "./effects";
import SetFunctions from "./set";
import set from "immutable-set";

import type { DuelState, Manager } from "./manager";
import type { PlayerState, PlayerAttribute } from "./player";

// type PlayerAttribute =
//   | "spellcasting"
//   | "accuracy"
//   | "evasion"
//   | "pain"
//   | "turnSpellcasting"
//   | "turnAccuracy"
//   | "turnEvasion"
//   | "turnShield"
//   | "turnPain";
export type Modifier = [PlayerAttribute, string, number, ?string];
export type Synergy = any;

const POSSESSIVE_DETERMINER = "_possessive";

/**
 * Class for effect instances that wraps some standard functionality around the
 *   configuration.
 */
class Effect {
  static POSSESSIVE_DETERMINER = POSSESSIVE_DETERMINER;

  effect: any;
  name: string;

  constructor(name: string, effectConfig: any) {
    this.effect = effectConfig;
    this.name = name;
  }

  get noun(): string {
    if (this.effect.noun) return this.effect.noun;
    else return this.name;
  }

  get removalVerb(): string {
    if (this.effect.removalVerb) return this.effect.removalVerb;
    else return "removes";
  }

  get negatingVerb(): string {
    if (this.effect.negatingVerb) return this.effect.negatingVerb;
    else return "negates";
  }

  get repellingVerb(): string {
    if (this.effect.repellingVerb) return this.effect.repellingVerb;
    else return "repels";
  }

  get global(): boolean {
    return this.effect.global;
  }

  get negatedEffects(): string[] {
    if (this.effect.negates) return this.effect.negates;
    return [];
  }

  get removedEffects(): string[] {
    var list = [];
    if (this.effect.removes) SetFunctions.add(list, this.effect.removes);
    if (this.effect.alwaysRemoves)
      SetFunctions.add(list, this.effect.alwaysRemoves);
    return list;
  }

  get alwaysRemovedEffects(): string[] {
    if (this.effect.alwaysRemoves) return this.effect.alwaysRemoves;
    return [];
  }

  get counteractedEffects(): string[] {
    if (this.effect.counteracts) return this.effect.counteracts;
    return [];
  }

  get repelledEffects(): string[] {
    if (this.effect.repels) return this.effect.repels;
    return [];
  }

  removes(effectName: string): boolean {
    return Effect.applies(this.removedEffects, effectName);
  }

  alwaysRemoves(effectName: string): boolean {
    return Effect.applies(this.alwaysRemovedEffects, effectName);
  }

  negates(effectName: string): boolean {
    return Effect.applies(this.negatedEffects, effectName);
  }

  counteracts(effectName: string): boolean {
    return Effect.applies(this.counteractedEffects, effectName);
  }

  repels(effectName: string): boolean {
    return Effect.applies(this.repelledEffects, effectName);
  }

  /**
   * Determines whether a given effect matches any of the listed effects
   * either by name or by an attribute identifier (e.g. ":isFlammable").
   */
  static applies(effectNames: string[], effectName: string): boolean {
    // Look to see if it's listed outright
    if (effectNames.includes(effectName)) return true;

    // Look to see if it has a matching attribute
    var effect = Effects.get(effectName);
    for (let name of effectNames) {
      if (name.charAt(0) === ":") {
        // Then this effect name is actually an attribute
        let attribute = name.substring(1);
        if (effect.getAttribute(attribute) === true) return true;
      }
    }

    // Doesn't apply
    return false;
  }

  getAttribute(attributeString: string): string {
    if (attributeString.charAt(0) === ":")
      attributeString = attributeString.substr(1);

    return this.effect[attributeString];
  }

  getDeterminer(playerName: string) {
    if (this.effect.determiner) {
      if (this.effect.determiner === POSSESSIVE_DETERMINER)
        return `@${playerName}'s`;
      else return this.effect.determiner;
    } else return "the";
  }

  /**
   *
   */
  modify(
    state: DuelState,
    manager: Manager,
    playerName: string,
    isDefense: boolean,
    verbose: boolean
  ): DuelState {
    // Apply listed modifiers
    if (this.effect.modifiers) {
      for (let modifier of this.effect.modifiers) {
        let { narrations, playerState } = this.applyModifier(
          state.players[playerName],
          modifier
        );
        state = set(state, ["players", playerName], playerState);
        if (narrations.length && verbose)
          manager.output.append(
            `Because of ${this.noun}, @${playerName} ${oxfordJoin(
              narrations
            )}. `
          );
      }
    }

    // Look for synergies
    if (this.effect.synergies) {
      for (let synergy of this.effect.synergies) {
        state = this.applySynergies(
          state,
          manager,
          playerName,
          synergy,
          isDefense,
          verbose
        );
      }
    }

    // Call modify function if it exists
    if (this.effect.modify) {
      state = this.effect.modify.call(
        this,
        state,
        manager,
        playerName,
        isDefense,
        verbose
      );
    }

    return state;
  }

  /**
   * Applies the modifier to the playerState and returns a narration
   */
  applyModifier(
    playerState: PlayerState,
    modifier: Modifier | string
  ): { playerState: PlayerState, narrations: string[] } {
    let narrations = [];

    if (typeof modifier !== "string") {
      playerState = { ...playerState };
      const [property, operator, operand, narration] = modifier;

      switch (operator) {
        case "*=":
          playerState[property] *= operand;
          break;
        case "/=":
          playerState[property] /= operand;
          break;
        case "+=":
          playerState[property] += operand;
          break;
        case "-=":
          playerState[property] -= operand;
          break;
        case "=":
          playerState[property] = operand;
          break;
      }

      if (narration) narrations.push(narration);
    } else if (typeof modifier === "string") {
      // It's the name of another effect; just take its direct modifiers
      var effect = Effects.get(modifier);
      if (effect.effect.modifiers) {
        for (let effectModifier of effect.effect.modifiers) {
          let {
            playerState: modifiedPlayerState,
            narrations: modifierNarrations
          } = this.applyModifier(playerState, effectModifier);
          narrations = narrations.concat(modifierNarrations);
          playerState = modifiedPlayerState;
        }
      }
    }

    return { playerState, narrations };
  }

  inverselyApplyModifier(
    playerState: PlayerState,
    modifier: Modifier
  ): PlayerState {
    playerState = { ...playerState };
    // Inversly apply listed modifiers
    const [property, operator, operand] = modifier;
    switch (operator) {
      case "*=":
        playerState[property] /= operand;
        break;
      case "/=":
        playerState[property] *= operand;
        break;
      case "+=":
        playerState[property] -= operand;
        break;
      case "-=":
        playerState[property] += operand;
        break;
    }
    return playerState;
  }

  applySynergies(
    state: DuelState,
    manager: Manager,
    playerName: string,
    synergy: Synergy,
    isDefense: boolean,
    verbose: boolean
  ): DuelState {
    var playerState = state.players[playerName];
    var opponentState = state.players[playerState.opponent];

    var conditionsMet;

    // Find out what our pool of effects is
    var effects;
    if (synergy.effects.onOpponent) {
      effects = opponentState.effects;
    } else if (synergy.effects.onEitherPlayer) {
      effects = opponentState.effects.concat(playerState.effects);
    } else {
      effects = playerState.effects;
    }

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
    } else {
      conditionsMet = true;
    }

    if (synergy.effects.and) {
      for (let effectName of synergy.effects.and) {
        conditionsMet = conditionsMet && effects.includes(effectName);
        applicableEffects.push(effectName);
      }
    }

    if (conditionsMet) {
      var numTimesToApply;

      if (synergy.effects.each) {
        numTimesToApply = 0;
        for (let effectName of synergy.effects.each) {
          if (effects.includes(effectName)) {
            numTimesToApply++;
            applicableEffects.push(effectName);
          }
        }
      } else numTimesToApply = 1;

      if (verbose && numTimesToApply) {
        var nouns = Effects.getNouns(applicableEffects);
        var determiner = this.getDeterminer(playerState.name);
        manager.output.append(
          `Because of ${determiner} ${
            this.noun
          } and the presence of ${oxfordJoin(nouns)}, @${playerState.name} `
        );
      }

      let narrations = [];
      let modifierNarrations;
      let didCollectNarrations = false;
      for (let i = 0; i < numTimesToApply; i++) {
        for (let modifier of synergy.modifiers) {
          modifierNarrations = this.applyModifier(playerState, modifier);
          if (verbose && !didCollectNarrations)
            narrations.push(modifierNarrations);
        }
        didCollectNarrations = true;
      }

      if (verbose && numTimesToApply) {
        manager.output.append(oxfordJoin(narrations));
        if (numTimesToApply > 1) manager.output.append(`(x${numTimesToApply})`);
        manager.output.append(".");
      }
    }
  }

  getDefenseModifiersNarration(playerState) {
    const defenseModifiers = ["turnEvasion", "turnShield"];
  }

  getOffenseModifiersNarration(playerState) {
    // 'Spellcasting chance is lowered'
  }

  counteracts(effectName) {
    if (this.effect.counteracts)
      return this.effect.counteracts.includes(effectName);
    else return false;
  }

  negates(effectName) {
    if (this.effect.negates) return this.effect.negates.includes(effectName);
    else return false;
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

export default Effect;
