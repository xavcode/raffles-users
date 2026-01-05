import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { SafeAreaView } from 'react-native-safe-area-context';

const TermsScreen = () => {
    const router = useRouter();

    const termsMarkdown = `# TÉRMINOS Y CONDICIONES DE USO DE LA APLICACIÓN "MILSORTEOS"

**Última actualización:** [●]

---

## 1. Introducción y aceptación

Bienvenido a **MilSorteos**, una aplicación móvil desarrollada en **React Native y Expo**, disponible en Colombia, que permite a los usuarios registrados crear, gestionar y participar en sorteos o rifas virtuales ("los Servicios").

Al registrarse, acceder, descargar, instalar o utilizar la aplicación MilSorteos ("la App"), usted acepta de manera expresa e informada los presentes **Términos y Condiciones de Uso** ("Términos"). Si no está de acuerdo con alguno de los apartados, debe abstenerse de usar la App.

MilSorteos actúa **únicamente como un intermediario tecnológico** que facilita la interacción entre usuarios, pero **no organiza, administra ni se hace responsable por los sorteos publicados dentro de la plataforma**.

---

## 2. Definiciones

- **"App" o "MilSorteos"**: la plataforma tecnológica que permite crear, publicar y gestionar sorteos en Colombia.
- **"Usuario"**: toda persona natural mayor de 18 años que se registra en la App.
- **"Creador"**: usuario que crea y administra un sorteo o rifa en la App.
- **"Participante"**: usuario que adquiere boletos virtuales para participar en un sorteo.
- **"Sorteo" o "Rifa"**: dinámica publicada por un Creador, que incluye reglas, número de boletos, precio, premios y fecha de realización.
- **"Servicios"**: todas las funcionalidades tecnológicas ofrecidas por la App.

---

## 3. Descripción de los Servicios

MilSorteos ofrece a los Usuarios las siguientes funcionalidades principales:

a. Registro y gestión de perfiles.
b. Creación y publicación de sorteos con descripción, boletos, precios, fechas y premios.
c. Compra de boletos virtuales por parte de Participantes.
d. Herramientas de verificación de compras, comunicación entre Usuarios y calificación de Creadores.
e. Moderación básica de contenido y suspensión de cuentas en caso de violaciones a los presentes Términos.

**Importante:**
- MilSorteos **no recibe, custodia ni transfiere dinero** entre Usuarios.
- Los pagos se realizan **por fuera de la App**, mediante medios externos como transferencias bancarias, billeteras digitales o pasarelas de pago (ej. MercadoPago, Nequi, Daviplata, entre otros).
- El Creador es el único responsable de recaudar pagos, organizar el sorteo, elegir al ganador y entregar los premios.

---

## 4. Obligaciones y responsabilidades de los Usuarios

### 4.1. De los Creadores

Los Creadores se obligan a:

1. Garantizar la **veracidad** de la información publicada sobre cada sorteo.
2. Cumplir con la **Ley 643 de 2001** (Régimen propio del monopolio rentístico de juegos de suerte y azar) y demás normas aplicables en Colombia.
3. Recaudar directamente los pagos de los Participantes por medios externos a la App.
4. Realizar el sorteo en la fecha anunciada, comunicar al ganador y entregar el premio en las condiciones ofrecidas.
5. Cumplir con obligaciones fiscales y tributarias derivadas de la realización del sorteo.

### 4.2. De los Participantes

Los Participantes se obligan a:

1. Revisar cuidadosamente la información de cada sorteo antes de comprar boletos.
2. Realizar los pagos únicamente por los canales externos acordados con el Creador.
3. Reclamar directamente ante el Creador en caso de inconformidades.
4. Asumir el riesgo inherente de participar en sorteos organizados por terceros.

### 4.3. Prohibiciones generales

Queda expresamente prohibido:

- Publicar sorteos que incumplan la legislación colombiana.
- Usar la App para actividades ilícitas, fraudulentas o engañosas.
- Suplantar identidades o proporcionar información falsa.
- Publicar contenido ofensivo, discriminatorio o contrario al orden público.

---

## 5. Limitación de responsabilidad de la App

MilSorteos **no asume ninguna responsabilidad** derivada de la actividad de los Usuarios. En particular:

1. No responde por el **incumplimiento de los Creadores** en la entrega de premios.
2. No garantiza la legalidad individual de los sorteos publicados.
3. No interviene ni responde por los **pagos realizados entre Usuarios** mediante canales externos.
4. No se hace responsable de **fraudes, estafas, pérdidas económicas, daños directos o indirectos, lucro cesante o perjuicios** derivados del uso de la App.
5. No garantiza la disponibilidad ininterrumpida del servicio, dado que puede verse afectado por fallas técnicas, de conectividad o de terceros proveedores.

---

## 6. Propiedad intelectual

Todos los derechos de propiedad intelectual sobre la App, su diseño, software, logotipos, marcas, interfaces y bases de datos corresponden a **MilSorteos o sus licenciantes**.

Los Usuarios conservan los derechos sobre el contenido que publiquen, pero otorgan a la App una **licencia no exclusiva, gratuita y mundial** para mostrarlo dentro de la plataforma.

---

## 7. Privacidad y protección de datos personales

MilSorteos cumple con la **Ley 1581 de 2012**, el **Decreto 1377 de 2013** y demás normas sobre protección de datos en Colombia.

### 7.1. Datos recolectados

- Nombre completo.
- Dirección de correo electrónico.
- Número de teléfono (**usado exclusivamente para permitir la comunicación entre Usuarios con el fin de coordinar pagos, entregas y aspectos relacionados con sorteos**).
- Imágenes opcionales (ej. comprobantes de pago).
- Información básica de uso de la App.

### 7.2. Finalidades

- Creación y gestión de cuentas.
- Prestación de los Servicios.
- Verificación de identidad.
- Comunicación entre Usuarios para coordinar pagos y entrega de premios.
- Prevención de fraudes y actividades ilícitas.

### 7.3. Derechos del titular

Los Usuarios podrán ejercer sus derechos de **acceso, rectificación, actualización y supresión** de datos personales escribiendo al correo oficial: **xmddevs@gmail.com**.

En caso de solicitar la **eliminación de la cuenta y de los datos asociados**, deberán enviar la petición a dicho correo, indicando nombre de usuario y correo registrado en la App.

---

## 8. Pagos y transacciones

1. Todos los pagos relacionados con sorteos se realizan **fuera de la App**, bajo la exclusiva responsabilidad de los Usuarios.
2. La App no garantiza la seguridad de transacciones realizadas en plataformas externas.
3. MilSorteos no realiza reembolsos ni compensaciones económicas.

---

## 9. Cancelaciones, reembolsos y disputas

- Toda solicitud de cancelación, reembolso o reclamo debe dirigirse directamente al **Creador del sorteo**.
- MilSorteos podrá actuar como canal de reporte, pero no interviene ni resuelve disputas contractuales entre Usuarios.

---

## 10. Terminación y suspensión de cuentas

MilSorteos podrá suspender o cancelar cuentas de Usuario en los siguientes casos:

- Violación de estos Términos.
- Publicación de sorteos fraudulentos o ilegales.
- Conductas contrarias a la buena fe o a las normas aplicables.

La suspensión no genera derecho a indemnización alguna.

---

## 11. Fuerza mayor

MilSorteos no será responsable por el incumplimiento o interrupción de sus Servicios debido a causas de fuerza mayor o caso fortuito, tales como desastres naturales, fallas en servicios de telecomunicaciones, ataques informáticos, actos gubernamentales u otros fuera de su control.

---

## 12. Indemnización

El Usuario se obliga a **indemnizar y mantener indemne a MilSorteos** frente a cualquier reclamación, acción judicial, sanción administrativa o perjuicio que se derive del incumplimiento de estos Términos o de las obligaciones legales aplicables a los sorteos.

---

## 13. No renuncia

La falta de ejercicio de algún derecho por parte de MilSorteos no se interpretará como renuncia al mismo.

---

## 14. Ley aplicable y jurisdicción

Estos Términos se rigen por las leyes de la **República de Colombia**.

Cualquier controversia será resuelta por los **juzgados y tribunales de la ciudad de Bogotá D.C.**, renunciando las partes a cualquier otro fuero.

---

## 15. Actualizaciones de los Términos

MilSorteos podrá modificar estos Términos en cualquier momento. Las modificaciones entrarán en vigencia una vez sean publicadas en la App. El uso continuado de la plataforma implica la aceptación de los cambios.

---

## 16. Contacto

Para consultas, reclamos o ejercicio de derechos de datos personales, puede comunicarse a:

- **Correo electrónico oficial:** xmddevs@gmail.com

---`;

    return (
        <SafeAreaView className="flex-1 bg-background">
            <View className="flex-row items-center justify-between p-4 bg-surface border-b border-border">
                <Pressable onPress={() => router.back()} className="p-2">
                    <Ionicons name="arrow-back" size={24} color="#64748b" />
                </Pressable>
                <Text className="text-lg font-quicksand-bold text-text-main">Términos y Condiciones</Text>
                <View className="w-10" />
            </View>
            <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={true}>
                <Markdown
                    style={{
                        body: { fontFamily: 'Quicksand-Medium', color: '#334155', marginBottom: 8 },
                        heading1: { fontFamily: 'Quicksand-Bold', color: '#1e293b', marginTop: 16, marginBottom: 8 },
                        heading2: { fontFamily: 'Quicksand-Bold', color: '#1e293b', marginTop: 12, marginBottom: 6 },
                        heading3: { fontFamily: 'Quicksand-Bold', color: '#1e293b', marginTop: 10, marginBottom: 4 },
                        strong: { fontFamily: 'Quicksand-Bold' },
                        hr: { marginVertical: 16, height: 1, backgroundColor: '#e2e8f0' },
                        paragraph: { marginBottom: 8 },
                    }}
                >
                    {termsMarkdown}
                </Markdown>
            </ScrollView>
        </SafeAreaView>
    );
};

export default TermsScreen;
