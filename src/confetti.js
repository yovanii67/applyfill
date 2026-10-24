(function (root) {
  function burst(doc) {
    const documentRef = doc || document;
    const view = documentRef.defaultView || window;
    if (view.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return false;
    const parent = documentRef.body || documentRef.documentElement;
    if (!parent) return false;
    documentRef.getElementById("applyfill-confetti")?.remove();

    const canvas = documentRef.createElement("canvas");
    canvas.id = "applyfill-confetti";
    canvas.setAttribute("aria-hidden", "true");
    canvas.width = view.innerWidth || 1280;
    canvas.height = view.innerHeight || 800;
    canvas.style.cssText = [
      "position:fixed",
      "inset:0",
      "width:100vw",
      "height:100vh",
      "pointer-events:none",
      "z-index:2147483647",
    ].join(";");
    parent.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    const colors = ["#e8a054", "#f0c27a", "#7dcea0", "#f1948a", "#f7dc6f", "#85c1e9", "#fffdf9", "#2f9e5a"];
    const pieces = Array.from({ length: 150 }, () => ({
      x: Math.random() * canvas.width,
      y: -24 - Math.random() * canvas.height * 0.45,
      vx: -2.4 + Math.random() * 4.8,
      vy: 2.2 + Math.random() * 3.4,
      rot: Math.random() * Math.PI,
      vr: -0.22 + Math.random() * 0.44,
      w: 6 + Math.random() * 7,
      h: 8 + Math.random() * 8,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    let frame = 0;
    function tick() {
      frame += 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const piece of pieces) {
        piece.x += piece.vx;
        piece.y += piece.vy;
        piece.vy += 0.045;
        piece.rot += piece.vr;
        ctx.save();
        ctx.translate(piece.x, piece.y);
        ctx.rotate(piece.rot);
        ctx.fillStyle = piece.color;
        ctx.fillRect(-piece.w / 2, -piece.h / 2, piece.w, piece.h);
        ctx.restore();
      }
      if (frame < 170) view.requestAnimationFrame(tick);
      else canvas.remove();
    }
    view.requestAnimationFrame(tick);
    return true;
  }

  root.ApplyFillConfetti = { burst };
})(typeof globalThis !== "undefined" ? globalThis : window);
