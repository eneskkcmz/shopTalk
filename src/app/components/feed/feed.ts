import { Component, OnInit, OnDestroy, ChangeDetectorRef, AfterViewChecked, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService, Post } from '../../services/api';
import { interval, Subscription } from 'rxjs';
import { CommentsModal } from '../comments-modal/comments-modal';

@Component({
  selector: 'app-feed',
  imports: [CommonModule, RouterLink, CommentsModal],
  template: `
    <div class="max-w-md mx-auto py-8 px-4 flex flex-col gap-8">

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

      <!-- Empty State -->
      @if (api.feedPosts().length === 0) {
        <div class="text-center py-20 animate-fade-in">
          <div class="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-300 dark:text-gray-600"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="12" x2="12" y1="8" y2="16"/><line x1="8" x2="16" y1="12" y2="12"/></svg>
          </div>
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Akış Boş</h3>
          <p class="text-gray-500 dark:text-gray-400 max-w-xs mx-auto leading-relaxed">Şu an aktif bir oylama yok. İlk kombini sen paylaş!</p>
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
                @if (post.mediaType === 'video') {
                  <video [src]="getImageUrl(post.imageUrl)" 
                         [muted]="post.isMuted !== false"
                         autoplay loop playsinline 
                         class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105">
                  </video>
                  <!-- Sound Toggle Button -->
                   <button (click)="$event.stopPropagation(); toggleMute(post)" 
                           class="absolute top-4 right-4 z-20 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white backdrop-blur-md transition-all opacity-0 group-hover:opacity-100">
                       @if (post.isMuted !== false) {
                           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" x2="1" y1="1" y2="23"/></svg>
                       } @else {
                           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
                       }
                   </button>
                } @else {
                  <img [src]="getImageUrl(post.imageUrl)" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105">
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
      <div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl transition-all duration-300 animate-fade-in"
           (click)="closeImageViewer()">
           
           <div class="relative w-full h-full flex items-center justify-center overflow-hidden" (click)="$event.stopPropagation()">
              
              <!-- Close Button -->
              <button (click)="closeImageViewer()" class="absolute top-6 right-6 z-[110] p-3 text-white/90 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 rounded-full transition-all shadow-lg hover:rotate-90 duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
              </button>
  
              <!-- Controls (Only for images) -->
              @if (viewingMediaType !== 'video') {
                <div class="absolute bottom-10 left-1/2 -translate-x-1/2 z-[110] flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-2xl animate-slide-up">
                    <button (click)="zoomOut()" class="p-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Uzaklaş">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="8" x2="14" y1="11" y2="11"/></svg>
                    </button>
                    <span class="text-white/90 font-medium text-xs w-12 text-center select-none">{{ (scale * 100).toFixed(0) }}%</span>
                    <button (click)="zoomIn()" class="p-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Yakınlaş">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="11" x2="11" y1="8" y2="14"/><line x1="8" x2="14" y1="11" y2="11"/></svg>
                    </button>
                    <div class="w-px h-5 bg-white/20 mx-1"></div>
                    <button (click)="rotateLeft()" class="p-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Sola Döndür">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                    </button>
                    <button (click)="rotateRight()" class="p-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Sağa Döndür">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
                    </button>
                </div>
              }
  
              <!-- Content -->
              <div class="w-full h-full flex items-center justify-center p-4 sm:p-10 transition-transform duration-200 ease-out cursor-move animate-zoom-in"
                   (mousedown)="startDrag($event)"
                   (mouseup)="stopDrag()"
                   (mouseleave)="stopDrag()"
                   (mousemove)="onDrag($event)">
                  
                  @if (viewingMediaType === 'video') {
                     <video [src]="getImageUrl(viewingImage!)" 
                            controls autoplay playsinline
                            class="max-w-full max-h-full object-contain rounded-lg drop-shadow-2xl"
                            (click)="$event.stopPropagation()">
                     </video>
                  } @else {
                     <img [src]="getImageUrl(viewingImage!)" 
                          class="max-w-full max-h-full object-contain transition-transform duration-200 drop-shadow-2xl rounded-lg select-none"
                          [style.transform]="getTransformStyle()"
                          (click)="$event.stopPropagation()">
                  }
              </div>
           </div>
      </div>
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
  now = Date.now();

  // Image Viewer State
  viewingImage: string | null = null;
  viewingMediaType: 'image' | 'video' = 'image';
  scale = 1;
  rotation = 0;
  isDragging = false;
  dragStartX = 0;
  dragStartY = 0;
  translateX = 0;
  translateY = 0;

  // Comments State
  showCommentsModal = false;
  selectedPost: Post | null = null;

  constructor(public api: ApiService, private cdr: ChangeDetectorRef) {}
  
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
  openImageViewer(url: string, mediaType: 'image' | 'video' = 'image') {
    this.viewingImage = url;
    this.viewingMediaType = mediaType;
    this.scale = 1;
    this.rotation = 0;
    this.translateX = 0;
    this.translateY = 0;
    document.body.style.overflow = 'hidden';
  }

  closeImageViewer() {
    this.viewingImage = null;
    document.body.style.overflow = '';
  }

  zoomIn() {
    this.scale = Math.min(this.scale + 0.25, 4);
  }

  zoomOut() {
    this.scale = Math.max(this.scale - 0.25, 0.5);
  }

  rotateLeft() {
    this.rotation -= 90;
  }

  rotateRight() {
    this.rotation += 90;
  }

  startDrag(event: MouseEvent) {
    if (this.scale <= 1) return; // Only drag when zoomed in
    this.isDragging = true;
    this.dragStartX = event.clientX - this.translateX;
    this.dragStartY = event.clientY - this.translateY;
  }

  stopDrag() {
    this.isDragging = false;
  }

  onDrag(event: MouseEvent) {
    if (!this.isDragging) return;
    event.preventDefault();
    this.translateX = event.clientX - this.dragStartX;
    this.translateY = event.clientY - this.dragStartY;
  }

  getTransformStyle() {
    return `scale(${this.scale}) rotate(${this.rotation}deg) translate(${this.translateX / this.scale}px, ${this.translateY / this.scale}px)`;
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

  ngOnInit() {
    this.api.getFeed();
    // Update timer every second to keep the progress bar smooth and accurate
    this.timerSub = interval(1000).subscribe(() => {
         this.now = Date.now();
         
         // Only fetch new feed data every 60 seconds (approx)
         if (Math.floor(this.now / 1000) % 60 === 0) {
            this.api.getFeed(this.currentCategory !== 'Hepsi' ? this.currentCategory : undefined);
         }
         
         this.cdr.detectChanges();
    });
  }

  filterCategory(cat: string) {
    this.currentCategory = cat;
    this.api.getFeed(cat !== 'Hepsi' ? cat : undefined);
  }

  ngAfterViewChecked() {
      // No longer needed to force detectChanges here if we manage 'now' properly
  }

  ngOnDestroy() {
    this.timerSub?.unsubscribe();
  }

  vote(post: Post, type: 'like' | 'dislike') {
    (this.api.vote(post.id, type) as any).subscribe();
  }

  toggleMute(post: Post) {
      // Toggle muted state. Undefined/true means muted, false means unmuted.
      post.isMuted = post.isMuted === false ? true : false;
  }

  getImageUrl(url: string): string {
    if (url.startsWith('http')) return url;
    return `http://localhost:3000${url}`;
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
}
