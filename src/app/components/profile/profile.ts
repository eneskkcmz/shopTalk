import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { ApiService, User, Post } from '../../services/api';
import { CommentsModal } from '../comments-modal/comments-modal';
import { MediaViewer } from '../media-viewer/media-viewer';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, CommentsModal, MediaViewer, RouterLink],
  template: `
    @if (loading) {
      <div class="flex justify-center items-center h-[50vh]">
          <div class="w-8 h-8 border-4 border-gray-200 dark:border-gray-800 border-t-purple-600 dark:border-t-purple-500 rounded-full animate-spin"></div>
      </div>
    }

@if (!loading && user) {
      <div class="max-w-screen-lg mx-auto px-4 pt-8 pb-24 animate-fade-in">

        <!-- Header -->
        <div class="flex flex-col items-center text-center mb-12">
          <div class="relative w-32 h-32 mb-6 group">
              <div class="absolute inset-0 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-full blur-md opacity-75 group-hover:opacity-100 transition-opacity"></div>
              <div class="relative w-full h-full rounded-full p-1 bg-white dark:bg-black overflow-hidden shadow-xl">
                  <img [src]="user.avatar" class="w-full h-full rounded-full object-cover">
              </div>
          </div>

          <h1 class="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{{ user.name }}</h1>
          <p class="text-gray-500 dark:text-gray-400 font-medium max-w-sm mt-2">{{ user.bio }}</p>

          <!-- Action Buttons -->
          @if (!isOwnProfile) {
            <div class="flex gap-4 mt-6">
                <button
                    (click)="toggleFollow()"
                    [class.bg-gray-200]="isFollowing"
                    [class.text-gray-900]="isFollowing"
                    [class.bg-black]="!isFollowing"
                    [class.text-white]="!isFollowing"
                    [class.dark:bg-white]="!isFollowing"
                    [class.dark:text-black]="!isFollowing"
                    class="px-8 py-2.5 rounded-full font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-lg">
                    {{ isFollowing ? 'Takipten Çık' : 'Takip Et' }}
                </button>

                <a
                    [routerLink]="['/chat', user.id]"
                    class="px-8 py-2.5 rounded-full font-bold text-sm bg-purple-600 hover:bg-purple-700 text-white transition-all hover:scale-105 active:scale-95 shadow-lg shadow-purple-500/20 flex items-center gap-2 cursor-pointer no-underline">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    Mesaj
                </a>
            </div>
          }

          <div class="flex gap-10 mt-8 text-center p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
              <div>
                  <span class="block text-2xl font-black text-gray-900 dark:text-white">{{ posts.length }}</span>
                  <span class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Gönderi</span>
              </div>
              <div class="w-px bg-gray-100 dark:bg-gray-800"></div>
              <div>
                  <span class="block text-2xl font-black text-gray-900 dark:text-white">{{ stats.followers }}</span>
                  <span class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Takipçi</span>
              </div>
              <div class="w-px bg-gray-100 dark:bg-gray-800"></div>
              <div>
                  <span class="block text-2xl font-black text-gray-900 dark:text-white">{{ stats.following }}</span>
                  <span class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Takip</span>
              </div>
          </div>
        </div>

        <!-- Divider -->
        <div class="border-t border-gray-100 dark:border-gray-800 mb-8 flex justify-center">
          <span class="px-8 py-3 border-t-2 border-black dark:border-white -mt-[1px] text-xs font-black tracking-widest uppercase bg-white dark:bg-black text-black dark:text-white">Arşiv & Akış</span>
        </div>

        <!-- Empty State -->
         @if (posts.length === 0) {
           <div class="text-center py-12 text-gray-400 dark:text-gray-600">
             <p>Henüz gönderi yok.</p>
           </div>
         }

              <!-- Grid -->
        <div class="grid grid-cols-2 md:grid-cols-3 gap-1 md:gap-8">
          @for (post of posts; track post.id) {
            <div (click)="openComments(post)" class="relative group aspect-[4/5] bg-gray-100 dark:bg-gray-900 cursor-pointer overflow-hidden rounded-md md:rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300">
                <!-- Full URL handling -->
                @if (post.mediaType === 'video' || post.imageUrl.endsWith('.mp4')) {
                  <video [src]="getImageUrl(post.imageUrl)"
                         muted
                         class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                         onmouseover="this.play()"
                         onmouseout="this.pause(); this.currentTime = 0;"
                         (error)="onVideoError($event)">
                  </video>

                  <!-- Video Indicator Icon -->
                  <div class="absolute top-2 right-2 bg-black/50 p-1.5 rounded-full backdrop-blur-sm z-10 group-hover:opacity-0 transition-opacity">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  </div>
                } @else {
                  <img [src]="getImageUrl(post.imageUrl)" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" (error)="onImageError($event)">
                }

                  <!-- Hover Overlay -->
                  <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-4 text-white font-bold backdrop-blur-sm">

                  @if (post.location) {
                    <div class="absolute top-3 left-0 right-0 text-center px-2 pointer-events-none">
                        <span class="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider bg-black/40 px-2 py-1 rounded-full backdrop-blur-md border border-white/20">
                             <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                             {{ post.location }}
                        </span>
                    </div>
                  }

                  <!-- Height/Weight Indicator -->
                  @if (post.height || post.weight) {
                      <div class="absolute top-10 left-0 right-0 text-center px-2 pointer-events-none mt-1">
                          <span class="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider bg-purple-600/60 px-2 py-1 rounded-full backdrop-blur-md border border-white/20">
                              {{ post.height ? post.height + 'cm' : '' }}{{ post.height && post.weight ? ' / ' : '' }}{{ post.weight ? post.weight + 'kg' : '' }}
                          </span>
                      </div>
                  }

                  <!-- View Fullscreen Button -->
                  <button (click)="openMedia(post, $event)" class="absolute top-3 left-3 p-2 bg-white/20 hover:bg-white/40 rounded-full backdrop-blur-md transition-colors" title="Büyük Halini Gör">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" x2="14" y1="3" y2="10"/><line x1="3" x2="10" y1="21" y2="14"/></svg>
                  </button>

                  <div class="flex items-center gap-2 text-xl pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/></svg>
                      {{ post.likes }}
                  </div>
                   <div class="flex items-center gap-2 text-xl text-red-300 pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 14V2"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z"/></svg>
                      {{ post.dislikes }}
                  </div>
                  <div class="absolute bottom-4 text-xs font-medium uppercase tracking-widest text-white/80 flex items-center gap-1 pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                      @if (post.commentCount && post.commentCount > 0) {
                          {{ post.commentCount }}
                      } @else {
                          0
                      }
                      Yorum
                  </div>
              </div>

                <!-- Status Badge -->
                @if (post.isActive) {
                  <div class="absolute top-3 right-3 bg-white/90 dark:bg-black/90 text-purple-600 dark:text-purple-400 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                      Yayında
                  </div>
                }
            </div>
          }
        </div>

        <!-- Comments Modal -->
        @if (showCommentsModal && selectedPost) {
            <app-comments-modal
                [post]="selectedPost"
                (close)="closeComments()">
            </app-comments-modal>
        }

        <!-- Media Viewer -->
        @if (viewingMedia) {
            <app-media-viewer
                [url]="viewingMedia.url"
                [mediaType]="viewingMedia.type"
                (close)="closeMedia()">
            </app-media-viewer>
        }

      </div>
    }
  `,
  styles: `
    @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fade-in { animation: fade-in 0.6s ease-out; }
  `
})
export class Profile implements OnInit {
  user?: User;
  posts: Post[] = [];
  loading = true;
  isFollowing = false;
  isOwnProfile = false;
  stats = { followers: 0, following: 0 };

  // Comments State
  showCommentsModal = false;
  selectedPost: Post | null = null;

  // Media Viewer State
  viewingMedia: { url: string, type: 'image' | 'video' } | null = null;

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
        const userId = +params['id'];
        if (userId) {
            this.loadProfile(userId);

            // Check if it's the current user's own profile
            const currentUser = this.api.currentUser();
            this.isOwnProfile = currentUser?.id === userId;
        }
    });
  }

  loadProfile(id: number) {
    this.loading = true;
    this.api.getUserProfile(id).subscribe({
        next: (data) => {
            console.log("Profile data loaded:", data);
            this.user = data.user;
            this.posts = data.posts;
            this.isFollowing = data.isFollowing;
            this.stats = data.stats;
            this.loading = false;
            this.cdr.markForCheck(); // Manually trigger change detection
        },
        error: (err) => {
            console.error("Error loading profile:", err);
            this.loading = false;
            this.cdr.markForCheck();
        }
    });
  }

  toggleFollow() {
      if (!this.user) return;

      // Optimistic Update
      this.isFollowing = !this.isFollowing;
      this.stats.followers += this.isFollowing ? 1 : -1;

      this.api.toggleFollow(this.user.id).subscribe({
          next: (res) => {
              // Ensure state matches server response
              this.isFollowing = res.isFollowing;
              this.cdr.markForCheck();
          },
          error: () => {
              // Revert on error
              this.isFollowing = !this.isFollowing;
              this.stats.followers += this.isFollowing ? 1 : -1;
              this.cdr.markForCheck();
          }
      });
  }

  openComments(post: Post) {
      this.selectedPost = post;
      this.showCommentsModal = true;
  }

  closeComments() {
      this.showCommentsModal = false;
      this.selectedPost = null;
  }

  openMedia(post: Post, event: Event) {
      event.stopPropagation();
      const isVideo = post.mediaType === 'video' || post.imageUrl.endsWith('.mp4');
      this.viewingMedia = {
          url: this.getImageUrl(post.imageUrl),
          type: isVideo ? 'video' : 'image'
      };
  }

  closeMedia() {
      this.viewingMedia = null;
  }

  getImageUrl(url: string): string {
    if (url.startsWith('http')) return url;
    return url; // Relative path handled by proxy/nginx
  }

  onVideoError(event: any) {
    console.error('Video loading error in profile:', event);
  }

  onImageError(event: any) {
    console.error('Image loading error in profile:', event);
    event.target.src = 'https://placehold.co/600x800?text=Resim+Yüklenemedi';
  }
}