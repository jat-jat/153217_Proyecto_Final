import { ComunService } from './../comun.service';
import { Component } from '@angular/core';
import { NavController, LoadingController, ActionSheetController, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import * as firebase from 'firebase/app';

@Component({
  selector: 'app-panel',
  templateUrl: './panel.page.html',
  styleUrls: ['./panel.page.scss'],
})
export class PanelPage {
  elUsuarioEsNuevo = true;
  // Expresión regular para los nombres de las salas.
  readonly regexNombre: RegExp;
  // Referencia a la base de datos que contiene el escuchador de las salas.
  refDBSalas = firebase.database().ref('/salas');

  salas = {};

  constructor(private navCtrl: NavController, public servicio: ComunService,
    private router: Router, private loadCtrl: LoadingController, private menu: ActionSheetController, private alertCtrl: AlertController) {
      this.regexNombre = new RegExp(/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ]{3,15}$/);
  }

  async inicializar() {
    const cargando = await this.loadCtrl.create({
      message: 'Cargando...'
    });
    await cargando.present();

    // Analizamos si el usuario que acaba de iniciar sesión ya creó su perfil.
    firebase.database().ref('/usuarios/' + this.servicio.getIdUsuario()).once('value', (snapshot) => {
      const datosPerfil = snapshot.val();

      if (datosPerfil && datosPerfil.nick) {
        this.elUsuarioEsNuevo = false;

        // Creamos los eventos relacionados con las salas.
        this.refDBSalas.on('child_added', (snapshot) => {
          const val = snapshot.val();

          this.salas[snapshot.key] = {
            'propietario': val.propietario,
            'key': snapshot.key,
            'nombre': val.nombre,
            'soyMiembro': false
          };

          if (val.miembros) {
            for (let key in val.miembros) {
              if (val.miembros[key] === this.servicio.getIdUsuario()) {
                this.salas[snapshot.key]['soyMiembro'] = true;
                break;
              }
            }
          }
        });

        this.refDBSalas.on('child_changed', (snapshot) => {
          const val = snapshot.val();

          // Actualizamos el nombre.
          this.salas[snapshot.key]['nombre'] = val.nombre;
          // Actualizamos si es miembro, o no.
          let soyMiembro = false;
          if (val.miembros) {
            for (let key in val.miembros) {
              if (val.miembros[key] === this.servicio.getIdUsuario()) {
                soyMiembro = true;
                break;
              }
            }
          }
          this.salas[snapshot.key]['soyMiembro'] = soyMiembro;
        });
        
        this.refDBSalas.on('child_removed', (snapshot) => {
          delete this.salas[snapshot.key];
        });

        // Guardamos el token de Firebase Notifications para que los demás usuarios nos puedan notificar.
        if (this.servicio.firebaseNotifToken) {
          datosPerfil['firebaseNotifToken'] = this.servicio.firebaseNotifToken;
          firebase.database().ref('/usuarios/' + this.servicio.getIdUsuario()).set(datosPerfil);
        }

        cargando.dismiss();
      } else {
        this.elUsuarioEsNuevo = true;

        cargando.dismiss();
        this.servicio.mostrarAlertaSimple(
          'Atención',
          'Es la primera vez que inicias sesión.<br>Crea tu perfil para que todos sepan quién eres.'
        );
        this.router.navigateByUrl('/perfil-editar');
      }
    });
  }

  ionViewWillEnter() {
    if (this.elUsuarioEsNuevo) {
      this.inicializar();
    } else {
      this.navCtrl.navigateRoot('/home');
    }
  }

  cerrarSesion() {
    firebase.database().ref('/usuarios/' + this.servicio.getIdUsuario() + '/firebaseNotifToken').remove();
    this.servicio.setIdUsuario(null);
    this.navCtrl.navigateRoot('/home');
  }

  filtrar(salas, criterio){
    const resultado = [];

    switch (criterio) {
      case 0: // Mis salas.
        for(let key in salas){
          if (salas[key].propietario === this.servicio.getIdUsuario()) {
            resultado.push(salas[key]);
          }
        }
        break;
      case 1: // Salas en las que estoy y no son mías.
        for (let key in salas){
          if (salas[key].propietario !== this.servicio.getIdUsuario() && salas[key].soyMiembro) {
            resultado.push(salas[key]);
          }
        }
        break;
      case 2: // Salas en las que no estoy.
        for (let key in salas){
          if (salas[key].propietario !== this.servicio.getIdUsuario() && !salas[key].soyMiembro) {
            resultado.push(salas[key]);
          }
        }
        break;
    }

    return resultado;
  }

  async mostrarMenu() {
    const menu = await this.menu.create({
      header: 'Menú',
      buttons: [{
        text: 'Ver mi perfil',
        icon: 'person',
        handler: () => {
          this.router.navigateByUrl('/perfil-ver/' + this.servicio.getIdUsuario());
        }
      }, {
        text: 'Editar perfil',
        icon: 'create',
        handler: () => {
          this.router.navigateByUrl('/perfil-editar');
        }
      }, {
        text: 'Cerrar sesión',
        icon: 'undo',
        handler: () => {
          this.cerrarSesion();
        }
      }]
    });

    await menu.present();
  }

  async crearSalaFirebase(nombre){
    const cargando = await this.loadCtrl.create({
      message: 'Cargando...'
    });
    await cargando.present();

    // 1.- Cromprobamos que no existan salas con el mismo nombre.
    firebase.database().ref('/salas').orderByChild('nombre').equalTo(nombre).once('value', (snapshot) => {
      if (snapshot.hasChildren()) {
        cargando.dismiss();
        this.servicio.mostrarAlertaSimple(
          '¡Ups!',
          'Ya existe una sala con este nombre.'
        );
      } else {
        // 2.- Guardamos la sala nueva en la base de datos.
        firebase.database().ref('/salas').push().set({'propietario': this.servicio.getIdUsuario(), 'nombre': nombre})
          .then(() => {
            // ¡ÉXITO!
            cargando.dismiss();
          }).catch((error) => {
            cargando.dismiss();
            this.servicio.mostrarAlertaSimple(
              '¡Ups!',
              'Hubo un error relacionado con la base de datos.<br>Inténtalo más tarde...'
            );
          });
      }
    }, (error) => {
      cargando.dismiss();
      this.servicio.mostrarAlertaSimple(
        '¡Ups!',
        'Hubo un error relacionado con la base de datos.<br>Inténtalo más tarde...'
      );
    });
  }

  async crearSala() {
    const alert = await this.alertCtrl.create({
      header: 'Crea una sala',
      inputs: [
        {
          name: 'nombre',
          type: 'text',
          placeholder: 'Nombre de la sala'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => {
            console.log('Confirm Cancel');
          }
        }, {
          text: 'Crear',
          handler: (datos) => {
            // Eliminamos espacios innecesarios.
            datos.nombre = datos.nombre.replace(/\s+/g, ' ').trim();

            if (!this.regexNombre.test(datos.nombre)) {
              this.servicio.mostrarToastSimple(`El nombre (${datos.nombre}) es inválido.`);
              return false;
            } else {
              this.crearSalaFirebase(datos.nombre);
              return true;
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async unirmeASala(keySala, nombreSala) {
    const alert = await this.servicio.alertCtrl.create({
      header: `Sala '${nombreSala}'`,
      message: '¿Quieres unirte a esta sala?',
      buttons: [ { text: 'No', role: 'cancel' }, { text: 'Sí', handler: async () => {
        const cargando = await this.loadCtrl.create({
          message: `Uniéndome a '${nombreSala}'...`
        });
        await cargando.present();
    
        try {
          await firebase.database().ref('/salas/' + keySala + '/miembros').push().set(this.servicio.getIdUsuario());
          cargando.dismiss();
        } catch (e) {
          cargando.dismiss();
          this.servicio.mostrarAlertaSimple('¡Ups!', 'Algo salió mal.<br>Inténtalo más tarde...');
        }
      }
    }]});

    await alert.present();
  }
}
