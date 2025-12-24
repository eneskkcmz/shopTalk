import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';

export interface User {
  id: number;
  name: string;
  avatar: string;
  bio: string;
  followers?: number;
}

export interface Post {
  id: number;
  userId: number;
  imageUrl: string;
  mediaType?: 'image' | 'video';
  description: string;
  category: string;
  location?: string;
  timestamp: number;
  likes: number;
  dislikes: number;
  user?: User; 
  isActive?: boolean;
  commentCount?: number;
  userVote?: 'like' | 'dislike' | null;
  isMuted?: boolean;
}

export interface Comment {
    id: number;
    postId: number;
    userId: number;
    text: string;
    timestamp: number;
    user?: User;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:3000/api';

  // Signals for state management
  private feedPostsSignal = signal<Post[]>([]);
  // Initialize with a mock user for now (simulating a logged-in session)
  private currentUserSignal = signal<User | null>({
      id: 1,
      name: 'Enes Kocamaz',
      avatar: 'https://i.pravatar.cc/150?u=1',
      bio: 'Fashion enthusiast | Minimalist style',
      followers: 2423
  });

  // Read-only signals for components
  feedPosts = this.feedPostsSignal.asReadonly();
  currentUser = this.currentUserSignal.asReadonly();

  constructor(private http: HttpClient) { }

  getFeed(category?: string) {
    const params: any = {};
    if (category) params.category = category;
    
    // Pass current user ID to check vote status
    const currentUser = this.currentUserSignal();
    if (currentUser) {
        params.userId = currentUser.id;
    }

    this.http.get<Post[]>(`${this.apiUrl}/feed`, { params }).pipe(
      catchError(err => {
        console.error('Error fetching feed:', err);
        return of([]);
      })
    ).subscribe(posts => {
        console.log('Fetched posts:', posts);
        this.feedPostsSignal.set(posts);
    });
  }

  getUsers(): Observable<User[]> {
      return this.http.get<User[]>(`${this.apiUrl}/users`);
  }

  setCurrentUser(user: User) {
      this.currentUserSignal.set(user);
  }

  getUserProfile(id: number): Observable<{ user: User, posts: Post[] }> {
    return this.http.get<{ user: User, posts: Post[] }>(`${this.apiUrl}/users/${id}`);
  }

  searchUsers(query: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users/search`, { params: { q: query } });
  }

  createPost(formData: FormData): Observable<Post> {
    return this.http.post<Post>(`${this.apiUrl}/posts`, formData).pipe(
        tap(() => this.getFeed()) // Refresh feed after posting
    );
  }

    vote(postId: number, type: 'like' | 'dislike') {
    const currentUser = this.currentUserSignal();
    if (!currentUser) return of(null); // Should not happen if guard exists

    return this.http.post<Post>(`${this.apiUrl}/vote`, { postId, userId: currentUser.id, type }).pipe(
        tap(updatedPost => {
             this.feedPostsSignal.update(posts => 
                posts.map(p => p.id === postId ? { 
                    ...p, 
                    likes: updatedPost.likes, 
                    dislikes: updatedPost.dislikes,
                    userVote: updatedPost.userVote 
                } : p)
             );
        })
    );
  }

  getComments(postId: number): Observable<Comment[]> {
      return this.http.get<Comment[]>(`${this.apiUrl}/posts/${postId}/comments`);
  }

  addComment(postId: number, userId: number, text: string): Observable<Comment> {
      return this.http.post<Comment>(`${this.apiUrl}/posts/${postId}/comments`, { userId, text });
  }
}
