/* Optical Flat Simulator (45° AOI) */
(function () {
    const canvas = document.getElementById('viewport');
    const ctx = canvas.getContext('2d');

    const riSlider = document.getElementById('ri');
    const riNumber = document.getElementById('riNumber');
    const tSlider = document.getElementById('thickness');
    const tNumber = document.getElementById('thicknessNumber');
    const resultEl = document.getElementById('result');

    const width = canvas.width;
    const height = canvas.height;

    const deg2rad = (deg) => deg * Math.PI / 180;
    const rad2deg = (rad) => rad * 180 / Math.PI;

    // Fixed AOI = 45° relative to surface normal at first interface
    const incidenceAngleDeg = 45;
    const incidenceAngleRad = deg2rad(incidenceAngleDeg);
    const pxPerMm = 6; // Fixed rendering scale; not user-facing.

    // Incoming light perpendicular to X-axis => vertical downwards
    const dIn = { x: 0, y: 1 };

    // Surface normal (first surface) rotated +45° from vertical towards +X so that i = 45°
    const nHat = normalize({ x: Math.sin(incidenceAngleRad), y: Math.cos(incidenceAngleRad) });
    const tHat = { x: -nHat.y, y: nHat.x }; // tangential unit vector (surface direction)

    // Helpers
    function dot(a, b) { return a.x * b.x + a.y * b.y; }
    function add(a, b) { return { x: a.x + b.x, y: a.y + b.y }; }
    function sub(a, b) { return { x: a.x - b.x, y: a.y - b.y }; }
    function mul(v, s) { return { x: v.x * s, y: v.y * s }; }
    function len(v) { return Math.hypot(v.x, v.y); }
    function normalize(v) { const l = len(v) || 1; return { x: v.x / l, y: v.y / l }; }

    function syncInputs(a, b) {
        a.addEventListener('input', () => { b.value = a.value; draw(); });
        b.addEventListener('input', () => { a.value = b.value; draw(); });
    }

    syncInputs(riSlider, riNumber);
    syncInputs(tSlider, tNumber);

    function drawPlate(ctx, c1, c2, colorFill = '#f6f6f7', colorEdge = '#999') {
        // Build a wide quad between two parallel lines defined by nHat·p = c1 and c2
        const L = 2000; // half-length along the plate
        const p1 = mul(nHat, c1);
        const p2 = mul(nHat, c2);
        const a = add(p1, mul(tHat, -L));
        const b = add(p1, mul(tHat, +L));
        const c = add(p2, mul(tHat, +L));
        const d = add(p2, mul(tHat, -L));

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.lineTo(c.x, c.y);
        ctx.lineTo(d.x, d.y);
        ctx.closePath();
        ctx.fillStyle = colorFill;
        ctx.fill();
        ctx.strokeStyle = colorEdge;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
    }

    function drawArrow(ctx, p0, p1, options = {}) {
        const { color = '#e74c3c', width = 2, head = 8 } = options;
        ctx.save();
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();
        const v = sub(p1, p0);
        const u = normalize(v);
        const left = add(p1, add(mul(u, -head), mul({ x: -u.y, y: u.x }, head * 0.6)));
        const right = add(p1, add(mul(u, -head), mul({ x: u.y, y: -u.x }, head * 0.6)));
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(left.x, left.y);
        ctx.lineTo(right.x, right.y);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    function draw() {
        const n = Math.max(1.0, parseFloat(riNumber.value));
        const tMm = Math.min(10, Math.max(0.3, parseFloat(tNumber.value)));
        tNumber.value = tMm.toFixed(1);
        tSlider.value = tMm.toFixed(1);

        const tPx = tMm * pxPerMm; // separation along normal between surfaces

        // Compute plate surfaces centered around canvas center
        const center = { x: width * 0.5, y: height * 0.5 };
        const cMid = dot(center, nHat);
        const c1 = cMid - tPx * 0.5;
        const c2 = cMid + tPx * 0.5;

        // Clear background (white)
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        // Draw plate
        drawPlate(ctx, c1, c2);

        // Choose incoming ray x-position so that intersection is nicely on-canvas
        let xIn = width * 0.35;
        let yEntry = (c1 - nHat.x * xIn) / nHat.y;
        if (yEntry < 20 || yEntry > height - 20) {
            const targetY = height * 0.2;
            xIn = (c1 - nHat.y * targetY) / nHat.x;
            yEntry = (c1 - nHat.x * xIn) / nHat.y;
        }
        const pTop = { x: xIn, y: 0 };
        const pEntry = { x: xIn, y: yEntry };

        // Inside angle via Snell's law: sin r = sin i / n
        const sinI = Math.sin(incidenceAngleRad);
        const sinR = Math.min(1, sinI / n);
        const r = Math.asin(sinR);
        const cosR = Math.cos(r);

        // Determine tangential direction sign from incident ray
        const tangentialSign = Math.sign(dot(dIn, tHat)) || 1;

        // Build inside direction at angle r to normal, moving towards second surface (positive along nHat)
        const dInside = normalize(add(mul(tHat, tangentialSign * Math.sin(r)), mul(nHat, cosR)));

        // Travel from entry to exit (intersection with second surface)
        const dotEntry = dot(pEntry, nHat);
        const denom = dot(dInside, nHat); // should equal cosR
        const sToExit = (c2 - dotEntry) / (denom || 1e-6);
        const pExit = add(pEntry, mul(dInside, sToExit));

        // Outgoing ray is parallel to incoming for a parallel plate (same external medium)
        const xOut = pExit.x;
        const pBottom = { x: xOut, y: height };

        // Draw rays
        drawArrow(ctx, pTop, pEntry, { color: '#2c3e50' });
        drawArrow(ctx, pEntry, pExit, { color: '#2c3e50' });
        drawArrow(ctx, pExit, pBottom, { color: '#2c3e50' });

        // Draw surface normals at midpoints for visual reference
        drawNormalMarker(c1);
        drawNormalMarker(c2);

        // Lateral shift (perpendicular to beam) equals horizontal delta for vertical beam
        const shiftPx = xOut - xIn;
        const shiftMm = shiftPx / pxPerMm;

        // Display result (only mm)
        resultEl.textContent = `Light Shift: ${shiftMm.toFixed(3)} mm`;

        // Draw a clear shift marker (guides + double-headed arrow + label).
        ctx.save();
        ctx.strokeStyle = '#e67e22';
        ctx.fillStyle = '#e67e22';
        ctx.lineWidth = 1.8;
        const yMeas = Math.min(Math.max(pExit.y + 42, 48), height - 24);

        // Dashed guides from each ray to the measurement line.
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(xIn, pEntry.y);
        ctx.lineTo(xIn, yMeas);
        ctx.moveTo(xOut, pExit.y);
        ctx.lineTo(xOut, yMeas);
        ctx.stroke();
        ctx.setLineDash([]);

        // Double-headed arrow indicating shift distance.
        const head = 8;
        ctx.beginPath();
        ctx.moveTo(xIn, yMeas);
        ctx.lineTo(xOut, yMeas);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(xIn, yMeas);
        ctx.lineTo(xIn + head, yMeas - head * 0.6);
        ctx.lineTo(xIn + head, yMeas + head * 0.6);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(xOut, yMeas);
        ctx.lineTo(xOut - head, yMeas - head * 0.6);
        ctx.lineTo(xOut - head, yMeas + head * 0.6);
        ctx.closePath();
        ctx.fill();

        // Label centered above measurement arrow.
        ctx.font = '12px system-ui, -apple-system, Segoe UI, Roboto, Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`Shift = ${shiftMm.toFixed(3)} mm`, (xIn + xOut) / 2, yMeas - 7);
        ctx.restore();

        function drawNormalMarker(c) {
            // mark a short normal centered at middle of canvas intersection with the line
            const pCenter = mul(nHat, c);
            const start = add(pCenter, mul(nHat, -16));
            const end = add(pCenter, mul(nHat, +16));
            ctx.save();
            ctx.strokeStyle = '#95a5a6';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
            ctx.restore();
        }
    }

    // Initial draw
    draw();
})();


