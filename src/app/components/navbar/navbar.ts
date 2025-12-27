import { Component, ElementRef, ViewChild, ChangeDetectorRef, NgZone, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService, User } from '../../services/api';
import { ThemeService } from '../../services/theme.service';
import { ChatService } from '../../services/chat.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, CommonModule, FormsModule],
  template: `
    <nav class="bg-white/90 dark:bg-black/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 fixed w-full top-0 z-50 transition-all duration-300">
      <div class="max-w-screen-xl mx-auto px-4 h-16 md:h-20 flex items-center justify-between gap-4">
        <!-- Logo -->
        <a routerLink="/" class="text-2xl font-black tracking-tighter text-black dark:text-white flex items-center gap-2 group shrink-0">
          <div class="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center text-white dark:text-black group-hover:bg-purple-600 dark:group-hover:bg-purple-500 transition-colors">
            <span class="text-lg">S</span>
          </div>
          <span class="hidden sm:inline">SHOP<span class="text-purple-600 dark:text-purple-400">TALK</span></span>
        </a>

          <!-- Search Bar -->
          <div class="flex-1 max-w-md relative group flex justify-end md:justify-start static md:relative">

              <!-- Mobile Search Toggle -->
              <button (click)="isMobileSearchOpen = !isMobileSearchOpen" class="md:hidden p-2 text-gray-500 dark:text-gray-400">
                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              </button>

              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-50 hidden md:flex">
                  <svg class="h-5 w-5 text-gray-400 dark:text-gray-500 group-focus-within:text-purple-500 dark:group-focus-within:text-purple-400 transition-colors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
                  </svg>
              </div>

              <!-- Desktop Input -->
              <input
                  type="text"
                  [(ngModel)]="searchQuery"
                  (input)="onSearch()"
                  (focus)="showResults = true"
                  placeholder="Kullanıcı ara..."
                  class="hidden md:block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-800 rounded-full leading-5 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:bg-white dark:focus:bg-black focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent transition-all sm:text-sm relative z-50"
              >

              <!-- Mobile Search Overlay Input -->
              @if (isMobileSearchOpen) {
                  <div class="absolute inset-0 z-[60] bg-white dark:bg-black px-4 flex items-center gap-2 md:hidden animate-fade-in">
                       <div class="flex-1 relative">
                           <input
                              type="text"
                              [(ngModel)]="searchQuery"
                              (input)="onSearch()"
                              autoFocus
                              placeholder="Kullanıcı ara..."
                              class="w-full pl-4 pr-10 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                          @if (searchQuery) {
                              <button (click)="searchQuery = ''; onSearch()" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
                              </button>
                          }
                       </div>
                      <button (click)="isMobileSearchOpen = false; searchQuery = ''; onSearch()" class="p-2 text-gray-500 dark:text-gray-400 font-medium text-sm whitespace-nowrap">
                          Vazgeç
                      </button>
                  </div>
              }

              <!-- Search Results Overlay (Clicking outside closes it) -->
              @if (showResults) {
                  <div class="fixed inset-0 z-40" (click)="showResults = false"></div>
              }

              <!-- Search Results Dropdown -->
              @if (showResults && (searchResults.length > 0 || isSearching || (searchQuery.length > 1 && searchResults.length === 0))) {
                  <div class="absolute top-full left-0 w-full mt-2 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50">
                      @if (isSearching) {
                          <div class="p-4 text-center text-gray-400 dark:text-gray-500 text-sm">Aranıyor...</div>
                      }
                      @if (!isSearching && searchResults.length === 0 && searchQuery.length > 1) {
                          <div class="p-4 text-center text-gray-400 dark:text-gray-500 text-sm">Sonuç bulunamadı</div>
                      }

                      @for (user of searchResults; track user.id) {
                          <a [routerLink]="['/profile', user.id]"
                             class="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0 cursor-pointer"
                             (click)="closeSearch(); isMobileSearchOpen = false">
                              <img [src]="user.avatar" class="w-10 h-10 rounded-full object-cover bg-gray-200 dark:bg-gray-700">
                              <div class="flex-1 min-w-0">
                                  <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ user.name }}</p>
                                  <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                      <span class="truncate max-w-[150px]">{{ user.bio }}</span>
                                      @if (user.followers) {
                                          <span class="text-purple-600 dark:text-purple-400 font-medium bg-purple-50 dark:bg-purple-900/30 px-1.5 py-0.5 rounded-full">{{ user.followers | number }} takipçi</span>
                                      }
                                  </div>
                              </div>
                          </a>
                      }
                  </div>
              }
          </div>

        <!-- Mobile Theme Toggle -->
        <button (click)="themeService.toggle()" class="md:hidden p-2 text-gray-500 dark:text-gray-400">
            @if (themeService.darkMode()) {
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
            } @else {
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
            }
        </button>

        <!-- Mobile Notifications Bell -->
        <div class="md:hidden relative">
            <button (click)="toggleNotifications()" class="p-2 text-gray-500 dark:text-gray-400 relative">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                @if (chatService.unreadNotificationsCount() > 0) {
                    <span class="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full border border-white dark:border-black"></span>
                }
            </button>
             @if (showNotifications) {
                  <!-- Mobile Notification Dropdown Logic (reused or simplified) -->
                  <div class="fixed inset-0 z-40 bg-black/20" (click)="showNotifications = false"></div>
                   <div class="absolute top-full right-[-10px] mt-2 w-[85vw] max-w-[320px] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50 animate-fade-in-up origin-top-right">
                     <!-- Reuse the same notification list content as desktop -->
                      <div class="p-3 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                          <h3 class="font-bold text-gray-900 dark:text-white text-sm">Bildirimler</h3>
                          <button (click)="chatService.markNotificationsAsRead()" class="text-xs text-purple-600 dark:text-purple-400 hover:underline">Tümünü Okundu İşaretle</button>
                      </div>
                      <div class="max-h-80 overflow-y-auto">
                         @if (chatService.notificationsSignal().length === 0) {
                             <div class="p-6 text-center text-gray-400 text-sm">
                                 Henüz bildirim yok.
                             </div>
                         }
                         @for (note of chatService.notificationsSignal(); track note.id) {
                             <div class="p-3 border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex gap-3" [class.bg-purple-50]="!note.isRead" [class.dark:bg-purple-900/10]="!note.isRead">
                                 <div class="shrink-0">
                                    @if (note.type === 'like') {
                                        <div class="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                                        </div>
                                    } @else {
                                        <div class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-500 flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                                        </div>
                                    }
                                 </div>
                                 <div class="flex-1 min-w-0">
                                     <p class="text-sm text-gray-900 dark:text-white">
                                         <span class="font-bold">{{ note.sender?.name }}</span> {{ note.type === 'like' ? 'fotoğrafını beğendi.' : 'yorum yaptı.' }}
                                     </p>
                                     <p class="text-[10px] text-gray-400 mt-1">{{ note.timestamp | date:'shortTime' }}</p>
                                 </div>
                             </div>
                         }
                      </div>
                   </div>
             }
        </div>

        <!-- Right Side (Desktop) -->
        <div class="hidden md:flex items-center gap-4 shrink-0">
          <!-- Theme Toggle -->
          <button (click)="themeService.toggle()" class="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            @if (themeService.darkMode()) {
              <!-- Sun Icon -->
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
            } @else {
              <!-- Moon Icon -->
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
            }
          </button>

          <!-- Upload Button -->
          <button (click)="openUploadModal()" class="flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-5 py-2.5 rounded-full font-medium text-sm hover:bg-gray-800 dark:hover:bg-gray-200 transition-all active:scale-95 shadow-lg shadow-black/20 dark:shadow-white/10">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
            <span class="hidden sm:inline">Yükle</span>
          </button>

          <!-- Hall of Fame Link -->
          <a routerLink="/hall-of-fame" class="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Şeref Kürsüsü">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </a>

          <!-- Notifications Dropdown -->
           <div class="relative">
              <button (click)="toggleNotifications()" class="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative" title="Bildirimler">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                @if (chatService.unreadNotificationsCount() > 0) {
                  <span class="absolute -top-1 -right-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white dark:border-black shadow-sm"
                        [class.w-5]="chatService.unreadNotificationsCount() < 10"
                        [class.h-5]="chatService.unreadNotificationsCount() < 10"
                        [class.rounded-full]="chatService.unreadNotificationsCount() < 10"
                        [class.px-1.5]="chatService.unreadNotificationsCount() >= 10"
                        [class.py-0.5]="chatService.unreadNotificationsCount() >= 10"
                        [class.rounded-full]="chatService.unreadNotificationsCount() >= 10"
                        [class.min-w-[20px]]="chatService.unreadNotificationsCount() >= 10">
                    {{ chatService.unreadNotificationsCount() > 99 ? '99+' : chatService.unreadNotificationsCount() }}
                  </span>
                }
              </button>

              @if (showNotifications) {
                 <!-- Backdrop -->
                 <div class="fixed inset-0 z-40" (click)="showNotifications = false"></div>

                 <!-- Dropdown -->
                 <div class="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50">
                     <div class="p-3 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                         <h3 class="font-bold text-gray-900 dark:text-white text-sm">Bildirimler</h3>
                         <button (click)="chatService.markNotificationsAsRead()" class="text-xs text-purple-600 dark:text-purple-400 hover:underline">Tümünü Okundu İşaretle</button>
                     </div>
                     <div class="max-h-80 overflow-y-auto">
                        @if (chatService.notificationsSignal().length === 0) {
                            <div class="p-6 text-center text-gray-400 text-sm">
                                Henüz bildirim yok.
                            </div>
                        }
                        @for (note of chatService.notificationsSignal(); track note.id) {
                            <div class="p-3 border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex gap-3" [class.bg-purple-50]="!note.isRead" [class.dark:bg-purple-900/10]="!note.isRead">
                                <div class="shrink-0">
                                   @if (note.type === 'like') {
                                       <div class="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 flex items-center justify-center">
                                           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                                       </div>
                                   } @else {
                                       <div class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-500 flex items-center justify-center">
                                           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                                       </div>
                                   }
                                </div>
                                <div class="flex-1 min-w-0">
                                    <p class="text-sm text-gray-900 dark:text-white">
                                        <span class="font-bold">{{ note.sender?.name }}</span> {{ note.type === 'like' ? 'fotoğrafını beğendi.' : 'yorum yaptı.' }}
                                    </p>
                                    @if (note.type === 'comment') {
                                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">"{{ note.text.split(': "')[1]?.slice(0, -1) || note.text }}"</p>
                                    }
                                    <p class="text-[10px] text-gray-400 mt-1">{{ note.timestamp | date:'shortTime' }}</p>
                                </div>
                            </div>
                        }
                     </div>
                 </div>
              }
           </div>

          <!-- Chat Link -->
          <a routerLink="/chat" class="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative" title="Mesajlar">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            @if (chatService.totalUnreadCount() > 0) {
              <span class="absolute -top-1 -right-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white dark:border-black shadow-sm"
                    [class.w-5]="chatService.totalUnreadCount() < 10"
                    [class.h-5]="chatService.totalUnreadCount() < 10"
                    [class.rounded-full]="chatService.totalUnreadCount() < 10"
                    [class.px-1.5]="chatService.totalUnreadCount() >= 10"
                    [class.py-0.5]="chatService.totalUnreadCount() >= 10"
                    [class.rounded-full]="chatService.totalUnreadCount() >= 10"
                    [class.min-w-[20px]]="chatService.totalUnreadCount() >= 10">
                {{ chatService.totalUnreadCount() > 99 ? '99+' : chatService.totalUnreadCount() }}
              </span>
            }
          </a>

          <!-- Profile Link / User Switcher -->
          <div class="relative">
              <a [routerLink]="['/profile', api.currentUser()?.id]" class="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden border-2 border-transparent hover:border-purple-500 dark:hover:border-purple-400 transition-all duration-300 cursor-pointer relative flex items-center justify-center group">
                 @if (api.currentUser()) {
                     <img [src]="api.currentUser()?.avatar" alt="Profile" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110">
                 } @else {
                     <span class="text-xs font-bold text-gray-500">?</span>
                 }
                 <div class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-black transition-transform duration-300 group-hover:scale-110"></div>
              </a>
          </div>
        </div>
      </div>
    </nav>
    <div class="h-16 md:h-20"></div>

    <!-- Mobile Bottom Navigation -->
    <nav class="md:hidden fixed bottom-0 left-0 w-full bg-white/95 dark:bg-black/95 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 z-50 pb-safe transition-all duration-300 shadow-[0_-1px_20px_rgba(0,0,0,0.05)]">
      <div class="flex items-center justify-between h-16 px-1">
        <!-- Home -->
        <a routerLink="/" (click)="handleHomeClick()" routerLinkActive="!text-purple-600 dark:!text-purple-400" [routerLinkActiveOptions]="{exact: true}" class="flex-1 flex flex-col items-center justify-center gap-1 text-gray-500 dark:text-gray-400 py-1 transition-all active:scale-90">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          <span class="text-[10px] font-bold whitespace-nowrap">Ana Sayfa</span>
        </a>

        <!-- Hall of Fame -->
        <a routerLink="/hall-of-fame" routerLinkActive="!text-purple-600 dark:!text-purple-400" class="flex-1 flex flex-col items-center justify-center gap-1 text-gray-500 dark:text-gray-400 py-1 transition-all active:scale-90">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          <span class="text-[10px] font-bold whitespace-nowrap">Kürsü</span>
        </a>

        <!-- Upload (Center) -->
        <div class="flex-1 flex items-center justify-center -mt-5">
          <button (click)="openUploadModal()" class="w-14 h-14 bg-black dark:bg-white text-white dark:text-black rounded-2xl shadow-xl shadow-purple-500/20 flex items-center justify-center hover:scale-110 active:scale-95 transition-all border-4 border-white dark:border-black">
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
          </button>
        </div>

        <!-- Chat -->
        <a routerLink="/chat" routerLinkActive="!text-purple-600 dark:!text-purple-400" class="flex-1 flex flex-col items-center justify-center gap-1 text-gray-500 dark:text-gray-400 py-1 transition-all active:scale-90 relative">
          <div class="relative">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            @if (chatService.totalUnreadCount() > 0) {
              <span class="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[9px] font-bold flex items-center justify-center border-2 border-white dark:border-black shadow-sm"
                    [class.w-4]="chatService.totalUnreadCount() < 10"
                    [class.h-4]="chatService.totalUnreadCount() < 10"
                    [class.rounded-full]="chatService.totalUnreadCount() < 10"
                    [class.px-1]="chatService.totalUnreadCount() >= 10"
                    [class.py-0.5]="chatService.totalUnreadCount() >= 10"
                    [class.rounded-full]="chatService.totalUnreadCount() >= 10"
                    [class.min-w-[16px]]="chatService.totalUnreadCount() >= 10">
                {{ chatService.totalUnreadCount() > 99 ? '99+' : chatService.totalUnreadCount() }}
              </span>
            }
          </div>
          <span class="text-[10px] font-bold whitespace-nowrap">Mesajlar</span>
        </a>

        <!-- Profile -->
        <a [routerLink]="['/profile', api.currentUser()?.id]" routerLinkActive="!text-purple-600 dark:!text-purple-400" class="flex-1 flex flex-col items-center justify-center gap-1 text-gray-500 dark:text-gray-400 py-1 transition-all active:scale-90">
          <div class="relative">
            @if (api.currentUser()) {
              <img [src]="api.currentUser()?.avatar" alt="Profile" class="w-6 h-6 rounded-full object-cover border-2 border-transparent">
            } @else {
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            }
          </div>
          <span class="text-[10px] font-bold whitespace-nowrap">Profil</span>
        </a>
      </div>
    </nav>

    <!-- Upload Modal -->
    @if (showModal) {
      <div class="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <!-- Backdrop -->
          <div class="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm transition-opacity" (click)="closeModal()"></div>

          <!-- Modal Content -->
          <div class="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-sm max-h-[85vh] flex flex-col relative z-10 shadow-2xl animate-slide-up border border-gray-100 dark:border-gray-800">

              <div class="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
                  <h3 class="font-bold text-lg text-gray-900 dark:text-white">Yeni Paylaşım</h3>
                <button
                  (click)="closeModal()"
                  class="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700
           transition-colors flex items-center justify-center text-gray-500 dark:text-gray-400">

                  <svg xmlns="http://www.w3.org/2000/svg"
                       width="20"
                       height="20"
                       viewBox="0 0 24 24"
                       fill="none"
                       stroke="currentColor"
                       stroke-width="2"
                       stroke-linecap="round"
                       stroke-linejoin="round">

                    <path d="M18 6 L6 18"/>
                    <path d="M6 6 L18 18"/>

                  </svg>
                </button>
              </div>

              <!-- Scrollable Content -->
              <div class="flex-1 overflow-y-auto p-4 scrollbar-hide">
                  <!-- Preview Area -->
                  <div class="mb-5">
                      @if (!previewUrl) {
                        <div (click)="fileInput.click()" class="w-full aspect-[4/5] bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors group">
                            <div class="w-16 h-16 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition-transform">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400 dark:text-gray-500 group-hover:text-purple-500 dark:hover:text-purple-400"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                            </div>
                            <span class="font-medium text-gray-500 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400">Fotoğraf Seç</span>
                            <span class="text-xs text-gray-400 dark:text-gray-500 mt-1">veya sürükle bırak</span>
                        </div>
                      }

                      @if (previewUrl) {
                      <div class="relative w-full aspect-[4/5] rounded-2xl overflow-hidden shadow-md bg-black">
                        @if (previewType === 'video') {
                            <video [src]="previewUrl" controls class="w-full h-full object-contain"></video>
                        } @else {
                            <img [src]="previewUrl" class="w-full h-full object-cover">
                        }

                        <button
                          (click)="removeImage()"
                          class="absolute top-3 right-3 w-8 h-8 bg-black/50 text-white rounded-full
                  hover:bg-red-500 transition-colors backdrop-blur-md
                  flex items-center justify-center z-10">

                          <svg xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round">
                            <path d="M18 6 L6 18"/>
                            <path d="M6 6 L18 18"/>
                          </svg>

                        </button>
                      </div>
                    }
                  </div>

                  <input #fileInput type="file" (change)="onFileSelected($event)" accept="image/*,video/*" class="hidden">

                  <!-- Description Input -->
                  <div class="mb-4">
                      <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Açıklama</label>
                      <textarea #descInput class="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 resize-none text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500" rows="3" placeholder="Bu kombin hakkında ne düşünüyorsunuz?"></textarea>
                  </div>

                  <!-- Location Input -->
                  <div class="mb-4">
                      <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Konum (İsteğe bağlı)</label>
                      <div class="relative">
                          <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                          </div>
                          <input [(ngModel)]="postLocation" name="postLocation" type="text" class="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500" placeholder="Örn: Nişantaşı, İstanbul">
                      </div>
                  </div>

                  <!-- Category Select -->
                  <div class="mb-6">
                      <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Kategori</label>
                      <div class="flex flex-wrap gap-2">
                          @for (cat of categories; track cat) {
                            <button
                                    (click)="selectedCategory = cat"
                                    [class.bg-purple-600]="selectedCategory === cat"
                                    [class.dark:bg-purple-500]="selectedCategory === cat"
                                    [class.text-white]="selectedCategory === cat"
                                    [class.bg-gray-100]="selectedCategory !== cat"
                                    [class.dark:bg-gray-800]="selectedCategory !== cat"
                                    [class.text-gray-600]="selectedCategory !== cat"
                                    [class.dark:text-gray-400]="selectedCategory !== cat"
                                    class="px-4 py-2 rounded-full text-sm font-medium transition-colors hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-700 dark:hover:text-purple-300">
                                {{ cat }}
                            </button>
                          }
                      </div>
                  </div>
              </div>

              <!-- Footer Button -->
              <div class="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-b-3xl shrink-0">
                  <button (click)="upload()" [disabled]="!selectedFile || uploading" class="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold text-lg hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-purple-900/10 dark:shadow-white/10 flex items-center justify-center gap-2">
                      @if (uploading) {
                        <span class="w-5 h-5 border-2 border-white/30 dark:border-black/30 border-t-white dark:border-t-black rounded-full animate-spin"></span>
                      }
                      {{ uploading ? 'Yükleniyor...' : 'Paylaş' }}
                  </button>
              </div>
          </div>
      </div>
    }
  `,
  styles: ``
})
export class Navbar implements OnInit {
  showModal = false;
  previewUrl: string | null = null;
  previewType: 'image' | 'video' = 'image';
  selectedFile: File | null = null;
  uploading = false;

  @ViewChild('fileInput') fileInput!: ElementRef;
  @ViewChild('descInput') descInput!: ElementRef;
  postLocation = '';

  categories = ['Sokak Modası', 'Ofis', 'Davet', 'Spor', 'Vintage', 'Diğer'];
  selectedCategory = 'Sokak Modası';

  searchQuery = '';
  searchResults: User[] = [];
  showResults = false;
  isSearching = false;
  isMobileSearchOpen = false;
  searchTimeout: any;

  // User Switcher
  // showUserMenu = false; // Removed
  allUsers: User[] = [];

  unreadCount = 0;
  showNotifications = false;

  constructor(
      public api: ApiService,
      private cdr: ChangeDetectorRef,
      private ngZone: NgZone,
      public themeService: ThemeService,
      public chatService: ChatService
  ) {
      // Fetch users for the switcher (kept for future use if needed, but menu removed)
      /*this.api.getUsers().subscribe(users => {
          this.allUsers = users;
      });*/
  }

  ngOnInit() {
      // Initial fetch of unread count
      this.chatService.refreshConversations();
      this.chatService.fetchNotifications();
  }

  handleHomeClick() {
    this.api.triggerScrollToTop();
  }

  toggleNotifications() {
      this.showNotifications = !this.showNotifications;
      if (this.showNotifications) {
          // Maybe refresh?
          this.chatService.fetchNotifications();
      }
  }

  onSearch() {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);

    if (this.searchQuery.length < 2) {
        this.searchResults = [];
        this.isSearching = false;
        return;
    }

    this.isSearching = true;
    this.searchTimeout = setTimeout(() => {
        this.api.searchUsers(this.searchQuery).subscribe({
            next: (users) => {
                this.ngZone.run(() => {
                    this.searchResults = users;
                    this.isSearching = false;
                    this.cdr.markForCheck(); // Use markForCheck for signal/OnPush compatibility or detectChanges
                });
            },
            error: () => {
                this.ngZone.run(() => {
                    this.isSearching = false;
                    this.cdr.markForCheck();
                });
            }
        });
    }, 300);
  }

  // Handle clicking outside/closing search more robustly
  resetSearch() {
    this.isSearching = false;
    this.showResults = false;
  }

  onBlur() {
    // Small delay to allow click event on result to fire
    setTimeout(() => {
        this.showResults = false;
    }, 200);
  }

  closeSearch() {
    this.showResults = false;
    this.searchQuery = '';
  }

  openUploadModal() {
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.resetForm();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
        this.selectedFile = file;
        this.previewType = file.type.startsWith('video') ? 'video' : 'image';

        const reader = new FileReader();
        reader.onload = (e) => {
            this.ngZone.run(() => {
                this.previewUrl = e.target?.result as string;
                this.cdr.markForCheck();
            });
        };
        reader.readAsDataURL(file);
    }
  }

  removeImage() {
    this.selectedFile = null;
    this.previewUrl = null;
    if (this.fileInput) this.fileInput.nativeElement.value = '';
  }

  resetForm() {
    this.removeImage();
    if (this.descInput) this.descInput.nativeElement.value = '';
    this.postLocation = '';
    this.selectedCategory = 'Sokak Modası';
  }

  switchUser(user: User) {
      this.api.setCurrentUser(user);
      // this.showUserMenu = false;
      // If we are on a profile page, we might want to reload or redirect?
      // For now, let's just update the state.
  }

  upload() {
    if (!this.selectedFile) return;

    this.uploading = true;

    try {
      const formData = new FormData();
      formData.append('image', this.selectedFile);
      // Use the current user ID
      const currentUserId = this.api.currentUser()?.id;
      if (currentUserId) {
          formData.append('userId', currentUserId.toString());
      } else {
          // Fallback or error if no user logged in
          alert("Lütfen önce giriş yapın (bir kullanıcı seçin)");
          this.uploading = false;
          return;
      }

      formData.append('description', this.descInput?.nativeElement?.value || '');

      // Use the bound model for location
      formData.append('location', this.postLocation || '');

      formData.append('category', this.selectedCategory);

      // Explicitly append mediaType for the frontend optimistic update or backend handling if needed
      // Note: Backend infers this from the file mimetype, but sending it can be safer
      formData.append('mediaType', this.previewType);

      this.api.createPost(formData).subscribe({
          next: () => {
              this.uploading = false;
              this.closeModal();
          },
          error: (err) => {
              console.error('Upload failed:', err);
              this.uploading = false;
              alert('Yükleme başarısız oldu. Lütfen tekrar deneyin.');
          }
      });
    } catch (error) {
      console.error('Error preparing upload:', error);
      this.uploading = false;
      alert('Bir hata oluştu. Lütfen tekrar deneyin.');
    }
  }
}
