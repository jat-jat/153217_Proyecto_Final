import { LoadingController, NavController } from '@ionic/angular';
import { ComunService } from './../comun.service';
import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import * as firebase from 'firebase/app';
import { PhotoViewer } from '@ionic-native/photo-viewer/ngx';
import * as moment from 'moment';

@Component({
  selector: 'app-perfil-ver',
  templateUrl: './perfil-ver.page.html',
  styleUrls: ['./perfil-ver.page.scss'],
})
export class PerfilVerPage implements OnDestroy {
  // Referencia al punto de la base de datos, en donde se almacenan los datos del usuario.
  refDB: firebase.database.Reference;

  // Indica si el perfil que se visita es el de la persona que está usando la app.
  esMiPerfil = false;

  datosPerfil = {
    'nick': '...',
    'nombre': '...',
    'apellidos': '...',
    'sexo': 'M',
    'edad': 0,
    'fecha_nacimiento': '...',
    'estado': '...',
    'municipio': '...',
    'foto': ''
  };

  constructor(private actRoute: ActivatedRoute, private servicio: ComunService, private loadCtrl: LoadingController, private navCtrl: NavController, public visorImg: PhotoViewer) {
    this.inicializar();
  }

  async inicializar() {
    let primeraCarga = true;

    const cargando = await this.loadCtrl.create({
      message: 'Cargando...'
    });
    await cargando.present();

    const idUsuario = this.actRoute.snapshot.paramMap.get('id');

    this.esMiPerfil = (idUsuario === this.servicio.getIdUsuario());

    this.refDB = firebase.database().ref('/usuarios/' + idUsuario);
    this.refDB.on('value', (snapshot) => {
      this.datosPerfil = snapshot.val();

      // Se ajusta el formato de la fecha de nacimiento a '1 de enero de 2000'.
      if (this.datosPerfil.fecha_nacimiento) {
        this.datosPerfil.fecha_nacimiento = (new Date(this.datosPerfil.fecha_nacimiento)).toLocaleDateString(
          'es-MX', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'
        });

        // Se calcula la edad.
        this.datosPerfil['edad'] = Math.floor(moment().startOf('day').diff(
          moment(this.datosPerfil.fecha_nacimiento.split('T')[0], ['YYYY-MM-DD', 'MM-DD-YYYY']), 'years', true));
      }

      if (primeraCarga) {
        primeraCarga = false;
        cargando.dismiss();
      }
    }, (error) => {
      cargando.dismiss();
      this.servicio.mostrarAlertaSimple(
        '¡Ups!',
        'No se pudieron cargar los datos, inténtelo más tarde.'
      );
      this.navCtrl.back();
    });
  }

  verFoto() {
    this.visorImg.show(this.datosPerfil.foto);
  }

  ngOnDestroy() {
    if (this.refDB) {
      this.refDB.off();
    }
  }
}
