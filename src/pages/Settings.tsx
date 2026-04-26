import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Upload, AlertTriangle, CheckCircle2, Eye, Copy, LogIn, LogOut, User as UserIcon, DatabaseZap, Globe } from 'lucide-react';
import { useProdeStore } from '@/store/useProdeStore';
import { toast } from 'sonner';
import { auth } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { useFirebase } from '@/components/FirebaseProvider';
import { useIsAdmin } from '@/hooks/useReadOnly';

export default function Settings() {
  const { participants, tournaments, results, matches, importData } = useProdeStore();
  const { user } = useFirebase();
  const isAdmin = useIsAdmin();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasLocalData = !!localStorage.getItem('prode-tenis-storage');

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast.success('Sesión iniciada correctamente');
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      toast.error('Error al iniciar sesión con Google');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Sesión cerrada');
    } catch (error) {
      toast.error('Error al cerrar sesión');
    }
  };

  const handleMigrateLocalData = async () => {
    const localDataRaw = localStorage.getItem('prode-tenis-storage');
    if (!localDataRaw) {
      toast.error('No se encontraron datos locales para migrar');
      return;
    }

    try {
      const parsed = JSON.parse(localDataRaw);
      const data = parsed.state; // Zustand persist stores data in .state
      
      if (!data || (!data.participants && !data.tournaments)) {
        toast.error('Los datos locales parecen estar vacíos o corruptos');
        return;
      }

      if (window.confirm(`Se encontraron ${data.participants?.length || 0} participantes y ${data.tournaments?.length || 0} torneos en tu navegador. ¿Quieres subirlos a la nube?`)) {
        await importData(data);
        toast.success('¡Datos migrados a la nube con éxito!');
        // Optional: clear local storage to avoid confusion
        // localStorage.removeItem('prode-tenis-storage');
      }
    } catch (error) {
      console.error('Error al migrar:', error);
      toast.error('Error al procesar los datos locales');
    }
  };

  const copyReadOnlyLink = () => {
    const url = new URL(window.location.origin);
    url.searchParams.set('view', '1');
    navigator.clipboard.writeText(url.toString());
    toast.success('Enlace de solo lectura copiado al portapapeles');
  };

  const handleDownloadBackup = () => {
    const data = {
      participants,
      tournaments,
      results,
      matches,
      version: '1.0',
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `prode-tenis-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Respaldo descargado correctamente');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const [pendingData, setPendingData] = React.useState<any>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('Archivo seleccionado:', file?.name);
    if (!file) return;

    if (!isAdmin) {
      console.warn('Intento de importación sin permisos de admin');
      toast.error('Debes iniciar sesión como administrador para importar datos a la nube.');
      event.target.value = '';
      return;
    }

    toast.info('Leyendo archivo...', { id: 'import-status' });
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        if (!content) {
          toast.error('El archivo está vacío', { id: 'import-status' });
          return;
        }

        let data;
        try {
          data = JSON.parse(content);
        } catch (parseError) {
          toast.error('El archivo no es un JSON válido.', { id: 'import-status' });
          return;
        }
        
        const finalData = data.state ? data.state : data;

        if (!finalData.participants || !finalData.tournaments) {
          toast.error('El archivo no tiene el formato esperado.', { id: 'import-status' });
          return;
        }

        toast.success('Archivo procesado. Por favor confirma la importación.', { id: 'import-status' });
        setPendingData(finalData);
      } catch (error) {
        toast.error('Error crítico al leer el archivo', { id: 'import-status' });
      }
    };
    
    reader.onerror = () => {
      toast.error('Error al leer el archivo del disco', { id: 'import-status' });
    };

    reader.readAsText(file);
    event.target.value = '';
  };

  const confirmImport = async () => {
    if (!pendingData) return;
    
    try {
      toast.loading('Subiendo datos a Firebase...', { id: 'import-loading' });
      await importData(pendingData);
      setPendingData(null);
      toast.dismiss('import-loading');
      toast.success('¡Datos importados y sincronizados con éxito!');
    } catch (error) {
      toast.dismiss('import-loading');
      toast.error('Error al subir los datos a Firebase');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Configuración y Respaldo</h1>
        <p className="text-neutral-500">Administra tus datos y genera copias de seguridad.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-emerald-100 bg-emerald-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-800">
              <UserIcon className="w-5 h-5" />
              Sesión de Administrador
            </CardTitle>
            <CardDescription>
              Inicia sesión para poder editar datos y sincronizar con la nube.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {user ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-white/50 rounded-md border border-emerald-100">
                    {user.photoURL && <img src={user.photoURL} alt={user.displayName || ''} className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" />}
                    <div className="overflow-hidden">
                      <p className="font-medium text-sm truncate">{user.displayName}</p>
                      <p className="text-xs text-neutral-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  {!isAdmin && (
                    <div className="p-2 bg-amber-50 border border-amber-200 rounded text-[10px] text-amber-800 flex items-start gap-2">
                      <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                      <p>Tu correo no está en la lista de administradores. Solo podrás ver los datos.</p>
                    </div>
                  )}
                  <Button onClick={handleLogout} variant="outline" className="w-full border-red-200 text-red-700 hover:bg-red-50">
                    <LogOut className="w-4 h-4 mr-2" />
                    Cerrar Sesión
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Button onClick={handleLogin} className="w-full bg-emerald-600 hover:bg-emerald-700">
                    <LogIn className="w-4 h-4 mr-2" />
                    Iniciar Sesión con Google
                  </Button>
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-md text-xs text-blue-800 flex items-start gap-2">
                    <Globe className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold mb-1">¿No puedes iniciar sesión?</p>
                      <p>Asegúrate de agregar este dominio a "Dominios autorizados" en la consola de Firebase (Auth {'>'} Settings).</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {hasLocalData && isAdmin && (
          <Card className="border-purple-100 bg-purple-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-800">
                <DatabaseZap className="w-5 h-5" />
                Migrar Datos Locales
              </CardTitle>
              <CardDescription>
                Se detectaron datos antiguos en este navegador. Súbelos a la nube ahora.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleMigrateLocalData} className="w-full bg-purple-600 hover:bg-purple-700">
                Subir Datos a Firebase
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="border-emerald-100 bg-emerald-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-800">
              <Download className="w-5 h-5" />
              Descargar Respaldo
            </CardTitle>
            <CardDescription>
              Guarda una copia de todos tus datos en tu dispositivo. Recomendado antes de hacer cambios grandes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-neutral-600 bg-white/50 p-3 rounded-md border border-emerald-100">
                <p><strong>Datos incluidos:</strong></p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>{participants.length} Participantes</li>
                  <li>{tournaments.length} Torneos</li>
                  <li>{results.length} Resultados registrados</li>
                  <li>{matches.length} Partidos de playoffs</li>
                </ul>
              </div>
              <Button onClick={handleDownloadBackup} className="w-full bg-emerald-600 hover:bg-emerald-700">
                Descargar Archivo JSON
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-100 bg-blue-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Eye className="w-5 h-5" />
              Modo Solo Lectura
            </CardTitle>
            <CardDescription>
              Genera un enlace para compartir el prode sin permitir ediciones.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-neutral-600 bg-white/50 p-3 rounded-md border border-blue-100">
                <p>Ideal para compartir el ranking y resultados con otros participantes sin riesgo de cambios accidentales.</p>
              </div>
              <Button onClick={copyReadOnlyLink} variant="outline" className="w-full border-blue-300 text-blue-800 hover:bg-blue-100">
                <Copy className="w-4 h-4 mr-2" />
                Copiar Enlace de Solo Lectura
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-100 bg-amber-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <Upload className="w-5 h-5" />
              Importar Datos
            </CardTitle>
            <CardDescription>
              Carga un archivo de respaldo previamente descargado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-amber-100/50 rounded-md border border-amber-200 text-amber-900 text-sm">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>
                  <strong>Atención:</strong> Al importar un archivo, se <strong>borrarán todos los datos actuales</strong> y se reemplazarán por los del respaldo.
                </p>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".json" 
                className="hidden" 
              />
              {!pendingData ? (
                <Button 
                  onClick={handleImportClick} 
                  variant="outline" 
                  className="w-full border-amber-300 text-amber-800 hover:bg-amber-100"
                >
                  Seleccionar Archivo
                </Button>
              ) : (
                <div className="space-y-3 p-3 bg-white/50 rounded-md border border-amber-200">
                  <p className="text-xs font-medium text-amber-800">Archivo listo para importar:</p>
                  <ul className="text-[10px] text-neutral-600 space-y-1">
                    <li>• {pendingData.participants?.length || 0} Participantes</li>
                    <li>• {pendingData.tournaments?.length || 0} Torneos</li>
                    <li>• {pendingData.results?.length || 0} Resultados</li>
                  </ul>
                  <div className="flex gap-2">
                    <Button onClick={confirmImport} className="flex-1 bg-amber-600 hover:bg-amber-700 text-xs h-8">
                      Confirmar Importación
                    </Button>
                    <Button onClick={() => setPendingData(null)} variant="ghost" className="text-xs h-8">
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Estado del Almacenamiento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              Actualmente tus datos se guardan en el navegador. Si ves errores de guardado, descarga un respaldo e intenta limpiar el caché del navegador.
            </p>
            <div className="p-4 bg-neutral-100 rounded-lg border border-neutral-200">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">Uso de LocalStorage</span>
                <span className="text-neutral-500">Estimado</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2.5">
                <div className="bg-emerald-600 h-2.5 rounded-full" style={{ width: '15%' }}></div>
              </div>
              <p className="text-xs text-neutral-400 mt-2 italic">
                * El límite suele ser de 5MB. Si tienes muchos torneos, podrías alcanzarlo.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
