import { GameLoop } from './engine/GameLoop.js';
import { Tweens } from './engine/Tween.js';
import { Assets } from './engine/Assets.js';
import { AudioManager } from './engine/AudioManager.js';
import { Renderer } from './engine/Renderer.js';
import { Input } from './engine/Input.js';
import { DialogSystem } from './engine/DialogSystem.js';
import { SceneManager } from './engine/SceneManager.js';
import { iconButton } from './engine/UI.js';
import { Scene1, Scene2, Scene3 } from './scenes/menu.js';
import * as L1 from './scenes/level1.js';
import * as L2 from './scenes/level2.js';
import { Scene16 } from './scenes/level3.js';
import { Scene17, Scene18, Scene19, Scene20 } from './scenes/endings.js';

const bar = document.getElementById('bar'), loading = document.getElementById('loading');
const setProg = p => { bar.style.width = Math.round(p * 100) + '%'; };

async function boot() {
  const game = { state: { poin: 0, lastLevel: 1 } };
  game.assets = new Assets();
  game.audio = new AudioManager();
  game.tweens = new Tweens();
  game.renderer = new Renderer();
  await game.renderer.init(document.getElementById("stage"), game.assets);
  await game.assets.loadImages(setProg);
  await game.assets.loadAudio(game.audio, setProg);
  game.renderer.assets = game.assets;
  game.input = new Input(game.renderer, game.audio);
  game.dialog = new DialogSystem(game);
  game.scenes = new SceneManager(game);

  const S = { 1: Scene1, 2: Scene2, 3: Scene3, 4: L1.Scene4, 5: L1.Scene5, 6: L1.Scene6, 7: L1.Scene7, 8: L1.Scene8, 9: L1.Scene9, 10: L1.Scene10,
    11: L2.Scene11, 12: L2.Scene12, 13: L2.Scene13, 14: L2.Scene14, 15: L2.Scene15, 16: Scene16, 17: Scene17, 18: Scene18, 19: Scene19, 20: Scene20 };
  for (const id in S) game.scenes.register(+id, S[id]);

  // tombol mute global (selalu tampil)
  const mute = iconButton(game, 'G6', { size: 58, sfx: false, onClick: () => { game.audio.toggleAll(); sync(); } });
  mute.position.set(1236, 40);
  const sync = () => { mute.anim.stop(); mute.anim.setFrame(game.audio.allMuted ? 0 : 3); mute.alpha = game.audio.allMuted ? 0.55 : 0.95; };
  sync(); game.renderer.hud.addChild(mute);

  const loop = new GameLoop(dt => {
    game.tweens.update(dt); game.scenes.update(dt); game.dialog.update(dt); game.renderer.update(dt);
  }, () => game.renderer.render());
  loop.start();
  window.game = game; // untuk debugging

  loading.classList.add('hide');
  setTimeout(() => loading.remove(), 600);
  const start = new URLSearchParams(location.search).get('scene');
  game.scenes.go(start ? +start : 1, {}, { fade: 0.6 });
}
boot().catch(e => { console.error(e); document.getElementById('msg').textContent = 'Gagal memuat: ' + e.message; });
