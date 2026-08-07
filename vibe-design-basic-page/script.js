    const links = [...document.querySelectorAll('.toc a')];
    const sections = links
      .map(link => document.querySelector(link.getAttribute('href')))
      .filter(Boolean);

    const demoToggle = document.querySelector('#demoToggle');
    const toggleStatus = document.querySelector('#toggleStatus');
    const toggleText = demoToggle?.querySelector('.demo-toggle__text');
    const syncToggle = (isOn) => {
      demoToggle?.classList.toggle('is-on', isOn);
      demoToggle?.setAttribute('aria-pressed', String(isOn));
      if (toggleText) toggleText.textContent = isOn ? 'ON' : 'OFF';
      if (toggleStatus) toggleStatus.textContent = `当前状态：${isOn ? '开启' : '关闭'}`;
    };
    demoToggle?.addEventListener('click', () => {
      syncToggle(!demoToggle.classList.contains('is-on'));
    });
    syncToggle(false);

    const orbitDots = [...document.querySelectorAll('.formula-orbit__dot')];
    const orbitConnector = document.querySelector('.formula-orbit__connector');
    const orbitPaths = [...document.querySelectorAll('.formula-orbit__track')];
    const orbitSpeeds = [.12, .08, .16];
    const orbitOffsets = [0, .34, .68];

    const buildOrbitPath = (path) => {
      const center = {
        x: Number(path.dataset.cx),
        y: Number(path.dataset.cy),
      };
      const radius = {
        x: Number(path.dataset.rx),
        y: Number(path.dataset.ry),
      };
      const rotation = Number(path.dataset.angle) * Math.PI / 180;
      const segments = 180;
      const points = [];

      for (let i = 0; i < segments; i += 1) {
        const theta = (Math.PI * 2 * i) / segments;
        const x = radius.x * Math.cos(theta);
        const y = radius.y * Math.sin(theta);

        points.push({
          x: center.x + x * Math.cos(rotation) - y * Math.sin(rotation),
          y: center.y + x * Math.sin(rotation) + y * Math.cos(rotation),
        });
      }

      path.setAttribute(
        'd',
        points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ') + ' Z'
      );

      return path;
    };

    const orbitTracks = orbitPaths.map((path, index) => {
      const track = buildOrbitPath(path);
      return {
        path: track,
        length: track.getTotalLength(),
        speed: orbitSpeeds[index],
        offset: orbitOffsets[index],
      };
    });

    const animateFormulaOrbit = (timestamp) => {
      const time = timestamp / 1000;
      const points = orbitTracks.map(({ path, length, speed, offset }) => {
        const progress = (time * speed + offset) % 1;
        const point = path.getPointAtLength(progress * length);
        return { x: point.x, y: point.y };
      });

      orbitDots.forEach((dot, index) => {
        const point = points[index];
        dot.setAttribute('cx', point.x.toFixed(2));
        dot.setAttribute('cy', point.y.toFixed(2));
      });

      orbitConnector?.setAttribute(
        'points',
        points.map(point => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).concat(`${points[0].x.toFixed(2)},${points[0].y.toFixed(2)}`).join(' ')
      );

      requestAnimationFrame(animateFormulaOrbit);
    };

    if (orbitDots.length === orbitTracks.length && orbitConnector) {
      requestAnimationFrame(animateFormulaOrbit);
    }

    const updateActiveLink = () => {
      const scrollY = window.scrollY;
      const viewH = window.innerHeight;
      const docH = document.documentElement.scrollHeight;

      if (scrollY + viewH >= docH - 30) {
        const lastLink = links[links.length - 1];
        links.forEach(link => link.classList.toggle('active', link === lastLink));
        return;
      }

      const trigger = scrollY + viewH * 0.25;
      let current = sections[0];
      for (const section of sections) {
        if (section.offsetTop <= trigger) current = section;
      }
      links.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${current.id}`));
    };

    window.addEventListener('scroll', updateActiveLink, { passive: true });
    window.addEventListener('resize', updateActiveLink);
    updateActiveLink();
