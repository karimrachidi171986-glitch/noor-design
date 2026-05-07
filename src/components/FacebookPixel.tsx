import { useEffect } from 'react';

const PIXEL_ID = '61588096002695';

// Global flag to track if the pixel has been initialized in this session
let isPixelInitialized = false;

export default function FacebookPixel() {
  useEffect(() => {
    // If we already initialized it in this window session, don't do it again
    if (isPixelInitialized) return;
    
    // Check if fbq is already defined on window (maybe by another script or previous run)
    if (typeof (window as any).fbq !== 'undefined') {
      // It exists, so we just track the PageView if not already done
      // and mark as initialized to avoid further attempts
      isPixelInitialized = true;
      (window as any).fbq('track', 'PageView');
      return;
    }

    /* eslint-disable */
    (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) n = f.fbq;
      n.push = n.loaded = !0;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */

    (window as any).fbq('init', PIXEL_ID);
    (window as any).fbq('track', 'PageView');
    
    isPixelInitialized = true;
  }, []);

  return (
    <noscript>
      <img
        height="1"
        width="1"
        style={{ display: 'none' }}
        src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
        alt=""
      />
    </noscript>
  );
}
