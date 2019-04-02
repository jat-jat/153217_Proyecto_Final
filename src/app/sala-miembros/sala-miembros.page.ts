import { LoadingController, NavController } from '@ionic/angular';
import { ComunService } from './../comun.service';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import * as firebase from 'firebase/app';

@Component({
  selector: 'app-sala-miembros',
  templateUrl: './sala-miembros.page.html',
  styleUrls: ['./sala-miembros.page.scss'],
})
export class SalaMiembrosPage {
  miembrosID = {};
  idSala: string;
  nombreSala: string;
  Object = Object;

  idUsuarioPropietario: string;

  refDB: firebase.database.Reference;

  constructor(public servicio: ComunService, private actRoute: ActivatedRoute, private loadCtrl: LoadingController, private navCtrl: NavController) {
    this.idSala = this.actRoute.snapshot.paramMap.get('id');
    this.nombreSala = this.actRoute.snapshot.paramMap.get('nombre');
    this.inicializar();
  }

  async inicializar() {
    const cargando = await this.loadCtrl.create({
      message: 'Cargando...'
    });
    await cargando.present();

    let primeraCarga = true;

    this.refDB = firebase.database().ref('/salas/' + this.idSala + '/miembros');

    firebase.database().ref('/salas/' + this.idSala + '/propietario').once('value', (snapshot) => {
      this.idUsuarioPropietario = snapshot.val();
    });

    this.refDB.on('value', (snapshot) => {
      if (snapshot.exists()) {
        this.miembrosID = snapshot.val();
      }

      if (primeraCarga) {
        cargando.dismiss();
        primeraCarga = false;
      }
    });
  }

  /*ngOnDestroy() {
    if (this.refDB) {
      this.refDB.off();
    }
  }*/

}
