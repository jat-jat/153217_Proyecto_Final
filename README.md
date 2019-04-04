# Proyecto final: MicroChat
<img width="150px" src="https://image.flaticon.com/icons/svg/1490/1490405.svg">

Esta es una aplicación de chat por salas, en la que para acceder, es necesario tener una cuenta.
Todas las salas son públicas, es decir, cualquiera se puede unir a ellas.

🔴🔴🔴 **Úsea con una conexión estable de internet. De lo contrario, la base de datos podría verse comprometida.**

🔹 [Descarga un zip con capturas de pantalla de la app y de la consola de Firebase](https://github.com/jat-jat/153217_Proyecto_Final/files/3036239/MicroChat.-.Capturas.de.app.y.consola.de.Firebase.zip) 🔹

Para crear una cuenta sólo necesitas una dirección de correo electrónico y una contraseña.
Puedes crear una cuenta con una dirección falsa, sin embargo, no podrás recuperar tu cuenta si te olvidas de la contraseña; porque el mensaje que permite efectuar esta acción se envía a esta dirección.

Al crear una cuenta, creas un perfil para que los demás te conozcan. Éste último se compone de los siguientes datos:
- Un nick para que te identifiquen fácilmente y te puedan citar usando un '@'.
- Nombres.
- Apellidos.
- Sexo (hombre o mujer).
- Fecha de nacimiento (se usa para calcular la edad).
- Estado y municipio en el que vives.
- Imagen/foto de perfil, tomada desde la cámara o la galería.

Puedes crear tus salas para que otra gente se una.
Para ver los mensajes dentro de una sala que no es de tu propiedad, debes unirte primero.

Una vez estés en la página de una sala, puedes enviar mensajes, ver la lista de miembros activos, ver los perfiles de los miembros y, abandonar la sala o eliminarla (dependiendo de que si ésta te pertenece).

Cuando estés dentro de una sala, podrás ver los mensajes en tiempo real. Si quieres citar a alguien (notificarle a su dispositivo móvil, sin necesidad de que esté dentro de la página de la sala), basta con escribir en el cuerpo del mensaje un arroba, seguido del nick del usuario a citar, por ejemplo: "Oye @javi ¡Contesta!".

No se escribió código del lado del servidor, sino que se usaron los servicios de Google Firebase.

Sobre derechos de autor:
- Las imágenes de fondo fueron tomadas de Google Imágenes.
- El ícono se tomó de: https://www.flaticon.com/free-icon/chat_1490405
- El código HTML y SCSS para dibujar las burbujas de diálogo del chat, fue tomado de este proyecto: https://github.com/HsuanXyz/ionic3-chat

### Librerías importantes usadas:

 Nombre  | Uso 
 ------------- | ------------- 
 [Firebase Authentication](https://ionicframework.com/docs/native/firebase-authentication) | Gestión de cuentas de usuario.
 [HTTPClient](https://angular.io/guide/http) | Emisión de notificaciones de menciones.
 [Firebase](https://ionicframework.com/docs/native/firebase) (Nativo) | Recepción de notificaciones de menciones.
 [Firebase](https://www.npmjs.com/package/firebase) | Alcenamiento de los perfiles de usuario; salas, sus mensajes, sus miembros y su propietario.
 [Camera](https://ionicframework.com/docs/native/camera) | Selección de foto a través de la cámara o galería para el perfil de usuario.
 [Photo Viewer](https://ionicframework.com/docs/native/photo-viewer) | Visualización de fotos de perfil propias y ajenas.
 [Native Audio](https://ionicframework.com/docs/native/native-audio) | Reproducción de sonidos al recibir un mensaje y al recibir una notificación.
 [Storage](https://ionicframework.com/docs/building/storage) | Guardado y lectura de la información del usuario si el checkbox "Recuérdame" está seleccionado.
 [Background Mode](https://ionicframework.com/docs/native/background-mode) | Evitar que el código se detenga al pasar a segundo plano.
 [Moment](https://www.npmjs.com/package/moment) | Substracción de fechas para obtener la edad a partir de la fecha de nacimiento.
 
 ### Cuentas que puede usar:

 Correo  | Contraseña 
 ------------- | ------------- 
 jatcompu@gmail.com | qwerty
 javier-ello@hotmail.com | qwerty
 javierawebdev@gmail.com | qwerty
 
### Información del autor:
```
UNIVERSIDAD POLITÉCNICA DE CHIAPAS
INGENIERÍA EN DESARROLLO DE SOFTWARE
Desarrollo de aplicaciones móviles – Corte 3

Javier Alberto Argüello Tello – 153217 – 8º
2 de abril del 2019
```
