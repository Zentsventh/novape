# Despliegue automatico a Linux

`Deploy Linux` compila y despliega los cambios de `main` cuando el workflow `Checks` termina correctamente. Tambien permite una ejecucion manual desde Actions, que vuelve a ejecutar las pruebas. Un commit superado por otro en `main` se omite.

## Configuracion inicial

El repositorio necesita un entorno `production` y estos secretos **del entorno**:

- `DEPLOY_PRIVATE_KEY`: clave SSH privada exclusiva de GitHub Actions.
- `DEPLOY_KNOWN_HOSTS`: claves publicas del servidor previamente verificadas.

Variables del repositorio:

| Variable | Valor actual |
| --- | --- |
| `DEPLOY_HOST` | `132.196.66.23` |
| `DEPLOY_USER` | `azureuser` |
| `DEPLOY_PORT` | `22` |
| `DEPLOY_PATH` | `/var/www/novape` |
| `DEPLOY_URL` | `http://132.196.66.23` |
| `DEPLOY_PHP_SERVICE` | `php8.3-fpm` |

Autorizar la clave publica correspondiente en `~azureuser/.ssh/authorized_keys`. Puede llevar el prefijo `restrict`: el workflow no usa terminal interactiva ni reenvio de puertos. La clave privada se conserva en GitHub, nunca en el repositorio.

Completar primero la restauracion del catalogo. En el servidor comprobar:

```bash
cd /var/www/novape
command -v php composer rsync tar curl flock
sudo -n systemctl is-active php8.3-fpm
test -w /var/www/novape
```

`azureuser` debe poder actualizar el codigo y los directorios de ejecucion. El script necesita recargar PHP-FPM con `sudo` sin solicitar contrasena. Si el servidor no tiene esta configuracion, el administrador puede autorizar solo `systemctl is-active php8.3-fpm` y `systemctl reload php8.3-fpm` con `visudo`.

Cuando se use Reverb, configurar tambien `VITE_REVERB_APP_KEY`, `VITE_REVERB_HOST`, `VITE_REVERB_PORT` y `VITE_REVERB_SCHEME` en las variables de GitHub: el frontend se compila en el runner. Los demas ajustes privados siguen en el `.env` de Linux.

## Comportamiento

El workflow crea un paquete a partir de los archivos versionados, instala dependencias PHP de produccion y compila Vite con Node 22. No copia el `.env` del runner. Transfiere el paquete por SSH con comprobacion estricta de la identidad del servidor.

Antes de actualizar, verifica los requisitos PHP reales, la conexion a la base y las migraciones pendientes. La cuenta de la aplicacion no necesita permisos de migracion: si hay cambios de esquema pendientes, el despliegue se detiene antes de poner la tienda en mantenimiento. Aplicarlos con la identidad de mantenimiento y un respaldo, y volver a ejecutar Actions. No se importan respaldos ni se ejecutan seeders.

El script guarda una copia privada del codigo anterior, pone la tienda brevemente en mantenimiento, sincroniza codigo y compilacion y regenera las caches de Laravel. Conserva `.env`, `storage`, `public/storage`, favicon, certificados de `public/.well-known` y respaldos SQL. Reinicia los workers de cola y Reverb mediante sus senales de Laravel, y recarga PHP-FPM.

Comprueba `/up` y la portada. Si falla la actualizacion o estas lecturas, intenta restaurar el codigo anterior y sacar la tienda de mantenimiento. Un rollback de codigo no modifica la base de datos. Los workers necesitan estar supervisados para arrancar de nuevo cuando reciben la senal de reinicio.

Los respaldos y los paquetes quedan en `~/.cache/novape-deploy`, accesibles solo para el usuario de despliegue. Revisar periodicamente el espacio y conservar los respaldos necesarios. `.deploy-revision` contiene el commit instalado. Los logs del workflow indican el directorio del codigo anterior.

## Uso diario

```bash
git add <archivos-corregidos>
git commit -m "Describe la correccion"
git push origin main
```

El avance aparece en Actions: primero `Checks`, despues `Deploy Linux`. El despliegue toma los archivos confirmados en Git; las modificaciones sin commit permanecen solo en el equipo local.
