import React from 'react';
import { ActivityIndicator, View } from 'react-native';

const OAuthCallbackScreen = () => {
  // Esta pantalla es solo un marcador de posición para "atrapar" la redirección de OAuth.
  // Clerk maneja la lógica de la sesión en segundo plano.
  // El layout raíz se encargará de la redirección final una vez que el estado de autenticación del usuario se actualice.
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <ActivityIndicator size="large" color="#FE8C00" />
    </View>
  );
};

export default OAuthCallbackScreen;