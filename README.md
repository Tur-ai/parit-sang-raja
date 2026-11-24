# Parit Sang Raja

Game web 2D (HTML5 + PixiJS v8 + micro-engine sendiri, ES Modules). 20 adegan, 3 level, 3 ending.

## Menjalankan (wajib lewat server lokal, bukan klik ganda index.html)
    python3 serve.py            # lalu buka http://localhost:8000
    # atau: npx serve -l 8000 .
Debug adegan tertentu: http://localhost:8000/?scene=16

## Struktur
- `index.html`, `style.css`, `serve.py`, `vendor/pixi.min.js` (PixiJS lokal, tanpa CDN)
- `src/engine/` GameLoop, SceneManager, Renderer (5 layer + letterbox 1280x720), AudioManager, DialogSystem, SpriteAnimator, AmbientFX, Tween, UI
- `src/scenes/` Adegan 1-20 | `src/data/script.js` naskah, teks Tentang, KREDIT/LISENSI
- `src/assetManifest.js` pemetaan G1-G100 dan S1-S26 (dibuat otomatis)
- `tools/prepare_assets.py` memproses gambar asli -> `assets/img/*.webp` (menghapus latar abu-abu, memotong sprite sheet 4 frame)
  Jalankan ulang bila gambar di `asset batu mahpar/` diganti: `pip install pillow numpy scipy && python3 tools/prepare_assets.py`

## Catatan
- Lisensi audio TIDAK ada di metadata file; ubah teks `CREDITS.license` di `src/data/script.js`.
- Audio .ogg: Safari lama mungkin tidak memutarnya.
- Level 3: kalau parit selesai tetapi bintang < 3 -> Ending 2 (spesifikasi tidak mengatur kasus ini).
