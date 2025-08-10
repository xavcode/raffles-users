// app/components/toastConfig.tsx

import React from 'react';
import { BaseToast, ErrorToast } from 'react-native-toast-message';

/*
  Este es el objeto de configuración para los toasts.
  Aquí podemos sobreescribir los estilos de los toasts existentes ('success', 'error', 'info')
  para que se ajusten a nuestro diseño.
*/
const toastConfig = {
  /*
    Sobreescribimos el toast de 'success' para hacerlo más alto y con tus fuentes.
    Usamos el componente BaseToast que ya viene en la librería y le pasamos nuevas props.
  */
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: '#10B981', // Verde
        height: undefined, // Dejamos que la altura se defina por el contenido y el padding
        minHeight: 70, // Aseguramos una altura mínima para que sea más grande
        paddingVertical: 8, // Añadimos padding vertical para darle más altura
        backgroundColor: '#F0FDF4',
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 14,
        fontFamily: 'quicksand-bold', // Usando las fuentes de tu app
        color: '#065F46',
      }}
      text2Style={{
        fontSize: 12,
        fontFamily: 'quicksand-medium',
        color: '#047857',
      }}
    />
  ),

  /*
    Hacemos lo mismo para el toast de 'error'.
  */
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{
        borderLeftColor: '#EF4444', // Rojo
        height: undefined,
        minHeight: 70,
        paddingVertical: 10,
        backgroundColor: '#FEF2F2',
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 14,
        fontFamily: 'quicksand-bold',
        color: '#991B1B',
      }}
      text2Style={{
        fontSize: 12,
        fontFamily: 'quicksand-medium',
        color: '#B91C1C',
      }}
    />
  ),

  /*
    Y finalmente para el toast de 'info', que usamos en el ejemplo anterior.
  */
  info: (props: any) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: '#3B82F6', // Azul
        height: undefined,
        minHeight: 70,
        paddingVertical: 10,
        backgroundColor: '#EFF6FF',
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 14,
        fontFamily: 'quicksand-bold',
        color: '#107df6',
      }}
      text2Style={{
        fontSize: 12,
        fontFamily: 'quicksand-medium',
        color: '#09f',
      }}
    />
  ),
};
export default toastConfig