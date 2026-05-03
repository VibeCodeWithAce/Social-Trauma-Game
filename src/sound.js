// sound.js — Retro arcade sounds via Web Audio API

const Sound = {
    _ctx: null,
    _muted: false,
    _vol: 0.3,

    init() {
        // Create audio context on first user interaction
        const unlock = () => {
            if (!this._ctx) {
                this._ctx = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (this._ctx.state === 'suspended') {
                this._ctx.resume();
            }
        };
        window.addEventListener('keydown', unlock, { once: false });
        window.addEventListener('touchstart', unlock, { once: false });
    },

    _tone(freq, duration, type, volume, slide) {
        if (this._muted || !this._ctx) return;
        const ctx = this._ctx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type || 'square';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        if (slide) {
            osc.frequency.linearRampToValueAtTime(slide, ctx.currentTime + duration);
        }
        gain.gain.setValueAtTime((volume || 1) * this._vol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
    },

    _noise(duration, volume) {
        if (this._muted || !this._ctx) return;
        const ctx = this._ctx;
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime((volume || 0.3) * this._vol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        source.connect(gain);
        gain.connect(ctx.destination);
        source.start(ctx.currentTime);
    },

    // ── Game sounds ──

    shoot() {
        // Classic laser pew — high pitch slide down
        this._tone(900, 0.08, 'square', 0.4, 400);
    },

    enemyShoot() {
        // Lower, softer pew
        this._tone(300, 0.1, 'sawtooth', 0.2, 150);
    },

    hit() {
        // Enemy hit — short crunch
        this._noise(0.08, 0.4);
        this._tone(400, 0.06, 'square', 0.3, 200);
    },

    explode() {
        // Enemy destroyed — boom
        this._noise(0.25, 0.5);
        this._tone(150, 0.2, 'sawtooth', 0.4, 40);
    },

    playerHit() {
        // Player takes damage — low thud + buzz
        this._noise(0.15, 0.5);
        this._tone(120, 0.2, 'square', 0.5, 60);
    },

    select() {
        // Menu navigate — short blip
        this._tone(660, 0.06, 'square', 0.3);
    },

    confirm() {
        // Menu confirm — two-tone rise
        this._tone(520, 0.08, 'square', 0.35);
        setTimeout(() => this._tone(780, 0.12, 'square', 0.35), 80);
    },

    gameOver() {
        // Descending sad tones
        this._tone(440, 0.25, 'square', 0.4);
        setTimeout(() => this._tone(370, 0.25, 'square', 0.4), 250);
        setTimeout(() => this._tone(310, 0.25, 'square', 0.4), 500);
        setTimeout(() => this._tone(220, 0.5, 'sawtooth', 0.35), 750);
    },

    levelUp() {
        // Quick ascending arpeggio
        this._tone(520, 0.1, 'square', 0.3);
        setTimeout(() => this._tone(660, 0.1, 'square', 0.3), 80);
        setTimeout(() => this._tone(880, 0.15, 'square', 0.35), 160);
    }
};
