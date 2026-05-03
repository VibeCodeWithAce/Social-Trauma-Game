// input.js — Keyboard + touch input

const Input = {
    keys: {},
    justPressed: {},
    _prevKeys: {},
    isTouch: false,

    init() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            e.preventDefault();
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            e.preventDefault();
        });

        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
            this.isTouch = true;
            document.body.classList.add('touch-enabled');
            this._initTouchControls();
            this._initTouchMenu();
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

    // ── Fight screen touch controls (dpad + fire) ──
    _initTouchControls() {
        const mapDir = { left: 'ArrowLeft', right: 'ArrowRight' };
        const mapAction = { shoot: 'Space' };

        document.querySelectorAll('.touch-dir').forEach(btn => {
            const code = mapDir[btn.dataset.dir];
            if (!code) return;
            btn.addEventListener('touchstart', (e) => { e.preventDefault(); this.keys[code] = true; }, { passive: false });
            btn.addEventListener('touchend', (e) => { e.preventDefault(); this.keys[code] = false; }, { passive: false });
            btn.addEventListener('touchcancel', (e) => { e.preventDefault(); this.keys[code] = false; }, { passive: false });
        });

        document.querySelectorAll('.touch-action').forEach(btn => {
            const code = mapAction[btn.dataset.action];
            if (!code) return;
            btn.addEventListener('touchstart', (e) => { e.preventDefault(); this.keys[code] = true; }, { passive: false });
            btn.addEventListener('touchend', (e) => { e.preventDefault(); this.keys[code] = false; }, { passive: false });
            btn.addEventListener('touchcancel', (e) => { e.preventDefault(); this.keys[code] = false; }, { passive: false });
        });
    },

    // ── Menu screens: tap to confirm, swipe left/right to navigate select ──
    _initTouchMenu() {
        const menu = document.getElementById('touch-menu');
        let startX = 0;
        let startY = 0;
        let moved = false;

        menu.addEventListener('touchstart', (e) => {
            e.preventDefault();
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            moved = false;
        }, { passive: false });

        menu.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const dx = e.touches[0].clientX - startX;
            const dy = e.touches[0].clientY - startY;
            if (Math.abs(dx) > 30 || Math.abs(dy) > 30) moved = true;
        }, { passive: false });

        menu.addEventListener('touchend', (e) => {
            e.preventDefault();
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            const dx = endX - startX;
            const dy = endY - startY;

            if (State.current === 'select' && Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
                // Horizontal swipe — navigate characters
                if (dx > 0) {
                    this.keys['ArrowRight'] = true;
                    setTimeout(() => { this.keys['ArrowRight'] = false; }, 50);
                } else {
                    this.keys['ArrowLeft'] = true;
                    setTimeout(() => { this.keys['ArrowLeft'] = false; }, 50);
                }
            } else if (State.current === 'select' && Math.abs(dy) > 40 && Math.abs(dy) > Math.abs(dx)) {
                // Vertical swipe — navigate rows
                if (dy > 0) {
                    this.keys['ArrowDown'] = true;
                    setTimeout(() => { this.keys['ArrowDown'] = false; }, 50);
                } else {
                    this.keys['ArrowUp'] = true;
                    setTimeout(() => { this.keys['ArrowUp'] = false; }, 50);
                }
            } else if (!moved) {
                // Simple tap — acts as Enter
                this.keys['Enter'] = true;
                setTimeout(() => { this.keys['Enter'] = false; }, 50);
            }
        }, { passive: false });
    }
};
