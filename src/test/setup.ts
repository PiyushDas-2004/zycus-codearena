import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// jsdom has no layout: scrolling APIs are no-ops here.
Element.prototype.scrollTo ??= function scrollTo() {};
Element.prototype.scrollIntoView ??= function scrollIntoView() {};

afterEach(() => {
  cleanup();
});
