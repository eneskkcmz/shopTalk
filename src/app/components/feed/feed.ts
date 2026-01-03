import { Component, OnInit, OnDestroy, ChangeDetectorRef, AfterViewChecked, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService, Post } from '../../services/api';
import { interval, Subscription } from 'rxjs';
import { CommentsModal } from '../comments-modal/comments-modal';
import { MediaViewer } from '../media-viewer/media-viewer';
import { io, Socket } from 'socket.io-client';

@Component({
  selector: 'app-feed',
  imports: [CommonModule, RouterLink, CommentsModal, MediaViewer],
  template: `
    <div class="max-w-md mx-auto py-4 px-4 flex flex-col gap-6">

      <!-- Feed Type Switcher (Sticky Header) -->
      <div class="sticky top-0 z-30 bg-white/95 dark:bg-black/95 backdrop-blur-md pt-2 pb-2 -mx-4 px-4 border-b border-gray-100 dark:border-gray-800">
          <div class="flex items-center justify-center gap-8">
              <button (click)="switchFeedType('foryou')" 
                      class="relative py-3 font-black text-sm tracking-wide transition-colors"
                      [class.text-gray-900]="currentFeedType === 'foryou'"
                      [class.dark:text-white]="currentFeedType === 'foryou'"
                      [class.text-gray-400]="currentFeedType !== 'foryou'"
                      [class.dark:text-gray-600]="currentFeedType !== 'foryou'">
                  SANA ÖZEL
                  @if (currentFeedType === 'foryou') {
                      <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 dark:bg-purple-500 rounded-full animate-fade-in"></div>
                  }
              </button>
              
              <button (click)="switchFeedType('following')" 
                      class="relative py-3 font-black text-sm tracking-wide transition-colors"
                      [class.text-gray-900]="currentFeedType === 'following'"
                      [class.dark:text-white]="currentFeedType === 'following'"
                      [class.text-gray-400]="currentFeedType !== 'following'"
                      [class.dark:text-gray-600]="currentFeedType !== 'following'">
                  TAKİP EDİLENLER
                  @if (currentFeedType === 'following') {
                      <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 dark:bg-purple-500 rounded-full animate-fade-in"></div>
                  }
              </button>
          </div>
      </div>

      <!-- Category Filter -->
      <div class="relative group -mx-4 px-4">
        <!-- Scroll Left Button (Desktop/Hover) -->
        <button (click)="scrollCategories('left')"
                class="absolute left-2 top-[30%] -translate-y-1/2 z-20 bg-white/90 dark:bg-black/90 backdrop-blur-sm shadow-lg rounded-full p-2 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white hover:scale-110 transition-all opacity-0 group-hover:opacity-100 border border-gray-100 dark:border-gray-800 hidden sm:flex">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>

        <!-- Fade masks -->
        <div class="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-white dark:from-black to-transparent z-10 pointer-events-none"></div>

        <div #scrollContainer
             class="flex gap-2 overflow-x-auto pb-4 px-4 scrollbar-hide snap-x scroll-smooth">
            <button (click)="filterCategory('Hepsi')"
                    [class.bg-black]="currentCategory === 'Hepsi'"
                    [class.dark:bg-white]="currentCategory === 'Hepsi'"
                    [class.text-white]="currentCategory === 'Hepsi'"
                    [class.dark:text-black]="currentCategory === 'Hepsi'"
                    [class.bg-white]="currentCategory !== 'Hepsi'"
                    [class.dark:bg-gray-900]="currentCategory !== 'Hepsi'"
                    [class.text-gray-900]="currentCategory !== 'Hepsi'"
                    [class.dark:text-white]="currentCategory !== 'Hepsi'"
                    class="px-5 py-2.5 rounded-full text-sm font-bold shadow-sm whitespace-nowrap transition-all border border-gray-100 dark:border-gray-800 hover:shadow-md snap-start shrink-0">
                Hepsi
            </button>
            @for (cat of categories; track cat) {
              <button
                      (click)="filterCategory(cat)"
                      [class.bg-black]="currentCategory === cat"
                      [class.dark:bg-white]="currentCategory === cat"
                      [class.text-white]="currentCategory === cat"
                      [class.dark:text-black]="currentCategory === cat"
                      [class.bg-white]="currentCategory !== cat"
                      [class.dark:bg-gray-900]="currentCategory !== cat"
                      [class.text-gray-900]="currentCategory !== cat"
                      [class.dark:text-white]="currentCategory !== cat"
                      class="px-5 py-2.5 rounded-full text-sm font-bold shadow-sm whitespace-nowrap transition-all border border-gray-100 dark:border-gray-800 hover:shadow-md snap-start shrink-0">
                  {{ cat }}
              </button>
            }
            <!-- Spacer to ensure last item isn't cut off by the right mask -->
            <div class="w-12 shrink-0"></div>
        </div>

        <!-- Scroll Right Button (Desktop/Hover) -->
        <button (click)="scrollCategories('right')"
                class="absolute right-2 top-[30%] -translate-y-1/2 z-20 bg-white/90 dark:bg-black/90 backdrop-blur-sm shadow-lg rounded-full p-2 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white hover:scale-110 transition-all opacity-0 group-hover:opacity-100 border border-gray-100 dark:border-gray-800 hidden sm:flex">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </div>

      <!-- New Posts Badge -->
      @if (hasNewPosts) {
          <div class="flex justify-center -mt-2 mb-2 animate-fade-in">
              <button (click)="loadNewPosts()" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2 transition-all hover:scale-105">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>
                  Yeni Gönderiler
              </button>
          </div>
      }

      <!-- Empty State -->
      @if (api.feedPosts().length === 0) {
        <div class="text-center py-20 animate-fade-in">
          <div class="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-300 dark:text-gray-600"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="12" x2="12" y1="8" y2="16"/><line x1="8" x2="16" y1="12" y2="12"/></svg>
          </div>
          
          @if (currentFeedType === 'following') {
               <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Akış Boş</h3>
               <p class="text-gray-500 dark:text-gray-400 max-w-xs mx-auto leading-relaxed mb-6">Henüz kimseyi takip etmiyorsunuz veya takip ettiklerin henüz bir şey paylaşmadı.</p>
               <button (click)="switchFeedType('foryou')" class="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-full transition-colors">
                   Keşfetmeye Başla
               </button>
          } @else {
              <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Akış Boş</h3>
              <p class="text-gray-500 dark:text-gray-400 max-w-xs mx-auto leading-relaxed">Şu an aktif bir oylama yok. İlk kombini sen paylaş!</p>
          }
        </div>
      }

      <!-- Feed Cards -->
      @for (post of api.feedPosts(); track post.id) {
        <div class="relative group perspective animate-slide-up">
          <div class="bg-white dark:bg-black rounded-[2rem] shadow-xl shadow-gray-200/50 dark:shadow-gray-900/20 border border-gray-100 dark:border-gray-800 overflow-hidden transform transition-all duration-500 hover:shadow-2xl hover:-translate-y-1">

            <!-- Header -->
            <div class="p-5 flex items-center justify-between">
              <div class="flex items-center gap-3 cursor-pointer" [routerLink]="['/profile', post.userId]">
                  <div class="relative">
                      <div class="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-purple-500 to-pink-500 group-hover:from-purple-600 group-hover:to-pink-600 transition-colors">
                          <img [src]="post.user?.avatar || 'https://i.pravatar.cc/150'" class="w-full h-full rounded-full object-cover border-2 border-white dark:border-black">
                      </div>
                  </div>
                  <div>
                      <h4 class="font-bold text-gray-900 dark:text-white leading-tight hover:text-purple-600 dark:hover:text-purple-400 transition-colors">{{ post.user?.name || 'Anonim' }}</h4>
                      <p class="text-xs font-medium text-gray-400 dark:text-gray-500 mt-0.5 flex items-center gap-1">
                          <span class="bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide">{{ post.category || 'Diğer' }}</span>
                          @if (post.location) {
                            <span>•</span>
                            <span class="flex items-center gap-0.5 text-gray-500 dark:text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                {{ post.location }}
                            </span>
                          }
                          <span>•</span>
                          {{ getTimeLeft(post.timestamp) }}
                      </p>
                  </div>
              </div>

              <button class="text-gray-300 dark:text-gray-600 hover:text-gray-900 dark:hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
              </button>
            </div>


              <!-- Image Container -->
              <div class="relative w-full aspect-[4/5] bg-gray-100 dark:bg-gray-900 overflow-hidden group-hover:shadow-inner transition-all cursor-zoom-in"
                   (click)="openImageViewer(post.imageUrl, post.mediaType)">
                <!-- Full URL handling -->
                @if (post.mediaType === 'video' || post.imageUrl.endsWith('.mp4')) {
                  <video [src]="getImageUrl(post.imageUrl)"
                         [muted]="post.isMuted !== false"
                         autoplay loop playsinline
                         class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                         (error)="onVideoError($event)">
                  </video>
                  <!-- Sound Toggle Button -->
                   <button (click)="$event.stopPropagation(); toggleMute(post)"
                           class="absolute top-4 right-4 z-20 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white backdrop-blur-md transition-all opacity-0 group-hover:opacity-100">
                       @if (post.isMuted !== false) {
                         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                           <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>

                           <line x1="17" y1="9" x2="22" y2="14" stroke-width="2"/>
                           <line x1="22" y1="9" x2="17" y2="14" stroke-width="2"/>
                         </svg>                       } @else {
                           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
                       }
                   </button>
                } @else {
                  <img [src]="getImageUrl(post.imageUrl)" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" (error)="onImageError($event)">
                }

                <!-- Gradient Overlay -->
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 pointer-events-none"></div>

                <!-- Floating Description -->
                <div class="absolute bottom-0 left-0 right-0 p-6 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 pointer-events-none">
                   <p class="text-white text-lg font-medium leading-snug drop-shadow-md">
                       {{ post.description }}
                   </p>
                </div>
             </div>

            <!-- Timer Bar -->
            <div class="h-1.5 w-full bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
              <div class="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-[60000ms] ease-linear" [style.width.%]="getTimerProgress(post.timestamp)"></div>
            </div>

            <!-- Actions -->
            <div class="p-4 grid grid-cols-3 gap-3">
              <button (click)="vote(post, 'dislike')"
                      [class.bg-red-50]="post.userVote === 'dislike'"
                      [class.dark:bg-red-900]="post.userVote === 'dislike'"
                      [class.text-red-600]="post.userVote === 'dislike'"
                      [class.dark:text-red-400]="post.userVote === 'dislike'"
                      class="group/btn relative overflow-hidden flex items-center justify-center gap-2 py-4 rounded-2xl bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 font-bold transition-all hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 active:scale-95">
                 <div class="absolute inset-0 bg-red-100/50 dark:bg-red-900/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                 <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" [attr.fill]="post.userVote === 'dislike' ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="relative z-10"><path d="M17 14V2"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z"/></svg>
                 <span class="relative z-10 text-lg">{{ post.dislikes }}</span>
              </button>

              <button (click)="openComments(post)" class="group/btn relative overflow-hidden flex items-center justify-center gap-2 py-4 rounded-2xl bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 font-bold transition-all hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-500 active:scale-95">
                 <div class="absolute inset-0 bg-blue-100/50 dark:bg-blue-900/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                 <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="relative z-10"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                 <span class="relative z-10 text-lg">
                    @if (post.commentCount && post.commentCount > 0) {
                        {{ post.commentCount }}
                    } @else {
                        0
                    }
                 </span>
              </button>

              <button (click)="vote(post, 'like')"
                      [class.bg-green-50]="post.userVote === 'like'"
                      [class.dark:bg-green-900]="post.userVote === 'like'"
                      [class.text-green-600]="post.userVote === 'like'"
                      [class.dark:text-green-400]="post.userVote === 'like'"
                      class="group/btn relative overflow-hidden flex items-center justify-center gap-2 py-4 rounded-2xl bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 font-bold transition-all hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-500 active:scale-95">
                 <div class="absolute inset-0 bg-green-100/50 dark:bg-green-900/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                 <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" [attr.fill]="post.userVote === 'like' ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="relative z-10"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/></svg>
                 <span class="relative z-10 text-lg">{{ post.likes }}</span>
              </button>
            </div>

          </div>
        </div>
      }

      <!-- Footer Spacer -->
      <div class="h-12"></div>
    </div>

    <!-- Image/Video Viewer Modal -->
    @if (viewingImage) {
        <app-media-viewer
            [url]="getImageUrl(viewingImage)"
            [mediaType]="viewingMediaType"
            (close)="closeImageViewer()">
        </app-media-viewer>
    }

    <!-- Comments Modal -->
    @if (showCommentsModal && selectedPost) {
        <app-comments-modal
            [post]="selectedPost"
            (close)="closeComments()">
        </app-comments-modal>
    }
  `,
  styles: `
    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes zoom-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }

    .animate-fade-in { animation: fade-in 0.3s ease-out; }
    .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
    .animate-zoom-in { animation: zoom-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
  `
})
export class Feed implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;
  timerSub?: Subscription;
  categories = ['Sokak Modası', 'Ofis', 'Davet', 'Spor', 'Vintage', 'Diğer'];
  currentCategory = 'Hepsi';
  currentFeedType: 'foryou' | 'following' = 'foryou';
  now = Date.now();

  // Image Viewer State
  viewingImage: string | null = null;
  viewingMediaType: 'image' | 'video' = 'image';

  // Comments State
  showCommentsModal = false;
  selectedPost: Post | null = null;
  
  // Real-time Feed State
  hasNewPosts = false;
  private socket: Socket;

  constructor(public api: ApiService, private cdr: ChangeDetectorRef) {
      this.socket = io('/', { path: '/socket.io' });
  }

  ngOnInit() {
    this.refreshFeed();
    this.setupSocketListeners();
    
    // Subscribe to scroll to top events
    this.api.scrollToTop$.subscribe(() => {
          // Always reset the new posts badge
        this.hasNewPosts = false;
        this.cdr.markForCheck(); // Ensure UI updates
        
        if (this.currentFeedType !== 'foryou') {
             // If we are not on 'foryou', maybe switch to it? 
             // Or just scroll to top of current feed. 
             // Let's scroll to top and refresh.
             window.scrollTo({ top: 0, behavior: 'smooth' });
             this.refreshFeed();
        } else {
             window.scrollTo({ top: 0, behavior: 'smooth' });
             this.refreshFeed();
        }
    });

    // Update timer every second to keep the progress bar smooth and accurate
    this.timerSub = interval(1000).subscribe(() => {
         this.now = Date.now();
         this.cdr.detectChanges();
    });
  }

  setupSocketListeners() {
      // Listen for new posts notification from server
      this.socket.on('new_posts_available', (data: any) => {
          console.log('New posts available:', data);
          // Only show badge if we are not at the top or if the user prefers manual updates
          // For now, let's always show the badge to be safe and interactive
          this.hasNewPosts = true;
          this.cdr.detectChanges();
      });
  }

  loadNewPosts() {
      this.refreshFeed();
      this.hasNewPosts = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Feed Switching Logic
  switchFeedType(type: 'foryou' | 'following') {
      if (this.currentFeedType === type) return;
      this.currentFeedType = type;
      this.refreshFeed();
  }

  // Comments Methods
  openComments(post: Post) {
      this.selectedPost = post;
      this.showCommentsModal = true;
  }

  closeComments() {
      this.showCommentsModal = false;
      this.selectedPost = null;
  }

  // Image Viewer Methods
  openImageViewer(url: string, mediaType: 'image' | 'video' | undefined = 'image') {
    this.viewingImage = url;
    // Stronger detection: If it ends in .mp4, it IS a video, regardless of what mediaType argument says.
    // This fixes issues where old DB data has mediaType: 'image' for video files.
    if (url.endsWith('.mp4')) {
        this.viewingMediaType = 'video';
    } else {
        this.viewingMediaType = mediaType || 'image';
    }
  }

  closeImageViewer() {
    this.viewingImage = null;
  }

  @HostListener('window:keydown.escape')
  onEscape() {
    if (this.viewingImage) this.closeImageViewer();
    if (this.showCommentsModal) this.closeComments();
  }

  scrollCategories(direction: 'left' | 'right') {
    if (!this.scrollContainer) return;

    const container = this.scrollContainer.nativeElement;
    const scrollAmount = 200;

    if (direction === 'left') {
        container.scrollLeft -= scrollAmount;
    } else {
        container.scrollLeft += scrollAmount;
    }
  }

  filterCategory(cat: string) {
    this.currentCategory = cat;
    this.refreshFeed();
  }
  
  refreshFeed() {
      this.api.getFeed(
          this.currentCategory !== 'Hepsi' ? this.currentCategory : undefined,
          this.currentFeedType
      );
  }

  ngAfterViewChecked() {
      // No longer needed to force detectChanges here if we manage 'now' properly
  }

  ngOnDestroy() {
    this.timerSub?.unsubscribe();
    this.socket.disconnect();
  }

  vote(post: Post, type: 'like' | 'dislike') {
    (this.api.vote(post.id, type) as any).subscribe();
  }

  toggleMute(post: Post) {
      // Toggle muted state. Undefined/true means muted, false means unmuted.
      const isMuting = post.isMuted === false;

      // If we are unmuting this video, mute all other videos first
      if (!isMuting) {
          this.api.feedPosts().forEach(p => {
              if (p.id !== post.id && p.mediaType === 'video') {
                  p.isMuted = true;
              }
          });
      }

      post.isMuted = isMuting ? true : false;
  }

  getImageUrl(url: string): string {
    if (url.startsWith('http')) return url;
    return url; // Relative path handled by proxy/nginx
  }

  getTimerProgress(timestamp: number): number {
    const age = this.now - timestamp;
    const oneHour = 1000 * 60 * 60;
    const timeLeft = oneHour - age;
    if (timeLeft <= 0) return 0;
    return (timeLeft / oneHour) * 100;
  }

  getTimeLeft(timestamp: number): string {
    const age = this.now - timestamp;
    const oneHour = 1000 * 60 * 60; // 1 hour for posts

    // For posts (countdown)
    const timeLeft = oneHour - age;

    if (timeLeft <= 0) return 'Süre doldu';

    const minutes = Math.floor(timeLeft / 60000);
    if (minutes < 1) return '< 1 dk';
    return `${minutes} dk kaldı`;
  }

  onVideoError(event: any) {
    console.error('Video loading error:', event);
    // Fallback or UI indication could go here
    // event.target.style.display = 'none';
  }

  onImageError(event: any) {
    console.error('Image loading error:', event);
    event.target.src = 'https://placehold.co/600x800?text=Resim+Yüklenemedi';
  }
}
