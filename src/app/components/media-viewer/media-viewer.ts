import { Component, Input, Output, EventEmitter, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-media-viewer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl transition-all duration-300 animate-fade-in"
         (click)="close.emit()">
         
         <div class="relative w-full h-full flex items-center justify-center overflow-hidden" (click)="$event.stopPropagation()">
            
            <!-- Close Button -->
            <button (click)="close.emit()" class="absolute top-6 right-6 z-[110] p-3 text-white/90 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 rounded-full transition-all shadow-lg hover:rotate-90 duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
            </button>

            <!-- Controls (Only for images) -->
            @if (effectiveMediaType !== 'video') {
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
                 (mousemove)="onDrag($event)"
                 (touchstart)="onTouchStart($event)"
                 (touchmove)="onTouchMove($event)"
                 (touchend)="onTouchEnd()">
                
                 @if (effectiveMediaType === 'video') {
                    <video [src]="url" 
                           controls autoplay playsinline
                           class="max-w-full max-h-full object-contain rounded-lg drop-shadow-2xl"
                           (click)="$event.stopPropagation()"
                           (error)="onVideoError($event)">
                    </video>
                 } @else {
                    <img [src]="url" 
                         class="max-w-full max-h-full object-contain transition-transform duration-200 drop-shadow-2xl rounded-lg select-none"
                         [style.transform]="getTransformStyle()"
                         (click)="$event.stopPropagation()"
                         (error)="onImageError($event)">
                 }
            </div>
         </div>
    </div>
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
export class MediaViewer implements OnInit {
  @Input() url!: string;
  @Input() mediaType: 'image' | 'video' = 'image';
  @Output() close = new EventEmitter<void>();

  scale = 1;
  rotation = 0;
  isDragging = false;
  dragStartX = 0;
  dragStartY = 0;
  translateX = 0;
  translateY = 0;

  // Touch State
  lastTouchDistance = 0;
  isPinching = false;

  get effectiveMediaType(): 'image' | 'video' {
    if (this.url && this.url.endsWith('.mp4')) return 'video';
    return this.mediaType;
  }

  ngOnInit() {
    document.body.style.overflow = 'hidden';
  }

  ngOnDestroy() {
    document.body.style.overflow = '';
  }

  onVideoError(event: any) {
     console.error('MediaViewer video error:', event);
  }

  onImageError(event: any) {
      console.error('MediaViewer image error:', event);
      event.target.src = 'https://placehold.co/800x600?text=Görsel+Yüklenemedi';
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

  // Touch Handling
  onTouchStart(event: TouchEvent) {
    if (event.touches.length === 1) {
      if (this.scale > 1) {
        this.isDragging = true;
        this.dragStartX = event.touches[0].clientX - this.translateX;
        this.dragStartY = event.touches[0].clientY - this.translateY;
      }
    } else if (event.touches.length === 2) {
      this.isPinching = true;
      this.lastTouchDistance = this.getDistance(event.touches);
    }
  }

  onTouchMove(event: TouchEvent) {
    event.preventDefault();

    if (this.isDragging && event.touches.length === 1) {
      this.translateX = event.touches[0].clientX - this.dragStartX;
      this.translateY = event.touches[0].clientY - this.dragStartY;
    } else if (this.isPinching && event.touches.length === 2) {
      const currentDistance = this.getDistance(event.touches);
      // Determine direction of pinch
      const delta = currentDistance - this.lastTouchDistance;
      
      // Scale factor (adjustable sensitivity)
      const zoomFactor = delta * 0.005;
      this.scale = Math.min(Math.max(this.scale + zoomFactor, 0.5), 4);
      
      this.lastTouchDistance = currentDistance;
    }
  }

  onTouchEnd() {
    this.isDragging = false;
    this.isPinching = false;
  }

  getDistance(touches: TouchList) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  getTransformStyle() {
    return `scale(${this.scale}) rotate(${this.rotation}deg) translate(${this.translateX / this.scale}px, ${this.translateY / this.scale}px)`;
  }

  @HostListener('window:keydown.escape')
  onEscape() {
    this.close.emit();
  }
}
