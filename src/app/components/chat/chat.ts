import { Component, OnInit, ViewChild, ElementRef, PLATFORM_ID, Inject, effect } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ChatService } from '../../services/chat.service';
import { ApiService, User } from '../../services/api';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat',
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="max-w-screen-lg mx-auto h-[calc(100vh-80px-5rem)] md:h-[calc(100vh-80px)] flex bg-white dark:bg-black overflow-hidden border-x border-gray-100 dark:border-gray-800 pb-safe">
      
      <!-- Left Sidebar: Conversations -->
      <div class="w-full md:w-80 flex flex-col border-r border-gray-100 dark:border-gray-800" [class.hidden]="activeChatUser && isMobile" [class.flex]="!activeChatUser || !isMobile">
          <div class="p-4 border-b border-gray-100 dark:border-gray-800">
              <h2 class="text-xl font-black text-gray-900 dark:text-white tracking-tight">Mesajlar</h2>
          </div>
          
          <div class="flex-1 overflow-y-auto">
              @for (conv of chatService.conversationsSignal(); track conv.user.id) {
                  <div (click)="selectChat(conv.user)" 
                       [class.bg-purple-50]="activeChatUser?.id === conv.user.id"
                       [class.dark:bg-purple-900/20]="activeChatUser?.id === conv.user.id"
                       class="p-4 flex gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors relative">
                      <img [src]="conv.user.avatar" class="w-12 h-12 rounded-full object-cover">
                      <div class="flex-1 min-w-0">
                          <div class="flex justify-between items-baseline mb-1">
                              <h4 class="font-bold text-gray-900 dark:text-white truncate">{{ conv.user.name }}</h4>
                              <div class="flex flex-col items-end gap-1">
                                  <span class="text-xs text-gray-400 font-medium whitespace-nowrap">{{ getTimeAgo(conv.lastMessage.timestamp) }}</span>
                                  @if (conv.unreadCount > 0) {
                                      <div class="w-5 h-5 bg-purple-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                          {{ conv.unreadCount }}
                                      </div>
                                  }
                              </div>
                          </div>
                          <p class="text-sm text-gray-500 dark:text-gray-400 truncate" [class.font-bold]="!conv.lastMessage.isRead && conv.lastMessage.receiverId === currentUser?.id">
                              {{ conv.lastMessage.senderId === currentUser?.id ? 'Sen: ' : '' }}{{ conv.lastMessage.text }}
                          </p>
                      </div>
                  </div>
              }
              @if (chatService.conversationsSignal().length === 0) {
                  <div class="p-8 text-center text-gray-400 dark:text-gray-600">
                      <p>Henüz hiç mesajın yok.</p>
                      <p class="text-sm mt-2">Profil sayfalarından arkadaşlarına mesaj atabilirsin.</p>
                  </div>
              }
          </div>
      </div>

      <!-- Right Side: Chat Window -->
      <div class="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900" [class.hidden]="!activeChatUser && isMobile" [class.flex]="activeChatUser || !isMobile">
          @if (activeChatUser) {
              <!-- Chat Header -->
              <div class="p-3 bg-white dark:bg-black border-b border-gray-100 dark:border-gray-800 flex items-center gap-3 shadow-sm z-10">
                  <button (click)="backToInbox()" class="md:hidden p-2 -ml-2 text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  </button>
                  <img [src]="activeChatUser.avatar" class="w-10 h-10 rounded-full object-cover">
                      <div class="flex-1 cursor-pointer" [routerLink]="['/profile', activeChatUser.id]">
                      <h3 class="font-bold text-gray-900 dark:text-white">{{ activeChatUser.name }}</h3>
                      <p class="text-xs font-bold transition-colors duration-300"
                         [class.text-purple-500]="chatService.typingUsersSignal().has(activeChatUser.id)"
                         [class.text-green-500]="!chatService.typingUsersSignal().has(activeChatUser.id)">
                          {{ chatService.typingUsersSignal().has(activeChatUser.id) ? 'Yazıyor...' : 'Çevrimiçi' }}
                      </p>
                  </div>
              </div>

              <!-- Messages Area -->
              <div class="flex-1 overflow-y-auto p-4 flex flex-col gap-4" #scrollContainer>
                  @for (msg of chatService.messagesSignal(); track msg.id) {
                      <div class="flex gap-2 max-w-[80%]" [class.self-end]="msg.senderId === currentUser?.id" [class.self-start]="msg.senderId !== currentUser?.id"
                           [class.flex-row-reverse]="msg.senderId === currentUser?.id">
                          @if (msg.senderId !== currentUser?.id) {
                              <img [src]="activeChatUser.avatar" class="w-8 h-8 rounded-full self-start mb-1">
                          }
                          <div [class.bg-purple-600]="msg.senderId === currentUser?.id"
                               [class.text-white]="msg.senderId === currentUser?.id"
                               [class.bg-white]="msg.senderId !== currentUser?.id"
                               [class.dark:bg-gray-800]="msg.senderId !== currentUser?.id"
                               [class.text-gray-900]="msg.senderId !== currentUser?.id"
                               [class.dark:text-white]="msg.senderId !== currentUser?.id"
                               [class.rounded-br-none]="msg.senderId === currentUser?.id"
                               [class.rounded-bl-none]="msg.senderId !== currentUser?.id"
                               [class.self-end]="msg.senderId === currentUser?.id"
                               [class.self-start]="msg.senderId !== currentUser?.id"
                               class="px-4 py-2 rounded-2xl shadow-sm text-sm leading-relaxed max-w-fit">
                              {{ msg.text }}
                          </div>
                      </div>
                  }
              </div>

              <!-- Input Area -->
              <div class="p-4 bg-white dark:bg-black border-t border-gray-100 dark:border-gray-800">
                  <form (submit)="sendMessage()" class="flex gap-2">
                      <input type="text" [(ngModel)]="newMessageText" (input)="onInput()" name="message" 
                             placeholder="Bir mesaj yaz..." 
                             class="flex-1 bg-gray-100 dark:bg-gray-900 border-none rounded-full px-5 py-3 focus:ring-2 focus:ring-purple-500 dark:text-white"
                             autocomplete="off">
                      <button type="submit" [disabled]="!newMessageText.trim()"
                              class="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-full transition-colors flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                      </button>
                  </form>
              </div>

          } @else {
              <!-- Empty State -->
              <div class="flex-1 flex flex-col items-center justify-center text-gray-300 dark:text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  <p class="mt-4 font-bold text-lg">Bir sohbet seç</p>
              </div>
          }
      </div>
    </div>
  `
})
export class ChatComponent implements OnInit {
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;
  currentUser: User | null = null;
  activeChatUser: User | null = null;
  newMessageText = '';
  isMobile = false;
  typingTimeout: any;

  constructor(
      public chatService: ChatService,
      private api: ApiService,
      private route: ActivatedRoute,
      @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Effect to scroll to bottom when messages change and we are in active chat
    effect(() => {
        const msgs = this.chatService.messagesSignal();
        if (this.activeChatUser && msgs.length > 0) {
             setTimeout(() => this.scrollToBottom(), 50);
        }
    });
  }

  ngOnInit() {
      this.currentUser = this.api.currentUser();
      this.chatService.refreshConversations();
      this.checkMobile();

      // Check if URL has a userId to start chat immediately
      this.route.params.subscribe(params => {
          const userId = params['userId'];
          if (userId) {
              // Fetch user details and open chat
              this.api.getUserProfile(+userId).subscribe(data => {
                  this.selectChat(data.user);
              });
          }
      });
  }

  checkMobile() {
      if (isPlatformBrowser(this.platformId)) {
          this.isMobile = window.innerWidth < 768;
          window.addEventListener('resize', () => {
              this.isMobile = window.innerWidth < 768;
          });
      }
  }

  selectChat(user: User) {
      if (!this.activeChatUser || this.activeChatUser.id !== user.id) {
          this.activeChatUser = user;
          this.chatService.loadConversation(user.id);
          
          // Scroll to bottom after small delay
          setTimeout(() => this.scrollToBottom(), 100);
      }
  }

  backToInbox() {
      this.activeChatUser = null;
  }

  sendMessage() {
      if (!this.newMessageText.trim() || !this.activeChatUser) return;
      
      this.chatService.sendMessage(this.activeChatUser.id, this.newMessageText);
      this.chatService.stopTyping(this.activeChatUser.id);
      this.newMessageText = '';
      setTimeout(() => this.scrollToBottom(), 100);
  }

  onInput() {
      if (!this.activeChatUser) return;

      this.chatService.sendTyping(this.activeChatUser.id);
      
      clearTimeout(this.typingTimeout);
      this.typingTimeout = setTimeout(() => {
          if (this.activeChatUser) {
              this.chatService.stopTyping(this.activeChatUser.id);
          }
      }, 2000);
  }

  scrollToBottom() {
      if (this.scrollContainer) {
          const el = this.scrollContainer.nativeElement;
          el.scrollTop = el.scrollHeight;
      }
  }

  getTimeAgo(timestamp: number): string {
      const seconds = Math.floor((Date.now() - timestamp) / 1000);
      if (seconds < 60) return 'Şimdi';
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}dk`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}s`;
      return `${Math.floor(hours / 24)}g`;
  }
}
