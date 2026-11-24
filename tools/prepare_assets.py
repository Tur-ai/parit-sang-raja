#!/usr/bin/env python3
"""
Parit Sang Raja - asset preparer.
1. Membaca daftar file ASLI di ./asset batu mahpar/ (gmbr, Musik, Efek)
2. Memetakan G1..G100 -> file gambar (berdasarkan deskripsi visual nama file) dan S1..S26 -> .ogg (awalan nomor)
3. Gambar sprite aslinya punya latar abu-abu "permanen" (bukan transparan) -> dihapus (flood key / alpha-diff)
4. Sprite sheet 4-frame dipotong rapi, hasil ditulis ke ./assets/img/G{n}.webp
5. Menulis src/assetManifest.js (dibaca game saat preloading)

Jalankan:  python3 tools/prepare_assets.py
Butuh: pip install pillow numpy scipy
"""
import os, re, json
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'asset batu mahpar')
GDIR = os.path.join(SRC, 'gmbr')
OUT = os.path.join(ROOT, 'assets', 'img')
os.makedirs(OUT, exist_ok=True)

# G -> (awalan nama file setelah "scaled_", mode, frames)
# mode: bg (latar penuh) | key (hapus latar abu, tepi tajam) | soft (alpha dari selisih warna: glow/asap/partikel)
#       strict (key toleransi ketat) | tile (soft, seamless horizontal) | split (G13: kotak + plakat)
G = {
 1:('Dawn Over','bg',1), 2:('Parit Sang Raja Animated','key',4), 3:('Four-state carved','key',4),
 4:('Four-frame stone book','key',4), 5:('Stone gear','key',4), 6:('Four-Frame Stone Speaker','key',4),
 7:('Glinting Stone Scroll','key',4), 8:('Stone button tap','key',4), 9:('Four-frame glinting stone path','key',4),
 10:('Glinting Irrigation','key',4),
 11:('11_Background','bg',1), 12:('12_Penjaga','key',4), 13:('13_Kotak','split',1), 14:('14_Panah','key',4),
 15:('15_Background','strict',1), 16:('16_Penjaga','key',4), 17:('17_Ikon','key',4), 18:('18_Ikon','key',4),
 19:('20Galunggung','bg',1), 20:('23Storytelling','key',4), 21:('21Glowing','key',4), 22:('24Four-frame pixel incense','soft',4),
 23:('26Cahaya Batara','soft',4), 24:('30Sundanese Kingdom','bg',1), 25:('29Sundanese Elder Idle','key',4),
 26:('28Unfinished','bg',1), 27:('31Four-frame Sundanese carver','key',4), 28:('36Stone Chip','soft',4),
 29:('32Sunlit bamboo','bg',1), 30:('34Pixel Sundanese Woman','key',4), 31:('35Pixel water drop','soft',4),
 32:('33Pixel art stone trough','key',4), 33:('40Golden Hour','bg',1), 34:('25Four-frame Indonesian guardian','key',4),
 35:('39Water-to-rock','key',4), 36:('37Four-frame sparkling','soft',4), 37:('41Starless','bg',1),
 38:('45Four-frame Sundanese guardian','key',4), 39:('47Sundanese Stone Carver Idle','key',4),
 40:('48Pixel art stone buttons','key',4), 41:('46Four-frame golden spark','key',4), 42:('44Broken Irrigation','bg',1),
 43:('42Golden magic burst','soft',4), 44:('52Drought','bg',1), 45:('53Worried','key',4), 46:('51Sundanese Carver','key',4),
 47:('49Bobbing empty','key',4), 48:('50Bamboo Tube','key',4), 49:('56Sunlit Sundanese Mountain','bg',1),
 50:('55Exhausted','key',4), 51:('60Stone carver','key',4), 52:('57Trembling','key',4), 53:('61Four-Frame Pixel Sweat','soft',4),
 54:('59Cracking','key',4), 55:('54Carved Stone Altar','bg',1), 56:('62Four Stone Scoreboards','key',4),
 57:('58Four-stage golden star','key',4), 58:('71Morning Over','bg',1), 59:('70Sundanese Carver Hammering','key',4),
 60:('63Sundanese child','key',4), 61:('72Swaying Farmer','key',4), 62:('81Bamboo Straw','key',4),
 63:('67Stone Chisel and Mallet','key',4), 64:('75Four-frame pixel chisel','soft',4), 65:('66Four-stage pixel stone trench','key',4),
 66:('65Pixel art stone water trench','key',4), 67:('73Bamboo Energy','key',4), 68:('43Mossy Stone','key',4),
 69:('79Pixel warning','key',4), 70:('84Dizzy spiral and orbiting','key',4), 71:('82Rotating gold star','key',4),
 72:('83Pulsing golden star','soft',4), 73:('88Sundanese Sunset','bg',1), 74:('87Sundanese Carver','key',4),
 75:('86Sundanese Elderly','key',4), 76:('89Laughing','key',4), 77:('90Sundanese carver walking','key',4),
 78:('85Moonlit','bg',1), 79:('98Golden Sunset','bg',1), 80:('100Sundanese Elder','key',4), 81:('102Sad Sundanese','key',4),
 82:('92Four-frame Sundanese carver','key',4), 83:('95Cracked Earth','bg',1), 84:('101Sundanese elder raises','key',4),
 85:('94Startled','key',4), 86:('99Four-frame falling rock','soft',4), 87:('96Ornate stone tablet','bg',1),
 88:('97Four-frame rolling parchment','key',4), 89:('93Four-frame stone replay','key',4), 90:('91Stone house','key',4),
 91:('109Seamless pixel cloud','tile',1), 92:('111Seamless pixel mist','tile',1), 93:('104Four-frame pixel art bird','soft',4),
 94:('107Four-frame seamless water','soft',4), 95:('113Four-frame golden glint','soft',4), 96:('105Four-frame golden flame','key',4),
 97:('80Pixel moon','key',4), 98:('108Four-Frame Fading Lightning','soft',4), 99:('112Windblown','key',4),
 100:('103Festival pennant','key',4),
}
KEYTOL = {48: 62, 66: 62, 80: 52}            # toleransi flood key khusus (latar punya bayangan pucat)
SOFT_T = {53: (58, 130), 31: (34, 95), 93: (34, 95), 94: (40, 100), 28: (12, 60)}
CYAN_WASH = {48}                        # latar punya bayangan biru pucat -> ikut dihapus
SKY_FIX = {42: ((105, 140, 175), (225, 190, 150)), 83: ((58, 62, 80), (120, 108, 112))}
BADGE_FIX = {15, 16, 17, 18}   # file asli punya lencana angka kecil di pojok kiri-atas

files = sorted(os.listdir(GDIR))
def find(prefix):
    m = [f for f in files if f.startswith('scaled_' + prefix)]
    if len(m) != 1:
        raise SystemExit(f'Prefix ambigu/tidak ketemu: {prefix} -> {m}')
    return m[0]

def fix_sky(im, top, bot):
    arr = np.array(im).astype(np.int16)
    h, w, _ = arr.shape
    bgc = np.median(arr[0], axis=0)
    dist = np.abs(arr - bgc).max(axis=2)
    cand = dist <= 16
    lab, n = ndi.label(cand)
    top_labels = set(np.unique(lab[0])) - {0}
    mask = np.isin(lab, list(top_labels))
    mask = ndi.binary_dilation(mask, iterations=1)
    ys = np.where(mask.any(axis=1))[0]
    y1 = max(int(ys.max()), 1)
    t = np.clip(np.arange(h) / float(y1), 0, 1)[:, None, None]
    grad = np.array(top)[None, None, :] * (1 - t) + np.array(bot)[None, None, :] * t
    grad = np.repeat(grad, w, axis=1)
    out = np.where(mask[..., None], grad, arr)
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))

def key_alpha(rgb, mode, g=0):
    h, w, _ = rgb.shape
    arr = rgb.astype(np.int16)
    ring = np.concatenate([arr[0], arr[-1], arr[:, 0], arr[:, -1]])
    bgc = np.median(ring, axis=0)
    dist = np.abs(arr - bgc).max(axis=2)
    if g == 53:   # tetes keringat: ambil piksel jenuh/gelap saja, bayangan segitiga pucat dibuang
        br0 = arr[..., 2] - arr[..., 0]
        lum0 = arr.mean(axis=2)
        a = np.maximum.reduce([np.clip((br0 - 62) / 18.0, 0, 1), np.clip((-br0 - 40) / 20.0, 0, 1),
                               np.clip((135 - lum0) / 40.0, 0, 1)])
        cw_ = a.shape[1] // 4
        yy, xx = np.mgrid[0:a.shape[0], 0:cw_]
        for f_ in range(4):
            cell = a[:, f_ * cw_:(f_ + 1) * cw_]
            dm = (lum0[:, f_ * cw_:(f_ + 1) * cw_] < 135)
            if dm.sum() < 30:
                cell[:] = 0; continue
            ys_, xs_ = np.where(dm)
            cy_, cx_ = np.median(ys_), np.median(xs_)
            rr = np.hypot(yy - cy_, xx - cx_)
            cell *= np.clip((150 - rr) / 12.0, 0, 1)
        a = ndi.gaussian_filter(a, 0.6)
        return np.dstack([rgb, (np.clip(a, 0, 1) * 255).astype(np.uint8)])
    if mode in ('soft', 'tile'):
        d0, d1 = SOFT_T.get(g, (9, 67))
        a = np.clip((dist - d0) / float(d1 - d0), 0, 1)
        aa = np.maximum(a, 1e-3)[..., None]
        col = (arr - bgc * (1 - aa)) / aa
        out = np.zeros((h, w, 4), np.float32)
        out[..., :3] = np.clip(col, 0, 255)
        out[..., 3] = a * 255
        return out.astype(np.uint8)
    sat = arr.max(axis=2) - arr.min(axis=2)
    lum = arr.mean(axis=2)
    if mode == 'strict':
        cand = dist <= 20
    else:
        tol = KEYTOL.get(g, 30)
        cand = (dist <= tol) | ((sat <= 16) & (lum >= 150) & (dist <= 70))
        if g in CYAN_WASH:
            br = arr[..., 2] - arr[..., 0]
            wash = (lum > 160) & (br >= 4) & (br <= 62)
            cand |= wash
    lab, n = ndi.label(cand)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bgmask = np.isin(lab, list(border))
    if g in CYAN_WASH:
        bgmask |= wash
    fg = ~bgmask
    fg = ndi.binary_opening(fg, iterations=1)
    lab2, n2 = ndi.label(fg)
    if n2:
        sizes = ndi.sum(fg, lab2, range(1, n2 + 1))
        fg = np.isin(lab2, [i + 1 for i, s in enumerate(sizes) if s >= 40])
    fg = ndi.binary_erosion(fg, iterations=1)
    alpha = ndi.gaussian_filter(fg.astype(np.float32), 0.7)
    alpha = np.clip((alpha - 0.25) / 0.5, 0, 1)
    return np.dstack([rgb, (alpha * 255).astype(np.uint8)])

def trim_frames(img, frames, pad=2, only_v=False, robust=False):
    a = np.array(img)[..., 3]
    h, w = a.shape
    cw = w // frames
    x0, x1, y0, y1 = cw, 0, h, 0
    for f in range(frames):
        sub = a[:, f * cw:(f + 1) * cw] > 20
        if robust:   # abaikan serat/noktah tipis sisa latar (mis. garis bayangan di bawah tombol)
            sub = sub & (ndi.uniform_filter(sub.astype(np.float32), size=(1, 9)) > 0.6) & \
                        (ndi.uniform_filter(sub.astype(np.float32), size=(9, 1)) > 0.6)
        if sub.any():
            ys, xs = np.where(sub)
            x0, x1 = min(x0, xs.min()), max(x1, xs.max())
            y0, y1 = min(y0, ys.min()), max(y1, ys.max())
    x0, x1, y0, y1 = int(x0), int(x1), int(y0), int(y1)
    if x1 <= x0:
        return img, cw, h
    if only_v:
        x0, x1 = 0, cw - 1
    x0 = max(0, x0 - pad); x1 = min(cw - 1, x1 + pad); y0 = max(0, y0 - pad); y1 = min(h - 1, y1 + pad)
    nw = int(x1 - x0 + 1)
    out = Image.new('RGBA', (nw * frames, y1 - y0 + 1))
    for f in range(frames):
        out.paste(img.crop((f * cw + x0, y0, f * cw + x1 + 1, y1 + 1)), (f * nw, 0))
    return out, int(nw), int(y1 - y0 + 1)

manifest = {}
for g in range(1, 101):
    prefix, mode, frames = G[g]
    fn = find(prefix)
    im = Image.open(os.path.join(GDIR, fn)).convert('RGB')
    W, H = im.size
    meta = dict(file=fn, mode=mode)
    if mode == 'bg':
        if g in SKY_FIX:   # sumber punya "langit" abu-abu polos (latar transparan palsu) -> ganti gradasi langit
            im = fix_sky(im, *SKY_FIX[g])
        im.save(os.path.join(OUT, f'G{g}.webp'), quality=90, method=5)
        meta.update(path=f'assets/img/G{g}.webp', w=W, h=H, frames=1, fw=W, fh=H)
    elif mode == 'split':
        rgba = Image.fromarray(key_alpha(np.array(im), 'key'))
        a = np.array(rgba)[..., 3] > 30
        lab, n = ndi.label(ndi.binary_dilation(a, iterations=3))
        objs = ndi.find_objects(lab)
        sizes = [(o[0].stop - o[0].start) * (o[1].stop - o[1].start) for o in objs]
        order = np.argsort(sizes)[::-1]
        big, o2 = objs[order[0]], objs[order[1]]
        box = rgba.crop((big[1].start, big[0].start, big[1].stop, big[0].stop))
        box.save(os.path.join(OUT, 'G13.webp'), lossless=True)
        pl = rgba.crop((o2[1].start, o2[0].start, o2[1].stop, o2[0].stop))
        pl.save(os.path.join(OUT, 'G13_plaque.webp'), lossless=True)
        meta.update(path='assets/img/G13.webp', w=box.width, h=box.height, frames=1, fw=box.width, fh=box.height,
                    plaque=dict(path='assets/img/G13_plaque.webp', w=pl.width, h=pl.height))
    else:
        arr = np.array(im)
        if g in BADGE_FIX:
            bgc = np.median(np.concatenate([arr[0, 100:], arr[:, -1]]), axis=0).astype(np.uint8)
            reg = arr[:90, :130].astype(np.int16)
            dark = (reg.mean(axis=2) < 110)
            lab_b, nb = ndi.label(dark, structure=np.ones((3, 3)))
            for o in ndi.find_objects(lab_b):
                h_, w_ = o[0].stop - o[0].start, o[1].stop - o[1].start
                if o[0].start <= 40 and o[1].start <= 40 and w_ < 100 and h_ < 80 and w_ > 12:
                    arr[max(0, o[0].start - 4):o[0].stop + 4, max(0, o[1].start - 4):o[1].stop + 4] = bgc
        rgba = Image.fromarray(key_alpha(arr, mode, g))
        if mode == 'tile':
            out, fw, fh = trim_frames(rgba, 1, pad=0, only_v=True)
        else:
            out, fw, fh = trim_frames(rgba, frames, robust=(mode == 'key'))
        out.save(os.path.join(OUT, f'G{g}.webp'), lossless=True, method=4)
        meta.update(path=f'assets/img/G{g}.webp', w=out.width, h=out.height, frames=frames, fw=fw, fh=fh)
    manifest[f'G{g}'] = meta
    print(f'G{g:<3} {meta["w"]}x{meta["h"]}  f={meta["frames"]:<2} {mode:6} <- {fn}')

sfx = {}
for sub, kind in (('Musik - unknown album', 'bgm'), ('Efek - unknown album', 'sfx')):
    for f in sorted(os.listdir(os.path.join(SRC, sub))):
        m = re.match(r'(\d+)', f)
        if not m or not f.endswith('.ogg'):
            continue
        n = int(m.group(1))
        sfx[f'S{n}'] = dict(file=f'{sub}/{f}', kind=kind, loop=('loop' in f.lower()), name=re.sub(r'^\d+ - ', '', f[:-4]))
assert len(sfx) == 26, len(sfx)

js = '/* DIBUAT OTOMATIS oleh tools/prepare_assets.py - jangan edit manual */\n'
js += 'export const IMAGES = ' + json.dumps(manifest, indent=1, ensure_ascii=False) + ';\n\n'
js += 'export const AUDIO = ' + json.dumps(sfx, indent=1, ensure_ascii=False) + ';\n'
open(os.path.join(ROOT, 'src', 'assetManifest.js'), 'w', encoding='utf-8').write(js)
print('OK: manifest ditulis, 100 gambar + 26 audio')
