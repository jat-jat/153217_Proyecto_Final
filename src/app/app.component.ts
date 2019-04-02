import { Component } from '@angular/core';

import { Platform, ToastController } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import * as firebase from 'firebase';

// Configuración de Firebase (para manejar la base de datos).
const configFirebase = {
  apiKey: 'AIzaSyCZA3MxJ2tBVazJiTpJtezseB-bCSyv4FE',
  authDomain: 'microchat-5098f.firebaseapp.com',
  databaseURL: 'https://microchat-5098f.firebaseio.com',
  projectId: 'microchat-5098f',
  storageBucket: 'microchat-5098f.appspot.com',
  messagingSenderId: '358776362405'
};

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html'
})
export class AppComponent {
  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.splashScreen.hide();

      // Al pulsar el botón de retorno de Android, salimos de la app.
      this.platform.backButton.subscribe(() => {
        navigator['app'].exitApp();
      });
    });

    // Inicialización de Firebase.
    firebase.initializeApp(configFirebase);
  }
}
