const { getComputedStyle } = window;
window.getComputedStyle = elt => getComputedStyle(elt);

window.fetch = () => Promise.resolve();
