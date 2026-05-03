// input.js — Keyboard + touch input

const Input = {
    keys: {},
    justPressed: {},
    _prevKeys: {},

    init() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            e.preventDefault();
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            e.preventDefault();
        });

        // Detect touch device
        if ('ontouchstart' in window) {
            document.body.classList.add('touch-enabled');
            this._initTouch();
        }
    },

    update() {
        for (const code in this.keys) {
            this.justPressed[code] = this.keys[code] && !this._prevKeys[code];
        }
        this._prevKeys = { ...this.keys };
    },

    isDown(code) {
        return !!this.keys[code];
    },

    pressed(code) {
        return !!this.justPressed[code];
    },

    _initTouch() {
        const mapDir = { left: 'ArrowLeft', right: 'ArrowRight' };
        const mapAction = { shoot: 'Space' };

        document.querySelectorAll('.dpad-btn').forEach(btn => {
            const code = mapDir[btn.dataset.dir];
            if (!code) return;
            btn.addEventListener('touchstart', (e) => { e.preventDefault(); this.keys[code] = true; });
            btn.addEventListener('touchend', (e) => { e.preventDefault(); this.keys[code] = false; });
            btn.addEventListener('touchcancel', (e) => { e.preventDefault(); this.keys[code] = false; });
        });

        document.querySelectorAll('.action-btn').forEach(btn => {
            const code = mapAction[btn.dataset.action];
            if (!code) return;
            btn.addEventListener('touchstart', (e) => { e.preventDefault(); this.keys[code] = true; });
            btn.addEventListener('touchend', (e) => { e.preventDefault(); this.keys[code] = false; });
            btn.addEventListener('touchcancel', (e) => { e.preventDefault(); this.keys[code] = false; });
        });
    }
};
