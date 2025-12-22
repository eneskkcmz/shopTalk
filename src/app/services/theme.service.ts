import { Injectable, signal, effect, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  darkMode = signal<boolean>(false);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      // Check local storage or system preference
      const storedTheme = localStorage.getItem('theme');
      
      // Safety check for matchMedia in case it's not available in certain environments
      const prefersDark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)').matches : false;

      if (storedTheme === 'dark' || (!storedTheme && prefersDark)) {
        this.darkMode.set(true);
      }
    }

    // Apply theme whenever signal changes
    effect(() => {
      if (isPlatformBrowser(this.platformId)) {
        if (this.darkMode()) {
          document.documentElement.classList.add('dark');
          localStorage.setItem('theme', 'dark');
        } else {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('theme', 'light');
        }
      }
    });
  }

  toggle() {
    this.darkMode.update(dark => !dark);
  }
}
