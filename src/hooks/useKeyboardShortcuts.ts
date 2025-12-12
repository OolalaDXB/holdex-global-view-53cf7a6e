import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(isDemo = false) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const prefix = isDemo ? '/demo' : '';

    const shortcuts: ShortcutConfig[] = [
      {
        key: 'a',
        meta: true,
        shift: true,
        action: () => navigate(`${prefix}/add`),
        description: 'Add Asset',
      },
      {
        key: 'l',
        meta: true,
        shift: true,
        action: () => navigate(`${prefix}${isDemo ? '/add-liability' : '/add-liability'}`),
        description: 'Add Liability',
      },
      {
        key: 'd',
        meta: true,
        shift: true,
        action: () => navigate(prefix || '/'),
        description: 'Dashboard',
      },
      {
        key: 's',
        meta: true,
        shift: true,
        action: () => !isDemo && navigate('/settings'),
        description: 'Settings',
      },
    ];

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        const metaMatch = shortcut.meta ? (e.metaKey || e.ctrlKey) : true;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();

        if (metaMatch && shiftMatch && keyMatch) {
          e.preventDefault();
          shortcut.action();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, isDemo, location]);
}

export const KEYBOARD_SHORTCUTS = [
  { keys: ['⌘', '⇧', 'A'], description: 'Add Asset' },
  { keys: ['⌘', '⇧', 'L'], description: 'Add Liability' },
  { keys: ['⌘', '⇧', 'D'], description: 'Dashboard' },
  { keys: ['⌘', '⇧', 'S'], description: 'Settings' },
];
