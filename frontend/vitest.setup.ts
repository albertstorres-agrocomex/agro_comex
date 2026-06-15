import '@testing-library/jest-dom'

// jsdom nao implementa scrollIntoView; stub global para componentes que o usam
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {}
}
