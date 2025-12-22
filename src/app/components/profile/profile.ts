import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ApiService, User, Post } from '../../services/api';
import { CommentsModal } from '../comments-modal/comments-modal';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, CommentsModal],
  template: `
    @if (loading) {
      <div class="flex justify-center items-center h-[50vh]">
          <div class="w-8 h-8 border-4 border-gray-200 dark:border-gray-800 border-t-purple-600 dark:border-t-purple-500 rounded-full animate-spin"></div>
      </div>
    }

    @if (!loading && user) {
      <div class="max-w-screen-lg mx-auto px-4 py-8 animate-fade-in">
        
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
          
          <div class="flex gap-10 mt-8 text-center p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
              <div>
                  <span class="block text-2xl font-black text-gray-900 dark:text-white">{{ posts.length }}</span>
                  <span class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Gönderi</span>
              </div>
              <div class="w-px bg-gray-100 dark:bg-gray-800"></div>
              <div>
                  <span class="block text-2xl font-black text-gray-900 dark:text-white">1.2K</span>
                  <span class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Takipçi</span>
              </div>
              <div class="w-px bg-gray-100 dark:bg-gray-800"></div>
              <div>
                  <span class="block text-2xl font-black text-gray-900 dark:text-white">856</span>
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
                <img [src]="getImageUrl(post.imageUrl)" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110">
                
                <!-- Hover Overlay -->
              <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-4 text-white font-bold backdrop-blur-sm">
                  <div class="flex items-center gap-2 text-xl">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/></svg>
                      {{ post.likes }}
                  </div>
                   <div class="flex items-center gap-2 text-xl text-red-300">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 14V2"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z"/></svg>
                      {{ post.dislikes }}
                  </div>
                  <div class="absolute bottom-4 text-xs font-medium uppercase tracking-widest text-white/80 flex items-center gap-1">
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
  
  // Comments State
  showCommentsModal = false;
  selectedPost: Post | null = null;

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
        const userId = +params['id'];
        if (userId) {
            this.loadProfile(userId);
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

  openComments(post: Post) {
      this.selectedPost = post;
      this.showCommentsModal = true;
  }

  closeComments() {
      this.showCommentsModal = false;
      this.selectedPost = null;
  }

  getImageUrl(url: string): string {
    if (url.startsWith('http')) return url;
    return `http://localhost:3000${url}`;
  }
}
