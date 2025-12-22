import { Routes } from '@angular/router';
import { Feed } from './components/feed/feed';
import { Profile } from './components/profile/profile';
import { HallOfFame } from './components/hall-of-fame/hall-of-fame';

export const routes: Routes = [
    { path: '', component: Feed },
    { path: 'profile/:id', component: Profile },
    { path: 'hall-of-fame', component: HallOfFame },
    { path: '**', redirectTo: '' }
];
