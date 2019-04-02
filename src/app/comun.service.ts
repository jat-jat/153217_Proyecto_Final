/* Sevicio universal de la app */

import { Injectable } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import * as firebase from 'firebase';
import { Firebase as FirebaseNotifications } from '@ionic-native/firebase/ngx';
import { NativeAudio } from '@ionic-native/native-audio/ngx';
import { BackgroundMode } from '@ionic-native/background-mode/ngx';

@Injectable({
  providedIn: 'root'
})
export class ComunService {
  firebaseNotifToken: string;
  private idUsuario = null;
  // Contiene la siguiente información de los usuarios en tiempo real: nick y foto.
  infoBasicaUsuarios = {};

  constructor(public alertCtrl: AlertController, private toastCtrl: ToastController, private firebaseNotif: FirebaseNotifications, public audio: NativeAudio, private backgroundMode: BackgroundMode) {
    firebase.database().ref('/usuarios').on('value', (snapshot) => {
      const val = snapshot.val();
      const nuevaInfo = {};

      for (const key in val){
        if (val[key].nick) {
          nuevaInfo[key] = {
            'nick': val[key].nick,
            'foto': val[key].foto,
            'firebaseNotifToken': (val[key]['firebaseNotifToken'] ? val[key]['firebaseNotifToken'] : null)
          };
        }
      }

      this.infoBasicaUsuarios = nuevaInfo;
    });

    // Obtenemos un token para esta instancia.
    firebaseNotif.getToken().then((token) => {
      this.firebaseNotifToken = token;
    });
    
    // Se define el evento de cuando el token cambia.
    this.firebaseNotif.onTokenRefresh()
      .subscribe((token: string) => this.firebaseNotifToken = token);
    
    // Se define el evento de cuando se recibe una notificación.
    firebaseNotif.onNotificationOpen().subscribe (data => {
      this.audio.play('notificacion');
      // Se muestra la notificación dentro de la app.
      this.mostrarToastSimple(data.body);
    });

    // Cargamos los sonidos.
    this.audio.preloadSimple('nuevo_msg', 'assets/sonidos/nuevo_msg.mp3');
    this.audio.preloadSimple('notificacion', 'assets/sonidos/notificacion.mp3');

    // Se hace que la app no se duerma en segundo plano.
    this.backgroundMode.enable();
  }

  setIdUsuario(idUsuario) {
    this.idUsuario = idUsuario;
  }

  getIdUsuario() {
    return this.idUsuario;
  }

  async mostrarAlertaSimple(cabecera, mensaje) {
    const alert = await this.alertCtrl.create({
      header: cabecera,
      message: mensaje,
      buttons: ['Ok']
    });

    await alert.present();
  }

  /**
   * Muestra un toast (un rectángulo con un texto), en el centro de la pantalla, por un par de segundos.
   * @param texto El texto que contendrá el toast.
   */
  async mostrarToastSimple(texto: string) {
    const toast = await this.toastCtrl.create({
      message: texto,
      position: 'middle',
      duration: 2000
    });

    toast.present();
  }
}
