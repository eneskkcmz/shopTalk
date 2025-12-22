import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './components/navbar/navbar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar],
  template: `
    <div class="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white transition-colors duration-300">
      <app-navbar></app-navbar>
      <router-outlet></router-outlet>
    </div>
  `,
  styleUrl: './app.css'
})
export class App {
  title = 'wear-vote';
}
