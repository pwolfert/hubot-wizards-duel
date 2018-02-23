import Effects      from '../../src/wizards-duel/effects';
import Spells       from '../../src/wizards-duel/spells';
import Player       from '../../src/wizards-duel/player';
import Manager      from '../../src/wizards-duel/manager';

window.Effects = Effects;
window.Spells = Spells;
window.Player = Player;
window.Manager = Manager;

(() => {
  const onLoad = () => {
    var manager = new Manager({
      brain: {},
      hear: () => {},
    });

    const hitForm = document.querySelector('#hit-calculation');
    const hitResult = document.querySelector('#hit-result');

    hitForm.addEventListener('submit', (event) => {
      var player = new Player(manager, Player.getInitialState('alice', true, 'bob'));
      player.state.turnAccuracy = parseFloat(hitForm.accuracy.value);
      player.state.turnPain = parseFloat(hitForm.playerPain.value);

      var opponentState = Player.getInitialState('bob', false, 'alice');
      opponentState.turnEvasion = parseFloat(hitForm.evasion.value);
      opponentState.turnPain = parseFloat(hitForm.opponentPain.value);

      manager.getPlayerState = () => {
        return opponentState;
      };

      var hit = player.spellHitTarget(Spells.create({}));
      hitResult.innerHTML = hit ? 'Hit!' : 'Miss!';

      event.preventDefault();
    });

    const castForm = document.querySelector('#cast-calculation');
    const castResult = document.querySelector('#cast-result');

    castForm.addEventListener('submit', (event) => {
      var player = new Player(manager, Player.getInitialState('alice', true, 'bob'));
      player.state.turnSpellcasting = parseFloat(castForm.spellcasting.value);
      player.state.turnPain = parseFloat(castForm.pain.value);

      var cast = player.spellSucceeded(Spells.create({
        baseSuccessRate: parseFloat(castForm.baseSuccessRate.value)
      }));
      castResult.innerHTML = cast ? 'Success!' : 'Failure!';

      event.preventDefault();
    });
  };

  // Only initialize if the document has been loaded
  if (document.readyState !== 'loading')
    onLoad();
  else
    document.addEventListener('DOMContentLoaded', onLoad);
})();
