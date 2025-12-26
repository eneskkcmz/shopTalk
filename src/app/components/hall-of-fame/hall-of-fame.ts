import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Post } from '../../services/api';
import { MediaViewer } from '../media-viewer/media-viewer';

@Component({
  selector: 'app-hall-of-fame',
  imports: [CommonModule, MediaViewer],
  template: `
    <div class="max-w-2xl mx-auto py-8 px-4">
      <div class="text-center mb-10 animate-fade-in">
        <div class="inline-flex w-20 h-20 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-full items-center justify-center mb-4 shadow-lg shadow-orange-500/30">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </div>
        <h1 class="text-3xl font-black mb-2 text-gray-900 dark:text-white tracking-tight">Şeref Kürsüsü</h1>
        <p class="text-gray-500 dark:text-gray-400 text-lg">Tüm zamanların en beğenilen kombinleri</p>
      </div>

      <div class="grid gap-6">
        @for (post of posts; track post.id; let i = $index) {
            <div (click)="openMedia(post)" class="bg-white dark:bg-gray-900 rounded-2xl p-4 flex gap-4 items-center shadow-sm border border-gray-100 dark:border-gray-800 animate-slide-up cursor-pointer hover:shadow-md transition-all" [style.animation-delay]="i * 100 + 'ms'">
                <div class="flex-shrink-0 text-2xl font-bold w-10 text-center text-gray-300 dark:text-gray-700">#{{ i + 1 }}</div>
                
                <div class="relative w-20 h-24 flex-shrink-0">
                    @if (post.mediaType === 'video' || post.imageUrl.endsWith('.mp4')) {
                        <video [src]="getImageUrl(post.imageUrl)" 
                            muted
                            class="w-full h-full object-cover rounded-xl bg-gray-100 dark:bg-gray-800"
                            onmouseover="this.play()"
                            onmouseout="this.pause(); this.currentTime = 0;"
                            (error)="onVideoError($event)">
                        </video>
                        <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div class="bg-black/30 p-1 rounded-full backdrop-blur-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                            </div>
                        </div>
                    } @else {
                        <img [src]="getImageUrl(post.imageUrl)" class="w-full h-full object-cover rounded-xl bg-gray-100 dark:bg-gray-800" (error)="onImageError($event)">
                    }
                </div>
                
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                         <img [src]="post.user?.avatar || 'https://i.pravatar.cc/150'" class="w-5 h-5 rounded-full">
                         <span class="text-sm font-bold text-gray-900 dark:text-white truncate">{{ post.user?.name }}</span>
                    </div>
                    <p class="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 mb-2">{{ post.description }}</p>
                    <div class="flex items-center gap-4 text-xs font-medium">
                        <span class="flex items-center gap-1 text-green-600 dark:text-green-400">
                             <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/></svg>
                             {{ post.likes }}
                        </span>
                        <span class="flex items-center gap-1 text-red-500 dark:text-red-400">
                             <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 14V2"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z"/></svg>
                             {{ post.dislikes }}
                        </span>
                        <span class="text-gray-400 ml-auto">{{ getTimeAgo(post.timestamp) }}</span>
                    </div>
                </div>
            </div>
        }
      </div>
      
      <!-- Media Viewer -->
      @if (viewingMedia) {
        <app-media-viewer
            [url]="viewingMedia.url"
            [mediaType]="viewingMedia.type"
            (close)="closeMedia()">
        </app-media-viewer>
      }
    </div>
  `,
  styles: `
    @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    
    .animate-fade-in { animation: fade-in 0.6s ease-out; }
    .animate-slide-up { animation: slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) backwards; }
  `
})
export class HallOfFame implements OnInit {
  posts: Post[] = [];
  viewingMedia: { url: string, type: 'image' | 'video' } | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<Post[]>('http://localhost:3000/api/hall-of-fame').subscribe(posts => {
        this.posts = posts;
    });
  }

  getImageUrl(url: string): string {
    if (url.startsWith('http')) return url;
    return `http://localhost:3000${url}`;
  }

  getTimeAgo(timestamp: number): string {
    const age = Date.now() - timestamp;
    const hours = Math.floor(age / (1000 * 60 * 60));
    if (hours < 24) return `${hours}sa önce`;
    const days = Math.floor(hours / 24);
    return `${days}g önce`;
  }

  openMedia(post: Post) {
      // Strong check for video extension
      const isVideo = post.mediaType === 'video' || post.imageUrl.endsWith('.mp4');
      this.viewingMedia = {
          url: this.getImageUrl(post.imageUrl),
          type: isVideo ? 'video' : 'image'
      };
  }

  closeMedia() {
      this.viewingMedia = null;
  }

  onVideoError(event: any) {
    console.error('Video loading error in hall of fame:', event);
  }

  onImageError(event: any) {
    console.error('Image loading error in hall of fame:', event);
    event.target.src = 'https://placehold.co/150x150?text=Yüklenemedi';
  }
}

