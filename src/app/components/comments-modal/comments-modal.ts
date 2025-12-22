import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService, Post, Comment } from '../../services/api';

@Component({
  selector: 'app-comments-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="fixed inset-0 z-[80] flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm transition-opacity" (click)="close.emit()"></div>

        <!-- Modal Content -->
        <div class="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md h-[80vh] flex flex-col relative z-10 shadow-2xl animate-slide-up border border-gray-100 dark:border-gray-800">
            
            <!-- Header -->
            <div class="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                <h3 class="font-bold text-lg text-gray-900 dark:text-white">Yorumlar</h3>
                <button (click)="close.emit()" class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-500 dark:text-gray-400"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
                </button>
            </div>

            <!-- Comments List -->
            <div class="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                @if (comments.length === 0) {
                    <div class="flex flex-col items-center justify-center h-full text-center text-gray-400 dark:text-gray-500 gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                        <p>Henüz yorum yok. İlk yorumu sen yap!</p>
                    </div>
                }
                @for (comment of comments; track comment.id) {
                    <div class="flex gap-3 animate-fade-in">
                        <div [routerLink]="['/profile', comment.userId]" (click)="close.emit()" class="cursor-pointer">
                            <img [src]="comment.user?.avatar || 'https://i.pravatar.cc/150'" class="w-8 h-8 rounded-full object-cover bg-gray-200 dark:bg-gray-700 shrink-0 hover:opacity-80 transition-opacity">
                        </div>
                        <div class="flex-1">
                            <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded-2xl rounded-tl-none">
                                <p [routerLink]="['/profile', comment.userId]" (click)="close.emit()" class="text-xs font-bold text-gray-900 dark:text-white mb-0.5 cursor-pointer hover:underline">{{ comment.user?.name || 'Anonim' }}</p>
                                <p class="text-sm text-gray-700 dark:text-gray-300">{{ comment.text }}</p>
                            </div>
                            <span class="text-[10px] text-gray-400 dark:text-gray-500 ml-1 mt-1 block">{{ getTimeAgo(comment.timestamp) }}</span>
                        </div>
                    </div>
                }
            </div>

            <!-- Input Area -->
            <div class="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-b-3xl">
                <!-- Success Message -->
                @if (showSuccessMessage) {
                    <div class="mb-3 px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm font-medium rounded-xl flex items-center gap-2 animate-fade-in">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                        Yorumunuz başarıyla gönderildi!
                    </div>
                }

                <form (submit)="submitComment()" class="flex gap-2">
                    <input type="text" 
                            [(ngModel)]="newCommentText" 
                            name="comment"
                            placeholder="Yorum yaz..." 
                            class="flex-1 bg-gray-100 dark:bg-gray-800 border-0 rounded-full px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 dark:text-white transition-all outline-none"
                            autocomplete="off">
                    <button type="submit" 
                            [disabled]="!newCommentText.trim() || isSubmittingComment"
                            class="bg-purple-600 hover:bg-purple-700 text-white p-2.5 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                        @if (isSubmittingComment) {
                             <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        } @else {
                             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" x2="11" y1="2" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                        }
                    </button>
                </form>
            </div>
        </div>
    </div>
  `,
  styles: `
    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    
    .animate-fade-in { animation: fade-in 0.3s ease-out; }
    .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
  `
})
export class CommentsModal implements OnInit {
  @Input() post!: Post;
  @Output() close = new EventEmitter<void>();

  comments: Comment[] = [];
  newCommentText = '';
  isSubmittingComment = false;
  showSuccessMessage = false;

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadComments();
    document.body.style.overflow = 'hidden';
  }

  ngOnDestroy() {
    document.body.style.overflow = '';
  }

  loadComments() {
    if (!this.post) return;
    this.api.getComments(this.post.id).subscribe(comments => {
      this.comments = comments;
      this.cdr.detectChanges();
    });
  }

  submitComment() {
    const currentUser = this.api.currentUser();
    if (!this.post || !this.newCommentText.trim() || !currentUser) return;

    this.isSubmittingComment = true;
    this.showSuccessMessage = false;

    this.api.addComment(this.post.id, currentUser.id, this.newCommentText).subscribe({
      next: (comment) => {
        this.comments.unshift(comment);
        this.newCommentText = '';
        this.isSubmittingComment = false;
        
        // Show success message
        this.showSuccessMessage = true;
        this.cdr.detectChanges();

        // Hide message after 3 seconds
        setTimeout(() => {
            this.showSuccessMessage = false;
            this.cdr.detectChanges();
        }, 3000);
      },
      error: () => {
        this.isSubmittingComment = false;
        alert('Yorum gönderilemedi.');
      }
    });
  }

  getTimeAgo(timestamp: number): string {
    const age = Date.now() - timestamp;
    const seconds = Math.floor(age / 1000);
    if (seconds < 60) return 'Az önce';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}dk önce`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}sa önce`;
    return `${Math.floor(hours / 24)}g önce`;
  }
}
