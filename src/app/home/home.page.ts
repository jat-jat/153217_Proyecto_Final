import { ComunService } from './../comun.service';
import { Component, ViewChild, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoadingController, IonCheckbox } from '@ionic/angular';
import { Router } from '@angular/router';
import { FirebaseAuthentication } from '@ionic-native/firebase-authentication/ngx';
import * as firebase from 'firebase/app';
import { Storage } from '@ionic/storage';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit{
  @ViewChild('checkRecordar') checkRecordar: IonCheckbox;

  formulario: FormGroup;
  // Indica si se muestran los controles de inicio de sesión o recuperación de cuenta.
  modoIniciarSesion = true;
  // Referencia a la base de datos.
  readonly refDb: firebase.database.Reference;

  constructor(private formBuilder: FormBuilder, private servicio: ComunService, 
    private router: Router, private sesion: FirebaseAuthentication,
    private loadCtrl: LoadingController, private storage: Storage) {
      this.formulario = this.formBuilder.group({
        'correo': ['', Validators.compose([Validators.required,
          Validators.pattern(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)])],
        'contrasena': ['', Validators.compose([Validators.required, Validators.minLength(6)])]
      });
      this.refDb = firebase.database().ref();
    }

    /**
     * Checa si hay un usuario recordado, y si es así, inicia su sesión.
     */
    async ngOnInit() {
      const length = await this.storage.length();

      if (length !== 0) {
        this.checkRecordar.checked = true;
        const usuarioRecordado = await this.storage.get('usuarioRecordado');

        this.formulario.get('correo').markAsTouched();
        this.formulario.get('contrasena').markAsTouched();
        this.formulario.setValue(usuarioRecordado);
        
        this.iniciarSesion();
      } else {
        this.checkRecordar.checked = false;
      }
      
      this.checkRecordar.ionChange.subscribe(() => {
        if (!this.checkRecordar.checked) {
          this.storage.clear();
        }
      });
    }

    ionViewWillEnter() {
      if (this.servicio.getIdUsuario()) {
        this.router.navigateByUrl('/panel');
      }
    }
    
    /**
     * Obtiene el mensaje de un error de Firebase Authentication, en español.
     */
    obtenerMsgErrorOAuth (error) {
      let mensaje = '';
      if (typeof error === 'string') {
        if (error.startsWith('There is no user record')) {
          mensaje = 'No existe una cuenta asociada a este correo.';
        } else if (error.startsWith('The password is invalid')) {
          mensaje = 'La contraseña es incorrecta.';
        } else if (error.startsWith('The email address is already in use')) {
          mensaje = 'Ya existe una cuenta asociada a este correo.';
        } else {
          // Si el mensaje es desconocido, se muestra en inglés.
          mensaje = error;
        }
      } else {
        // En caso de que el error no sea de Firebase Authentication.
        mensaje = error.message;
      }

      return mensaje;
    }
  
  async iniciarSesion() {
    const cargando = await this.loadCtrl.create({
      message: 'Iniciando sesión...'
    });
    await cargando.present();

    try {
      const usuario = await this.sesion.signInWithEmailAndPassword(
        this.formulario.value.correo,
        this.formulario.value.contrasena
      );

      this.servicio.setIdUsuario(usuario.uid);

      // Guardamos el usuario recordado...
      if (this.checkRecordar.checked) {
        await this.storage.set('usuarioRecordado', this.formulario.value);
      }

      await cargando.dismiss();
      // Cambiamos de página.
      this.router.navigateByUrl('/panel');
    } catch (error) {
      await cargando.dismiss();
      await this.servicio.mostrarAlertaSimple('Error', this.obtenerMsgErrorOAuth(error));
    }
  }

  async crearCuenta(){
    const cargando = await this.loadCtrl.create({
      message: 'Creando cuenta...'
    });
    await cargando.present();

    try {
      // Se crea el usuario en Firebase OAuth.
      const nuevoUsuario = await this.sesion.createUserWithEmailAndPassword(
        this.formulario.value.correo,
        this.formulario.value.contrasena
      );
      
      // Se crea el usuario en la base de datos.
      await this.refDb.child('usuarios').child(nuevoUsuario.uid).set({
        correo: nuevoUsuario.email
      });

      await cargando.dismiss();
      this.iniciarSesion();
    } catch (error) {
      await cargando.dismiss();
      await this.servicio.mostrarAlertaSimple('Error', this.obtenerMsgErrorOAuth(error));
    }
  }

  async recuperarContrasena(){
    const cargando = await this.loadCtrl.create({
      message: 'Enviando correo...'
    });
    await cargando.present();

    try {
      await this.sesion.sendPasswordResetEmail(this.formulario.value.correo);
      
      await cargando.dismiss();
      await this.servicio.mostrarAlertaSimple(
        '¡Listo!', 'Te hemos enviado un email que te permitirá cambiar tu contraseña.'
      );
    } catch (error) {
      await cargando.dismiss();
      await this.servicio.mostrarAlertaSimple('Error', this.obtenerMsgErrorOAuth(error));
    }
  }

  async cambiarModo(){
    this.modoIniciarSesion = !this.modoIniciarSesion;
  }
}
