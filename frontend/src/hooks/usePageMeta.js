import { useEffect } from 'react';

export const SITE_NAME = 'IndusCart Valley';
const DEFAULT_TITLE = 'IndusCart Valley | Skincare, home & handmade finds from Pakistan';

const setMeta = (selector, attr, value) => {
  const el = document.head.querySelector(selector);
  if (el && value) el.setAttribute(attr, value);
};

// Sets the browser-tab title and description for the current page; restores the defaults on leave.
export default function usePageMeta(title, description) {
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const previousTitle = document.title;
    const descEl = document.head.querySelector('meta[name="description"]');
    const previousDesc = descEl?.getAttribute('content');
    document.title = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
    if (description) {
      setMeta('meta[name="description"]', 'content', description);
      setMeta('meta[property="og:description"]', 'content', description);
    }
    setMeta('meta[property="og:title"]', 'content', document.title);
    return () => {
      document.title = previousTitle;
      if (previousDesc) descEl?.setAttribute('content', previousDesc);
    };
  }, [title, description]);
}
