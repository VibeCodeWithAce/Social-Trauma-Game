// fighters.js — Fighter data + asset loading

const FIGHTER_DATA = [
    {
        name: 'Ghosted',
        color: '#6ec6ff',
        hp: 100,
        speed: 300,
        portrait: 'assets/portraits/ghosted.webp'
    },
    {
        name: 'Gaslighter',
        color: '#ff6b6b',
        hp: 110,
        speed: 260,
        portrait: 'assets/portraits/gaslighter.webp'
    },
    {
        name: 'Overthinker',
        color: '#c084fc',
        hp: 90,
        speed: 320,
        portrait: 'assets/portraits/overthinker.webp'
    },
    {
        name: 'Lovebomber',
        color: '#fb7185',
        hp: 95,
        speed: 300,
        portrait: 'assets/portraits/lovebomber.webp'
    },
    {
        name: 'Breadcrumber',
        color: '#fbbf24',
        hp: 100,
        speed: 340,
        portrait: 'assets/portraits/breadcrumber.webp'
    },
    {
        name: 'Stonewaller',
        color: '#94a3b8',
        hp: 130,
        speed: 220,
        portrait: 'assets/portraits/stonewaller.webp'
    }
];

// Images cache
const Portraits = {};
let BgImage = null;
let assetsLoaded = false;

function loadAssets(callback) {
    let total = FIGHTER_DATA.length + 1; // +1 for background
    let loaded = 0;

    function onDone() {
        loaded++;
        if (loaded >= total) {
            assetsLoaded = true;
            if (callback) callback();
        }
    }

    FIGHTER_DATA.forEach((f, i) => {
        const img = new Image();
        img.onload = onDone;
        img.onerror = onDone;
        img.src = f.portrait;
        Portraits[i] = img;
    });

    // Background image
    BgImage = new Image();
    BgImage.onload = onDone;
    BgImage.onerror = onDone;
    BgImage.src = 'assets/portraits/background.webp';
}
