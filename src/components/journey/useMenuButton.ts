// Menu-button behaviour shared by the station switcher and the overflow menu:
// toggles open, closes on outside click and Escape (returning focus to the trigger),
// and moves focus between items with the arrow keys, Home and End.
import { useCallback, useEffect, useRef, useState } from 'react';
import type React from 'react';

const ITEM_SELECTOR = '[role="menuitem"]:not([disabled]),[role="menuitemcheckbox"]:not([disabled]),[role="menuitemradio"]:not([disabled])';

export function useMenuButton() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const items = () => Array.from(menuRef.current?.querySelectorAll<HTMLElement>(ITEM_SELECTOR) ?? []);

  const close = useCallback((restoreFocus = true) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    // Focus the current item (or the first) once the menu has rendered.
    const raf = requestAnimationFrame(() => {
      const list = items();
      const current = list.find((el) => el.getAttribute('aria-checked') === 'true' || el.dataset.current === 'true');
      (current ?? list[0])?.focus();
    });
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  const onMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const list = items();
    const index = list.indexOf(document.activeElement as HTMLElement);
    const focusAt = (i: number) => list[(i + list.length) % list.length]?.focus();
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        focusAt(index + 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        focusAt(index - 1);
        break;
      case 'Home':
        e.preventDefault();
        focusAt(0);
        break;
      case 'End':
        e.preventDefault();
        focusAt(list.length - 1);
        break;
      case 'Escape':
        // Stop here so global Escape handlers (demo stop, drawers) do not also fire.
        e.preventDefault();
        e.stopPropagation();
        close();
        break;
      case 'Tab':
        setOpen(false);
        break;
      default:
        break;
    }
  };

  const onTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setOpen(true);
    }
  };

  return { open, setOpen, close, triggerRef, menuRef, onMenuKeyDown, onTriggerKeyDown };
}
