import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', loadChildren: './home/home.module#HomePageModule' },
  { path: 'panel', loadChildren: './panel/panel.module#PanelPageModule' },
  { path: 'perfil-editar', loadChildren: './perfil-editar/perfil-editar.module#PerfilEditarPageModule' },
  { path: 'perfil-ver/:id', loadChildren: './perfil-ver/perfil-ver.module#PerfilVerPageModule' },
  { path: 'sala/:id/:soypropietario/:nombre', loadChildren: './sala/sala.module#SalaPageModule' },
  { path: 'sala-miembros/:id/:nombre', loadChildren: './sala-miembros/sala-miembros.module#SalaMiembrosPageModule' },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
