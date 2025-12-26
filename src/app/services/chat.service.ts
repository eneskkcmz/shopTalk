import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { ApiService, User } from './api';
import { HttpClient } from '@angular/common/http';

export interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  text: string;
  timestamp: number;
  isRead: boolean;
}

export interface Conversation {
    user: User;
    lastMessage: Message;
    unreadCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private socket: Socket;
  private apiUrl = 'http://localhost:3000/api';

  // State management for current chat
  public messagesSignal = signal<Message[]>([]);
  public conversationsSignal = signal<Conversation[]>([]);
  
  // Computed total unread count
  public totalUnreadCount = signal<number>(0);
  
  // Typing state
  public typingUsersSignal = signal<Set<number>>(new Set());

  constructor(private api: ApiService, private http: HttpClient) {
    this.socket = io('http://localhost:3000');
    
    // Identify user when connected
    const currentUser = this.api.currentUser();
    if (currentUser) {
        this.socket.emit('identify', currentUser.id);
    }

    this.setupListeners();
  }

  private setupListeners() {
      this.socket.on('receive_message', (message: Message) => {
          console.log('New message received:', message);
          // Update message list if we are in that chat
          this.messagesSignal.update(msgs => [...msgs, message]);
          
          // Also update conversation list (to move this chat to top)
          this.refreshConversations();
      });

      this.socket.on('message_sent', (message: Message) => {
          // Update UI for sender
          this.messagesSignal.update(msgs => [...msgs, message]);
          this.refreshConversations();
      });

      this.socket.on('user_typing', (data: { senderId: number }) => {
          this.typingUsersSignal.update(users => {
              const newUsers = new Set(users);
              newUsers.add(data.senderId);
              return newUsers;
          });
      });

      this.socket.on('user_stop_typing', (data: { senderId: number }) => {
          this.typingUsersSignal.update(users => {
              const newUsers = new Set(users);
              newUsers.delete(data.senderId);
              return newUsers;
          });
      });
  }

  sendMessage(receiverId: number, text: string) {
      const currentUser = this.api.currentUser();
      if (!currentUser) return;

      this.socket.emit('send_message', {
          senderId: currentUser.id,
          receiverId,
          text
      });
  }

  sendTyping(receiverId: number) {
      const currentUser = this.api.currentUser();
      if (!currentUser) return;
      this.socket.emit('typing', { senderId: currentUser.id, receiverId });
  }

  stopTyping(receiverId: number) {
      const currentUser = this.api.currentUser();
      if (!currentUser) return;
      this.socket.emit('stop_typing', { senderId: currentUser.id, receiverId });
  }

  loadConversation(otherId: number) {
      const currentUser = this.api.currentUser();
      if (!currentUser) return;

      this.http.get<Message[]>(`${this.apiUrl}/messages/${currentUser.id}/${otherId}`).subscribe(msgs => {
          this.messagesSignal.set(msgs);
          
          // Mark as read locally and on server
          this.markAsRead(otherId);
      });
  }

  markAsRead(otherId: number) {
      const currentUser = this.api.currentUser();
      if (!currentUser) return;
      
      this.http.post(`${this.apiUrl}/messages/mark-read`, { userId: currentUser.id, otherId }).subscribe(() => {
          this.refreshConversations();
      });
  }

  refreshConversations() {
      const currentUser = this.api.currentUser();
      if (!currentUser) return;

      this.http.get<Conversation[]>(`${this.apiUrl}/conversations/${currentUser.id}`).subscribe(convos => {
          this.conversationsSignal.set(convos);
          
          // Calculate total unread
          const total = convos.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
          this.totalUnreadCount.set(total);
      });
  }
}
