const toc = document.querySelector('#toc-list');
const headings = [...document.querySelectorAll('.doc-content h2, .doc-content .component-section-heading')];

const formatIndex = (index) => String(index).padStart(2, '0');
const stripHeadingNumber = (text) => text.replace(/^\s*\d+(?:\.\d+)*\.?\s*/, '');

headings.forEach((heading, index) => {
  const id = `section-${index + 1}`;
  heading.id = id;

  const sectionNumber = formatIndex(index + 1);

  if (heading.tagName === 'H2') {
    heading.dataset.section = heading.dataset.sectionLabel || `${sectionNumber} / GUIDE`;
  }

  const link = document.createElement('a');
  const indexLabel = document.createElement('span');
  const textLabel = document.createElement('span');

  link.href = `#${id}`;
  link.dataset.level = '2';
  indexLabel.textContent = sectionNumber;
  textLabel.textContent = heading.dataset.tocLabel || stripHeadingNumber(heading.textContent);

  link.append(indexLabel, textLabel);
  toc?.appendChild(link);
});

const links = [...document.querySelectorAll('.toc a')];

const updateActiveLink = () => {
  if (!links.length || !headings.length) return;

  const scrollY = window.scrollY;
  const viewH = window.innerHeight;
  const docH = document.documentElement.scrollHeight;

  if (scrollY + viewH >= docH - 30) {
    const lastLink = links[links.length - 1];
    links.forEach((link) => link.classList.toggle('active', link === lastLink));
    return;
  }

  const trigger = scrollY + viewH * 0.25;
  let current = headings[0];

  headings.forEach((heading) => {
    if (heading.offsetTop <= trigger) current = heading;
  });

  links.forEach((link) => {
    link.classList.toggle('active', link.getAttribute('href') === `#${current.id}`);
  });
};

window.addEventListener('scroll', updateActiveLink, { passive: true });
window.addEventListener('resize', updateActiveLink);
updateActiveLink();

const mapLayouts = [...document.querySelectorAll('.folder-map-layout')];
const selectedFlowSteps = new WeakMap();

const getLayoutParts = (layout) => ({
  flow: layout.querySelector('.maintenance-flow'),
  steps: [...layout.querySelectorAll('.maintenance-flow button[data-highlight]')],
  nodes: [...layout.querySelectorAll('[data-map-node]')],
});

const clearMapHighlight = (layout) => {
  const { flow, steps, nodes } = getLayoutParts(layout);

  layout.classList.remove('is-filtering');
  flow?.classList.remove('is-counts-lit');
  steps.forEach((step) => {
    step.classList.remove('is-active', 'is-selected');
    step.setAttribute('aria-pressed', 'false');
  });
  nodes.forEach((node) => {
    node.classList.remove('is-map-highlighted', 'has-map-highlight');
  });
};

const highlightMapNodes = (step, options = {}) => {
  const layout = step.closest('.folder-map-layout');
  if (!layout) return;

  const { flow, nodes } = getLayoutParts(layout);
  clearMapHighlight(layout);
  const skipMapHighlight = step.dataset.noMapHighlight === 'true';

  if (skipMapHighlight) {
    flow?.classList.add('is-counts-lit');
    step.classList.add('is-active');
    if (options.persist) selectedFlowSteps.set(layout, step);
    if (options.persist) {
      step.classList.add('is-selected');
      step.setAttribute('aria-pressed', 'true');
    }
    return;
  }

  const targets = step.dataset.highlight.split(/\s+/).filter(Boolean);
  const matchedNodes = nodes.filter((node) => {
    const nodeKeys = node.dataset.mapNode.split(/\s+/);
    return targets.some((target) => nodeKeys.includes(target));
  });

  layout.classList.add('is-filtering');
  step.classList.add('is-active');
  matchedNodes.forEach((node) => {
    node.classList.add('is-map-highlighted');
    node.closest('.architecture-card')?.classList.add('has-map-highlight');
  });

  if (options.persist) selectedFlowSteps.set(layout, step);
  if (options.persist) {
    step.classList.add('is-selected');
    step.setAttribute('aria-pressed', 'true');
  }
};

const restoreSelectedHighlight = (layout) => {
  const selectedFlowStep = selectedFlowSteps.get(layout);

  if (selectedFlowStep) {
    highlightMapNodes(selectedFlowStep, { persist: true });
  } else {
    clearMapHighlight(layout);
  }
};

mapLayouts.forEach((layout) => {
  const { steps } = getLayoutParts(layout);

  steps.forEach((step) => {
    step.setAttribute('aria-pressed', 'false');
    step.addEventListener('mouseenter', () => highlightMapNodes(step));
    step.addEventListener('focus', () => highlightMapNodes(step));
    step.addEventListener('click', () => highlightMapNodes(step, { persist: true }));
    step.addEventListener('mouseleave', () => {
      if (document.activeElement !== step) restoreSelectedHighlight(layout);
    });
    step.addEventListener('blur', () => restoreSelectedHighlight(layout));
  });
});

const promptTabs = [...document.querySelectorAll('[data-prompt-tab]')];
const promptPanels = [...document.querySelectorAll('[data-prompt-panel]')];

const activatePromptPanel = (panelId) => {
  promptTabs.forEach((tab) => {
    const isActive = tab.dataset.promptTab === panelId;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', String(isActive));
  });

  promptPanels.forEach((panel) => {
    const isActive = panel.dataset.promptPanel === panelId;
    panel.classList.toggle('active', isActive);
    panel.hidden = !isActive;
  });
};

promptTabs.forEach((tab) => {
  tab.addEventListener('click', () => activatePromptPanel(tab.dataset.promptTab));
});

const copyText = async (text) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
};

document.querySelectorAll('[data-copy-prompt]').forEach((button) => {
  button.addEventListener('click', async () => {
    const target = document.getElementById(button.dataset.copyPrompt);
    if (!target) return;

    const originalText = button.textContent;
    await copyText(target.textContent.trim());
    button.textContent = '已复制';
    setTimeout(() => {
      button.textContent = originalText;
    }, 1200);
  });
});
