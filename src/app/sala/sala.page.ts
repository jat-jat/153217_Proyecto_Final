import { NavController, ActionSheetController, LoadingController, IonContent } from '@ionic/angular';
import { ComunService } from './../comun.service';
import { Component, ViewChild, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import * as firebase from 'firebase/app';
import * as moment from 'moment';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-sala',
  templateUrl: './sala.page.html',
  styleUrls: ['./sala.page.scss'],
})
export class SalaPage implements OnDestroy {
  @ViewChild('content') content: IonContent;
  formChat: FormGroup;

  nombreSala: string;
  readonly idSala: string;

  mensajes = {};

  desactivarListenerEliminar = true;

  // Referencia a la parte de la base de datos con los mensjaes.
  readonly refDbMsg: firebase.database.Reference;
  // Referencia a la parte de la base de datos que escucha si esta sala es borrada.
  readonly refDbSalaBorrada: firebase.database.Reference;
  readonly soyPropietario: boolean;

  momentoEnQueSeAbrioLaPagina = Date.now();

  Object = Object;
  
  constructor(private formBuilder: FormBuilder, private actRoute: ActivatedRoute, public servicio: ComunService,
    private navCtrl: NavController, private menu: ActionSheetController,
    private loadCtrl: LoadingController, private http: HttpClient, private router: Router) {
    this.formChat = this.formBuilder.group({
      'cuerpo': ['', Validators.required]
    });

    this.idSala = this.actRoute.snapshot.paramMap.get('id');
    this.refDbMsg = firebase.database().ref('/salas/' + this.idSala + '/mensajes');
    this.refDbSalaBorrada = firebase.database().ref('/salas');
    this.soyPropietario = this.actRoute.snapshot.paramMap.get('soypropietario') === 'true';
    this.nombreSala = this.actRoute.snapshot.paramMap.get('nombre');
  }

  ionViewDidEnter() {
    // Evento cuando llega un nuevo mensaje.
    this.refDbMsg.on('child_added', (snapshot) => {
      const val = snapshot.val();

      this.mensajes[snapshot.key] = {
        posicion: (val.autor === this.servicio.getIdUsuario() ? 'right' : 'left'),
        autor: val.autor,
        cuerpo: val.cuerpo,
        datetime: moment(val.datetime).format('DD/MM/YYYY h:mm:ss a')
      };

      setTimeout(() => {
        this.content.scrollToBottom();
      }, 500);

      if (val.datetime > this.momentoEnQueSeAbrioLaPagina){
        this.servicio.audio.play('nuevo_msg');
      }
    });

    if (this.desactivarListenerEliminar) {
      // Evento cuando un mensaje es eliminado.
      this.refDbMsg.on('child_removed', (snapshot) => {
        delete this.mensajes[snapshot.key];
      });

      // Creamos un evento que detecta el momento en el que esta sala es eliminada.
      this.refDbSalaBorrada.on('child_removed', (snapshot) => {
        const val = snapshot.val();

        if (snapshot.key === this.idSala) {
          if (val.propietario !== this.servicio.getIdUsuario()) {
            this.servicio.mostrarAlertaSimple('¡Ups!', 'Esta sala acaba de ser eliminada por su propietario.');
          }

          this.navCtrl.navigateBack('panel');
        }
      });
    } else {
      this.desactivarListenerEliminar = true;
    }
  }

  ngOnInit() {
  }

  async eliminarSala() {
    const alert = await this.servicio.alertCtrl.create({
      header: 'Confirmación',
      message: '¿Está seguro de que desea eliminar esta sala?<br><strong>No podrá deshacer esta acción.</strong>',
      buttons: [ { text: 'No', role: 'cancel' }, { text: 'Sí', handler: async () => {
        const cargando = await this.loadCtrl.create({
          message: 'Eliminando...'
        });
        await cargando.present();
        
        try {
          await firebase.database().ref('/salas/' + this.idSala).remove();
          await cargando.dismiss();
        } catch (e) {
          cargando.dismiss();
          this.servicio.mostrarAlertaSimple('¡Ups!', 'No se pudo efectuar esta acción.');
        }
      }}]
    });

    await alert.present();
  }

  async abandonarSala() {
    const alert = await this.servicio.alertCtrl.create({
      header: 'Confirmación',
      message: '¿Está seguro de que desea abandonar esta sala?<br><strong>No podrá deshacer esta acción.</strong>',
      buttons: [ { text: 'No', role: 'cancel' }, { text: 'Sí', handler: async () => {
        const cargando = await this.loadCtrl.create({
          message: 'Abandonando...'
        });
        await cargando.present();

        firebase.database().ref('/salas/' + this.idSala + '/miembros')
          .once('value', async (snapshot) => {
            const miembros = snapshot.val();
            
            try {
              for (const key in miembros){
                if (miembros[key] === this.servicio.getIdUsuario()) {
                  await firebase.database().ref('/salas/' + this.idSala + '/miembros/' + key).remove();
                  break;
                }
              }
              await cargando.dismiss();
              this.navCtrl.navigateBack('panel');
            } catch (e) {
              await cargando.dismiss();
              this.servicio.mostrarAlertaSimple('¡Ups!', 'No se pudo efectuar esta acción.');
            }
          }, async (e) => {
            await cargando.dismiss();
            this.servicio.mostrarAlertaSimple('¡Ups!', 'No se pudo efectuar esta acción.');
          });
      }}]
    });

    await alert.present();
  }

  async mostrarMenu() {
    const menu = await this.menu.create({
      header: 'Menú',
      buttons: [{
        text: (this.soyPropietario ? 'Eliminar sala' : 'Abandonar sala'),
        icon: (this.soyPropietario ? 'trash' : 'backspace'),
        handler: () => {
          if (this.soyPropietario){
            this.eliminarSala();
          } else {
            this.abandonarSala();
          }
        }
      }, {
        text: 'Ver miembros',
        icon: 'contacts',
        handler: () => {
          this.desactivarListenerEliminar = false;
          this.router.navigateByUrl(`sala-miembros/${this.idSala}/${this.nombreSala}`);
        }
      }]
    });

    await menu.present();
  }

  async enviarMensaje() {
    await this.refDbMsg.push().set({
      autor: this.servicio.getIdUsuario(),
      cuerpo: this.formChat.value.cuerpo,
      datetime: Date.now()
    });

    const mensaje = this.formChat.value.cuerpo.toLowerCase();
    this.formChat.get('cuerpo').setValue('');

    // Citamos a los usuarios mencionados.
    for (const key in this.servicio.infoBasicaUsuarios) {
      if (mensaje.includes('@' + this.servicio.infoBasicaUsuarios[key].nick.toLowerCase())) {
        if (this.servicio.infoBasicaUsuarios[key]['firebaseNotifToken']) {
          this.citar(this.servicio.infoBasicaUsuarios[key]['firebaseNotifToken']);
        }
      }
    }
  }

  ngOnDestroy() {
    if (this.refDbMsg) {
      this.refDbMsg.off();
    }

    if (this.refDbSalaBorrada && this.desactivarListenerEliminar) {
      this.refDbSalaBorrada.off();
    }
  }

  async citar(tokenFirebaseNotifUsuarioCitado: string){
    // Datos necesarios para hacer peticiones HTTP.
    // Ubicada en 'Consola de Firebase > Proyecto > Configuración > Mensajería en la nube > Credenciales de proyecto'.
    const clave_servidor = 'AAAAU4i81aU:APA91bEfxvuoeYB4iXzhT93bW9Yp47rT85k_N1CqEIxkdvmMPFMNxggsH7ZoX42Jq1QWW9vU3QCUR3ZdO8_WDqnfDlJ9snVSyTc8APvlYRXumEL0WUMYu2DcV7_oMmeROmxVfK7LBXwM';
    // Cabeceras de las peticiones HTTP para trabajar con el proyecto de Firebase.
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `key=${clave_servidor}`
    });

    const url = 'https://fcm.googleapis.com/fcm/send';
    const cuerpoPeticion = {
      data: {
        title: 'Aleta de MicroChat.',
        body: `${this.servicio.infoBasicaUsuarios[this.servicio.getIdUsuario()].nick} te acaba de citar en la sala ${this.nombreSala}.`
      },
      to: tokenFirebaseNotifUsuarioCitado
    };

    this.http.post(url, cuerpoPeticion, { headers: headers }).subscribe(() => {
      // La notificación se envió satisfactoriamente.
    });
  }
}