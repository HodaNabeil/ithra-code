'use client';

import Script from 'next/script';
import { useCallback, useEffect, useRef } from 'react';

import { resolveTurnstileSiteKey } from '../lib/turnstile-config';

const TURNSTILE_SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const TURNSTILE_SITE_KEY = resolveTurnstileSiteKey();

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      'expired-callback'?: () => void;
      'error-callback'?: () => void;
    },
  ) => string;
  remove: (widgetId: string) => void;
  reset: (widgetId: string) => void;
  ready: (callback: () => void) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

type ContactTurnstileProps = {
  onTokenChange: (token: string | null) => void;
  onReadyChange?: (ready: boolean) => void;
  resetSignal?: number;
};

export default function ContactTurnstile({
  onTokenChange,
  onReadyChange,
  resetSignal = 0,
}: ContactTurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenChangeRef = useRef(onTokenChange);
  const onReadyChangeRef = useRef(onReadyChange);

  useEffect(() => {
    onTokenChangeRef.current = onTokenChange;
  }, [onTokenChange]);

  useEffect(() => {
    onReadyChangeRef.current = onReadyChange;
  }, [onReadyChange]);

  const renderWidget = useCallback(() => {
    if (
      !TURNSTILE_SITE_KEY ||
      !containerRef.current ||
      !window.turnstile ||
      widgetIdRef.current
    ) {
      return;
    }

    onReadyChangeRef.current?.(false);
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      callback: (token) => {
        onTokenChangeRef.current(token);
        onReadyChangeRef.current?.(true);
      },
      'expired-callback': () => {
        onTokenChangeRef.current(null);
        onReadyChangeRef.current?.(false);
      },
      'error-callback': () => {
        onTokenChangeRef.current(null);
        onReadyChangeRef.current?.(false);
      },
    });
  }, []);

  const mountWidget = useCallback(() => {
    if (!window.turnstile) {
      return;
    }

    window.turnstile.ready(renderWidget);
  }, [renderWidget]);

  useEffect(() => {
    mountWidget();
  }, [mountWidget]);

  useEffect(() => {
    if (resetSignal === 0 || !widgetIdRef.current || !window.turnstile) {
      return;
    }

    window.turnstile.reset(widgetIdRef.current);
    onTokenChangeRef.current(null);
    onReadyChangeRef.current?.(false);
  }, [resetSignal]);

  useEffect(() => {
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, []);

  if (!TURNSTILE_SITE_KEY) {
    return null;
  }

  return (
    <>
      <Script
        src={TURNSTILE_SCRIPT_SRC}
        strategy="afterInteractive"
        onLoad={mountWidget}
      />
      <div
        ref={containerRef}
        className="flex w-full max-w-75 items-center justify-center"
      />
    </>
  );
}
