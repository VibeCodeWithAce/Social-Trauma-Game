// main.js — Entry point, game loop

(function () {
    'use strict';

    Render.init();
    Input.init();
    Sound.init();
    State.change('title');

    // Load assets (non-blocking — game works with colored rectangles if images fail)
    loadAssets();

    let lastTime = 0;

    function loop(timestamp) {
        const dt = Math.min((timestamp - lastTime) / 1000, 0.05); // Cap at 50ms
        lastTime = timestamp;

        Input.update();
        Game.update(dt);
        Game.render();

        requestAnimationFrame(loop);
    }

    requestAnimationFrame((ts) => {
        lastTime = ts;
        requestAnimationFrame(loop);
    });
})();
