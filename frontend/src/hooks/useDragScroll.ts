import { useEffect, useRef } from 'react';

export function useDragScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let isDown = false;
    let startX = 0;
    let startScroll = 0;
    let moved = false;

    const onMouseDown = (event: MouseEvent) => {
      if (event.button !== 0) return;
      isDown = true;
      moved = false;
      startX = event.pageX;
      startScroll = el.scrollLeft;
      el.style.cursor = 'grabbing';
      el.style.userSelect = 'none';
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!isDown) return;
      const walk = event.pageX - startX;
      if (Math.abs(walk) > 5) moved = true;
      el.scrollLeft = startScroll - walk;
    };

    const stop = () => {
      if (!isDown) return;
      isDown = false;
      el.style.cursor = '';
      el.style.userSelect = '';
    };

    const onClickCapture = (event: MouseEvent) => {
      if (moved) {
        event.stopPropagation();
        event.preventDefault();
        moved = false;
      }
    };

    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', stop);
    el.addEventListener('click', onClickCapture, true);

    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', stop);
      el.removeEventListener('click', onClickCapture, true);
    };
  }, []);

  return ref;
}
