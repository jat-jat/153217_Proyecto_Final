import { LoadingController, NavController } from '@ionic/angular';
import { ComunService } from './../comun.service';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Camera, CameraOptions, PictureSourceType } from '@ionic-native/camera/ngx';
import * as firebase from 'firebase/app';
import * as mapaMexico from './../mexico';
import { PhotoViewer } from '@ionic-native/photo-viewer/ngx';

@Component({
  selector: 'app-perfil-editar',
  templateUrl: './perfil-editar.page.html',
  styleUrls: ['./perfil-editar.page.scss'],
})
export class PerfilEditarPage{
  formulario: FormGroup;
  datosActuales = null;
  estados = [];
  municipios = [];

  // Opciones de la cámara.
  opcionesCam: CameraOptions = {
    quality: 90,
    destinationType: this.camara.DestinationType.DATA_URL,
    encodingType: this.camara.EncodingType.JPEG,
    mediaType: this.camara.MediaType.PICTURE,
    correctOrientation: true,
    targetWidth: 854,
    targetHeight: 480
  };

  constructor(private formBuilder: FormBuilder, private servicio: ComunService, private loadCtrl: LoadingController, private navCtrl: NavController, private camara: Camera, public visorImg: PhotoViewer) {
    // Se inicializa el formulario.
    this.formulario = this.formBuilder.group({
      'correo': [null, Validators.nullValidator],
      'nick': ['', Validators.pattern(/^[0-9a-zA-ZáéíóúÁÉÍÓÚüÜñÑ]{3,10}$/)],
      'nombre': ['', Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ' -]{2,100}$/)],
      'apellidos': ['', Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ' -]{2,100}$/)],
      'sexo': [null, Validators.required],
      'fecha_nacimiento': [null, Validators.required],
      'estado': [null, Validators.required],
      'municipio': [null, Validators.required],
      'foto': [null, Validators.required]
    });

    this.formulario.get('estado').valueChanges.subscribe(nuevoEstado => {
      if (nuevoEstado) {
        this.municipios = mapaMexico.datos[nuevoEstado].sort();
        this.formulario.get('municipio').setValue(this.municipios[0]);
      }
    });

    this.cargarDatos();
  }

  cancelar() {
    if (this.datosActuales && this.datosActuales.nick) {
      this.navCtrl.back();
    } else {
      // Cerramos sesión.
      this.servicio.setIdUsuario(null);
      this.navCtrl.navigateRoot('/home');
    }
  }

  actualizarNick(evt){
    this.formulario.get('nick').setValue(this.formulario.value.nick.toLowerCase());
  }

  async reiniciar() {
    const datos = this.datosActuales;

    this.formulario.setValue({
      'correo': (datos.correo ? datos.correo : ''),
      'nick': (datos.nick ? datos.nick : ''),
      'nombre': (datos.nombre ? datos.nombre : ''),
      'apellidos': (datos.apellidos ? datos.apellidos : ''),
      'sexo': (datos.sexo ? datos.sexo : null),
      'fecha_nacimiento': (datos.fecha_nacimiento ? datos.fecha_nacimiento : null),
      'estado': (datos.estado ? datos.estado : null),
      'municipio': (datos.municipio ? datos.municipio : null),
      'foto': (datos.foto ? datos.foto : null)
    });
  }

  async cargarDatos() {
    const cargando = await this.loadCtrl.create({
      message: 'Cargando tus datos...'
    });
    await cargando.present();

    // Cargamos la lista de estados de nuestro país.
    for (const estado of Object.keys(mapaMexico.datos)) {
      this.estados.push(estado);
    }

    // Cargamos la info del usuario desde la base de datos.
    firebase.database().ref('/usuarios/' + this.servicio.getIdUsuario()).once('value', (snapshot) => {
      this.datosActuales = snapshot.val();
      // Lenamos los campos con los datos actuales del usuario.
      this.reiniciar();
      cargando.dismiss();
    }, (error) => {
      cargando.dismiss();
      this.servicio.mostrarAlertaSimple(
        '¡Ups!',
        'Algo salió mal. Intenta abrir esta página más tarde.'
      );
      // Expulsamos al usuario de esta página.
      this.cancelar();
    });
  }

  verFoto() {
    this.visorImg.show(this.formulario.value.foto);
  }

  elegirFoto(usarCamara) {
    this.opcionesCam['sourceType'] = (usarCamara ? PictureSourceType.CAMERA : PictureSourceType.PHOTOLIBRARY);
    
    this.camara.getPicture(this.opcionesCam)
      .then((foto) => {
        this.formulario.get('foto').setValue('data:image/jpeg;base64,' + foto);
      })
      .catch((e) => {
        this.servicio.mostrarAlertaSimple(
          '¡Ups!',
          'Hubo un error al ' + (usarCamara ? 'tomar' : 'elegir') + ' tu foto.' + (e.message ? '<br>' + e.message : '')
        );
      });
  }

  async guardarCambiosFirebase(cargando){
    try {
      // Se guardan los cambios en la base de datos.
      firebase.database().ref().child('usuarios').child(this.servicio.getIdUsuario()).set(this.formulario.value);
      cargando.dismiss();
      this.navCtrl.back();
    } catch(e) {
      cargando.dismiss();
      this.servicio.mostrarAlertaSimple(
        '¡Ups!',
        'No se pudieron guardar los cambios, inténtelo después.'
      );
    }
  }

  async guardarCambios() {
    // Corregimos el nombre y apellidos.
    const nombreCompleto = [this.formulario.value.nombre, this.formulario.value.apellidos];
    for (let i = 0; i < 2; i++){
      // Eliminamos espacios extras.
      nombreCompleto[i] = nombreCompleto[i].replace(/\s+/g, ' ').trim();

      // Corregimos mayúsculas y minúsculas.
      nombreCompleto[i] = nombreCompleto[i].replace(/\w\S*/g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      });
    }
    this.formulario.get('nombre').setValue(nombreCompleto[0]);
    this.formulario.get('apellidos').setValue(nombreCompleto[1]);

    if (this.formulario.invalid) {
      return;
    }

    const cargando = await this.loadCtrl.create({
      message: 'Guardando los cambios...'
    });
    await cargando.present();

    // Evaluamos si hay necesidad de revisar si el nick ya está ocupado por otra persona.
    if (this.datosActuales.nick && this.formulario.value.nick === this.datosActuales.nick) {
      this.guardarCambiosFirebase(cargando);
    } else {
      firebase.database().ref('/usuarios').orderByChild('nick').equalTo(this.formulario.value.nick).once('value', (snapshot) => {
        if (snapshot.hasChildren()) {
          cargando.dismiss();
          this.servicio.mostrarAlertaSimple(
            '¡Ups!',
            'El nick ya está ocupado.'
          );
        } else {
          this.guardarCambiosFirebase(cargando);
        }
      });
    }
  }
}
